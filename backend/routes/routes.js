const express = require('express');
const {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
} = require('../controllers/routes');

// Include other resource routers
const studentRoutes = require('./students');

const router = express.Router();

const { protect } = require('../middleware/auth');
const { cacheRoutes } = require('../middleware/cache');

// Re-route into other resource routers
router.use('/:routeId/students', protect, studentRoutes.router);

router.route('/').get(protect, cacheRoutes, getRoutes).post(protect, createRoute);
router.route('/:id').get(protect, getRoute).put(protect, updateRoute).delete(protect, deleteRoute);

module.exports = router;
