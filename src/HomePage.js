// src/HomePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";

import PrivacyPolicyModal from "./components/PrivacyPolicyModal";
import TermsOfServiceModal from "./components/TermsOfServiceModal";

import "bootstrap/dist/css/bootstrap.min.css";
import "./WelcomeOverlay.css";

/** -------- Constants (keep storage keys & routes in one place) -------- */
const STORAGE = {
  SKIP_WELCOME: "skip_welcome",
  NEVER_SHOW_WELCOME: "welcome_never_show",
}

const ROUTES = {
  LOGIN: "/login",
  PARKING: "/parking",
}

/** =========================================================================
 * HomePage
 * Purpose: Show CTA to proceed; simulate a loading/progress ring, then route.
 * Overlay shows only for unauthenticated users unless suppressed by storage.
 * ========================================================================= */
function HomePage() {
  const navigate = useNavigate();

  /** -------- Action state (button/progress) -------- */
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  /** -------- UI state (modals/overlay) -------- */
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);

  /** -------- Effects -------- */
  useEffect(() => {
    // why: gate overlay by auth + user's suppression choices
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const skippedSession = sessionStorage.getItem(STORAGE.SKIP_WELCOME) === "true";
      const neverShow = localStorage.getItem(STORAGE.NEVER_SHOW_WELCOME) === "true";
      setShowWelcomeOverlay(!user && !skippedSession && !neverShow);
    });
    return () => unsubscribe();
  }, []);

  /** -------- Handlers -------- */
  const handleContinueWithoutAccount = () => {
    // why: suppress overlay for the rest of this session only
    sessionStorage.setItem(STORAGE.SKIP_WELCOME, "true");
    setShowWelcomeOverlay(false);
  };

  const handleButtonClick = () => {
    // why: prevent double-activation
    if (isLoading) return;

    // why: simulate a short, deterministic loading for UX continuity
    setIsLoading(true);
    setProgress(0);

    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(current + 5, 100);
      setProgress(current);

      if (current >= 100) {
        clearInterval(interval);
        // why: small delay to let ring reach "complete" visually
        setTimeout(() => {
          navigate(ROUTES.PARKING);
          setIsLoading(false);
        }, 300);
      }
    }, 100);
  };

  /** -------- Render -------- */
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
      {/* -------- Header copy -------- */}
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

      {/* -------- Center CTA with progress ring -------- */}
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
          aria-live="polite" // why: announce state changes for assistive tech
        >
          {/* Progress ring */}
          <svg
            style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            aria-hidden="true"
            focusable="false"
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

          {/* CTA button */}
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
              opacity: isLoading ? 0.85 : 1,
              transition: "all 0.3s ease",
            }}
            onClick={handleButtonClick}
            disabled={isLoading}
            aria-label={isLoading ? "Loading, please wait" : "Park"}
          >
            {isLoading ? "Loading..." : "Park"}
          </button>
        </div>
      </div>

      {/* -------- Welcome overlay (auth-gated) -------- */}
      {showWelcomeOverlay && (
        <div className="welcome-overlay">
          <div className="welcome-box">
            <h2>Welcome to Pin My Park</h2>
            <p>
              You can save your parking spots without an account.
              But logging in lets you keep a full parking history.
            </p>

            {/* Never show again */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                marginTop: "-10px",
                gap: "8px",
              }}
            >
              <input
                type="checkbox"
                id="neverShow"
                style={{ transform: "scale(1.2)" }}
                onChange={(e) => {
                  // why: persistent suppression across sessions
                  if (e.target.checked) {
                    localStorage.setItem(STORAGE.NEVER_SHOW_WELCOME, "true");
                  } else {
                    localStorage.removeItem(STORAGE.NEVER_SHOW_WELCOME);
                  }
                }}
              />
              <label htmlFor="neverShow" style={{ fontSize: "14px", color: "#444" }}>
                Don’t show this again
              </label>
            </div>

            <button className="overlay-btn primary" onClick={() => navigate(ROUTES.LOGIN)}>
              Login / Sign Up
            </button>

            <button className="overlay-btn secondary" onClick={handleContinueWithoutAccount}>
              Continue Without Account
            </button>
          </div>
        </div>
      )}

      {/* -------- Footer & Modals -------- */}
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

      <PrivacyPolicyModal show={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      <TermsOfServiceModal show={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </div>
  );
}

export default HomePage;
