const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const {
    initiateDonation,
    paymentWebhook,
    simulatePayment,
    getUserDonations,
    getDonationById,
    getAllDonations,
    getDonationStats
} = require('../controllers/donationController');

const { protect, authorize } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting
router.use(apiLimiter);

// Validation rules
const initiateDonationValidation = [
    body('amount')
        .isNumeric()
        .withMessage('Amount must be a number')
        .custom(value => value >= 1)
        .withMessage('Minimum donation amount is 1'),
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
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes cannot exceed 500 characters'),
    body('isAnonymous')
        .optional()
        .isBoolean()
        .withMessage('isAnonymous must be a boolean')
];

const webhookValidation = [
    body('orderId')
        .notEmpty()
        .withMessage('Order ID is required'),
    body('status')
        .notEmpty()
        .isIn(['success', 'failed', 'pending', 'captured', 'cancelled'])
        .withMessage('Invalid status')
];

const mongoIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid donation ID')
];

const simulatePaymentValidation = [
    body('status')
        .isIn(['success', 'failed'])
        .withMessage('Status must be success or failed')
];

// Public webhook endpoint (no auth, verified by signature)
router.post('/webhook', webhookValidation, paymentWebhook);

// User donation routes
router.post('/', protect, initiateDonationValidation, initiateDonation);
router.get('/', protect, getUserDonations);
router.get('/:id', protect, mongoIdValidation, getDonationById);

// Sandbox testing route (development only)
router.post('/:id/simulate-payment', protect, mongoIdValidation, simulatePaymentValidation, simulatePayment);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllDonations);
router.get('/admin/stats', protect, authorize('admin'), getDonationStats);

module.exports = router;
