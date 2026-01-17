const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const {
    getProfile,
    updateProfile,
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUser
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to all user routes
router.use(apiLimiter);

// Validation rules
const updateProfileValidation = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters'),
    body('phone')
        .optional()
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
        .withMessage('Please provide a valid phone number'),
    body('address.street').optional().trim(),
    body('address.city').optional().trim(),
    body('address.state').optional().trim(),
    body('address.zipCode').optional().trim(),
    body('address.country').optional().trim()
];

const updateUserValidation = [
    ...updateProfileValidation,
    body('role')
        .optional()
        .isIn(['user', 'admin'])
        .withMessage('Role must be either user or admin'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean')
];

const mongoIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid user ID')
];

// User routes (authenticated users)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileValidation, updateProfile);

// Admin routes
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/:id', protect, authorize('admin'), mongoIdValidation, getUserById);
router.put('/:id', protect, authorize('admin'), mongoIdValidation, updateUserValidation, updateUserById);
router.delete('/:id', protect, authorize('admin'), mongoIdValidation, deleteUser);

module.exports = router;
