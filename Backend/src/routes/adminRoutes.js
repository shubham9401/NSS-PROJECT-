const express = require('express');
const router = express.Router();

const {
    getDashboardStats,
    getAllRegistrations,
    getAllDonationsAdmin,
    exportRegistrations,
    exportDonations,
    getDonationAggregations
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting and admin auth to all routes
router.use(apiLimiter);
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Registrations (Users)
router.get('/registrations', getAllRegistrations);
router.get('/registrations/export', exportRegistrations);

// Donations
router.get('/donations', getAllDonationsAdmin);
router.get('/donations/export', exportDonations);
router.get('/donations/aggregate', getDonationAggregations);

module.exports = router;
