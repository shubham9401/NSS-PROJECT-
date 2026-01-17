/**
 * Database Initialization Script
 * 
 * This script connects to MongoDB Atlas, ensures all collections exist,
 * and verifies that indexes are properly created.
 * 
 * Usage: npm run init-db
 */

require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/database');
const { User, Donation, PaymentLog } = require('../models');

async function initializeDatabase() {
    console.log('🚀 Starting database initialization...\n');

    try {
        // Connect to MongoDB
        await connectDB();

        console.log('\n📋 Verifying collections and indexes...\n');

        // Ensure User collection and indexes
        console.log('👤 Users Collection:');
        await User.createCollection();
        await User.ensureIndexes();
        const userIndexes = await User.collection.getIndexes();
        console.log('   Indexes:', Object.keys(userIndexes).join(', '));

        // Ensure Donation collection and indexes
        console.log('\n💰 Donations Collection:');
        await Donation.createCollection();
        await Donation.ensureIndexes();
        const donationIndexes = await Donation.collection.getIndexes();
        console.log('   Indexes:', Object.keys(donationIndexes).join(', '));

        // Ensure PaymentLog collection and indexes
        console.log('\n📝 PaymentLogs Collection:');
        await PaymentLog.createCollection();
        await PaymentLog.ensureIndexes();
        const paymentLogIndexes = await PaymentLog.collection.getIndexes();
        console.log('   Indexes:', Object.keys(paymentLogIndexes).join(', '));

        // Get collection stats
        console.log('\n📊 Collection Statistics:');
        const userCount = await User.countDocuments();
        const donationCount = await Donation.countDocuments();
        const paymentLogCount = await PaymentLog.countDocuments();

        console.log(`   Users: ${userCount} documents`);
        console.log(`   Donations: ${donationCount} documents`);
        console.log(`   PaymentLogs: ${paymentLogCount} documents`);

        console.log('\n✅ Database initialization completed successfully!');

    } catch (error) {
        console.error('\n❌ Database initialization failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await disconnectDB();
    }
}

// Run the initialization
initializeDatabase();
