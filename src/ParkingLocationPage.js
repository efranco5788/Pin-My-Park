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
import { Modal, Button } from "react-bootstrap";

/** --------------------------------- Styles ------------------------------------ */
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

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
}

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

  /** --------------------------------- Handlers --------------------------------- */
  const handleSaveParking = async () => {
    setIsLoadingLocal(true);
    try {
      const locationData = await getLocation();
      if (!locationData?.latitude || !locationData?.longitude) {
        throw new Error("Failed to get a valid location. Please try again.");
      }

      // 1) Save locally immediately (optimistic UI)
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

      // 2) Offline or no user → queue for later sync
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

      // 3) Online & authed → attempt Firestore write
      try {
        await addDoc(collection(db, "parkingHistory", user.uid, "spots"), {
          ...payload,
          timestamp: serverTimestamp(),
        });

        toast.success("✅ Parking spot saved to your history!", {
          position: "top-center",
          autoClose: 3000,
        });

        // best-effort flush of any backlog
        syncAll();
      } catch (fireErr) {
        // why: on transient failure, keep data via queue for reliability
        console.warn("Firestore write failed; queued for retry.", fireErr);
        addToQueue(payload);
        toast.error("❌ Failed to upload — saved offline instead.", {
          position: "top-center",
          autoClose: 4000,
        });
      }

      // (Re)start timer after a successful local save
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

        {/* High precision toggle */}
        <div style={{ marginTop: 10 }}>
          <label style={{ color: "#ecf0f1", fontSize: 13 }}>
            <input type="checkbox" checked={highPrecision} onChange={toggleHighPrecision} />{" "}
            High precision mode
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
