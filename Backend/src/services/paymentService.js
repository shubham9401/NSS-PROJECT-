/**
 * Payment Service - Status Tracking & Management
 * Handles payment status synchronization, polling, and analytics
 */

const { razorpay } = require('../config/razorpay');
const Donation = require('../models/Donation');
const PaymentLog = require('../models/PaymentLog');
const { safeRazorpayCall } = require('../middleware/paymentErrorHandler');

/**
 * Payment status constants
 */
const PAYMENT_STATUS = {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILED: 'failed'
};

const RAZORPAY_ORDER_STATUS = {
    CREATED: 'created',
    ATTEMPTED: 'attempted',
    PAID: 'paid'
};

/**
 * Sync donation status with Razorpay
 * Useful for checking status of pending payments
 * @param {string} donationId - MongoDB donation ID
 * @returns {Object} Updated donation with sync status
 */
const syncPaymentStatus = async (donationId) => {
    const donation = await Donation.findById(donationId);

    if (!donation) {
        throw new Error('Donation not found');
    }

    if (!donation.gatewayOrderId) {
        return {
            synced: false,
            reason: 'No gateway order ID',
            donation
        };
    }

    // Already completed - no need to sync
    if (donation.status === PAYMENT_STATUS.SUCCESS) {
        return {
            synced: true,
            reason: 'Already successful',
            donation
        };
    }

    try {
        // Fetch order status from Razorpay
        const order = await safeRazorpayCall(
            'Sync Order Status',
            () => razorpay.orders.fetch(donation.gatewayOrderId),
            { timeout: 10000, retry: true }
        );

        console.log('[PaymentService] Razorpay order status:', {
            orderId: order.id,
            status: order.status,
            attempts: order.attempts
        });

        let statusChanged = false;
        const previousStatus = donation.status;

        // Update based on Razorpay status
        if (order.status === RAZORPAY_ORDER_STATUS.PAID) {
            // Order is paid - update to success
            if (donation.status !== PAYMENT_STATUS.SUCCESS) {
                donation.status = PAYMENT_STATUS.SUCCESS;
                donation.completedAt = new Date();
                statusChanged = true;
            }
        } else if (order.attempts > 0 && order.status !== RAZORPAY_ORDER_STATUS.PAID) {
            // Has attempts but not paid - might need to check individual payments
            const payments = await safeRazorpayCall(
                'Fetch Order Payments',
                () => razorpay.orders.fetchPayments(donation.gatewayOrderId),
                { timeout: 10000, retry: true }
            );

            const successfulPayment = payments.items.find(p => p.status === 'captured');
            const failedPayment = payments.items.find(p => p.status === 'failed');

            if (successfulPayment) {
                donation.status = PAYMENT_STATUS.SUCCESS;
                donation.gatewayPaymentId = successfulPayment.id;
                donation.transactionId = `TXN${Date.now()}`;
                donation.completedAt = new Date();
                statusChanged = true;
            } else if (failedPayment && !successfulPayment) {
                // Only mark failed if there's no successful payment
                // Keep as pending if there are no attempts yet
            }
        }

        if (statusChanged) {
            await donation.save();

            // Log the sync event
            await PaymentLog.createLog({
                donationId: donation._id,
                userId: donation.userId,
                eventType: donation.status,
                eventData: {
                    syncedFromRazorpay: true,
                    razorpayOrderStatus: order.status,
                    previousStatus,
                    attempts: order.attempts
                },
                gatewayName: 'razorpay',
                amount: donation.amount,
                currency: donation.currency,
                statusCode: '200'
            });

            console.log('[PaymentService] Status synced:', {
                donationId,
                previousStatus,
                newStatus: donation.status
            });
        }

        return {
            synced: true,
            statusChanged,
            previousStatus,
            currentStatus: donation.status,
            razorpayStatus: order.status,
            donation
        };

    } catch (error) {
        console.error('[PaymentService] Sync error:', error.message);
        return {
            synced: false,
            reason: error.message,
            donation
        };
    }
};

/**
 * Check for stale pending payments and update their status
 * @param {number} olderThanMinutes - Check payments older than N minutes
 * @returns {Object} Summary of updated payments
 */
const checkStalePendingPayments = async (olderThanMinutes = 30) => {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);

    const stalePendingDonations = await Donation.find({
        status: PAYMENT_STATUS.PENDING,
        donationDate: { $lt: cutoffTime }
    }).limit(50);

    console.log(`[PaymentService] Found ${stalePendingDonations.length} stale pending payments`);

    const results = {
        total: stalePendingDonations.length,
        synced: 0,
        updated: 0,
        failed: 0,
        details: []
    };

    for (const donation of stalePendingDonations) {
        try {
            const syncResult = await syncPaymentStatus(donation._id);
            results.synced++;

            if (syncResult.statusChanged) {
                results.updated++;
            }

            results.details.push({
                donationId: donation._id,
                orderId: donation.gatewayOrderId,
                result: syncResult.synced ? 'synced' : 'skipped',
                statusChanged: syncResult.statusChanged || false
            });

        } catch (error) {
            results.failed++;
            results.details.push({
                donationId: donation._id,
                result: 'error',
                error: error.message
            });
        }
    }

    return results;
};

/**
 * Get payment analytics for a time period
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Object} Analytics data
 */
const getPaymentAnalytics = async (startDate, endDate) => {
    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);

    const matchQuery = {};
    if (Object.keys(dateQuery).length > 0) {
        matchQuery.donationDate = dateQuery;
    }

    // Get donation statistics
    const donationStats = await Donation.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                avgAmount: { $avg: '$amount' }
            }
        }
    ]);

    // Get payment method breakdown
    const methodStats = await Donation.aggregate([
        { $match: { ...matchQuery, status: PAYMENT_STATUS.SUCCESS } },
        {
            $group: {
                _id: '$paymentMethod',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
            }
        },
        { $sort: { totalAmount: -1 } }
    ]);

    // Get daily trends
    const dailyTrends = await Donation.aggregate([
        { $match: { ...matchQuery, status: PAYMENT_STATUS.SUCCESS } },
        {
            $group: {
                _id: {
                    year: { $year: '$donationDate' },
                    month: { $month: '$donationDate' },
                    day: { $dayOfMonth: '$donationDate' }
                },
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        { $limit: 30 }
    ]);

    // Calculate summary
    const summary = {
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        pendingTransactions: 0,
        totalAmountReceived: 0,
        avgTransactionValue: 0,
        successRate: 0
    };

    donationStats.forEach(stat => {
        summary.totalTransactions += stat.count;
        if (stat._id === PAYMENT_STATUS.SUCCESS) {
            summary.successfulTransactions = stat.count;
            summary.totalAmountReceived = stat.totalAmount;
            summary.avgTransactionValue = stat.avgAmount;
        } else if (stat._id === PAYMENT_STATUS.FAILED) {
            summary.failedTransactions = stat.count;
        } else if (stat._id === PAYMENT_STATUS.PENDING) {
            summary.pendingTransactions = stat.count;
        }
    });

    if (summary.totalTransactions > 0) {
        summary.successRate = Math.round(
            (summary.successfulTransactions / summary.totalTransactions) * 100
        );
    }

    return {
        summary,
        byStatus: donationStats,
        byPaymentMethod: methodStats,
        dailyTrends,
        period: { startDate, endDate }
    };
};

/**
 * Get recent payment activity
 * @param {number} limit - Number of recent activities
 * @returns {Array} Recent payment logs
 */
const getRecentPaymentActivity = async (limit = 20) => {
    return await PaymentLog.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('donationId', 'amount status')
        .populate('userId', 'firstName lastName email');
};

/**
 * Expire old pending payments
 * Mark payments as failed if they've been pending too long
 * @param {number} olderThanHours - Mark as failed if older than N hours
 */
const expireOldPendingPayments = async (olderThanHours = 24) => {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    const result = await Donation.updateMany(
        {
            status: PAYMENT_STATUS.PENDING,
            donationDate: { $lt: cutoffTime }
        },
        {
            $set: { status: PAYMENT_STATUS.FAILED }
        }
    );

    console.log(`[PaymentService] Expired ${result.modifiedCount} old pending payments`);

    return {
        expired: result.modifiedCount
    };
};

module.exports = {
    PAYMENT_STATUS,
    RAZORPAY_ORDER_STATUS,
    syncPaymentStatus,
    checkStalePendingPayments,
    getPaymentAnalytics,
    getRecentPaymentActivity,
    expireOldPendingPayments
};
