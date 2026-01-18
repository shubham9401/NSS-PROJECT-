/**
 * Webhook Routes - External Payment Gateway Callbacks
 */

const express = require('express');
const router = express.Router();
const { handleRazorpayWebhook } = require('../controllers/webhookController');

/**
 * @route   POST /api/webhooks/razorpay
 * @desc    Handle Razorpay webhook events
 * @access  Public (verified by signature)
 * 
 * Razorpay sends webhook events for:
 * - payment.captured - Payment successful
 * - payment.failed - Payment failed
 * - payment.authorized - Payment authorized (before capture)
 * - order.paid - Order fully paid
 * - refund.created - Refund initiated
 * 
 * Configure webhook URL in Razorpay Dashboard:
 * Settings -> Webhooks -> Add New Webhook
 * URL: https://your-domain.com/api/webhooks/razorpay
 */
router.post('/razorpay', handleRazorpayWebhook);

module.exports = router;
