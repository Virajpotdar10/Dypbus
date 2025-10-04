const Driver = require('../models/Driver');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { invalidateCache } = require('../middleware/cache');

// Helper to emit real-time events
const emitDriverEvent = (req, eventType, data) => {
  const io = req.app.get('io');
  if (io) {
    io.emit(`driver:${eventType}`, data);
  }
};

exports.getUsers = asyncHandler(async (req, res, next) => {
  // Only admins can access all users
  if (req.user.role.toLowerCase() !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this route', 403));
  }
  
  const users = await Driver.find().select('-password');
  res.status(200).json({ success: true, count: users.length, data: users });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await Driver.findById(req.params.id).select('-password');
  
  // Only admin or the user themselves can access
  if (req.user.role !== 'admin' && user._id.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to access this user', 403));
  }
  
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({ success: true, data: user });
});

// @desc    Update user (admin or self)
// @route   PUT /api/v1/users/:id
// @access  Private
exports.updateUser = asyncHandler(async (req, res, next) => {
  try {
    let user = await Driver.findById(req.params.id);
    
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }
    
    // Only admin or the user themselves can update
    if (req.user.role !== 'admin' && user._id.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to update this user', 403));
    }
    
    // Only admin can change roles
    if (req.body.role && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to change user role', 403));
    }
    
    // Update user
    user = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');
    
    invalidateCache.drivers(req.params.id);

    // Emit real-time event
    emitDriverEvent(req, 'updated', { driver: user, updatedBy: req.user.name });
    
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// @desc    Delete user (admin only)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  try {
    const user = await Driver.findById(req.params.id);
    
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }
    
    // Prevent deleting self
    if (user._id.toString() === req.user.id) {
      return next(new ErrorResponse('Cannot delete your own account', 400));
    }
    
    await user.remove();
    
    invalidateCache.drivers(req.params.id);

    // Emit real-time event
    emitDriverEvent(req, 'deleted', { driverId: req.params.id, deletedBy: req.user.name });
    
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
});

// @desc    Get all drivers with their routes and students
// @route   GET /api/v1/users/drivers/full
// @access  Private/Admin
exports.getDriversWithRoutesAndStudents = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this route', 403));
  }
  
  try {
    const result = await Driver.aggregate([
      {
        $match: { role: 'driver' } // Only get drivers, not other admins
      },
      {
        $lookup: {
          from: 'routes',
          localField: '_id',
          foreignField: 'driver',
          as: 'routes',
        },
      },
      {
        $lookup: {
          from: 'students',
          let: { routeIds: '$routes._id' },
          pipeline: [
            { $match: { $expr: { $in: ['$route', '$$routeIds'] } } },
          ],
          as: 'studentsFlat',
        },
      },
      {
        $addFields: {
          routes: {
            $map: {
              input: '$routes',
              as: 'rt',
              in: {
                _id: '$$rt._id',
                routeName: '$$rt.routeName',
                students: {
                  $filter: {
                    input: '$studentsFlat',
                    as: 'st',
                    cond: { $eq: ['$$st.route', '$$rt._id'] },
                  },
                },
              },
            },
          },
        },
      },
      { 
        $project: { 
          name: 1, 
          email: 1, 
          role: 1, 
          routes: 1,
          createdAt: 1
        } 
      },
      { $sort: { name: 1 } },
    ]);

    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (err) {
    console.error('❌ Error fetching drivers:', err);
    next(err);
  }
});
