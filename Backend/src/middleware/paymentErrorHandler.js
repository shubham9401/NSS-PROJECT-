/**
 * Payment Error Handler
 * Handles edge cases: network failures, timeouts, retries
 */

/**
 * Custom Payment Error class
 */
class PaymentError extends Error {
    constructor(message, code, isRetryable = false, originalError = null) {
        super(message);
        this.name = 'PaymentError';
        this.code = code;
        this.isRetryable = isRetryable;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            isRetryable: this.isRetryable,
            timestamp: this.timestamp
        };
    }
}

/**
 * Error codes for payment operations
 */
const PAYMENT_ERROR_CODES = {
    // Network errors
    NETWORK_ERROR: 'PAYMENT_NETWORK_ERROR',
    TIMEOUT: 'PAYMENT_TIMEOUT',
    CONNECTION_REFUSED: 'PAYMENT_CONNECTION_REFUSED',

    // Gateway errors
    GATEWAY_ERROR: 'GATEWAY_ERROR',
    GATEWAY_UNAVAILABLE: 'GATEWAY_UNAVAILABLE',
    INVALID_RESPONSE: 'INVALID_GATEWAY_RESPONSE',

    // Validation errors
    INVALID_AMOUNT: 'INVALID_AMOUNT',
    INVALID_CURRENCY: 'INVALID_CURRENCY',
    INVALID_SIGNATURE: 'INVALID_SIGNATURE',

    // Order errors
    ORDER_CREATION_FAILED: 'ORDER_CREATION_FAILED',
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    ORDER_EXPIRED: 'ORDER_EXPIRED',

    // Payment errors
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    PAYMENT_CANCELLED: 'PAYMENT_CANCELLED',
    PAYMENT_DECLINED: 'PAYMENT_DECLINED',
    INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',

    // System errors
    DATABASE_ERROR: 'DATABASE_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
};

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
    retryableErrors: [
        PAYMENT_ERROR_CODES.NETWORK_ERROR,
        PAYMENT_ERROR_CODES.TIMEOUT,
        PAYMENT_ERROR_CODES.GATEWAY_UNAVAILABLE,
        PAYMENT_ERROR_CODES.CONNECTION_REFUSED
    ]
};

/**
 * Sleep utility for delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
const calculateBackoff = (attempt, config = RETRY_CONFIG) => {
    const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
    );
    // Add jitter (±10%)
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
};

/**
 * Wrap async function with timeout
 */
const withTimeout = async (promise, timeoutMs, operation = 'Operation') => {
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new PaymentError(
                `${operation} timed out after ${timeoutMs}ms`,
                PAYMENT_ERROR_CODES.TIMEOUT,
                true
            ));
        }, timeoutMs);
    });

    try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutId);
        return result;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
};

/**
 * Retry wrapper for payment operations
 */
const withRetry = async (fn, options = {}) => {
    const config = { ...RETRY_CONFIG, ...options };
    let lastError;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Check if error is retryable
            const isRetryable = error instanceof PaymentError
                ? error.isRetryable
                : config.retryableErrors.includes(error.code);

            if (!isRetryable || attempt >= config.maxRetries) {
                throw error;
            }

            // Calculate delay and wait
            const delay = calculateBackoff(attempt, config);
            console.log(`[PaymentRetry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }

    throw lastError;
};

/**
 * Parse Razorpay error to PaymentError
 */
const parseRazorpayError = (error) => {
    // Network errors
    if (error.code === 'ECONNREFUSED') {
        return new PaymentError(
            'Cannot connect to payment gateway',
            PAYMENT_ERROR_CODES.CONNECTION_REFUSED,
            true,
            error
        );
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
        return new PaymentError(
            'Payment gateway request timed out',
            PAYMENT_ERROR_CODES.TIMEOUT,
            true,
            error
        );
    }

    if (error.code === 'ENOTFOUND') {
        return new PaymentError(
            'Payment gateway DNS lookup failed',
            PAYMENT_ERROR_CODES.NETWORK_ERROR,
            true,
            error
        );
    }

    // Razorpay API errors
    if (error.statusCode) {
        const statusCode = error.statusCode;

        if (statusCode === 401) {
            return new PaymentError(
                'Payment gateway authentication failed',
                PAYMENT_ERROR_CODES.GATEWAY_ERROR,
                false,
                error
            );
        }

        if (statusCode === 400) {
            return new PaymentError(
                error.error?.description || 'Invalid request to payment gateway',
                PAYMENT_ERROR_CODES.GATEWAY_ERROR,
                false,
                error
            );
        }

        if (statusCode >= 500) {
            return new PaymentError(
                'Payment gateway temporarily unavailable',
                PAYMENT_ERROR_CODES.GATEWAY_UNAVAILABLE,
                true,
                error
            );
        }
    }

    // Default error
    return new PaymentError(
        error.message || 'Unknown payment error',
        PAYMENT_ERROR_CODES.INTERNAL_ERROR,
        false,
        error
    );
};

/**
 * Safe Razorpay API call wrapper
 */
const safeRazorpayCall = async (operation, fn, options = {}) => {
    const timeout = options.timeout || 30000; // 30 seconds default
    const shouldRetry = options.retry !== false;

    const executeWithTimeout = async () => {
        return await withTimeout(fn(), timeout, operation);
    };

    try {
        if (shouldRetry) {
            return await withRetry(executeWithTimeout, options);
        } else {
            return await executeWithTimeout();
        }
    } catch (error) {
        if (error instanceof PaymentError) {
            throw error;
        }
        throw parseRazorpayError(error);
    }
};

/**
 * Express error handler middleware for payment errors
 */
const paymentErrorHandler = (err, req, res, next) => {
    console.error('[PaymentError]', {
        path: req.path,
        method: req.method,
        error: err.message,
        code: err.code,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    // Handle PaymentError
    if (err instanceof PaymentError) {
        return res.status(getHttpStatus(err.code)).json({
            success: false,
            error: {
                message: err.message,
                code: err.code,
                isRetryable: err.isRetryable,
                timestamp: err.timestamp
            }
        });
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: err.errors
            }
        });
    }

    // Handle MongoDB errors
    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        return res.status(503).json({
            success: false,
            error: {
                message: 'Database temporarily unavailable',
                code: PAYMENT_ERROR_CODES.DATABASE_ERROR,
                isRetryable: true
            }
        });
    }

    // Default server error
    res.status(500).json({
        success: false,
        error: {
            message: 'An unexpected error occurred',
            code: PAYMENT_ERROR_CODES.INTERNAL_ERROR,
            isRetryable: false
        }
    });
};

/**
 * Map error codes to HTTP status codes
 */
const getHttpStatus = (errorCode) => {
    const statusMap = {
        [PAYMENT_ERROR_CODES.INVALID_AMOUNT]: 400,
        [PAYMENT_ERROR_CODES.INVALID_CURRENCY]: 400,
        [PAYMENT_ERROR_CODES.INVALID_SIGNATURE]: 401,
        [PAYMENT_ERROR_CODES.ORDER_NOT_FOUND]: 404,
        [PAYMENT_ERROR_CODES.PAYMENT_CANCELLED]: 400,
        [PAYMENT_ERROR_CODES.PAYMENT_DECLINED]: 402,
        [PAYMENT_ERROR_CODES.INSUFFICIENT_FUNDS]: 402,
        [PAYMENT_ERROR_CODES.GATEWAY_UNAVAILABLE]: 503,
        [PAYMENT_ERROR_CODES.TIMEOUT]: 504,
        [PAYMENT_ERROR_CODES.NETWORK_ERROR]: 502,
        [PAYMENT_ERROR_CODES.DATABASE_ERROR]: 503
    };
    return statusMap[errorCode] || 500;
};

module.exports = {
    PaymentError,
    PAYMENT_ERROR_CODES,
    RETRY_CONFIG,
    withTimeout,
    withRetry,
    parseRazorpayError,
    safeRazorpayCall,
    paymentErrorHandler,
    calculateBackoff,
    sleep
};
