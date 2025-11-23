// src/ParkingLocationPage.js
import React, { useState, useEffect, Suspense } from "react";
import { Helmet } from "react-helmet";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import useParkingLocation from "./hooks/useParkingLocation";
import useGeolocation from "./hooks/useGeolocation";
import usePersistentTimer from "./hooks/usePersistentTimer";
import ParkingWidgets from "./components/ParkingWidgets";

import useModals from "./hooks/useModals";
import useParkingActions from "./hooks/useParkingActions";

import AccordionButton from "./components/AccordionButton";
import HowItWorksModal from "./components/HowItWorksModal";
import PrivacyPolicyModal from "./components/PrivacyPolicyModal";
import TermsOfServiceModal from "./components/TermsOfServiceModal";
import { Modal, Button } from "react-bootstrap";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

const Map = React.lazy(() => import("./components/Maps"));
const ParkingLocation = React.lazy(() => import("./components/ParkingLocation"));
const NavigationButton = React.lazy(() => import("./components/NavigationButton"));
const TimerDurationSection = React.lazy(() => import("./components/TimerDurationSection"));

const DEFAULT_LOCATION = { latitude: 40.7128, longitude: -74.0060 };

function Loader({ text = "Loading…" }) {
  return (
    <div style={{ padding: 20, textAlign: "center", color: "#ecf0f1" }}>
      {text}
    </div>
  );
}

function ParkingLocationPage() {
  // local UI state
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);

  // domain hooks
  const {
    location,
    timestamp,
    address,
    isParkingSaved,
    additionalInfo,
    saveParkingLocation,
    saveAdditionalInfo,
    clearParkingLocation,
  } = useParkingLocation();

  const { getLocation, isFetching, highPrecision, toggleHighPrecision } = useGeolocation();

  const {
    timerRunning,
    elapsedTime,
    startTimer,
    stopTimer,
    resetTimer,
    hasRestored,
  } = usePersistentTimer(isParkingSaved);

  // modal management
  const { activeModal, errorMessage, showModal, hideModal, showError } = useModals();

  // consolidated Suspense wrapper will be used below
  // parking actions hook - inject dependencies
  const { isSaving, saveParking, clearParking } = useParkingActions({
    getLocation,
    saveParkingLocation,
    startTimer,
    stopTimer,
    resetTimer,
    additionalInfo,
    address,
    showError,
  });

  // Keep timer behavior on restore
  useEffect(() => {
    if (hasRestored && isParkingSaved && !timerRunning) {
      startTimer();
    }
  }, [hasRestored, isParkingSaved, timerRunning, startTimer]);

  // Show ephemeral modal when there's an error (managed by useModals)
  useEffect(() => {
    if (errorMessage) {
      // automatically hide after 5s
      const t = setTimeout(() => {
        hideModal();
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [errorMessage, hideModal]);

  // Handlers (thin wrappers)
  const handleSaveParking = async () => {
    setIsLoadingLocal(true);
    await saveParking();
    setIsLoadingLocal(false);
  };

  const handleClearParking = async () => {
    // call clearParking for toasts, then clear local storage via hook
    await clearParking();
    clearParkingLocation();
    stopTimer();
    resetTimer();
  };

  const displayedLocation = location || DEFAULT_LOCATION;

  return (
    <main
      className="container-fluid d-flex flex-column justify-content-between bg-custom-gradient"
      style={{
        minHeight: "calc(100vh - 50px)",
        padding: "20px",
        color: "#ecf0f1",
      }}
    >
      <Helmet>
        <title>Pin My Park – Find & Save Your Parking Location Easily</title>
        <meta
          name="description"
          content="Pin My Park helps you remember exactly where you parked with GPS precision. Save, manage, and navigate back to your car quickly and stress-free."
        />
        <meta
          name="keywords"
          content="parking app, GPS, car locator, find my car, parking reminder"
        />
      </Helmet>

      <ToastContainer theme="colored" />

      {/* Intro */}
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
          Pin My Park is your smart parking assistant. With one tap, save your
          parking spot using accurate GPS data. Add notes like your parking level or section,
          and when it’s time to leave, simply open the app and navigate back to your car.
        </p>
      </header>

      <div className="text-center mt-3">
        <button className="btn btn-outline-light" onClick={() => showModal("how")}>
          How It Works
        </button>
      </div>
      
      {/* Additional info */}
      <section className="mt-5">
        <AccordionButton
          title="Additional Information"
          defaultOpen={true}
          onSave={() => saveAdditionalInfo(additionalInfo)}
        >
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Parking Floor (e.g., Floor 2A)"
            value={additionalInfo.floor}
            onChange={(e) => saveAdditionalInfo({ ...additionalInfo, floor: e.target.value })}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Section (e.g., Near Elevator)"
            value={additionalInfo.section}
            onChange={(e) => saveAdditionalInfo({ ...additionalInfo, section: e.target.value })}
          />
        </AccordionButton>
      </section>

      {/* Controls */}
      <section className="d-flex flex-column align-items-center mt-4" id="btnSection">
        <button
          className={`modern-btn btn-lg shadow ${isParkingSaved ? "btn-warning" : "btn-primary pulse-animation"}`}
          onClick={isParkingSaved ? handleClearParking : handleSaveParking}
          disabled={isSaving || isFetching || isLoadingLocal}
        >
          {isParkingSaved ? "Clear Parking Info" : (isSaving || isFetching || isLoadingLocal) ? "Saving..." : "Save My Parking Spot"}
        </button>

        {!isParkingSaved && (
          <small className="text-light mt-2 fade-in-subtext">
            We’ll use GPS to remember where you parked.
          </small>
        )}

        {/* High precision toggle (optional UI) */}
        <div style={{ marginTop: 10 }}>
          <label style={{ color: "#ecf0f1", fontSize: 13 }}>
            <input type="checkbox" checked={highPrecision} onChange={toggleHighPrecision} />
            {" "}High precision mode
          </label>
        </div>
      </section>

      {/* Loading spinner */}
      {(isSaving || isFetching || isLoadingLocal) && (
        <div className="spinner-border text-primary mt-3" role="status" aria-live="polite" />
      )}

      {/* Consolidated Suspense for lazy components */}
      <ParkingWidgets
      location={location}
      address={address}
      timestamp={timestamp}
      isParkingSaved={isParkingSaved}
      />


      {/* Error modal uses single modal system via useModals */}
      <Modal show={activeModal === "error"} onHide={() => hideModal()} centered>
        <Modal.Header closeButton>
          <Modal.Title>Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{errorMessage}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => hideModal()}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Informational modals */}
      <HowItWorksModal show={activeModal === "how"} onClose={() => hideModal()} />
      <PrivacyPolicyModal show={activeModal === "privacy"} onClose={() => hideModal()} />
      <TermsOfServiceModal show={activeModal === "terms"} onClose={() => hideModal()} />

      {/* Footer */}
      <footer className="text-center mt-5" style={{ fontSize: "14px" }}>
        <p className="text-light mb-2">
          <strong>About:</strong> Pin My Park is a free parking locator app that helps you
          save your car’s location and find it later easily.
        </p>
        <div>
          <button className="btn btn-link text-light p-0 me-3" style={{ textDecoration: "underline" }} onClick={() => showModal("privacy")}>
            Privacy Policy
          </button>
          <button className="btn btn-link text-light p-0" style={{ textDecoration: "underline" }} onClick={() => showModal("terms")}>
            Terms of Service
          </button>
        </div>
        <p className="text-muted mt-2">© {new Date().getFullYear()} Pin My Park. All Rights Reserved.</p>
      </footer>
    </main>
  );
}

export default ParkingLocationPage;