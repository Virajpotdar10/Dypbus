// d:\Bus driver\backend\utils\etaCalculator.js
const { Client } = require('@googlemaps/google-maps-services-js');
const NodeCache = require('node-cache');

const client = new Client({});
const cache = new NodeCache({ stdTTL: 60 }); // Cache results for 60 seconds

const getEtas = async (currentLocation, stops) => {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API key is not configured.');
    return [];
  }

  if (!stops || stops.length === 0) {
    return [];
  }

  const cacheKey = `${currentLocation.latitude},${currentLocation.longitude}-${stops.map(s => s._id).join(',')}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await client.distancematrix({
      params: {
        origins: [currentLocation],
        destinations: stops.map(stop => ({ lat: stop.latitude, lng: stop.longitude })),
        key: process.env.GOOGLE_MAPS_API_KEY,
        travelMode: 'DRIVING',
      },
      timeout: 5000, // timeout in milliseconds
    });

    const results = response.data.rows[0].elements;
    const etas = results.map((result, index) => {
      if (result.status === 'OK') {
        return {
          stopId: stops[index]._id,
          duration: result.duration.value, // in seconds
          distance: result.distance.text,
        };
      }
      return {
        stopId: stops[index]._id,
        duration: null,
        distance: 'N/A',
      };
    });

    cache.set(cacheKey, etas);
    return etas;

  } catch (error) {
    console.error('Error fetching ETAs from Google Maps:', error.response ? error.response.data : error.message);
    return stops.map(stop => ({ stopId: stop._id, duration: null, distance: 'Error' }));
  }
};

module.exports = { getEtas };