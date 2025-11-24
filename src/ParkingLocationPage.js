// src/ParkingLocationPage.js
import React, { useState, useEffect, Suspense } from "react";
import { Helmet } from "react-helmet";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import useParkingLocation from "./hooks/useParkingLocation";
import useGeolocation from "./hooks/useGeolocation";
import usePersistentTimer from "./hooks/usePersistentTimer";
import ParkingWidgets from "./components/ParkingWidgets";

import useModals from "./hooks/useModals";
import useSyncQueue from "./hooks/useSyncQueue";

import AccordionButton from "./components/AccordionButton";
import HowItWorksModal from "./components/HowItWorksModal";
import PrivacyPolicyModal from "./components/PrivacyPolicyModal";
import TermsOfServiceModal from "./components/TermsOfServiceModal";
import { Modal, Button } from "react-bootstrap";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebaseConfig";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

const Map = React.lazy(() => import("./components/Maps"));
const ParkingLocation = React.lazy(() => import("./components/ParkingLocation"));
const NavigationButton = React.lazy(() => import("./components/NavigationButton"));
const TimerDurationSection = React.lazy(() => import("./components/TimerDurationSection"));

const DEFAULT_LOCATION = { latitude: 39.8283, longitude: -98.5795 };

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

  // sync queue for optimistic writes
  const { queue, isSyncing, addToQueue, syncAll } = useSyncQueue();

  // Keep timer behavior on restore
  useEffect(() => {
    if (hasRestored && isParkingSaved && !timerRunning) {
      startTimer();
    }
  }, [hasRestored, isParkingSaved, timerRunning, startTimer]);

  // auto-hide error modal if it appears
  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => {
        hideModal();
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [errorMessage, hideModal]);

  // Handlers (with optimistic queue integration)
  const handleSaveParking = async () => {
    setIsLoadingLocal(true);

    try {
      const locationData = await getLocation();
      if (!locationData?.latitude || !locationData?.longitude) {
        throw new Error("Failed to get a valid location. Please try again.");
      }

      // 1) Save locally immediately
      saveParkingLocation(
        { latitude: locationData.latitude, longitude: locationData.longitude },
        locationData.timestamp || Date.now()
      );

      const payload = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: address || "",
        floor: additionalInfo?.floor || "",
        section: additionalInfo?.section || "",
        name: additionalInfo?.name || "",
      };

      const user = auth.currentUser;

      // 2) If no user or offline -> queue and inform user
      if (!user || !navigator.onLine) {
        addToQueue(payload);
        toast.info("📡 Saved offline — will sync when online.", {
          position: "top-center",
          autoClose: 3000,
        });

        stopTimer();
        startTimer();
        return;
      }

      // 3) Try direct Firestore write
      try {
        await addDoc(collection(db, "parkingHistory", user.uid, "spots"), {
          ...payload,
          timestamp: serverTimestamp(),
        });

        toast.success("✅ Parking spot saved to your history!", {
          position: "top-center",
          autoClose: 3000,
        });

        // try flush queued items as well
        syncAll();
      } catch (fireErr) {
        // on failure, queue item and notify user
        console.warn("Firestore write failed; queued for retry.", fireErr);
        addToQueue(payload);
        toast.error("❌ Failed to upload — saved offline instead.", {
          position: "top-center",
          autoClose: 4000,
        });
      }

      stopTimer();
      startTimer();
    } catch (err) {
      console.error("Error saving parking:", err);
      showError(err?.message || "Failed to save parking.");
      toast.error("❌ Failed to save parking spot. Please try again.", {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      setIsLoadingLocal(false);
    }
  };

  const handleClearParking = async () => {
    // clear local + reset timers + toast
    try {
      clearParkingLocation();
      stopTimer();
      resetTimer();
      toast.info("🧹 Parking info cleared.", {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (err) {
      console.error("Error clearing parking:", err);
      showError("Failed to clear parking location.");
    }
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
          disabled={isSyncing || isFetching || isLoadingLocal}
        >
          {isParkingSaved ? "Clear Parking Info" : (isSyncing || isFetching || isLoadingLocal) ? "Saving..." : "Save My Parking Spot"}
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

        {/* Sync status */}
        <div style={{ marginTop: 10 }}>
          {queue && queue.length > 0 ? (
            <small style={{ color: "#ffd166" }}>🔄 Pending sync ({queue.length})</small>
          ) : (
            <small style={{ color: "#7be495" }}>✔ All data synced</small>
          )}
        </div>
      </section>

      {/* Loading spinner */}
      {(isSyncing || isFetching || isLoadingLocal) && (
        <div className="spinner-border text-primary mt-3" role="status" aria-live="polite" />
      )}

      {/* Consolidated Widgets (Map, Navigation, ParkingLocation, Timer) */}
      <Suspense fallback={<Loader text="Loading map and controls..." />}>
        <ParkingWidgets
          location={displayedLocation}
          address={address}
          timestamp={timestamp}
          isParkingSaved={isParkingSaved}
        />
      </Suspense>

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