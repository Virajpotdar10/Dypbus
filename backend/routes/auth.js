const express = require('express');
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  verifyOtp,
  updatePassword,
  updateDetails,
  getNotifications,
  markNotificationAsRead,
  getAllDrivers,
  updateDriverPassword,
} = require('../controllers/auth');

const router = express.Router();

const { protect, admin } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.put('/updatepassword', protect, updatePassword);
router.put('/updatedetails', protect, updateDetails);

router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id', protect, markNotificationAsRead);

// Admin routes for driver password management
router.get('/drivers', protect, admin, getAllDrivers);
router.put('/drivers/:id/password', protect, admin, updateDriverPassword);

module.exports = router;
