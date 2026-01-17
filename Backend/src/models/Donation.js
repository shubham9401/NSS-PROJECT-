const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    amount: {
        type: Number,
        required: [true, 'Donation amount is required'],
        min: [1, 'Minimum donation amount is 1']
    },
    currency: {
        type: String,
        default: 'INR',
        uppercase: true,
        enum: ['INR', 'USD', 'EUR', 'GBP']
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending',
        index: true
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'netbanking', 'wallet', 'other'],
        default: 'other'
    },
    transactionId: {
        type: String,
        sparse: true,
        index: true
    },
    gatewayOrderId: {
        type: String,
        sparse: true
    },
    gatewayPaymentId: {
        type: String,
        sparse: true
    },
    donationDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    completedAt: {
        type: Date
    },
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters'],
        trim: true
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    receiptNumber: {
        type: String,
        sparse: true
    }
}, {
    timestamps: true,
    collection: 'donations'
});

// Compound indexes for common queries
donationSchema.index({ userId: 1, status: 1 });
donationSchema.index({ userId: 1, donationDate: -1 });
donationSchema.index({ status: 1, donationDate: -1 });

// Generate receipt number on successful payment
donationSchema.pre('save', function (next) {
    if (this.isModified('status') && this.status === 'success' && !this.receiptNumber) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.receiptNumber = `RCP-${timestamp}-${random}`;
        this.completedAt = new Date();
    }
    next();
});

// Virtual for formatted amount
donationSchema.virtual('formattedAmount').get(function () {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: this.currency
    }).format(this.amount);
});

// Static method to get donation stats for a user
donationSchema.statics.getUserStats = async function (userId) {
    return await this.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
            }
        }
    ]);
};

// Static method to get overall donation stats
donationSchema.statics.getOverallStats = async function () {
    return await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
            }
        }
    ]);
};

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;
