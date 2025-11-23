// src/hooks/useSyncQueue.js
import { useEffect, useState, useCallback } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const QUEUE_KEY = "parkingSyncQueue_v1";

/**
 * useSyncQueue
 * - persistent local queue in localStorage
 * - auto-retries on network restore and on mount
 * - exposes addToQueue and syncAll
 */
export default function useSyncQueue() {
  const [queue, setQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // load queue from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(QUEUE_KEY);
      if (saved) setQueue(JSON.parse(saved));
    } catch (err) {
      console.warn("Failed to read sync queue from localStorage", err);
    }
  }, []);

  // persist queue when changed
  useEffect(() => {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.warn("Failed to persist sync queue", err);
    }
  }, [queue]);

  const addToQueue = useCallback((item) => {
    setQueue((prev) => [...prev, { ...item, _queuedAt: Date.now() }]);
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const syncItem = useCallback(async (item) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in — cannot sync");

    // perform Firestore write
    await addDoc(collection(db, "parkingHistory", user.uid, "spots"), {
      latitude: item.latitude,
      longitude: item.longitude,
      address: item.address || "Unknown location",
      floor: item.floor || "",
      section: item.section || "",
      name: item.name || "",
      timestamp: serverTimestamp(),
      _queuedAt: item._queuedAt || null,
    });
  }, []);

  const syncAll = useCallback(async () => {
    if (isSyncing) return;
    if (!navigator.onLine) return;
    if (queue.length === 0) return;

    setIsSyncing(true);

    // copy to mutate
    const workQueue = [...queue];

    for (let i = 0; i < workQueue.length; i++) {
      const item = workQueue[i];
      try {
        await syncItem(item);
        // remove item from actual queue state
        setQueue((prev) => prev.filter((q) => q._queuedAt !== item._queuedAt));
      } catch (err) {
        // stop on first failure to avoid hammering the server
        console.warn("Sync failed for item (will retry later):", err);
        break;
      }
    }

    setIsSyncing(false);
  }, [queue, isSyncing, syncItem]);

  // attempt to sync when the browser comes online
  useEffect(() => {
    const onOnline = () => {
      syncAll();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [syncAll]);

  // auto-sync on mount after loading queue
  useEffect(() => {
    // slight delay so app can settle
    const t = setTimeout(() => {
      syncAll();
    }, 600);
    return () => clearTimeout(t);
  }, [syncAll]);

  return {
    queue,
    isSyncing,
    addToQueue,
    clearQueue,
    syncAll,
  };
}