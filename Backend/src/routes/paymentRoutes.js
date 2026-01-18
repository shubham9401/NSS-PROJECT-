/**
 * Payment Routes - Razorpay Integration
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
    createOrder,
    verifyPayment,
    getPaymentStatus,
    fetchRazorpayPayment,
    syncStatus,
    getAnalytics,
    getRecentActivity,
    checkStalePayments
} = require('../controllers/paymentController');

// Validation rules for creating order
const createOrderValidation = [
    body('amount')
        .isNumeric()
        .withMessage('Amount must be a number')
        .custom(value => value >= 1)
        .withMessage('Minimum donation amount is 1 INR'),
    body('currency')
        .optional()
        .isIn(['INR', 'USD', 'EUR', 'GBP'])
        .withMessage('Invalid currency'),
    body('paymentMethod')
        .optional()
        .isIn(['card', 'upi', 'netbanking', 'wallet', 'other'])
        .withMessage('Invalid payment method'),
    body('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Notes cannot exceed 500 characters'),
    body('isAnonymous')
        .optional()
        .isBoolean()
        .withMessage('isAnonymous must be a boolean')
];

// Validation for payment verification
const verifyPaymentValidation = [
    body('razorpay_order_id')
        .notEmpty()
        .withMessage('Razorpay order ID is required'),
    body('razorpay_payment_id')
        .notEmpty()
        .withMessage('Razorpay payment ID is required'),
    body('razorpay_signature')
        .notEmpty()
        .withMessage('Razorpay signature is required')
];

// Routes

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order for payment
// @access  Private
router.post('/create-order', protect, createOrderValidation, createOrder);

// @route   POST /api/payments/verify
// @desc    Verify payment after completion
// @access  Private
router.post('/verify', protect, verifyPaymentValidation, verifyPayment);

// @route   GET /api/payments/status/:donationId
// @desc    Get payment status
// @access  Private
router.get('/status/:donationId', protect, getPaymentStatus);

// @route   POST /api/payments/sync/:donationId
// @desc    Sync payment status with Razorpay (for polling/refresh)
// @access  Private
router.post('/sync/:donationId', protect, syncStatus);

// @route   GET /api/payments/analytics
// @desc    Get payment analytics (Admin only)
// @access  Private/Admin
router.get('/analytics', protect, getAnalytics);

// @route   GET /api/payments/activity
// @desc    Get recent payment activity (Admin only)
// @access  Private/Admin
router.get('/activity', protect, getRecentActivity);

// @route   POST /api/payments/check-stale
// @desc    Check and sync stale pending payments (Admin only)
// @access  Private/Admin
router.post('/check-stale', protect, checkStalePayments);

// @route   GET /api/payments/razorpay/:paymentId
// @desc    Fetch Razorpay payment details (Admin only)
// @access  Private/Admin
router.get('/razorpay/:paymentId', protect, fetchRazorpayPayment);

module.exports = router;
