/**
 * Payment Controller - Razorpay Integration
 * Handles payment initiation, verification, and status tracking
 */

const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { razorpay, keyId } = require('../config/razorpay');
const Donation = require('../models/Donation');
const PaymentLog = require('../models/PaymentLog');
const {
    PaymentError,
    PAYMENT_ERROR_CODES,
    safeRazorpayCall,
    withTimeout
} = require('../middleware/paymentErrorHandler');

/**
 * @desc    Create Razorpay order and initiate payment
 * @route   POST /api/payments/create-order
 * @access  Private
 */
const createOrder = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { amount, currency = 'INR', paymentMethod, notes, isAnonymous } = req.body;

        // Amount validation (Razorpay expects amount in paise)
        if (!amount || amount < 1) {
            throw new PaymentError(
                'Amount must be at least 1 INR',
                PAYMENT_ERROR_CODES.INVALID_AMOUNT,
                false
            );
        }

        const amountInPaise = Math.round(amount * 100);

        // Create Razorpay order with timeout and retry
        const orderOptions = {
            amount: amountInPaise,
            currency: currency.toUpperCase(),
            receipt: `receipt_${Date.now()}_${req.user.id.slice(-6)}`,
            notes: {
                userId: req.user.id,
                userEmail: req.user.email || '',
                purpose: 'NGO Donation',
                isAnonymous: isAnonymous ? 'true' : 'false'
            }
        };

        console.log('[Payment] Creating Razorpay order:', {
            amount: amount,
            amountInPaise: amountInPaise,
            currency: currency,
            userId: req.user.id
        });

        // Use safe call with timeout (30s) and retry (3 attempts)
        const razorpayOrder = await safeRazorpayCall(
            'Create Order',
            () => razorpay.orders.create(orderOptions),
            { timeout: 30000, retry: true }
        );

        console.log('[Payment] Razorpay order created:', {
            orderId: razorpayOrder.id,
            status: razorpayOrder.status
        });

        // Create donation record with pending status
        const donation = await Donation.create({
            userId: req.user.id,
            amount: amount,
            currency: currency.toUpperCase(),
            status: 'pending',
            paymentMethod: paymentMethod || 'other',
            gatewayOrderId: razorpayOrder.id,
            notes: notes,
            isAnonymous: isAnonymous || false,
            donationDate: new Date()
        });

        // Log payment initiation
        await PaymentLog.createLog({
            donationId: donation._id,
            userId: req.user.id,
            eventType: 'initiated',
            eventData: {
                razorpayOrderId: razorpayOrder.id,
                receipt: razorpayOrder.receipt,
                amountInPaise: amountInPaise
            },
            gatewayName: 'razorpay',
            amount: amount,
            currency: currency.toUpperCase(),
            statusCode: '200',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        console.log('[Payment] Donation record created:', {
            donationId: donation._id,
            status: donation.status
        });

        // Return order details for frontend checkout
        res.status(201).json({
            success: true,
            message: 'Payment order created successfully',
            order: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                amountInRupees: amount,
                currency: razorpayOrder.currency,
                receipt: razorpayOrder.receipt,
                status: razorpayOrder.status
            },
            donation: {
                _id: donation._id,
                amount: donation.amount,
                currency: donation.currency,
                status: donation.status
            },
            // Razorpay checkout options for frontend
            razorpayOptions: {
                key: keyId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'NGO Donation',
                description: notes || 'Donation to NGO',
                order_id: razorpayOrder.id,
                prefill: {
                    email: req.user.email || '',
                    contact: req.user.phone || ''
                },
                theme: {
                    color: '#3399cc'
                }
            }
        });

    } catch (error) {
        console.error('[Payment] Error creating order:', error);

        // Log the error
        if (req.user) {
            await PaymentLog.createLog({
                donationId: null,
                userId: req.user.id,
                eventType: 'failed',
                eventData: {
                    error: error.message,
                    errorCode: error.code || 'UNKNOWN'
                },
                gatewayName: 'razorpay',
                amount: req.body.amount || 0,
                currency: req.body.currency || 'INR',
                statusCode: error.statusCode || '500',
                errorMessage: error.message,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }).catch(logError => {
                console.error('[Payment] Error logging payment failure:', logError);
            });
        }

        next(error);
    }
};

/**
 * @desc    Verify payment after completion (called from frontend)
 * @route   POST /api/payments/verify
 * @access  Private
 */
const verifyPayment = async (req, res, next) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            donationId
        } = req.body;

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing payment verification parameters'
            });
        }

        console.log('[Payment] Verifying payment:', {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id
        });

        // Find the donation
        const donation = await Donation.findOne({
            gatewayOrderId: razorpay_order_id
        });

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found for this order'
            });
        }

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isValidSignature = expectedSignature === razorpay_signature;

        console.log('[Payment] Signature verification:', {
            isValid: isValidSignature,
            orderId: razorpay_order_id
        });

        if (!isValidSignature) {
            // Log failed verification
            await PaymentLog.createLog({
                donationId: donation._id,
                userId: donation.userId,
                eventType: 'failed',
                eventData: {
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    reason: 'Signature verification failed'
                },
                gatewayName: 'razorpay',
                amount: donation.amount,
                currency: donation.currency,
                statusCode: '400',
                errorMessage: 'Invalid payment signature',
                ipAddress: req.ip
            });

            return res.status(400).json({
                success: false,
                message: 'Payment verification failed - Invalid signature'
            });
        }

        // Update donation status to success
        donation.status = 'success';
        donation.gatewayPaymentId = razorpay_payment_id;
        donation.transactionId = `TXN${Date.now()}`;
        donation.completedAt = new Date();
        await donation.save();

        // Log successful payment
        await PaymentLog.createLog({
            donationId: donation._id,
            userId: donation.userId,
            eventType: 'success',
            eventData: {
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                signatureVerified: true
            },
            gatewayName: 'razorpay',
            amount: donation.amount,
            currency: donation.currency,
            statusCode: '200',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        console.log('[Payment] Payment verified successfully:', {
            donationId: donation._id,
            paymentId: razorpay_payment_id,
            receiptNumber: donation.receiptNumber
        });

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            donation: {
                _id: donation._id,
                amount: donation.amount,
                currency: donation.currency,
                status: donation.status,
                receiptNumber: donation.receiptNumber,
                transactionId: donation.transactionId,
                completedAt: donation.completedAt
            }
        });

    } catch (error) {
        console.error('[Payment] Error verifying payment:', error);
        next(error);
    }
};

/**
 * @desc    Get payment status by donation ID
 * @route   GET /api/payments/status/:donationId
 * @access  Private
 */
const getPaymentStatus = async (req, res, next) => {
    try {
        const { donationId } = req.params;

        const donation = await Donation.findById(donationId);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        // Check if user owns this donation or is admin
        if (donation.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this payment'
            });
        }

        // Get payment logs
        const paymentLogs = await PaymentLog.getDonationTimeline(donation._id);

        // If there's a Razorpay order, fetch its status
        let razorpayStatus = null;
        if (donation.gatewayOrderId) {
            try {
                // Use safe call for fetching order status
                const order = await safeRazorpayCall(
                    'Fetch Order Status',
                    () => razorpay.orders.fetch(donation.gatewayOrderId),
                    { timeout: 10000, retry: true }
                );

                razorpayStatus = {
                    orderId: order.id,
                    status: order.status,
                    attempts: order.attempts,
                    amountPaid: order.amount_paid / 100,
                    amountDue: order.amount_due / 100
                };
            } catch (fetchError) {
                console.error('[Payment] Error fetching Razorpay order:', fetchError.message);
                // Don't fail the entire request if just polling status fails
            }
        }

        res.status(200).json({
            success: true,
            donation: {
                _id: donation._id,
                amount: donation.amount,
                currency: donation.currency,
                status: donation.status,
                paymentMethod: donation.paymentMethod,
                gatewayOrderId: donation.gatewayOrderId,
                gatewayPaymentId: donation.gatewayPaymentId,
                transactionId: donation.transactionId,
                receiptNumber: donation.receiptNumber,
                donationDate: donation.donationDate,
                completedAt: donation.completedAt
            },
            razorpayStatus,
            paymentTimeline: paymentLogs
        });

    } catch (error) {
        console.error('[Payment] Error getting payment status:', error);
        next(error);
    }
};

/**
 * @desc    Fetch Razorpay payment details
 * @route   GET /api/payments/razorpay/:paymentId
 * @access  Private/Admin
 */
const fetchRazorpayPayment = async (req, res, next) => {
    try {
        const { paymentId } = req.params;

        const payment = await safeRazorpayCall(
            'Fetch Payment Details',
            () => razorpay.payments.fetch(paymentId),
            { timeout: 10000, retry: true }
        );

        res.status(200).json({
            success: true,
            payment: {
                id: payment.id,
                amount: payment.amount / 100,
                currency: payment.currency,
                status: payment.status,
                method: payment.method,
                orderId: payment.order_id,
                email: payment.email,
                contact: payment.contact,
                createdAt: new Date(payment.created_at * 1000)
            }
        });

    } catch (error) {
        console.error('[Payment] Error fetching Razorpay payment:', error);
        next(error);
    }
};

/**
 * @desc    Sync payment status with Razorpay (for polling/refresh)
 * @route   POST /api/payments/sync/:donationId
 * @access  Private
 */
const syncStatus = async (req, res, next) => {
    try {
        const { donationId } = req.params;
        const paymentService = require('../services/paymentService');

        const donation = await Donation.findById(donationId);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        // Check authorization
        if (donation.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        const syncResult = await paymentService.syncPaymentStatus(donationId);

        res.status(200).json({
            success: true,
            ...syncResult
        });

    } catch (error) {
        console.error('[Payment] Error syncing status:', error);
        next(error);
    }
};

/**
 * @desc    Get payment analytics (Admin only)
 * @route   GET /api/payments/analytics
 * @access  Private/Admin
 */
const getAnalytics = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const paymentService = require('../services/paymentService');

        const analytics = await paymentService.getPaymentAnalytics(startDate, endDate);

        res.status(200).json({
            success: true,
            analytics
        });

    } catch (error) {
        console.error('[Payment] Error getting analytics:', error);
        next(error);
    }
};

/**
 * @desc    Get recent payment activity (Admin only)
 * @route   GET /api/payments/activity
 * @access  Private/Admin
 */
const getRecentActivity = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const paymentService = require('../services/paymentService');

        const activity = await paymentService.getRecentPaymentActivity(limit);

        res.status(200).json({
            success: true,
            count: activity.length,
            activity
        });

    } catch (error) {
        console.error('[Payment] Error getting activity:', error);
        next(error);
    }
};

/**
 * @desc    Check and sync stale pending payments (Admin only)
 * @route   POST /api/payments/check-stale
 * @access  Private/Admin
 */
const checkStalePayments = async (req, res, next) => {
    try {
        const minutes = parseInt(req.query.minutes) || 30;
        const paymentService = require('../services/paymentService');

        const results = await paymentService.checkStalePendingPayments(minutes);

        res.status(200).json({
            success: true,
            message: `Checked ${results.total} stale payments`,
            results
        });

    } catch (error) {
        console.error('[Payment] Error checking stale payments:', error);
        next(error);
    }
};

/**
 * @desc    Mark a payment as failed (called when user cancels or payment fails)
 * @route   POST /api/payments/mark-failed/:donationId
 * @access  Private
 */
const markFailed = async (req, res, next) => {
    try {
        const { donationId } = req.params;
        const { reason } = req.body;

        const donation = await Donation.findById(donationId);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        // Check if user owns this donation
        if (donation.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Only update if still pending
        if (donation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot mark as failed - donation is already ${donation.status}`
            });
        }

        // Update donation status
        donation.status = 'failed';
        await donation.save();

        // Log the failure
        await PaymentLog.createLog({
            donationId: donation._id,
            userId: donation.userId,
            eventType: 'failed',
            eventData: {
                reason: reason || 'Payment failed or cancelled by user',
                gatewayOrderId: donation.gatewayOrderId
            },
            gatewayName: 'razorpay',
            amount: donation.amount,
            currency: donation.currency,
            statusCode: '200',
            errorMessage: reason || 'Payment failed or cancelled',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        console.log('[Payment] Donation marked as failed:', {
            donationId: donation._id,
            reason: reason || 'User action'
        });

        res.status(200).json({
            success: true,
            message: 'Donation marked as failed',
            donation: {
                _id: donation._id,
                amount: donation.amount,
                status: donation.status
            }
        });

    } catch (error) {
        console.error('[Payment] Error marking payment as failed:', error);
        next(error);
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    getPaymentStatus,
    fetchRazorpayPayment,
    syncStatus,
    getAnalytics,
    getRecentActivity,
    checkStalePayments,
    markFailed
};
