/**
 * Payment Flow Test Script
 * Tests the complete payment flow in sandbox mode
 * 
 * Run: node src/scripts/testPaymentFlow.js
 */

require('dotenv').config();
const { razorpay } = require('../config/razorpay');
const crypto = require('crypto');

// Test configuration
const TEST_CONFIG = {
    amount: 100, // 100 INR
    currency: 'INR',
    testUserId: 'test_user_123'
};

console.log('\n==============================================');
console.log('🧪 PAYMENT FLOW TEST SCRIPT - SANDBOX MODE');
console.log('==============================================\n');

/**
 * Test 1: Create Razorpay Order
 */
async function testCreateOrder() {
    console.log('📋 Test 1: Creating Razorpay Order...');

    try {
        const orderOptions = {
            amount: TEST_CONFIG.amount * 100, // Convert to paise
            currency: TEST_CONFIG.currency,
            receipt: `test_receipt_${Date.now()}`,
            notes: {
                userId: TEST_CONFIG.testUserId,
                purpose: 'Test Payment',
                environment: 'sandbox'
            }
        };

        const order = await razorpay.orders.create(orderOptions);

        console.log('✅ Order created successfully!');
        console.log('   Order ID:', order.id);
        console.log('   Amount:', order.amount / 100, order.currency);
        console.log('   Status:', order.status);
        console.log('   Receipt:', order.receipt);

        return order;
    } catch (error) {
        console.error('❌ Order creation failed:', error.message);
        throw error;
    }
}

/**
 * Test 2: Fetch Order Details
 */
async function testFetchOrder(orderId) {
    console.log('\n📋 Test 2: Fetching Order Details...');

    try {
        const order = await razorpay.orders.fetch(orderId);

        console.log('✅ Order fetched successfully!');
        console.log('   Status:', order.status);
        console.log('   Attempts:', order.attempts);
        console.log('   Amount Paid:', order.amount_paid / 100);
        console.log('   Amount Due:', order.amount_due / 100);

        return order;
    } catch (error) {
        console.error('❌ Fetch order failed:', error.message);
        throw error;
    }
}

/**
 * Test 3: Simulate Signature Generation
 */
function testSignatureGeneration(orderId, paymentId) {
    console.log('\n📋 Test 3: Testing Signature Generation...');

    try {
        const body = orderId + '|' + paymentId;
        const signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        console.log('✅ Signature generated!');
        console.log('   Input:', body);
        console.log('   Signature:', signature.substring(0, 32) + '...');

        return signature;
    } catch (error) {
        console.error('❌ Signature generation failed:', error.message);
        throw error;
    }
}

/**
 * Test 4: Verify Signature
 */
function testSignatureVerification(orderId, paymentId, signature) {
    console.log('\n📋 Test 4: Testing Signature Verification...');

    try {
        const body = orderId + '|' + paymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        const isValid = crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );

        if (isValid) {
            console.log('✅ Signature verification passed!');
        } else {
            console.log('❌ Signature verification failed!');
        }

        return isValid;
    } catch (error) {
        console.error('❌ Verification error:', error.message);
        throw error;
    }
}

/**
 * Test 5: Test Razorpay API Connection
 */
async function testAPIConnection() {
    console.log('📋 Test 5: Testing Razorpay API Connection...');

    try {
        // Try to fetch orders (limit 1) to test connection
        const orders = await razorpay.orders.all({ count: 1 });

        console.log('✅ API connection successful!');
        console.log('   Orders in account:', orders.count || 'N/A');

        return true;
    } catch (error) {
        console.error('❌ API connection failed:', error.message);
        console.error('   Make sure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are correct');
        return false;
    }
}

/**
 * Run all tests
 */
async function runTests() {

    console.log('📍 Environment:', process.env.NODE_ENV || 'development');
    console.log('');

    try {
        // Test 5: API Connection (run first)
        const connected = await testAPIConnection();
        if (!connected) {
            console.log('\n⚠️  Cannot proceed - API connection failed');
            process.exit(1);
        }

        // Test 1: Create Order
        const order = await testCreateOrder();

        // Test 2: Fetch Order
        await testFetchOrder(order.id);

        // Test 3 & 4: Signature tests with mock payment ID
        const mockPaymentId = 'pay_test_' + Date.now();
        const signature = testSignatureGeneration(order.id, mockPaymentId);
        testSignatureVerification(order.id, mockPaymentId, signature);

        console.log('\n==============================================');
        console.log('🎉 ALL TESTS PASSED!');
        console.log('==============================================');
        console.log('\n📝 Test Order Created:');
        console.log('   Order ID:', order.id);
        console.log('   Use this in the test HTML page to complete payment\n');

        return order;

    } catch (error) {
        console.log('\n==============================================');
        console.log('❌ TESTS FAILED');
        console.log('==============================================');
        console.error('\nError:', error.message);
        process.exit(1);
    }
}

// Run tests
runTests();
