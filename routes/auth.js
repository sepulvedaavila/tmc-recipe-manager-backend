const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  refreshToken,
  verify,
  forgotPassword,
  resetPassword,
  changePassword
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/verify', authenticate, verify);
router.post('/change-password', authenticate, changePassword);

module.exports = router;