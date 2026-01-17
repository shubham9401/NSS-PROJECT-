const User = require('../models/User');
const Donation = require('../models/Donation');
const PaymentLog = require('../models/PaymentLog');

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
const getDashboardStats = async (req, res, next) => {
    try {
        // User statistics
        const totalUsers = await User.countDocuments({ role: 'user' });
        const activeUsers = await User.countDocuments({ role: 'user', isActive: true });
        const newUsersToday = await User.countDocuments({
            role: 'user',
            registrationDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });
        const newUsersThisMonth = await User.countDocuments({
            role: 'user',
            registrationDate: {
                $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
        });

        // Donation statistics
        const donationStats = await Donation.getOverallStats();

        let totalDonations = 0;
        let successfulDonations = 0;
        let pendingDonations = 0;
        let failedDonations = 0;
        let totalAmountReceived = 0;
        let totalAmountPending = 0;

        donationStats.forEach(stat => {
            totalDonations += stat.count;
            if (stat._id === 'success') {
                successfulDonations = stat.count;
                totalAmountReceived = stat.totalAmount;
            } else if (stat._id === 'pending') {
                pendingDonations = stat.count;
                totalAmountPending = stat.totalAmount;
            } else if (stat._id === 'failed') {
                failedDonations = stat.count;
            }
        });

        // Today's donations
        const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
        const donationsToday = await Donation.aggregate([
            { $match: { donationDate: { $gte: todayStart }, status: 'success' } },
            { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }
        ]);

        // This month's donations
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const donationsThisMonth = await Donation.aggregate([
            { $match: { donationDate: { $gte: monthStart }, status: 'success' } },
            { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }
        ]);

        // Recent registrations
        const recentRegistrations = await User.find({ role: 'user' })
            .select('firstName lastName email registrationDate')
            .sort({ registrationDate: -1 })
            .limit(5);

        // Recent successful donations
        const recentDonations = await Donation.find({ status: 'success' })
            .populate('userId', 'firstName lastName email')
            .select('amount currency completedAt receiptNumber')
            .sort({ completedAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            dashboard: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    newToday: newUsersToday,
                    newThisMonth: newUsersThisMonth
                },
                donations: {
                    total: totalDonations,
                    successful: successfulDonations,
                    pending: pendingDonations,
                    failed: failedDonations,
                    totalAmountReceived,
                    totalAmountPending,
                    today: {
                        count: donationsToday[0]?.count || 0,
                        amount: donationsToday[0]?.total || 0
                    },
                    thisMonth: {
                        count: donationsThisMonth[0]?.count || 0,
                        amount: donationsThisMonth[0]?.total || 0
                    }
                },
                recent: {
                    registrations: recentRegistrations,
                    donations: recentDonations
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all registrations with filtering
 * @route   GET /api/admin/registrations
 * @access  Private/Admin
 */
const getAllRegistrations = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const query = { role: 'user' };

        // Filters
        if (req.query.isActive !== undefined) {
            query.isActive = req.query.isActive === 'true';
        }
        if (req.query.search) {
            query.$or = [
                { firstName: { $regex: req.query.search, $options: 'i' } },
                { lastName: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        if (req.query.startDate || req.query.endDate) {
            query.registrationDate = {};
            if (req.query.startDate) {
                query.registrationDate.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                query.registrationDate.$lte = new Date(req.query.endDate);
            }
        }
        if (req.query.city) {
            query['address.city'] = { $regex: req.query.city, $options: 'i' };
        }
        if (req.query.state) {
            query['address.state'] = { $regex: req.query.state, $options: 'i' };
        }

        // Sort options
        const sortField = req.query.sortBy || 'registrationDate';
        const sortOrder = req.query.order === 'asc' ? 1 : -1;

        const users = await User.find(query)
            .select('-password')
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            registrations: users
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all donations with advanced filtering
 * @route   GET /api/admin/donations
 * @access  Private/Admin
 */
const getAllDonationsAdmin = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const query = {};

        // Status filter
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Amount range filter
        if (req.query.minAmount || req.query.maxAmount) {
            query.amount = {};
            if (req.query.minAmount) {
                query.amount.$gte = parseFloat(req.query.minAmount);
            }
            if (req.query.maxAmount) {
                query.amount.$lte = parseFloat(req.query.maxAmount);
            }
        }

        // Date range filter
        if (req.query.startDate || req.query.endDate) {
            query.donationDate = {};
            if (req.query.startDate) {
                query.donationDate.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                query.donationDate.$lte = new Date(req.query.endDate);
            }
        }

        // Payment method filter
        if (req.query.paymentMethod) {
            query.paymentMethod = req.query.paymentMethod;
        }

        // User filter
        if (req.query.userId) {
            query.userId = req.query.userId;
        }

        // Sort options
        const sortField = req.query.sortBy || 'donationDate';
        const sortOrder = req.query.order === 'asc' ? 1 : -1;

        const donations = await Donation.find(query)
            .populate('userId', 'firstName lastName email')
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit);

        const total = await Donation.countDocuments(query);

        // Aggregation for filtered results
        const aggregation = await Donation.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            count: donations.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            aggregation,
            donations
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Export registrations to CSV
 * @route   GET /api/admin/registrations/export
 * @access  Private/Admin
 */
const exportRegistrations = async (req, res, next) => {
    try {
        const query = { role: 'user' };

        // Apply same filters as listing
        if (req.query.isActive !== undefined) {
            query.isActive = req.query.isActive === 'true';
        }
        if (req.query.startDate || req.query.endDate) {
            query.registrationDate = {};
            if (req.query.startDate) {
                query.registrationDate.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                query.registrationDate.$lte = new Date(req.query.endDate);
            }
        }

        const users = await User.find(query)
            .select('-password -__v')
            .sort({ registrationDate: -1 });

        // Build CSV content
        const headers = [
            'ID',
            'Email',
            'First Name',
            'Last Name',
            'Phone',
            'Street',
            'City',
            'State',
            'Zip Code',
            'Country',
            'Registration Date',
            'Status',
            'Last Login'
        ];

        const csvRows = [headers.join(',')];

        users.forEach(user => {
            const row = [
                user._id,
                user.email,
                user.firstName,
                user.lastName,
                user.phone || '',
                user.address?.street || '',
                user.address?.city || '',
                user.address?.state || '',
                user.address?.zipCode || '',
                user.address?.country || '',
                user.registrationDate?.toISOString() || '',
                user.isActive ? 'Active' : 'Inactive',
                user.lastLogin?.toISOString() || ''
            ].map(val => `"${String(val).replace(/"/g, '""')}"`);
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=registrations_${Date.now()}.csv`);
        res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Export donations to CSV
 * @route   GET /api/admin/donations/export
 * @access  Private/Admin
 */
const exportDonations = async (req, res, next) => {
    try {
        const query = {};

        // Apply filters
        if (req.query.status) {
            query.status = req.query.status;
        }
        if (req.query.startDate || req.query.endDate) {
            query.donationDate = {};
            if (req.query.startDate) {
                query.donationDate.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                query.donationDate.$lte = new Date(req.query.endDate);
            }
        }

        const donations = await Donation.find(query)
            .populate('userId', 'firstName lastName email')
            .sort({ donationDate: -1 });

        // Build CSV content
        const headers = [
            'ID',
            'Donor Email',
            'Donor Name',
            'Amount',
            'Currency',
            'Status',
            'Payment Method',
            'Transaction ID',
            'Receipt Number',
            'Donation Date',
            'Completed At',
            'Anonymous'
        ];

        const csvRows = [headers.join(',')];

        donations.forEach(donation => {
            const donorName = donation.isAnonymous
                ? 'Anonymous'
                : `${donation.userId?.firstName || ''} ${donation.userId?.lastName || ''}`.trim();
            const donorEmail = donation.isAnonymous
                ? 'Anonymous'
                : (donation.userId?.email || '');

            const row = [
                donation._id,
                donorEmail,
                donorName,
                donation.amount,
                donation.currency,
                donation.status,
                donation.paymentMethod,
                donation.transactionId || '',
                donation.receiptNumber || '',
                donation.donationDate?.toISOString() || '',
                donation.completedAt?.toISOString() || '',
                donation.isAnonymous ? 'Yes' : 'No'
            ].map(val => `"${String(val).replace(/"/g, '""')}"`);
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=donations_${Date.now()}.csv`);
        res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get donation aggregations
 * @route   GET /api/admin/donations/aggregate
 * @access  Private/Admin
 */
const getDonationAggregations = async (req, res, next) => {
    try {
        // By status
        const byStatus = await Donation.getOverallStats();

        // By payment method
        const byPaymentMethod = await Donation.aggregate([
            { $match: { status: 'success' } },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        // By month (last 12 months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const byMonth = await Donation.aggregate([
            {
                $match: {
                    status: 'success',
                    donationDate: { $gte: twelveMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$donationDate' },
                        month: { $month: '$donationDate' }
                    },
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Top donors
        const topDonors = await Donation.aggregate([
            { $match: { status: 'success', isAnonymous: false } },
            {
                $group: {
                    _id: '$userId',
                    totalDonations: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { totalAmount: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 1,
                    totalDonations: 1,
                    totalAmount: 1,
                    'user.firstName': 1,
                    'user.lastName': 1,
                    'user.email': 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            aggregations: {
                byStatus,
                byPaymentMethod,
                byMonth,
                topDonors
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardStats,
    getAllRegistrations,
    getAllDonationsAdmin,
    exportRegistrations,
    exportDonations,
    getDonationAggregations
};
