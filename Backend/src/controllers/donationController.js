const crypto = require('crypto');
const { validationResult } = require('express-validator');
const Donation = require('../models/Donation');
const PaymentLog = require('../models/PaymentLog');

/**
 * Sandbox Payment Gateway Simulation
 * In production, replace with actual payment gateway (Razorpay, Stripe, etc.)
 */
const simulatePaymentGateway = {
    /**
     * Create order with payment gateway
     */
    createOrder: async (amount, currency, userId) => {
        // Simulate gateway order creation
        const orderId = `order_${crypto.randomBytes(12).toString('hex')}`;
        const paymentLink = `https://sandbox.payment.com/pay/${orderId}`;

        return {
            success: true,
            orderId,
            amount,
            currency,
            paymentLink,
            // In sandbox mode, we auto-generate these for testing
            simulatedPaymentId: `pay_${crypto.randomBytes(12).toString('hex')}`
        };
    },

    /**
     * Verify payment signature (for webhook validation)
     */
    verifySignature: (payload, signature, secret) => {
        // In production, use actual gateway signature verification
        // For sandbox, we'll use a simple HMAC check
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');

        return signature === expectedSignature || signature === 'sandbox_signature';
    }
};

/**
 * @desc    Initiate a new donation
 * @route   POST /api/donations
 * @access  Private
 */
const initiateDonation = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { amount, currency, paymentMethod, notes, isAnonymous } = req.body;

        // Create payment order with gateway
        const gatewayResponse = await simulatePaymentGateway.createOrder(
            amount,
            currency || 'INR',
            req.user.id
        );

        if (!gatewayResponse.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create payment order'
            });
        }

        // Create donation record (status: pending)
        // This ensures user data is saved regardless of payment outcome
        const donation = await Donation.create({
            userId: req.user.id,
            amount,
            currency: currency || 'INR',
            status: 'pending',
            paymentMethod: paymentMethod || 'other',
            gatewayOrderId: gatewayResponse.orderId,
            notes,
            isAnonymous: isAnonymous || false,
            donationDate: new Date()
        });

        // Log payment initiation
        await PaymentLog.createLog({
            donationId: donation._id,
            userId: req.user.id,
            eventType: 'initiated',
            eventData: {
                orderId: gatewayResponse.orderId,
                paymentLink: gatewayResponse.paymentLink
            },
            gatewayName: 'sandbox',
            amount,
            currency: currency || 'INR',
            statusCode: '200',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(201).json({
            success: true,
            message: 'Donation initiated successfully',
            donation: {
                _id: donation._id,
                amount: donation.amount,
                currency: donation.currency,
                status: donation.status,
                gatewayOrderId: donation.gatewayOrderId
            },
            payment: {
                orderId: gatewayResponse.orderId,
                paymentLink: gatewayResponse.paymentLink,
                // For sandbox testing, include simulated payment ID
                ...(process.env.NODE_ENV !== 'production' && {
                    sandboxPaymentId: gatewayResponse.simulatedPaymentId
                })
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Webhook for payment status updates
 * @route   POST /api/donations/webhook
 * @access  Public (verified by signature)
 */
const paymentWebhook = async (req, res, next) => {
    try {
        const { orderId, paymentId, status, signature } = req.body;

        // Verify webhook signature (skip in sandbox mode for testing)
        if (process.env.NODE_ENV === 'production') {
            const isValid = simulatePaymentGateway.verifySignature(
                { orderId, paymentId, status },
                signature,
                process.env.PAYMENT_WEBHOOK_SECRET
            );

            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid signature'
                });
            }
        }

        // Find donation by gateway order ID
        const donation = await Donation.findOne({ gatewayOrderId: orderId });

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        // Update donation status based on payment result
        const previousStatus = donation.status;

        if (status === 'success' || status === 'captured') {
            donation.status = 'success';
            donation.gatewayPaymentId = paymentId;
            donation.transactionId = `TXN${Date.now()}`;
            donation.completedAt = new Date();
        } else if (status === 'failed' || status === 'cancelled') {
            donation.status = 'failed';
        }
        // For 'pending' or 'processing', keep status as pending

        await donation.save();

        // Log payment event
        await PaymentLog.createLog({
            donationId: donation._id,
            userId: donation.userId,
            eventType: donation.status,
            eventData: {
                orderId,
                paymentId,
                previousStatus,
                webhookStatus: status
            },
            gatewayName: 'sandbox',
            amount: donation.amount,
            currency: donation.currency,
            statusCode: donation.status === 'success' ? '200' : '400',
            errorMessage: donation.status === 'failed' ? 'Payment failed or cancelled' : null,
            ipAddress: req.ip
        });

        res.status(200).json({
            success: true,
            message: `Donation status updated to ${donation.status}`,
            donation: {
                _id: donation._id,
                status: donation.status,
                receiptNumber: donation.receiptNumber
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Simulate payment completion (for sandbox testing)
 * @route   POST /api/donations/:id/simulate-payment
 * @access  Private (development only)
 */
const simulatePayment = async (req, res, next) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                message: 'This endpoint is only available in development mode'
            });
        }

        const { status } = req.body; // 'success' or 'failed'
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        if (donation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Can only simulate payment for pending donations'
            });
        }

        // Update donation status
        donation.status = status === 'success' ? 'success' : 'failed';
        if (status === 'success') {
            donation.gatewayPaymentId = `pay_simulated_${Date.now()}`;
            donation.transactionId = `TXN${Date.now()}`;
        }
        await donation.save();

        // Log payment event
        await PaymentLog.createLog({
            donationId: donation._id,
            userId: donation.userId,
            eventType: donation.status,
            eventData: { simulated: true },
            gatewayName: 'sandbox',
            amount: donation.amount,
            currency: donation.currency,
            statusCode: status === 'success' ? '200' : '400',
            errorMessage: status === 'failed' ? 'Simulated payment failure' : null
        });

        res.status(200).json({
            success: true,
            message: `Payment simulated as ${donation.status}`,
            donation
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user's donation history
 * @route   GET /api/donations
 * @access  Private
 */
const getUserDonations = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        // Build query
        const query = { userId: req.user.id };

        // Filter by status
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Filter by date range
        if (req.query.startDate || req.query.endDate) {
            query.donationDate = {};
            if (req.query.startDate) {
                query.donationDate.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                query.donationDate.$lte = new Date(req.query.endDate);
            }
        }

        // Sort options
        const sortField = req.query.sortBy || 'donationDate';
        const sortOrder = req.query.order === 'asc' ? 1 : -1;

        const donations = await Donation.find(query)
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit);

        const total = await Donation.countDocuments(query);

        // Get user stats
        const stats = await Donation.getUserStats(req.user.id);

        res.status(200).json({
            success: true,
            count: donations.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            stats,
            donations
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single donation details
 * @route   GET /api/donations/:id
 * @access  Private
 */
const getDonationById = async (req, res, next) => {
    try {
        const donation = await Donation.findById(req.params.id)
            .populate('userId', 'firstName lastName email');

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        // Users can only view their own donations, admins can view all
        if (donation.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this donation'
            });
        }

        // Get payment timeline
        const paymentLogs = await PaymentLog.getDonationTimeline(donation._id);

        res.status(200).json({
            success: true,
            donation,
            paymentTimeline: paymentLogs
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all donations (Admin only)
 * @route   GET /api/donations/admin/all
 * @access  Private/Admin
 */
const getAllDonations = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const query = {};

        // Filters
        if (req.query.status) {
            query.status = req.query.status;
        }
        if (req.query.userId) {
            query.userId = req.query.userId;
        }
        if (req.query.minAmount) {
            query.amount = { $gte: parseFloat(req.query.minAmount) };
        }
        if (req.query.maxAmount) {
            query.amount = { ...query.amount, $lte: parseFloat(req.query.maxAmount) };
        }
        if (req.query.startDate || req.query.endDate) {
            query.donationDate = {};
            if (req.query.startDate) {
                query.donationDate.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                query.donationDate.$lte = new Date(req.query.endDate);
            }
        }

        const sortField = req.query.sortBy || 'donationDate';
        const sortOrder = req.query.order === 'asc' ? 1 : -1;

        const donations = await Donation.find(query)
            .populate('userId', 'firstName lastName email')
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit);

        const total = await Donation.countDocuments(query);

        // Get overall stats
        const stats = await Donation.getOverallStats();

        res.status(200).json({
            success: true,
            count: donations.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            stats,
            donations
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get donation statistics (Admin only)
 * @route   GET /api/donations/admin/stats
 * @access  Private/Admin
 */
const getDonationStats = async (req, res, next) => {
    try {
        const stats = await Donation.getOverallStats();

        // Calculate totals
        const summary = {
            totalDonations: 0,
            successfulDonations: 0,
            pendingDonations: 0,
            failedDonations: 0,
            totalAmountReceived: 0,
            totalAmountPending: 0
        };

        stats.forEach(stat => {
            summary.totalDonations += stat.count;
            if (stat._id === 'success') {
                summary.successfulDonations = stat.count;
                summary.totalAmountReceived = stat.totalAmount;
            } else if (stat._id === 'pending') {
                summary.pendingDonations = stat.count;
                summary.totalAmountPending = stat.totalAmount;
            } else if (stat._id === 'failed') {
                summary.failedDonations = stat.count;
            }
        });

        // Get recent donations
        const recentDonations = await Donation.find({ status: 'success' })
            .populate('userId', 'firstName lastName')
            .sort({ completedAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            summary,
            breakdown: stats,
            recentSuccessful: recentDonations
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    initiateDonation,
    paymentWebhook,
    simulatePayment,
    getUserDonations,
    getDonationById,
    getAllDonations,
    getDonationStats
};
