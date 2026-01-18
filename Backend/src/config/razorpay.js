/**
 * Razorpay Configuration
 * This module initializes the Razorpay SDK with API credentials
 */

const Razorpay = require('razorpay');

// Validate required environment variables
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('⚠️  Razorpay API keys not found in environment variables.');
    console.warn('   Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file');
}

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Export both the instance and the key_id (needed for frontend)
module.exports = {
    razorpay: razorpayInstance,
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET
};
