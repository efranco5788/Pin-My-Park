// src/components/NavigationButton.js

import React from "react";

const NavigationButton = ({ location }) => {
  const navigateToCar = () => {
    if (location) {
      const { latitude, longitude } = location;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(url, "_blank");
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <button onClick={navigateToCar} className="btn btn-light" style={{marginTop: "20px", padding: "10px 20px", fontSize: "16px" }}>
      Navigate to My Car
      </button>
    </div>
  );
};

export default NavigationButton;
