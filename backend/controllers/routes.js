const Route = require('../models/Route');
const { invalidateCache } = require('../middleware/cache');

// Helper to emit real-time events
const emitRouteEvent = (req, eventType, data) => {
  const io = req.app.get('io');
  if (io) {
    io.emit(`route:${eventType}`, data);
  }
};

// @desc    Get all routes for the logged-in driver
// @route   GET /api/v1/routes
// @access  Private
exports.getRoutes = async (req, res, next) => {
  try {
    let query;

    const isAdmin = ((req.user && req.user.role) ? String(req.user.role) : '').toLowerCase() === 'admin';

    // If user is admin, show all routes with driver details. Otherwise, only show their own.
    if (isAdmin) {
      query = Route.find().populate('driver', '_id name email');
    } else {
      query = Route.find({ driver: req.driver.id }).populate('driver', 'name email');
    }

    const routes = await query;

    res.status(200).json({ success: true, count: routes.length, data: routes });
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};

// @desc    Create new route
// @route   POST /api/v1/routes
// @access  Private
exports.createRoute = async (req, res, next) => {
  try {
    // Add driver to req.body
    req.body.driver = req.driver._id;

    const route = await Route.create(req.body);
    await route.populate('driver', 'name email');
    
    invalidateCache.routes();

    // Emit real-time event
    emitRouteEvent(req, 'created', { route, createdBy: req.driver.name });

    res.status(201).json({ success: true, data: route });
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};

// @desc    Get single route
// @route   GET /api/v1/routes/:id
// @access  Private
exports.getRoute = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id).populate('driver', 'name email');

    if (!route) {
      return res.status(404).json({ success: false, msg: 'Route not found' });
    }

    const isAdmin = ((req.user && req.user.role) ? String(req.user.role) : '').toLowerCase() === 'admin';

    // Make sure driver owns route or is admin
    if (route.driver._id.toString() !== req.driver._id.toString() && !isAdmin) {
      return res.status(401).json({ success: false, msg: 'Not authorized to access this route' });
    }

    res.status(200).json({ success: true, data: route });
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};

// @desc    Update route
// @route   PUT /api/v1/routes/:id
// @access  Private
exports.updateRoute = async (req, res, next) => {
  try {
    let route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({ success: false, msg: 'Route not found' });
    }

    const isAdmin = ((req.user && req.user.role) ? String(req.user.role) : '').toLowerCase() === 'admin';

    // Make sure driver owns route or is admin
    if (route.driver.toString() !== req.driver._id.toString() && !isAdmin) {
      return res.status(401).json({ success: false, msg: 'Not authorized to update this route' });
    }

    route = await Route.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('driver', 'name email');

    invalidateCache.routes();

    // Emit real-time event
    emitRouteEvent(req, 'updated', { route, updatedBy: req.driver.name });

    res.status(200).json({ success: true, data: route });
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};

// @desc    Delete route
// @route   DELETE /api/v1/routes/:id
// @access  Private
exports.deleteRoute = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({ success: false, msg: 'Route not found' });
    }

    const isAdmin = ((req.user && req.user.role) ? String(req.user.role) : '').toLowerCase() === 'admin';

    // Make sure driver owns route or is admin
    if (route.driver.toString() !== req.driver._id.toString() && !isAdmin) {
      return res.status(401).json({ success: false, msg: 'Not authorized to delete this route' });
    }

    await Route.findByIdAndDelete(req.params.id);

    invalidateCache.routes();

    // Emit real-time event
    emitRouteEvent(req, 'deleted', { routeId: req.params.id, deletedBy: req.driver.name });

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};
