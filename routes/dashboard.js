const express = require('express');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');
const router = express.Router();

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  next();
};

// Dashboard home
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      req.session.destroy();
      return res.redirect('/');
    }

    res.render('dashboard/index', { 
      title: 'Dashboard - AdvanceTravels',
      user: user
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Something went wrong loading your dashboard.'
    });
  }
});

// Profile page
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      req.session.destroy();
      return res.redirect('/');
    }

    res.render('dashboard/profile', { 
      title: 'Profile - AdvanceTravels',
      user: user
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Something went wrong loading your profile.'
    });
  }
});

// Messages page
router.get('/messages', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      req.session.destroy();
      return res.redirect('/');
    }

    const messages = await ChatMessage.find({ sessionId: user.sessionId })
      .sort({ createdAt: 1 });

    res.render('dashboard/messages', { 
      title: 'Messages - AdvanceTravels',
      user: user,
      messages: messages
    });
  } catch (error) {
    console.error('Messages error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Something went wrong loading your messages.'
    });
  }
});

module.exports = router;