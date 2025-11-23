// src/hooks/useParkingActions.js
import { useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";

/**
 * useParkingActions
 * - Encapsulates save and clear logic including Firestore writes and toast notifications
 * - Dependencies injected via parameters (to keep hook testable)
 *
 * Parameters:
 *  - getLocation: fn that returns {latitude, longitude, accuracy?, timestamp}
 *  - saveParkingLocation: fn to save location locally
 *  - startTimer, stopTimer, resetTimer: timer control fns
 *  - additionalInfo, address: metadata to store in Firestore
 *  - showError: function to surface modal error messages
 */
export default function useParkingActions({
  getLocation,
  saveParkingLocation,
  startTimer,
  stopTimer,
  resetTimer,
  additionalInfo = {},
  address = "",
  showError = () => {},
}) {
  const [isSaving, setIsSaving] = useState(false);

  const saveParking = async () => {
    setIsSaving(true);
    try {
      const locationData = await getLocation();
      if (!locationData?.latitude || !locationData?.longitude) {
        throw new Error("Failed to obtain a valid location.");
      }

      // Save locally (hook provided)
      saveParkingLocation(
        { latitude: locationData.latitude, longitude: locationData.longitude },
        locationData.timestamp || Date.now()
      );

      // Firestore save if user is logged in
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(db, "parkingHistory", user.uid, "spots"), {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          timestamp: serverTimestamp(),
          address: address || "Unknown location",
          floor: additionalInfo?.floor || "",
          section: additionalInfo?.section || "",
          name: additionalInfo?.name || "",
        });

        toast.success("✅ Parking spot saved to your history!", {
          position: "top-center",
          autoClose: 3000,
        });
      } else {
        toast.info("ℹ️ Saved locally. Sign in to save to your history.", {
          position: "top-center",
          autoClose: 4000,
        });
      }

      // Restart timer
      stopTimer();
      startTimer();
      return { success: true };
    } catch (err) {
      const message = err?.message || "Failed to save parking.";
      // Surface error via modal (if desired)
      showError(message);
      // Also show toast for quick feedback
      toast.error("❌ " + (message || "Failed to save parking spot."), {
        position: "top-center",
        autoClose: 4000,
      });
      return { success: false, error: message };
    } finally {
      setIsSaving(false);
    }
  };

  const clearParking = async () => {
    try {
      // Clear local
      resetTimer(); // reset timer first
      // call local clearing provided by the consumer (they should call saveParkingLocation or separate clear hook)
      // in our usage, consumer will call clearParkingLocation() after this hook returns
      toast.info("🧹 Parking info cleared.", { position: "top-center", autoClose: 3000 });
      return { success: true };
    } catch (err) {
      const message = err?.message || "Failed to clear parking.";
      showError(message);
      toast.error("❌ " + message, { position: "top-center", autoClose: 3000 });
      return { success: false, error: message };
    }
  };

  return {
    isSaving,
    saveParking,
    clearParking,
  };
}