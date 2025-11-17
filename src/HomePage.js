import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

import useGeolocation from "./hooks/useGeolocation";
import useParkingLocation from "./hooks/useParkingLocation";
import usePersistentTimer from "./hooks/usePersistentTimer";

import PrivacyPolicyModal from "./components/PrivacyPolicyModal";
import TermsOfServiceModal from "./components/TermsOfServiceModal";

import "bootstrap/dist/css/bootstrap.min.css";
import "./WelcomeOverlay.css";

function HomePage() {
  const navigate = useNavigate();
  const { getLocation } = useGeolocation();
  const { saveParkingLocation } = useParkingLocation();
  const { startTimer } = usePersistentTimer();

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);

  // ------------------------------------------
  // SHOW OVERLAY ONLY IF:
  // user not logged in AND session skip not set
  // ------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const skippedSession = sessionStorage.getItem("skip_welcome") === "true";
      const neverShow = localStorage.getItem("welcome_never_show") === "true";

      // Logic:
      // 1. If user logged in → never show overlay
      // 2. If user chose never show → never show again
      // 3. If user skipped this session → don't show again for this session
      if (!user && !skippedSession && !neverShow) {
        setShowWelcomeOverlay(true);
      } else {
        setShowWelcomeOverlay(false);
      }
    });

    return () => unsubscribe();
  }, []);


  // ------------------------------------------
  // HANDLE "Continue Without Account"
  // ------------------------------------------
  const handleContinueWithoutAccount = () => {
    sessionStorage.setItem("skip_welcome", "true");
    setShowWelcomeOverlay(false);
  };

  // ------------------------------------------
  // PARK BUTTON LOGIC
  // ------------------------------------------
  const handleButtonClick = async () => {
    setIsLoading(true);
    setProgress(0);

    try {
      let progressVal = 0;
      const interval = setInterval(() => {
        progressVal += 5;
        setProgress(progressVal);
        if (progressVal >= 100) clearInterval(interval);
      }, 100);

      const locationData = await getLocation();
      if (!locationData?.latitude || !locationData?.longitude) {
        throw new Error("Failed to get location");
      }

      saveParkingLocation(
        { latitude: locationData.latitude, longitude: locationData.longitude },
        locationData.timestamp || Date.now()
      );

      startTimer();

      clearInterval(interval);
      setProgress(100);

      setTimeout(() => navigate("/parking"), 500);
    } catch (error) {
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
      {/* ----------------- TOP TEXT SECTION ------------------- */}
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
          navigate back to your car.
        </p>
      </header>

      {/* ----------------- CENTER BUTTON ------------------- */}
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
          {/* Circular Progress Indicator */}
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
            <circle cx="50" cy="50" r="45" stroke="#34495e" strokeWidth="8" fill="none" />

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

          {/* Button */}
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
              opacity: isLoading ? 0.8 : 1,
              transition: "all 0.3s ease",
            }}
            onClick={handleButtonClick}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Park"}
          </button>
        </div>
      </div>

      {/* ----------------- WELCOME OVERLAY ------------------- */}
      {showWelcomeOverlay && (
        <div className="welcome-overlay">
          <div className="welcome-box">
            <h2>Welcome to Pin My Park</h2>
            <p>
              You can save your parking spots without an account.
              But logging in lets you keep a full parking history.
            </p>

            {/* Never show again checkbox */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                marginTop: "-10px",
                gap: "8px"
              }}
            >
              <input
                type="checkbox"
                id="neverShow"
                style={{ transform: "scale(1.2)" }}
                onChange={(e) => {
                  if (e.target.checked) {
                    localStorage.setItem("welcome_never_show", "true");
                  } else {
                    localStorage.removeItem("welcome_never_show");
                  }
                }}
              />
              <label htmlFor="neverShow" style={{ fontSize: "14px", color: "#444" }}>
                Don’t show this again
              </label>
            </div>

            <button
              className="overlay-btn primary"
              onClick={() => navigate("/login")}
            >
              Login / Sign Up
            </button>

            <button
              className="overlay-btn secondary"
              onClick={() => {
                const neverShow = localStorage.getItem("welcome_never_show") === "true";

                if (!neverShow) {
                  // Normal behavior: hide only for this session
                  sessionStorage.setItem("skip_welcome", "true");
                }

                setShowWelcomeOverlay(false);
              }}
            >
              Continue Without Account
            </button>
          </div>
        </div>
      )}


      {/* ----------------- FOOTER ------------------- */}
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