/**
 * Seed Data Script
 * 
 * Populates the database with test data for development and testing.
 * Creates: 1 admin + 5 users, 10 donations, 15 payment logs
 * 
 * Usage: npm run seed
 */

require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/database');
const { User, Donation, PaymentLog } = require('../models');

// Sample user data
const sampleUsers = [
    {
        email: 'admin@ngo.org',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+91-9876543210',
        role: 'admin',
        address: {
            street: '123 Admin Street',
            city: 'New Delhi',
            state: 'Delhi',
            zipCode: '110001',
            country: 'India'
        }
    },
    {
        email: 'rahul.sharma@email.com',
        password: 'password123',
        firstName: 'Rahul',
        lastName: 'Sharma',
        phone: '+91-9876543211',
        role: 'user',
        address: {
            street: '45 MG Road',
            city: 'Mumbai',
            state: 'Maharashtra',
            zipCode: '400001',
            country: 'India'
        }
    },
    {
        email: 'priya.patel@email.com',
        password: 'password123',
        firstName: 'Priya',
        lastName: 'Patel',
        phone: '+91-9876543212',
        role: 'user',
        address: {
            street: '78 Park Avenue',
            city: 'Ahmedabad',
            state: 'Gujarat',
            zipCode: '380001',
            country: 'India'
        }
    },
    {
        email: 'amit.kumar@email.com',
        password: 'password123',
        firstName: 'Amit',
        lastName: 'Kumar',
        phone: '+91-9876543213',
        role: 'user',
        address: {
            street: '12 Lake View',
            city: 'Bangalore',
            state: 'Karnataka',
            zipCode: '560001',
            country: 'India'
        }
    },
    {
        email: 'sneha.reddy@email.com',
        password: 'password123',
        firstName: 'Sneha',
        lastName: 'Reddy',
        phone: '+91-9876543214',
        role: 'user',
        address: {
            street: '56 Hill Road',
            city: 'Hyderabad',
            state: 'Telangana',
            zipCode: '500001',
            country: 'India'
        }
    },
    {
        email: 'vikram.singh@email.com',
        password: 'password123',
        firstName: 'Vikram',
        lastName: 'Singh',
        phone: '+91-9876543215',
        role: 'user',
        address: {
            street: '89 Civil Lines',
            city: 'Jaipur',
            state: 'Rajasthan',
            zipCode: '302001',
            country: 'India'
        }
    }
];

// Generate random donation data
function generateDonations(users) {
    const statuses = ['pending', 'success', 'failed'];
    const paymentMethods = ['card', 'upi', 'netbanking', 'wallet'];
    const donations = [];

    const donationAmounts = [100, 250, 500, 1000, 2500, 5000, 10000, 15000, 25000, 50000];
    const statusDistribution = ['success', 'success', 'success', 'success', 'success', 'pending', 'pending', 'failed', 'failed', 'success'];

    for (let i = 0; i < 10; i++) {
        // Skip admin user (index 0), use regular users
        const userIndex = (i % 5) + 1;
        const user = users[userIndex];
        const status = statusDistribution[i];
        const daysAgo = Math.floor(Math.random() * 30);
        const donationDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

        donations.push({
            userId: user._id,
            amount: donationAmounts[i],
            currency: 'INR',
            status: status,
            paymentMethod: paymentMethods[i % 4],
            transactionId: status !== 'pending' ? `TXN${Date.now()}${i}` : null,
            gatewayOrderId: `ORD${Date.now()}${i}`,
            gatewayPaymentId: status === 'success' ? `PAY${Date.now()}${i}` : null,
            donationDate: donationDate,
            completedAt: status === 'success' ? new Date(donationDate.getTime() + 60000) : null,
            notes: i % 3 === 0 ? 'For education support' : null,
            isAnonymous: i % 5 === 0,
            receiptNumber: status === 'success' ? `RCP-${Date.now().toString(36).toUpperCase()}-${i}` : null
        });
    }

    return donations;
}

// Generate payment logs for donations
function generatePaymentLogs(donations, users) {
    const logs = [];
    const ipAddresses = ['192.168.1.100', '10.0.0.50', '172.16.0.25', '192.168.0.200', '10.10.10.10'];
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36',
        'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
    ];

    donations.forEach((donation, index) => {
        const baseTimestamp = new Date(donation.donationDate);

        // Always log initiation
        logs.push({
            donationId: donation._id,
            userId: donation.userId,
            eventType: 'initiated',
            eventData: { method: donation.paymentMethod, amount: donation.amount },
            gatewayName: 'sandbox',
            amount: donation.amount,
            currency: 'INR',
            statusCode: '200',
            ipAddress: ipAddresses[index % 5],
            userAgent: userAgents[index % 5],
            timestamp: baseTimestamp
        });

        // Log processing for non-pending
        if (donation.status !== 'pending') {
            logs.push({
                donationId: donation._id,
                userId: donation.userId,
                eventType: 'processing',
                eventData: { gatewayOrderId: donation.gatewayOrderId },
                gatewayName: 'sandbox',
                amount: donation.amount,
                currency: 'INR',
                statusCode: '202',
                ipAddress: ipAddresses[index % 5],
                userAgent: userAgents[index % 5],
                timestamp: new Date(baseTimestamp.getTime() + 5000)
            });
        }

        // Log final status
        if (donation.status === 'success') {
            logs.push({
                donationId: donation._id,
                userId: donation.userId,
                eventType: 'success',
                eventData: {
                    gatewayPaymentId: donation.gatewayPaymentId,
                    receiptNumber: donation.receiptNumber
                },
                gatewayName: 'sandbox',
                amount: donation.amount,
                currency: 'INR',
                statusCode: '200',
                ipAddress: ipAddresses[index % 5],
                userAgent: userAgents[index % 5],
                timestamp: new Date(baseTimestamp.getTime() + 60000)
            });
        } else if (donation.status === 'failed') {
            logs.push({
                donationId: donation._id,
                userId: donation.userId,
                eventType: 'failed',
                eventData: { errorCode: 'PAYMENT_DECLINED' },
                gatewayName: 'sandbox',
                amount: donation.amount,
                currency: 'INR',
                statusCode: '400',
                errorMessage: 'Payment was declined by the bank',
                ipAddress: ipAddresses[index % 5],
                userAgent: userAgents[index % 5],
                timestamp: new Date(baseTimestamp.getTime() + 30000)
            });
        }
    });

    return logs;
}

async function seedDatabase() {
    console.log('🌱 Starting database seeding...\n');

    try {
        await connectDB();

        // Check if data already exists
        const existingUsers = await User.countDocuments();
        if (existingUsers > 0) {
            console.log('⚠️  Database already contains data.');
            console.log('   To re-seed, please clear the collections first.');
            console.log('   Current counts:');
            console.log(`   - Users: ${existingUsers}`);
            console.log(`   - Donations: ${await Donation.countDocuments()}`);
            console.log(`   - PaymentLogs: ${await PaymentLog.countDocuments()}`);

            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise((resolve) => {
                rl.question('\n   Do you want to clear existing data and re-seed? (y/N): ', resolve);
            });
            rl.close();

            if (answer.toLowerCase() !== 'y') {
                console.log('\n   Seeding cancelled.');
                return;
            }

            // Clear existing data
            console.log('\n🧹 Clearing existing data...');
            await PaymentLog.deleteMany({});
            await Donation.deleteMany({});
            await User.deleteMany({});
            console.log('   Cleared all collections.');
        }

        // Insert users
        console.log('\n👤 Creating users...');
        const users = await User.insertMany(sampleUsers);
        console.log(`   Created ${users.length} users (1 admin + ${users.length - 1} regular users)`);

        // Insert donations
        console.log('\n💰 Creating donations...');
        const donationData = generateDonations(users);
        const donations = await Donation.insertMany(donationData);
        console.log(`   Created ${donations.length} donations`);

        // Insert payment logs
        console.log('\n📝 Creating payment logs...');
        const paymentLogData = generatePaymentLogs(donations, users);
        const paymentLogs = await PaymentLog.insertMany(paymentLogData);
        console.log(`   Created ${paymentLogs.length} payment logs`);

        // Summary
        console.log('\n📊 Seed Data Summary:');
        console.log('━'.repeat(40));
        console.log(`   Users:       ${users.length}`);
        console.log(`   Donations:   ${donations.length}`);
        console.log(`   PaymentLogs: ${paymentLogs.length}`);
        console.log('━'.repeat(40));

        // Show donation status breakdown
        const statusBreakdown = donations.reduce((acc, d) => {
            acc[d.status] = (acc[d.status] || 0) + 1;
            return acc;
        }, {});
        console.log('\n   Donation Status Breakdown:');
        Object.entries(statusBreakdown).forEach(([status, count]) => {
            const emoji = status === 'success' ? '✅' : status === 'pending' ? '⏳' : '❌';
            console.log(`   ${emoji} ${status}: ${count}`);
        });

        // Show test credentials
        console.log('\n🔐 Test Credentials:');
        console.log('━'.repeat(40));
        console.log('   Admin:');
        console.log('     Email:    admin@ngo.org');
        console.log('     Password: admin123');
        console.log('\n   Regular User:');
        console.log('     Email:    rahul.sharma@email.com');
        console.log('     Password: password123');
        console.log('━'.repeat(40));

        console.log('\n✅ Database seeding completed successfully!');

    } catch (error) {
        console.error('\n❌ Seeding failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await disconnectDB();
    }
}

// Run the seeding
seedDatabase();
