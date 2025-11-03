// src/components/Map.js
import React from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const Map = ({ location }) => {
  // Ensure hook is always called at the top level
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  if (loadError) return <p>Error loading maps</p>;
  if (!isLoaded) return <p>Loading Map...</p>;

  // Handle null or undefined location after ensuring hooks are not conditional
  if (!location || !location.latitude || !location.longitude) {
    return <p>Location data not available.</p>;
  }

  return (
    <div style={{ position: "relative", height: "400px" }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={{ lat: location.latitude, lng: location.longitude }}
        zoom={15}
      >
        <Marker position={{ lat: location.latitude, lng: location.longitude }} />
      </GoogleMap>
    </div>
  );
};

export default Map;
