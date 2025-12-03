// src/ParkingLocationPage.js

/** ----------------------------- Imports: Libraries ----------------------------- */
import React, { useState, useEffect, Suspense } from "react";
import { Helmet } from "react-helmet";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/** ----------------------------- Imports: Firebase ------------------------------ */
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebaseConfig";

/** ------------------------------- Imports: Hooks ------------------------------- */
import useParkingLocation from "./hooks/useParkingLocation";
import useGeolocation from "./hooks/useGeolocation";
import usePersistentTimer from "./hooks/usePersistentTimer";
import useModals from "./hooks/useModals";
import useSyncQueue from "./hooks/useSyncQueue";

/** ---------------------------- Imports: Components ----------------------------- */
import ParkingWidgets from "./components/ParkingWidgets";
import AccordionButton from "./components/AccordionButton";
import HowItWorksModal from "./components/HowItWorksModal";
import PrivacyPolicyModal from "./components/PrivacyPolicyModal";
import TermsOfServiceModal from "./components/TermsOfServiceModal";
import { Modal, Button, OverlayTrigger, Tooltip } from "react-bootstrap";

/** --------------------------------- Styles ------------------------------------ */
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

/** ------------------------------- Service ------------------------------------- */
import {
  buildParkingPayload,
  saveParkingSpot,
} from "./services/parkingService";

/** ----------------------------- Lazy-loaded chunks ---------------------------- */
// why: defer heavier UI to speed up initial paint
const Map = React.lazy(() => import("./components/Maps"));
const ParkingLocation = React.lazy(() => import("./components/ParkingLocation"));
const NavigationButton = React.lazy(() => import("./components/NavigationButton"));
const TimerDurationSection = React.lazy(() => import("./components/TimerDurationSection"));

/** -------------------------------- Constants ---------------------------------- */
const DEFAULT_LOCATION = { latitude: 39.8283, longitude: -98.5795 }; // USA centroid
const SEO = {
  title: "Pin My Park – Find & Save Your Parking Location Easily",
  description:
    "Pin My Park helps you remember exactly where you parked with GPS precision. Save, manage, and navigate back to your car quickly and stress-free.",
  keywords: "parking app, GPS, car locator, find my car, parking reminder",
};

/** --------------------------- Small UI Subcomponents --------------------------- */
function Loader({ text = "Loading…" }) {
  return (
    <div style={{ padding: 20, textAlign: "center", color: "#ecf0f1" }}>
      {text}
    </div>
  );
}

/** =============================================================================
 * ParkingLocationPage
 * Purpose: Manage capture/clear of parking info with optimistic offline queue,
 *          timer lifecycle, error handling, and consolidated widgets.
 * =========================================================================== */
function ParkingLocationPage() {
  /** ------------------------------- Local UI state ------------------------------ */
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);

  /** ------------------------------- Domain hooks -------------------------------- */
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

  /** ------------------------------ Modal management ----------------------------- */
  const { activeModal, errorMessage, showModal, hideModal, showError } = useModals();

  /** --------------------------- Sync queue (optimistic) ------------------------- */
  const { queue, isSyncing, addToQueue, syncAll } = useSyncQueue();

  /** --------------------------- Capability checks (a11y) ------------------------ */
  // why: High-precision needs Geolocation API and HTTPS context
  const supportsGeolocation =
    typeof navigator !== "undefined" && "geolocation" in navigator;
  const secureContext =
    typeof window !== "undefined" && Boolean(window.isSecureContext);
  const canUseHighPrecision = supportsGeolocation && secureContext;

  /** ------------------------------- Helpers ------------------------------------ */
  // why: present seconds as HH:MM:SS without extra state
  const formatDuration = (totalSec = 0) => {
    const s = Math.max(0, Number(totalSec) | 0);
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  /** ---------------------------------- Effects --------------------------------- */
  useEffect(() => {
    // why: if timer state restored and we have a saved spot, ensure timer is running
    if (hasRestored && isParkingSaved && !timerRunning) {
      startTimer();
    }
  }, [hasRestored, isParkingSaved, timerRunning, startTimer]);

  useEffect(() => {
    // why: auto-dismiss error modal to avoid trapping keyboard focus
    if (!errorMessage) return;
    const t = setTimeout(() => hideModal(), 5000);
    return () => clearTimeout(t);
  }, [errorMessage, hideModal]);

  useEffect(() => {
    // why: inform users once if high precision is unavailable
    if (!canUseHighPrecision) {
      toast.info("High precision requires device geolocation over HTTPS.", {
        position: "top-center",
        autoClose: 3000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseHighPrecision]);

  /** --------------------------------- Handlers --------------------------------- */
  const handleSaveParking = async () => {
    setIsLoadingLocal(true);
    try {
      // 0) Acquire location
      const locationData = await getLocation();
      if (!locationData?.latitude || !locationData?.longitude) {
        throw new Error("Failed to get a valid location. Please try again.");
      }

      // 1) Optimistic local save (instant feedback)
      saveParkingLocation(
        { latitude: locationData.latitude, longitude: locationData.longitude },
        locationData.timestamp || Date.now()
      );

      // 2) Build normalized payload (single source of truth)
      const payload = buildParkingPayload(additionalInfo, address, locationData);

      // 3) Delegate remote/queue persistence to service
      const result = await saveParkingSpot(payload, {
        user: auth.currentUser,
        online: typeof navigator !== "undefined" ? navigator.onLine : false,
        addDoc,
        collection,
        serverTimestamp,
        db,
        addToQueue,
        syncAll,
      });

      // 4) Timers + user feedback
      stopTimer();
      startTimer();

      if (result.status === "saved") {
        toast.success("✅ Parking spot saved to your history!", {
          position: "top-center",
          autoClose: 3000,
        });
      } else if (result.status === "queued") {
        const msg = result.error
          ? "❌ Upload failed — saved offline. Will retry."
          : "📡 Saved offline — will sync when online.";
        toast.info(msg, { position: "top-center", autoClose: 3500 });
      }
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
    // why: local clear + timer reset should always succeed, independent of network
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

  /** -------------------------------- Derived props ------------------------------ */
  const displayedLocation = location || DEFAULT_LOCATION;

  /** -------------------------- Tooltip content builder -------------------------- */
  // why: decoupled content based on support
  const renderHighPrecisionTip = (props) => (
    <Tooltip id="hp-tooltip" {...props}>
      {canUseHighPrecision
        ? "Use higher GPS accuracy (may increase battery usage)."
        : "High precision needs device geolocation over HTTPS."}
    </Tooltip>
  );

  /** ----------------------------------- Render --------------------------------- */
  return (
    <main
      className="container-fluid d-flex flex-column justify-content-between bg-custom-gradient"
      style={{ minHeight: "calc(100vh - 50px)", padding: "20px", color: "#ecf0f1" }}
    >
      {/* SEO */}
      <Helmet>
        <title>{SEO.title}</title>
        <meta name="description" content={SEO.description} />
        <meta name="keywords" content={SEO.keywords} />
      </Helmet>

      {/* Global toasts */}
      <ToastContainer theme="colored" />

      {/* Intro copy */}
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

      {/* Additional info (persist floor/section to local store) */}
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

      {/* Primary controls */}
      <section className="d-flex flex-column align-items-center mt-4" id="btnSection">
        <button
          className={`modern-btn btn-lg shadow ${isParkingSaved ? "btn-warning" : "btn-primary pulse-animation"}`}
          onClick={isParkingSaved ? handleClearParking : handleSaveParking}
          disabled={isSyncing || isFetching || isLoadingLocal}
        >
          {isParkingSaved
            ? "Clear Parking Info"
            : (isSyncing || isFetching || isLoadingLocal)
            ? "Saving..."
            : "Save My Parking Spot"}
        </button>

        {!isParkingSaved && (
          <small className="text-light mt-2 fade-in-subtext">
            We’ll use GPS to remember where you parked.
          </small>
        )}

        {/* High precision toggle (gated + info icon tooltip) */}
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ color: "#ecf0f1", fontSize: 13, margin: 0 }}>
            <input
              type="checkbox"
              checked={!!highPrecision && canUseHighPrecision}
              onChange={toggleHighPrecision}
              disabled={!canUseHighPrecision}
              aria-disabled={!canUseHighPrecision}
              aria-describedby="hp-help"
              style={{ marginRight: 6 }}
            />
            High precision mode
          </label>

          {/* Info icon button with tooltip */}
          <OverlayTrigger
            placement="top"
            trigger={["hover", "focus", "click"]} // why: mobile-friendly
            delay={{ show: 100, hide: 100 }}
            overlay={renderHighPrecisionTip}
          >
            <button
              type="button"
              aria-label="High precision information"
              className="btn btn-sm btn-outline-light rounded-circle"
              style={{
                width: 28,
                height: 28,
                lineHeight: "1",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span aria-hidden="true" style={{ fontWeight: 700 }}>i</span>
            </button>
          </OverlayTrigger>
        </div>

        {!canUseHighPrecision && (
          <div id="hp-help" style={{ color: "#ffd166", fontSize: 12, marginTop: 4 }}>
            High precision unavailable on this device or connection (needs HTTPS & Geolocation).
          </div>
        )}

        {/* Sync status */}
        <div style={{ marginTop: 10 }}>
          {queue && queue.length > 0 ? (
            <small style={{ color: "#ffd166" }}>🔄 Pending sync ({queue.length})</small>
          ) : (
            <small style={{ color: "#7be495" }}>✔ All data synced</small>
          )}
        </div>
      </section>

      {/* --- Timer readout (visible display of elapsedTime) --- */}
      {(timerRunning || isParkingSaved) && (
        <section
          className="d-flex flex-column align-items-center mt-3"
          aria-live="polite" // why: announce updates accessibly
        >
          <div
            style={{
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: 28,
              letterSpacing: 1,
            }}
          >
            {formatDuration(elapsedTime)}
          </div>
          <small className="text-muted" style={{ marginTop: 4 }}>
            Time parked
          </small>
        </section>
      )}

      {/* Loading indicator (geo fetch / local save / queue sync) */}
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

      {/* Error modal (centralized via useModals) */}
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
          <button
            className="btn btn-link text-light p-0 me-3"
            style={{ textDecoration: "underline" }}
            onClick={() => showModal("privacy")}
          >
            Privacy Policy
          </button>
          <button
            className="btn btn-link text-light p-0"
            style={{ textDecoration: "underline" }}
            onClick={() => showModal("terms")}
          >
            Terms of Service
          </button>
        </div>
        <p className="text-muted mt-2">© {new Date().getFullYear()} Pin My Park. All Rights Reserved.</p>
      </footer>
    </main>
  );
}

export default ParkingLocationPage;
