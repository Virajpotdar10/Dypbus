// backend/middleware/auth.js

const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const Driver = require('../models/Driver');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token
    req.user = await Driver.findById(decoded.id).select('-password');

    // For backward compatibility
    req.driver = req.user;

    if (!req.user) {
      return next(new ErrorResponse('User not found', 401));
    }

    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};

// Grant access to specific roles (case-insensitive)
exports.authorize = (...roles) => {
  const normalized = roles.map(r => String(r).trim().toLowerCase());
  return (req, res, next) => {
    // TEMP DEBUG: Log what role was read from DB
    try {
      console.log('[AUTHZ DEBUG] userId:', req.user?._id?.toString(), 'role:', req.user?.role);
    } catch (_) {}

    const role = (req.user && req.user.role)
      ? String(req.user.role).trim().toLowerCase()
      : '';

    if (!normalized.includes(role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user?.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

// Backward compatible admin-only middleware
exports.admin = (req, res, next) => {
  const role = (req.user && req.user.role)
    ? String(req.user.role).trim().toLowerCase()
    : '';
  if (role !== 'admin') {
    return next(new ErrorResponse('Access denied. Admin only.', 403));
  }
  next();
};