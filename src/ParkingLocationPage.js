import React, { useState, useEffect, useCallback, Suspense } from "react";
import { Helmet } from "react-helmet";
import useParkingLocation from "./hooks/useParkingLocation";
import useGeolocation from "./hooks/useGeolocation";
import AccordionButton from "./components/AccordionButton";
import { Modal, Button } from "react-bootstrap";
import usePersistentTimer from "./hooks/usePersistentTimer";
import HowItWorksModal from "./components/HowItWorksModal";
import PrivacyPolicyModal from "./components/PrivacyPolicyModal";
import TermsOfServiceModal from "./components/TermsOfServiceModal";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

const Map = React.lazy(() => import("./components/Maps"));
const ParkingLocation = React.lazy(() => import("./components/ParkingLocation"));
const NavigationButton = React.lazy(() => import("./components/NavigationButton"));
const TimerDurationSection = React.lazy(() => import("./components/TimerDurationSection"));

const DEFAULT_LOCATION = { latitude: 40.7128, longitude: -74.0060 };

function ParkingLocationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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

  const { getLocation } = useGeolocation();

  const {
    timerRunning,
    elapsedTime,
    startTimer,
    stopTimer,
    resetTimer,
    hasRestored,
  } = usePersistentTimer(isParkingSaved);

  useEffect(() => {
    if (hasRestored && isParkingSaved && !timerRunning) {
      startTimer();
    }
  }, [hasRestored, isParkingSaved, timerRunning, startTimer]);

  useEffect(() => {
    if (error) {
      console.log("Error occurred:", error);
      setShowErrorModal(true);
      const timer = setTimeout(() => {
        setError(null);
        setShowErrorModal(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSaveParking = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const locationData = await getLocation();
      if (!locationData?.latitude || !locationData?.longitude) {
        throw new Error("Failed to get a valid location. Please try again.");
      }

      saveParkingLocation(
        { latitude: locationData.latitude, longitude: locationData.longitude },
        locationData.timestamp || Date.now()
      );
      stopTimer();
      startTimer();
    } catch (error) {
      setError(error.message || "Failed to get location.");
    } finally {
      setIsLoading(false);
    }
  }, [getLocation, saveParkingLocation, stopTimer, startTimer]);

  const handleClearParking = () => {
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
      {/* SEO Metadata for Google AdSense */}
      <Helmet>
        <title>Pin My Park – Find & Save Your Parking Location Easily</title>
        <meta
          name="description"
          content="Pin My Park helps you remember exactly where you parked with GPS precision. Save, manage, and navigate back to your car quickly and stress-free."
        />
        <meta name="keywords" content="parking app, GPS, car locator, find my car, parking reminder" />
      </Helmet>

      <div className="text-center mt-3">
        <button
          className="btn btn-outline-light"
          onClick={() => setShowHowItWorks(true)}
          aria-label="Learn how the app works"
        >
          How It Works
        </button>
      </div>

      {/* Core App Buttons */}
      <section className="d-flex flex-column align-items-center mt-4" id="btnSection">
        <button
          className={`btn btn-lg shadow ${
            isParkingSaved ? "btn-warning" : "btn-success pulse-animation"
          }`}
          onClick={isParkingSaved ? handleClearParking : handleSaveParking}
          disabled={isLoading}
          aria-label={isParkingSaved ? "Clear saved parking location" : "Save current parking location"}
        >
          {isParkingSaved ? "Clear Parking Info" : "Save My Parking Spot"}
        </button>

        {!isParkingSaved && (
          <small className="text-light mt-2 fade-in-subtext">
            We’ll use GPS to remember where you parked.
          </small>
        )}
      </section>

      {isLoading && (
        <div
          className="spinner-border text-primary mt-3"
          role="status"
          aria-live="polite"
          aria-label="Loading"
        ></div>
      )}

      {/* Additional Info Accordion */}
      <section className="mt-5" aria-label="Add parking details">
        <AccordionButton
          title="Additional Information"
          onSave={() => saveAdditionalInfo(additionalInfo)}
        >
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Parking Floor (e.g., Floor 2A)"
            value={additionalInfo.floor}
            onChange={(e) =>
              saveAdditionalInfo({ ...additionalInfo, floor: e.target.value })
            }
          />
          <input
            type="text"
            className="form-control"
            placeholder="Section (e.g., Near Elevator)"
            value={additionalInfo.section}
            onChange={(e) =>
              saveAdditionalInfo({ ...additionalInfo, section: e.target.value })
            }
          />
        </AccordionButton>
      </section>

      {/* Timer */}
      <section className="mt-5" aria-label="Timer showing how long you’ve been parked">
        <Suspense fallback={<div>Loading timer...</div>}>
          <TimerDurationSection
            timerRunning={timerRunning}
            elapsedTime={elapsedTime}
            setElapsedTime={startTimer}
          />
        </Suspense>
      </section>

      {/* Map */}
      <section className="mt-5" aria-label="Map showing saved parking location">
        <Suspense fallback={<div>Loading map...</div>}>
          <Map location={displayedLocation} />
        </Suspense>
      </section>

      {/* Parking Info */}
      {isParkingSaved && (
        <>
          <section className="mt-4" aria-label="Navigation to parking spot">
            <Suspense fallback={<div>Loading navigation...</div>}>
              <NavigationButton location={location} />
            </Suspense>
          </section>

          <section className="mt-4" aria-label="Parking location details">
            <Suspense fallback={<div>Loading parking details...</div>}>
              <ParkingLocation
                location={location}
                address={address}
                timestamp={timestamp}
              />
            </Suspense>
          </section>
        </>
      )}

      {/* Error Modal */}
      <Modal
        show={showErrorModal}
        onHide={() => setShowErrorModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{error}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => setShowErrorModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Informational Modals */}
      <HowItWorksModal show={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
      <PrivacyPolicyModal show={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      <TermsOfServiceModal show={showTermsModal} onClose={() => setShowTermsModal(false)} />

      {/* Footer */}
      <footer className="text-center mt-5" style={{ fontSize: "14px" }}>
        <p className="text-light mb-2">
          <strong>About:</strong> Pin My Park is a free, browser-based parking locator app that helps you
          save your car’s location and find it later with ease. Built for simplicity and privacy.
        </p>
        <div>
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
        </div>
        <p className="text-muted mt-2">
          © {new Date().getFullYear()} Pin My Park. All Rights Reserved.
        </p>
      </footer>
    </main>
  );
}

export default ParkingLocationPage;