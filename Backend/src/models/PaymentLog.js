const mongoose = require('mongoose');

const paymentLogSchema = new mongoose.Schema({
    donationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donation',
        required: [true, 'Donation ID is required'],
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    eventType: {
        type: String,
        required: [true, 'Event type is required'],
        enum: ['initiated', 'processing', 'success', 'failed', 'refund', 'cancelled'],
        index: true
    },
    eventData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    gatewayName: {
        type: String,
        enum: ['razorpay', 'stripe', 'paypal', 'paytm', 'sandbox', 'other'],
        default: 'sandbox'
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: 0
    },
    currency: {
        type: String,
        default: 'INR',
        uppercase: true
    },
    statusCode: {
        type: String,
        trim: true
    },
    errorMessage: {
        type: String,
        trim: true
    },
    ipAddress: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'paymentlogs'
});

// Compound indexes for common queries
paymentLogSchema.index({ donationId: 1, timestamp: 1 });
paymentLogSchema.index({ userId: 1, timestamp: -1 });
paymentLogSchema.index({ eventType: 1, timestamp: -1 });

// Static method to get payment timeline for a donation
paymentLogSchema.statics.getDonationTimeline = async function (donationId) {
    return await this.find({ donationId })
        .sort({ timestamp: 1 })
        .select('eventType timestamp statusCode errorMessage gatewayName');
};

// Static method to get recent logs for a user
paymentLogSchema.statics.getUserRecentLogs = async function (userId, limit = 20) {
    return await this.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('donationId', 'amount status');
};

// Static method to get failed payment count
paymentLogSchema.statics.getFailedCount = async function (startDate, endDate) {
    const query = { eventType: 'failed' };
    if (startDate && endDate) {
        query.timestamp = { $gte: startDate, $lte: endDate };
    }
    return await this.countDocuments(query);
};

// Helper method to create a log entry
paymentLogSchema.statics.createLog = async function (logData) {
    return await this.create({
        donationId: logData.donationId,
        userId: logData.userId,
        eventType: logData.eventType,
        eventData: logData.eventData || {},
        gatewayName: logData.gatewayName || 'sandbox',
        amount: logData.amount,
        currency: logData.currency || 'INR',
        statusCode: logData.statusCode,
        errorMessage: logData.errorMessage,
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent,
        timestamp: new Date()
    });
};

const PaymentLog = mongoose.model('PaymentLog', paymentLogSchema);

module.exports = PaymentLog;
