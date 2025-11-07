const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Driver = require('../models/Driver');
const sendEmail = require('../utils/sendEmail');
const { invalidateCache } = require('../middleware/cache');
const emitDriverEvent = (req, eventType, data) => {
  const io = req.app.get('io');
  if (io) {
    io.emit(`driver:${eventType}`, data);
  }
};

exports.register = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  try {
    console.log('=== REGISTRATION DEBUG START ===');
    console.log('Registration attempt:', { name, email, role });
    console.log('MongoDB connection state:', require('mongoose').connection.readyState);
    console.log('Database name:', require('mongoose').connection.name);

    // Validate input
    if (!name || !email || !password) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({ 
        success: false, 
        msg: 'Please provide name, email, and password' 
      });
    }

    // Check if driver exists
    console.log('🔍 Checking for existing driver with email:', email);
    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) {
      console.log('❌ Driver already exists:', email);
      return res.status(400).json({ success: false, msg: 'Driver already exists' });
    }
    console.log('✅ No existing driver found, proceeding with creation');

    // Create driver
    console.log('📝 Creating new driver in database...');
    const driver = await Driver.create({
      name,
      email,
      password,
      role: (role || 'driver').toLowerCase()
    });

    console.log('✅ Driver created successfully in database:');
    console.log('   - ID:', driver._id);
    console.log('   - Name:', driver.name);
    console.log('   - Email:', driver.email);
    console.log('   - Role:', driver.role);

    // Verify the driver was actually saved
    const verifyDriver = await Driver.findById(driver._id);
    if (verifyDriver) {
      console.log('✅ Verification: Driver found in database after creation');
    } else {
      console.log('❌ Verification failed: Driver not found in database after creation');
    }

    // Count total drivers in database
    const totalDrivers = await Driver.countDocuments();
    console.log('📊 Total drivers in database:', totalDrivers);

    invalidateCache.drivers();

    // Emit real-time event for new driver registration
    emitDriverEvent(req, 'created', { 
      driver: { 
        _id: driver._id, 
        name: driver.name, 
        email: driver.email, 
        role: driver.role 
      },
      createdBy: 'System' // Or req.user.name if an admin is creating
    });

    // Emit 'driver:created' socket event
    emitDriverEvent(req, 'driver:created', { 
      driver: { 
        _id: driver._id, 
        name: driver.name, 
        email: driver.email, 
        role: driver.role 
      },
      createdBy: 'System' // Or req.user.name if an admin is creating
    });

    console.log('=== REGISTRATION DEBUG END ===');
    sendTokenResponse(driver, 201, res);
  } catch (err) {
    console.error('❌ Registration error details:');
    console.error('   - Error name:', err.name);
    console.error('   - Error message:', err.message);
    console.error('   - Error stack:', err.stack);
    console.error('   - MongoDB connection state:', require('mongoose').connection.readyState);
    res.status(400).json({ success: false, msg: err.message });
  }
};

// @desc    Login driver
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({ success: false, msg: 'Please provide an email and password' });
  }

  try {
    // Check for driver
    const driver = await Driver.findOne({ email }).select('+password');

    if (!driver) {
      return res.status(401).json({ success: false, msg: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await driver.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, msg: 'Invalid credentials' });
    }

    sendTokenResponse(driver, 200, res);
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (driver, statusCode, res) => {
  // Create token
  const token = jwt.sign({ id: driver._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      name: driver.name,
      role: driver.role || 'driver',
    },
  });
};

// @desc    Get current logged in driver
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.driver.id);

    if (!driver) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: driver,
    });
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
    };

    const driver = await Driver.findByIdAndUpdate(req.driver.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    // Emit real-time event for driver update
    emitDriverEvent(req, 'updated', { driver: { _id: driver._id, name: driver.name, email: driver.email, role: driver.role } });

    res.status(200).json({
      success: true,
      data: driver,
    });
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.driver.id).select('+password');

    // Check current password
    if (!(await driver.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({ success: false, msg: 'Password is incorrect' });
    }

    driver.password = req.body.newPassword;
    await driver.save();

    sendTokenResponse(driver, 200, res);
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ email: req.body.email });

    if (!driver) {
      return res.status(404).json({ success: false, msg: 'There is no user with that email' });
    }

    // Get reset token
    const resetToken = driver.getResetPasswordToken();

    await driver.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    const message = `
      <h1>You have requested a password reset</h1>
      <p>Please go to this link to reset your password:</p>
      <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
      <p>This link will expire in 30 minutes.</p>
    `;

    try {
      await sendEmail({
        email: driver.email,
        subject: 'Password reset token',
        message
      });

      res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
      console.error(err);
      driver.resetPasswordToken = undefined;
      driver.resetPasswordExpire = undefined;

      await driver.save({ validateBeforeSave: false });

      return res.status(500).json({ success: false, msg: 'Email could not be sent' });
    }

  } catch (err) {
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const driver = await Driver.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!driver) {
      return res.status(400).json({ success: false, msg: 'Invalid token' });
    }

    // Set new password
    driver.password = req.body.password;
    driver.resetPasswordToken = undefined;
    driver.resetPasswordExpire = undefined;
    await driver.save();

    sendTokenResponse(driver, 200, res);
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};

// @desc    Get notifications for logged in driver
// @route   GET /api/v1/auth/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.driver.id);
    res.status(200).json({
      success: true,
      data: driver.notifications || [],
    });
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/v1/auth/notifications/:id
// @access  Private
exports.markNotificationAsRead = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.driver.id);
    
    if (driver.notifications) {
      const notification = driver.notifications.id(req.params.id);
      if (notification) {
        notification.read = true;
        await driver.save();
      }
    }

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};

// @desc    Get all drivers (Admin only)
// @route   GET /api/v1/auth/drivers
// @access  Private/Admin
exports.getAllDrivers = async (req, res, next) => {
  try {
    const drivers = await Driver.find({ role: 'driver' }).select('+password');
    res.status(200).json({
      success: true,
      data: drivers,
    });
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};

// @desc    Update driver password (Admin only)
// @route   PUT /api/v1/auth/drivers/:id/password
// @access  Private/Admin
exports.updateDriverPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, msg: 'Please provide a new password' });
    }

    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ success: false, msg: 'Driver not found' });
    }

    driver.password = newPassword;
    await driver.save();

    res.status(200).json({
      success: true,
      msg: 'Password updated successfully',
    });
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};
