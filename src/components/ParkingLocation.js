// src/components/ParkingLocation.js

import React from "react";

const ParkingLocation = ({ location, address, timestamp }) => (
  <div style={{ marginTop: "20px", textAlign: "center"}}>
    <div className="card" style={{color: "white", background: "linear-gradient(145deg, #2c3e50, #34495e)"}}>
      <div className="card-body">
      <h2 className="card-title">Parking Details:</h2>
      <p className="card-text"><strong>Address:</strong> {address}</p>
      <p className="card-text"><strong>Time Parked:</strong> {timestamp}</p>
    {location ? (
      <>
        <p className="card-text">Latitude: {location.latitude}</p>
        <p className="card-text">Longitude: {location.longitude}</p>
      </>
    ) : (
      <p className="card-text">Location data is unavailable</p>
    )}
      </div>
    </div>
  </div>
);


export default ParkingLocation;
