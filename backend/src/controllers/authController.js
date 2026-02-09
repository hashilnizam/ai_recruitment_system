const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, companyName, phone } = req.body;

    // Check if user already exists
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, company_name, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, firstName, lastName, role, companyName || null, phone || null]
    );

    // Get created user
    const [users] = await db.query(
      'SELECT id, email, first_name, last_name, role, company_name, phone, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    const user = users[0];

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          companyName: user.company_name,
          phone: user.phone
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: error.message
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user
    const [users] = await db.query(
      `SELECT id, email, password_hash, first_name, last_name, role, company_name, phone, is_active
       FROM users WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user);

    console.log(`✅ Login successful: ${user.email} (${user.role})`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          companyName: user.company_name,
          phone: user.phone
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Specific database error handling
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Database connection failed. Please ensure XAMPP MySQL is running.'
      });
    }
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      return res.status(500).json({
        success: false,
        message: 'Database access denied. Check credentials.'
      });
    }
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      return res.status(500).json({
        success: false,
        message: 'Database not found. Please run the schema setup.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getProfile = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, email, first_name, last_name, role, company_name, phone, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        companyName: user.company_name,
        phone: user.phone,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, companyName, phone } = req.body;

    await db.query(
      `UPDATE users
       SET first_name = ?, last_name = ?, company_name = ?, phone = ?
       WHERE id = ?`,
      [firstName, lastName, companyName || null, phone || null, req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};
