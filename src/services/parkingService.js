// src/services/parkingService.js
// Small, testable service. No React. Dependencies injected for easy mocking.

/** Build a normalized payload from UI state + location. */
export function buildParkingPayload(additionalInfo, address, locationData) {
  if (!locationData || !locationData.latitude || !locationData.longitude) {
    throw new Error("Invalid location data.");
  }
  return {
    latitude: Number(locationData.latitude),
    longitude: Number(locationData.longitude),
    address: address || "",
    floor: additionalInfo?.floor || "",
    section: additionalInfo?.section || "",
    name: additionalInfo?.name || "",
  };
}

/**
 * Save parking payload.
 * Why: Queue offline/unauth; write to Firestore when possible; never lose data.
 */
export async function saveParkingSpot(payload, deps) {
  const {
    user,                // firebase auth currentUser or null
    online,              // boolean (navigator.onLine)
    addDoc, collection, serverTimestamp, db, // firestore deps
    addToQueue,          // queue add function
    syncAll,             // optional queue flush
  } = deps;

  // Offline or unauthenticated → queue
  if (!user || !online) {
    addToQueue(payload);
    return { status: "queued" };
  }

  // Try remote write
  try {
    await addDoc(collection(db, "parkingHistory", user.uid, "spots"), {
      ...payload,
      timestamp: serverTimestamp(),
    });
    // Best-effort flush of backlog
    if (typeof syncAll === "function") {
      try { await syncAll(); } catch {}
    }
    return { status: "saved" };
  } catch (err) {
    // Network/transient → queue for retry
    addToQueue(payload);
    return { status: "queued", error: err };
  }
}