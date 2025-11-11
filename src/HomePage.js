import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGeolocation from "./hooks/useGeolocation";
import useParkingLocation from "./hooks/useParkingLocation";
import usePersistentTimer from "./hooks/usePersistentTimer";
import PrivacyPolicyModal from "./components/PrivacyPolicyModal";
import TermsOfServiceModal from "./components/TermsOfServiceModal";

import "bootstrap/dist/css/bootstrap.min.css";

function HomePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { getLocation } = useGeolocation();
  const { saveParkingLocation } = useParkingLocation();
  const { startTimer } = usePersistentTimer();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleButtonClick = async () => {
    setIsLoading(true);
    setProgress(0);

    try {
      let progressValue = 0;
      const interval = setInterval(() => {
        progressValue += 5;
        setProgress(progressValue);
        if (progressValue >= 100) clearInterval(interval);
      }, 100);

      const locationData = await getLocation();
      if (!locationData || !locationData.latitude || !locationData.longitude) {
        throw new Error("Failed to get a valid location. Please try again.");
      }

      saveParkingLocation(
        { latitude: locationData.latitude, longitude: locationData.longitude },
        locationData.timestamp || Date.now()
      );

      startTimer();

      clearInterval(interval);
      setProgress(100);

      // Give a slight delay for smoother UX, then redirect
      setTimeout(() => {
        navigate("/parking");
      }, 500);

    } catch (error) {
      console.error("Error fetching location:", error.message);
      alert("Failed to get location. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
    className="container-fluid d-flex flex-column bg-custom-gradient"
      style={{
        minHeight: "calc(100vh - 50px)",
        padding: "10px",
        color: "#ecf0f1",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div className="row">
        <div className="col-12 text-center"></div>
      </div>

      <div className="row">
      {/* Content-rich Landing Section */}
      <header className="text-center mt-3">
        <p
          style={{
            maxWidth: "750px",
            margin: "15px auto",
            lineHeight: "1.7",
            color: "#f8f9fa",
            fontSize: "16px",
          }}
        >
          <strong>Pin My Park</strong> is your smart parking assistant. With one tap, 
          save your parking spot using accurate GPS data. Add notes like your parking 
          level or section, and when it’s time to leave, simply open the app and 
          navigate back to your car. Whether you’re at the mall, an airport, or a stadium, 
          Pin My Park makes sure you never waste time searching for your car again.
        </p>
      </header>
      </div>

      <div
        className="row flex-grow-1 d-flex justify-content-center align-items-center"
        style={{ position: "relative" }}
      >
        <div
          style={{
            width: "250px",
            height: "250px",
            position: "relative",
            borderRadius: "50%",
            background: "linear-gradient(145deg, #27ae60, #2ecc71)",
            boxShadow: "0 8px 15px rgba(0, 0, 0, 0.2)",
          }}
        >
          <svg
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              transform: "rotate(-90deg)",
            }}
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#34495e"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeDasharray="282.74"
              strokeDashoffset={`${282.74 - (progress / 100) * 282.74}`}
              strokeLinecap="round"
              fill="none"
            />
            <defs>
              <linearGradient id="gradient" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#1abc9c" />
                <stop offset="100%" stopColor="#2ecc71" />
              </linearGradient>
            </defs>
          </svg>

          <button
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: "linear-gradient(145deg, #1abc9c, #16a085)",
              color: "#ecf0f1",
              border: "none",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
              transition: "all 0.3s ease",
              opacity: isLoading ? 0.8 : 1,
            }}
            onClick={handleButtonClick}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Park"}
          </button>
        </div>
      </div>

      <footer className="text-center mt-5" style={{ fontSize: "14px" }}>
  <button
    className="btn btn-link text-light p-0 me-3"
    style={{ textDecoration: "underline" }}
    onClick={() => setShowPrivacyModal(true)}
  >
    Privacy Policy
  </button>
  <button
    className="btn btn-link text-light p-0"
    style={{ textDecoration: "underline" }}
    onClick={() => setShowTermsModal(true)}
  >
    Terms of Service
  </button>
</footer>

<PrivacyPolicyModal
  show={showPrivacyModal}
  onClose={() => setShowPrivacyModal(false)}
/>
<TermsOfServiceModal
  show={showTermsModal}
  onClose={() => setShowTermsModal(false)}
/>

    </div>
  );
}

export default HomePage;
