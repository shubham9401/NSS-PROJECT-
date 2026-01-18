/**
 * Webhook Controller - Razorpay Webhooks
 * Handles server-to-server payment notifications from Razorpay
 * 
 * IMPORTANT: Webhooks are called by Razorpay servers, not by users.
 * They provide reliable payment status updates even if user closes browser.
 */

const crypto = require('crypto');
const Donation = require('../models/Donation');
const PaymentLog = require('../models/PaymentLog');

/**
 * Verify Razorpay webhook signature
 * @param {string} body - Raw request body (as string)
 * @param {string} signature - X-Razorpay-Signature header
 * @param {string} secret - Webhook secret from Razorpay dashboard
 * @returns {boolean} - Whether signature is valid
 */
const verifyWebhookSignature = (body, signature, secret) => {
    if (!body || !signature || !secret) {
        console.error('[Webhook] Missing parameters for signature verification');
        return false;
    }

    try {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        const isValid = crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );

        console.log('[Webhook] Signature verification:', {
            isValid,
            signatureLength: signature.length
        });

        return isValid;
    } catch (error) {
        console.error('[Webhook] Signature verification error:', error.message);
        return false;
    }
};

/**
 * @desc    Handle Razorpay webhook events
 * @route   POST /api/webhooks/razorpay
 * @access  Public (verified by signature)
 */
const handleRazorpayWebhook = async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    console.log('[Webhook] Received Razorpay webhook:', {
        event: req.body?.event,
        hasSignature: !!signature,
        hasSecret: !!webhookSecret
    });

    // In development/sandbox mode, we can skip signature verification
    // In production, signature verification is MANDATORY
    if (process.env.NODE_ENV === 'production') {
        if (!webhookSecret) {
            console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET not configured');
            return res.status(500).json({
                success: false,
                message: 'Webhook secret not configured'
            });
        }

        // Get raw body for signature verification
        const rawBody = JSON.stringify(req.body);
        const isValidSignature = verifyWebhookSignature(rawBody, signature, webhookSecret);

        if (!isValidSignature) {
            console.error('[Webhook] Invalid signature - rejecting webhook');

            // Log the failed attempt
            await PaymentLog.create({
                eventType: 'failed',
                eventData: {
                    reason: 'Invalid webhook signature',
                    event: req.body?.event
                },
                gatewayName: 'razorpay',
                amount: 0,
                statusCode: '401',
                errorMessage: 'Webhook signature verification failed',
                ipAddress: req.ip
            }).catch(err => console.error('[Webhook] Failed to log invalid signature:', err));

            return res.status(401).json({
                success: false,
                message: 'Invalid webhook signature'
            });
        }
    } else {
        console.log('[Webhook] Skipping signature verification (development mode)');
    }

    // Process the webhook event
    const { event, payload } = req.body;

    try {
        switch (event) {
            case 'payment.captured':
                await handlePaymentCaptured(payload);
                break;

            case 'payment.failed':
                await handlePaymentFailed(payload);
                break;

            case 'payment.authorized':
                await handlePaymentAuthorized(payload);
                break;

            case 'order.paid':
                await handleOrderPaid(payload);
                break;

            case 'refund.created':
                await handleRefundCreated(payload);
                break;

            default:
                console.log(`[Webhook] Unhandled event type: ${event}`);
        }

        // Always respond with 200 to acknowledge receipt
        // Razorpay will retry if we don't respond with 2xx
        res.status(200).json({
            success: true,
            message: 'Webhook processed successfully'
        });

    } catch (error) {
        console.error('[Webhook] Error processing webhook:', error);

        // Still return 200 to prevent Razorpay from retrying
        // Log the error for debugging
        res.status(200).json({
            success: true,
            message: 'Webhook received (with processing error)'
        });
    }
};

/**
 * Handle payment.captured event
 * Payment has been successfully captured
 */
const handlePaymentCaptured = async (payload) => {
    const payment = payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;

    console.log('[Webhook] Payment captured:', {
        orderId,
        paymentId,
        amount: payment.amount / 100,
        method: payment.method
    });

    // Find donation by order ID
    const donation = await Donation.findOne({ gatewayOrderId: orderId });

    if (!donation) {
        console.error('[Webhook] Donation not found for order:', orderId);
        return;
    }

    // Skip if already processed
    if (donation.status === 'success') {
        console.log('[Webhook] Payment already processed, skipping');
        return;
    }

    // Update donation status
    const previousStatus = donation.status;
    donation.status = 'success';
    donation.gatewayPaymentId = paymentId;
    donation.transactionId = `TXN${Date.now()}`;
    donation.completedAt = new Date();
    donation.paymentMethod = mapPaymentMethod(payment.method);
    await donation.save();

    // Log the event
    await PaymentLog.createLog({
        donationId: donation._id,
        userId: donation.userId,
        eventType: 'success',
        eventData: {
            webhookEvent: 'payment.captured',
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            method: payment.method,
            email: payment.email,
            contact: payment.contact,
            previousStatus
        },
        gatewayName: 'razorpay',
        amount: payment.amount / 100,
        currency: payment.currency,
        statusCode: '200'
    });

    console.log('[Webhook] Donation updated to success:', donation._id);
};

/**
 * Handle payment.failed event
 */
const handlePaymentFailed = async (payload) => {
    const payment = payload.payment.entity;
    const orderId = payment.order_id;
    const errorCode = payment.error_code;
    const errorDescription = payment.error_description;

    console.log('[Webhook] Payment failed:', {
        orderId,
        errorCode,
        errorDescription
    });

    const donation = await Donation.findOne({ gatewayOrderId: orderId });

    if (!donation) {
        console.error('[Webhook] Donation not found for order:', orderId);
        return;
    }

    // Update donation status
    const previousStatus = donation.status;
    donation.status = 'failed';
    await donation.save();

    // Log the failure
    await PaymentLog.createLog({
        donationId: donation._id,
        userId: donation.userId,
        eventType: 'failed',
        eventData: {
            webhookEvent: 'payment.failed',
            razorpayOrderId: orderId,
            errorCode,
            errorDescription,
            previousStatus
        },
        gatewayName: 'razorpay',
        amount: payment.amount / 100,
        currency: payment.currency,
        statusCode: errorCode || '400',
        errorMessage: errorDescription || 'Payment failed'
    });

    console.log('[Webhook] Donation marked as failed:', donation._id);
};

/**
 * Handle payment.authorized event
 * Payment is authorized but not yet captured
 */
const handlePaymentAuthorized = async (payload) => {
    const payment = payload.payment.entity;
    const orderId = payment.order_id;

    console.log('[Webhook] Payment authorized:', { orderId });

    const donation = await Donation.findOne({ gatewayOrderId: orderId });

    if (!donation) {
        return;
    }

    // Log the authorization
    await PaymentLog.createLog({
        donationId: donation._id,
        userId: donation.userId,
        eventType: 'processing',
        eventData: {
            webhookEvent: 'payment.authorized',
            razorpayOrderId: orderId,
            razorpayPaymentId: payment.id
        },
        gatewayName: 'razorpay',
        amount: payment.amount / 100,
        currency: payment.currency,
        statusCode: '200'
    });
};

/**
 * Handle order.paid event
 * Order has been fully paid
 */
const handleOrderPaid = async (payload) => {
    const order = payload.order.entity;
    const orderId = order.id;

    console.log('[Webhook] Order paid:', {
        orderId,
        amount: order.amount_paid / 100
    });

    const donation = await Donation.findOne({ gatewayOrderId: orderId });

    if (!donation) {
        return;
    }

    // This is a backup event - payment.captured should have already updated
    if (donation.status !== 'success') {
        donation.status = 'success';
        donation.completedAt = new Date();
        await donation.save();
    }

    // Log the event
    await PaymentLog.createLog({
        donationId: donation._id,
        userId: donation.userId,
        eventType: 'success',
        eventData: {
            webhookEvent: 'order.paid',
            razorpayOrderId: orderId,
            amountPaid: order.amount_paid / 100
        },
        gatewayName: 'razorpay',
        amount: order.amount_paid / 100,
        currency: order.currency,
        statusCode: '200'
    });
};

/**
 * Handle refund.created event
 */
const handleRefundCreated = async (payload) => {
    const refund = payload.refund.entity;
    const paymentId = refund.payment_id;

    console.log('[Webhook] Refund created:', {
        refundId: refund.id,
        paymentId,
        amount: refund.amount / 100
    });

    const donation = await Donation.findOne({ gatewayPaymentId: paymentId });

    if (!donation) {
        console.log('[Webhook] Donation not found for payment:', paymentId);
        return;
    }

    // Log the refund
    await PaymentLog.createLog({
        donationId: donation._id,
        userId: donation.userId,
        eventType: 'refund',
        eventData: {
            webhookEvent: 'refund.created',
            refundId: refund.id,
            razorpayPaymentId: paymentId,
            refundAmount: refund.amount / 100,
            status: refund.status
        },
        gatewayName: 'razorpay',
        amount: refund.amount / 100,
        currency: refund.currency,
        statusCode: '200'
    });

    console.log('[Webhook] Refund logged for donation:', donation._id);
};

/**
 * Map Razorpay payment method to our enum
 */
const mapPaymentMethod = (razorpayMethod) => {
    const methodMap = {
        'card': 'card',
        'upi': 'upi',
        'netbanking': 'netbanking',
        'wallet': 'wallet',
        'emi': 'card',
        'bank_transfer': 'netbanking'
    };
    return methodMap[razorpayMethod] || 'other';
};

module.exports = {
    handleRazorpayWebhook,
    verifyWebhookSignature
};
