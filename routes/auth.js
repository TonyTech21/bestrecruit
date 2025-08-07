const express = require('express');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// User login
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    
    const user = await User.findOne({ email, isActive: true });
    if (!user || !await user.comparePassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      sessionId: user.sessionId
    };

    res.json({ success: true, redirect: '/dashboard' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Admin login
router.post('/admin-login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    
    // Check for default admin credentials
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      req.session.admin = {
        id: 'default-admin',
        email: email,
        name: 'System Administrator',
        role: 'admin'
      };
      return res.json({ success: true, redirect: '/admin/dashboard' });
    }

    // Check database for admin
    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin || !await admin.comparePassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    req.session.admin = {
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    };

    res.json({ success: true, redirect: '/admin/dashboard' });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, redirect: '/' });
  });
});

module.exports = router;