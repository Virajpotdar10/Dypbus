const express = require('express');
const router = express.Router();
const Route = require('../models/Route');

router.post('/:routeId', async (req, res) => {
  const { latitude, longitude } = req.body;
  const { routeId } = req.params;

  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
  }

  try {
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, error: 'Route not found' });
    }

    const currentLocation = { latitude, longitude };

    const io = req.app.get('io');

    const locationData = {
      routeId,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      timestamp: new Date(),
    };

    // Broadcast the location to the route-specific room
    io.to(routeId).emit('location:update', locationData);

    res.status(200).json({ success: true, data: locationData });
  } catch (error) {
    console.error('Error tracking location:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;