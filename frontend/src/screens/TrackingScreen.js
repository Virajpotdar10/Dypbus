import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Map from '../components/Map';
import Timeline from '../components/Timeline';
import './TrackingScreen.css';
import API, { socket } from '../api';

const TrackingScreen = () => {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [etas, setEtas] = useState([]);
  const [runningStatus, setRunningStatus] = useState('Waiting for location...');
  const [isLive, setIsLive] = useState(false);
  const lastEtaUpdateTime = useRef(0);

  const calculateEtas = useCallback((currentLocation, stops) => {
    if (!window.google || !window.google.maps || !window.google.maps.DirectionsService) {
      console.error("Google Maps Directions Service is not available.");
      return;
    }
    if (!currentLocation || !stops || stops.length === 0) {
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    const origin = new window.google.maps.LatLng(currentLocation.lat, currentLocation.lng);
    const destination = stops[stops.length - 1];
    const destinationLatLng = new window.google.maps.LatLng(
      parseFloat(destination.latitude),
      parseFloat(destination.longitude)
    );

    const waypoints = stops.slice(0, -1).map(stop => ({
      location: new window.google.maps.LatLng(parseFloat(stop.latitude), parseFloat(stop.longitude)),
      stopover: true,
    }));

    directionsService.route(
      {
        origin: origin,
        destination: destinationLatLng,
        waypoints: waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setRunningStatus('En Route');
          const legs = result.routes[0].legs;
          let cumulativeDuration = 0;
          const newEtas = [];

          for (let i = 0; i < legs.length; i++) {
            cumulativeDuration += legs[i].duration.value;
            const stopId = stops[i]._id;
            newEtas.push({ stopId, duration: cumulativeDuration });
          }
          setEtas(newEtas);
        } else {
          setRunningStatus('Route calculation error');
          console.error(`Directions request failed due to ${status}`);
        }
      }
    );
  }, []);

  const fetchRoute = useCallback(async () => {
    if (!routeId) {
      setError('No route ID provided in URL');
      setLoading(false);
      return;
    }

    try {
      console.log(`Fetching route with ID: ${routeId}`);
      const { data } = await API.get(`/api/v1/routes/${routeId}`);
      
      if (!data || !data.success || !data.data) {
        throw new Error(data?.message || 'No data received from server');
      }

      console.log('Route data:', {
        routeName: data.data.routeName,
        stopsCount: data.data.stops?.length || 0
      });

      setRoute(data.data);
      
      if (data.data.stops?.length > 0) {
        const firstStop = data.data.stops[0];
        const newLocation = {
          lat: parseFloat(firstStop.latitude),
          lng: parseFloat(firstStop.longitude)
        };
        
        if (isNaN(newLocation.lat) || isNaN(newLocation.lng)) {
          console.warn('Invalid coordinates in stop data:', firstStop);
          setLocationError('Invalid location data for this route');
        } else {
          setLocation(newLocation);
        }
      }
    } catch (err) {
      console.error('API Error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = 'Failed to load route details. Please try again.';
      if (err.response?.status === 404) {
        errorMessage = 'Route not found. Please check the URL.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Please log in to view this route.';
        setTimeout(() => navigate('/login'), 1500);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [routeId, navigate]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  useEffect(() => {
    if (!routeId || !route) return;

    socket.connect();
    socket.emit('joinRouteRoom', routeId);

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setRunningStatus('Connection Error');
      setLocationError('Could not connect to the live tracking service.');
    });

    const handleLocationUpdate = (data) => {
      if (data.routeId === routeId) {
        const newLocation = { lat: data.latitude, lng: data.longitude };
        setLocation(newLocation);
        if (!isLive) setIsLive(true); // Set live tracking to true on first update

        const now = Date.now();
        if (now - lastEtaUpdateTime.current > 20000 && route.stops && route.stops.length > 0) {
          lastEtaUpdateTime.current = now;
          calculateEtas(newLocation, route.stops);
        }
      }
    };

    socket.on('location:update', handleLocationUpdate);

    return () => {
      socket.emit('leaveRouteRoom', routeId);
      socket.off('location:update', handleLocationUpdate);
      socket.off('connect_error');
      socket.disconnect();
    };
  }, [routeId, route, calculateEtas, isLive]);

  const handleRetry = useCallback(() => {
    setError(null);
    setLocationError(null);
    setLoading(true);
    fetchRoute();
  }, [fetchRoute]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-overlay">
          <div className="spinner" />
          <h2>Loading Route Information...</h2>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <h2>Error Loading Route</h2>
          <p>{error}</p>
          <button 
            onClick={handleRetry} 
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!route) {
      return (
        <div className="no-route">
          <h2>No Route Information Available</h2>
          <p>The requested route could not be found.</p>
          <button 
            onClick={handleRetry} 
            className="retry-button"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <>
        <header className="header-overlay">
          <h1>{route.routeName || 'Unnamed Route'}</h1>
        </header>

        <div className="map-container">
          {locationError ? (
            <div className="location-error">
              <h2>Location Error</h2>
              <p>{locationError}</p>
              <button 
                onClick={handleRetry}
                className="retry-button"
              >
                Retry
              </button>
            </div>
          ) : location ? (
            <Map 
              center={location} 
              stops={route.stops || []} 
              zoom={14}
              isLive={isLive}
            />
          ) : (
            <div className="no-location">
              <div className="spinner" />
              <h2>Loading Map...</h2>
              {(!route.stops || route.stops.length === 0) && (
                <p className="no-stops-warning">Note: This route doesn't have any stops configured yet.</p>
              )}
            </div>
          )}
        </div>

        {route.stops?.length > 0 && (
          <div className="timeline-bottom-sheet">
            <Timeline 
              stops={route.stops} 
              etas={etas}
              runningStatus={runningStatus}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="tracking-container">
      {renderContent()}
    </div>
  );
};
export default React.memo(TrackingScreen);