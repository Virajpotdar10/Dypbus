// d:\Bus driver\frontend\src\components\Map.js
import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%' // Changed to 100% to fill container
};

const Map = ({ center, stops, isLive = false }) => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("FATAL ERROR: REACT_APP_GOOGLE_MAPS_API_KEY is not defined. The map will not load. Please add it to your .env file.");
  }
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey
  });

  const [directions, setDirections] = useState(null);

  useEffect(() => {
    if (!isLoaded || !stops || stops.length < 2) {
      setDirections(null); // Clear directions if not enough stops
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    const origin = { lat: parseFloat(stops[0].latitude), lng: parseFloat(stops[0].longitude) };
    const destination = { lat: parseFloat(stops[stops.length - 1].latitude), lng: parseFloat(stops[stops.length - 1].longitude) };

    const waypoints = stops.slice(1, -1).map(stop => ({
      location: { lat: parseFloat(stop.latitude), lng: parseFloat(stop.longitude) },
      stopover: true
    }));

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error(`Error fetching directions: ${status}`);
        }
      }
    );
  }, [stops, isLoaded]);

  const mapOptions = {
    mapTypeId: 'satellite',
    zoom: 15,
    center: center,
    disableDefaultUI: true, // Hides default controls for a cleaner look
  };

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      options={mapOptions}
      center={center}
    >
      {/* Bus Marker - only shown when tracking is live */}
      {center && isLive && (
        <Marker
          position={center}
          icon={{
            url: "http://maps.google.com/mapfiles/ms/icons/bus.png",
            scaledSize: new window.google.maps.Size(40, 40)
          }}
        />
      )}

      {/* Directions Renderer */}
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: true, // Use our custom stop markers instead
            polylineOptions: {
              strokeColor: '#FFFF00', // Yellow line for visibility on satellite view
              strokeOpacity: 0.8,
              strokeWeight: 4
            }
          }}
        />
      )}

      {/* Stop Markers */}
      {stops && stops.map((stop, index) => (
        <Marker
          key={index}
          position={{ lat: parseFloat(stop.latitude), lng: parseFloat(stop.longitude) }}
          label={{
            text: `${index + 1}`,
            color: "white",
            fontWeight: "bold",
          }}
          title={stop.stopName}
        />
      ))}
    </GoogleMap>
  ) : <p>Loading Map...</p>;
};

export default React.memo(Map);