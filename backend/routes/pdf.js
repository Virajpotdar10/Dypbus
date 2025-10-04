const express = require('express');
const { generateRoutePDF, generateAllRoutesPDF, generateRouteCSV } = require('../controllers/pdf');
const { protect } = require('../middleware/auth');

const router = express.Router();

// PDF generation routes
router.get('/route/:routeId', protect, generateRoutePDF);
router.get('/route/:routeId/csv', protect, generateRouteCSV);
router.get('/all-routes', protect, generateAllRoutesPDF);

module.exports = router;
