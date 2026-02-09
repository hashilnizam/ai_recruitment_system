const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Register user
router.post('/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('role').isIn(['recruiter', 'candidate']).withMessage('Role must be recruiter or candidate'),
    body('companyName').if(body('role').equals('recruiter')).notEmpty().withMessage('Company name is required for recruiters'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
  ],
  validate,
  asyncHandler(authController.register)
);

// Login user
router.post('/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  asyncHandler(authController.login)
);

// Get current user profile
router.get('/me',
  authenticateToken,
  asyncHandler(authController.getProfile)
);

// Update user profile
router.put('/profile',
  authenticateToken,
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('companyName').optional().notEmpty().withMessage('Company name cannot be empty'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
  ],
  validate,
  asyncHandler(authController.updateProfile)
);

module.exports = router;
