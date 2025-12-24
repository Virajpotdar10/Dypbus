// d:\Bus driver\frontend\src\screens\DriverScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import './DriverScreen.css';

const DriverScreen = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [route, setRoute] = useState(null);
  const [locationLog, setLocationLog] = useState([]);
  const trackingIntervalRef = useRef(null);

  // Fetch the driver's assigned route
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const { data } = await axios.get('/api/v1/routes/driver/me'); // Replace with your actual API endpoint
        setRoute(data);
      } catch (err) {
        toast.error('Failed to fetch route details.');
        console.error(err);
      }
    };

    fetchRoute();
    return () => clearInterval(trackingIntervalRef.current);
  }, []);

  const handleStartTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsTracking(true);
    trackingIntervalRef.current = setInterval(sendLocation, 5000); // Send location every 5 seconds
    toast.success('Live tracking started!');
  };

  const handleStopTracking = () => {
    setIsTracking(false);
    clearInterval(trackingIntervalRef.current);
    toast.info('Live tracking stopped.');
  };

  const sendLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await axios.post(`/api/v1/track/${route._id}`, {
            latitude,
            longitude,
          });
          setLocationLog(prev => [...prev, `Sent location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`]);
        } catch (err) {
          console.error('Error sending location:', err);
        }
      },
      (error) => {
        toast.error('Error getting location: ' + error.message);
      }
    );
  };

  const handleShareLink = () => {
    if (!route) return;
    const trackingLink = `${window.location.origin}/track/bus/${route._id}`;
    navigator.clipboard.writeText(trackingLink)
      .then(() => toast.success('Tracking link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link.'));
  };

  if (!route) return (
    <div className="driver-container">
      <div className="loading-message">Loading route information...</div>
      <div className="button-group">
        <button className="start-btn" disabled>Start Live Tracking</button>
        <button className="share-btn" disabled>Share Tracking Link</button>
      </div>
    </div>
  );

  return (
    <div className="driver-container">
      <h1>Driver Dashboard</h1>
      <h2>Route: {route.routeName}</h2>
      <p>Bus: {route.busNumber}</p>

      <div className="button-group">
        {!isTracking ? (
          <button className="start-btn" onClick={handleStartTracking}>
            Start Live Tracking
          </button>
        ) : (
          <button className="stop-btn" onClick={handleStopTracking}>
            Stop Live Tracking
          </button>
        )}
        <button className="share-btn" onClick={handleShareLink}>
          Share Tracking Link
        </button>
      </div>

      <div className="location-log">
        <h3>Location Logs:</h3>
        <ul>
          {locationLog.map((log, index) => (
            <li key={index}>{log}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DriverScreen;