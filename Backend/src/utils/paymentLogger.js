/**
 * Payment Logger Utility
 * Comprehensive logging for all payment events
 * Provides structured logging with different levels and contexts
 */

const PaymentLog = require('../models/PaymentLog');

/**
 * Log levels for console output
 */
const LOG_LEVELS = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR'
};

/**
 * Payment event types
 */
const PAYMENT_EVENTS = {
    ORDER_CREATED: 'order_created',
    ORDER_FAILED: 'order_creation_failed',
    PAYMENT_INITIATED: 'payment_initiated',
    PAYMENT_PROCESSING: 'payment_processing',
    PAYMENT_SUCCESS: 'payment_success',
    PAYMENT_FAILED: 'payment_failed',
    PAYMENT_CANCELLED: 'payment_cancelled',
    SIGNATURE_VERIFIED: 'signature_verified',
    SIGNATURE_FAILED: 'signature_verification_failed',
    WEBHOOK_RECEIVED: 'webhook_received',
    WEBHOOK_PROCESSED: 'webhook_processed',
    WEBHOOK_ERROR: 'webhook_error',
    STATUS_SYNCED: 'status_synced',
    REFUND_INITIATED: 'refund_initiated',
    REFUND_COMPLETED: 'refund_completed'
};

/**
 * Format log message with timestamp and context
 */
const formatLogMessage = (level, event, data) => {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [Payment:${event}]`;
    return { prefix, data };
};

/**
 * Console logger with colors (for development)
 */
const consoleLog = (level, event, message, data = {}) => {
    const { prefix } = formatLogMessage(level, event, data);

    const colors = {
        DEBUG: '\x1b[36m',   // Cyan
        INFO: '\x1b[32m',    // Green
        WARN: '\x1b[33m',    // Yellow
        ERROR: '\x1b[31m',   // Red
        RESET: '\x1b[0m'
    };

    const color = colors[level] || colors.RESET;
    const logFn = level === 'ERROR' ? console.error :
        level === 'WARN' ? console.warn :
            console.log;

    logFn(`${color}${prefix}${colors.RESET} ${message}`,
        Object.keys(data).length > 0 ? data : '');
};

/**
 * Main Payment Logger class
 */
class PaymentLogger {
    constructor(context = {}) {
        this.context = context;
        this.enableConsole = process.env.NODE_ENV !== 'test';
        this.enableDatabase = true;
    }

    /**
     * Set context for subsequent logs
     */
    setContext(context) {
        this.context = { ...this.context, ...context };
        return this;
    }

    /**
     * Log to console
     */
    _console(level, event, message, data) {
        if (this.enableConsole) {
            consoleLog(level, event, message, { ...this.context, ...data });
        }
    }

    /**
     * Log to database (PaymentLog model)
     */
    async _database(eventType, data) {
        if (!this.enableDatabase) return;

        try {
            // Only log to DB if we have required fields
            if (data.donationId || data.userId) {
                await PaymentLog.createLog({
                    donationId: data.donationId || null,
                    userId: data.userId || null,
                    eventType: eventType,
                    eventData: data.eventData || {},
                    gatewayName: data.gatewayName || 'razorpay',
                    amount: data.amount || 0,
                    currency: data.currency || 'INR',
                    statusCode: data.statusCode || null,
                    errorMessage: data.errorMessage || null,
                    ipAddress: data.ipAddress || null,
                    userAgent: data.userAgent || null
                });
            }
        } catch (error) {
            console.error('[PaymentLogger] Failed to write to database:', error.message);
        }
    }

    /**
     * Debug level logging
     */
    debug(event, message, data = {}) {
        this._console(LOG_LEVELS.DEBUG, event, message, data);
        return this;
    }

    /**
     * Info level logging
     */
    info(event, message, data = {}) {
        this._console(LOG_LEVELS.INFO, event, message, data);
        return this;
    }

    /**
     * Warning level logging
     */
    warn(event, message, data = {}) {
        this._console(LOG_LEVELS.WARN, event, message, data);
        return this;
    }

    /**
     * Error level logging
     */
    error(event, message, data = {}) {
        this._console(LOG_LEVELS.ERROR, event, message, data);
        return this;
    }

    // ================== Specific Payment Event Loggers ==================

    /**
     * Log order creation
     */
    async orderCreated(data) {
        this.info(PAYMENT_EVENTS.ORDER_CREATED, 'Razorpay order created successfully', {
            orderId: data.orderId,
            amount: data.amount,
            currency: data.currency,
            userId: data.userId
        });

        await this._database('initiated', {
            donationId: data.donationId,
            userId: data.userId,
            eventData: {
                razorpayOrderId: data.orderId,
                receipt: data.receipt
            },
            amount: data.amount,
            currency: data.currency,
            statusCode: '200',
            ipAddress: data.ipAddress,
            userAgent: data.userAgent
        });
    }

    /**
     * Log order creation failure
     */
    async orderCreationFailed(data) {
        this.error(PAYMENT_EVENTS.ORDER_FAILED, 'Failed to create Razorpay order', {
            error: data.error,
            amount: data.amount,
            userId: data.userId
        });

        await this._database('failed', {
            userId: data.userId,
            eventData: {
                error: data.error,
                errorCode: data.errorCode
            },
            amount: data.amount,
            currency: data.currency,
            statusCode: data.errorCode || '500',
            errorMessage: data.error,
            ipAddress: data.ipAddress
        });
    }

    /**
     * Log payment verification success
     */
    async paymentVerified(data) {
        this.info(PAYMENT_EVENTS.PAYMENT_SUCCESS, 'Payment verified successfully', {
            donationId: data.donationId,
            orderId: data.orderId,
            paymentId: data.paymentId,
            amount: data.amount
        });

        await this._database('success', {
            donationId: data.donationId,
            userId: data.userId,
            eventData: {
                razorpayOrderId: data.orderId,
                razorpayPaymentId: data.paymentId,
                signatureVerified: true
            },
            amount: data.amount,
            currency: data.currency,
            statusCode: '200',
            ipAddress: data.ipAddress,
            userAgent: data.userAgent
        });
    }

    /**
     * Log payment verification failure
     */
    async paymentVerificationFailed(data) {
        this.error(PAYMENT_EVENTS.SIGNATURE_FAILED, 'Payment signature verification failed', {
            donationId: data.donationId,
            orderId: data.orderId,
            reason: data.reason
        });

        await this._database('failed', {
            donationId: data.donationId,
            userId: data.userId,
            eventData: {
                razorpayOrderId: data.orderId,
                razorpayPaymentId: data.paymentId,
                reason: data.reason
            },
            amount: data.amount,
            currency: data.currency,
            statusCode: '400',
            errorMessage: data.reason || 'Signature verification failed',
            ipAddress: data.ipAddress
        });
    }

    /**
     * Log webhook received
     */
    async webhookReceived(data) {
        this.info(PAYMENT_EVENTS.WEBHOOK_RECEIVED, `Webhook received: ${data.event}`, {
            event: data.event,
            orderId: data.orderId,
            paymentId: data.paymentId
        });
    }

    /**
     * Log webhook processed successfully
     */
    async webhookProcessed(data) {
        this.info(PAYMENT_EVENTS.WEBHOOK_PROCESSED, `Webhook processed: ${data.event}`, {
            donationId: data.donationId,
            event: data.event,
            statusUpdated: data.statusUpdated
        });

        await this._database(data.eventType || 'success', {
            donationId: data.donationId,
            userId: data.userId,
            eventData: {
                webhookEvent: data.event,
                ...data.eventData
            },
            amount: data.amount,
            currency: data.currency,
            statusCode: '200'
        });
    }

    /**
     * Log webhook error
     */
    async webhookError(data) {
        this.error(PAYMENT_EVENTS.WEBHOOK_ERROR, 'Webhook processing error', {
            event: data.event,
            error: data.error
        });
    }

    /**
     * Log status sync
     */
    async statusSynced(data) {
        this.info(PAYMENT_EVENTS.STATUS_SYNCED, 'Payment status synced with Razorpay', {
            donationId: data.donationId,
            previousStatus: data.previousStatus,
            currentStatus: data.currentStatus,
            razorpayStatus: data.razorpayStatus
        });

        if (data.statusChanged) {
            await this._database(data.currentStatus, {
                donationId: data.donationId,
                userId: data.userId,
                eventData: {
                    syncedFromRazorpay: true,
                    previousStatus: data.previousStatus,
                    razorpayStatus: data.razorpayStatus
                },
                amount: data.amount,
                currency: data.currency,
                statusCode: '200'
            });
        }
    }

    /**
     * Log refund
     */
    async refundProcessed(data) {
        this.info(PAYMENT_EVENTS.REFUND_COMPLETED, 'Refund processed', {
            donationId: data.donationId,
            refundId: data.refundId,
            amount: data.amount
        });

        await this._database('refund', {
            donationId: data.donationId,
            userId: data.userId,
            eventData: {
                refundId: data.refundId,
                refundAmount: data.refundAmount
            },
            amount: data.refundAmount,
            currency: data.currency,
            statusCode: '200'
        });
    }
}

/**
 * Create a new logger instance
 */
const createLogger = (context = {}) => new PaymentLogger(context);

/**
 * Default logger instance
 */
const logger = new PaymentLogger();

module.exports = {
    PaymentLogger,
    createLogger,
    logger,
    LOG_LEVELS,
    PAYMENT_EVENTS
};
