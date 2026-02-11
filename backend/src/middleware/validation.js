const validator = require('validator');
const { body, validationResult } = require('express-validator');

// Custom validators
const isValidEmail = (email) => {
  return validator.isEmail(email) && email.length <= 254;
};

const isValidPhone = (phone) => {
  return validator.isMobilePhone(phone, 'any') && phone.length <= 20;
};

const isValidName = (name) => {
  return validator.isLength(name, { min: 2, max: 100 }) && /^[a-zA-Z\s'-]+$/.test(name);
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return validator.escape(input.trim());
};

// Validation middleware
const validateRegistration = [
  body('email').custom((value) => {
    if (!isValidEmail(value)) {
      throw new Error('Invalid email format');
    }
    return true;
  }),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters'),
  body('password').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one lowercase, one uppercase, and one number'),
  body('firstName').custom((value) => {
    if (!isValidName(value)) {
      throw new Error('First name must be 2-100 characters and contain only letters, spaces, and hyphens');
    }
    return true;
  }),
  body('lastName').custom((value) => {
    if (!isValidName(value)) {
      throw new Error('Last name must be 2-100 characters and contain only letters, spaces, and hyphens');
    }
    return true;
  }),
  body('role').isIn(['recruiter', 'candidate']).withMessage('Invalid role specified'),
  body('companyName').optional().custom((value) => {
    if (value && !validator.isLength(value, { min: 2, max: 255 })) {
      throw new Error('Company name must be 2-255 characters');
    }
    return true;
  }),
  body('phone').optional().custom((value) => {
    if (value && !isValidPhone(value)) {
      throw new Error('Invalid phone number format');
    }
    return true;
  }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.param,
          message: error.msg
        }))
      });
    }
    // Sanitize all inputs
    req.body = Object.keys(req.body).reduce((acc, key) => {
      acc[key] = sanitizeInput(req.body[key]);
      return acc;
    }, {});
    next();
  }
];

const validateJobCreation = [
  body('title').isLength({ min: 3, max: 255 }).withMessage('Title must be 3-255 characters'),
  body('title').custom((value) => {
    if (!validator.escape(value).length) {
      throw new Error('Invalid title format');
    }
    return true;
  }),
  body('description').isLength({ min: 10, max: 10000 }).withMessage('Description must be 10-10000 characters'),
  body('location').optional().isLength({ max: 255 }).withMessage('Location must be less than 255 characters'),
  body('employmentType').isIn(['full-time', 'part-time', 'contract', 'internship']).withMessage('Invalid employment type'),
  body('salaryMin').optional().isInt({ min: 0, max: 1000000 }).withMessage('Invalid minimum salary'),
  body('salaryMax').optional().isInt({ min: 0, max: 1000000 }).withMessage('Invalid maximum salary'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.param,
          message: error.msg
        }))
      });
    }
    // Validate salary range
    if (req.body.salaryMin && req.body.salaryMax && req.body.salaryMin > req.body.salaryMax) {
      return res.status(400).json({
        success: false,
        message: 'Minimum salary cannot be greater than maximum salary'
      });
    }
    next();
  }
];

module.exports = {
  validateRegistration,
  validateJobCreation,
  sanitizeInput,
  isValidEmail,
  isValidPhone,
  isValidName
};
