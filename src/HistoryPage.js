import React, { useEffect, useState } from "react";
import { db, auth } from "./firebaseConfig";
import {
  collection,
  getDocs,
  orderBy,
  query,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import "./HistoryPage.css";

const HistoryPage = () => {
  const [spots, setSpots] = useState([]);
  const [renameSpot, setRenameSpot] = useState(null); // { id, name }
  const [newName, setNewName] = useState("");

  // Fetch parking history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, "parkingHistory", user.uid, "spots"),
          orderBy("timestamp", "desc")
        );

        const snapshot = await getDocs(q);
        setSpots(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };

    fetchHistory();
  }, []);

  // Open user’s default map app
  const navigateToSpot = (lat, lng) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, "_blank");
  };

  // Delete a saved location
  const deleteSpot = async (spotId) => {
    const user = auth.currentUser;
    if (!user) return;

    if (!window.confirm("Delete this saved spot?")) return;

    try {
      await deleteDoc(doc(db, "parkingHistory", user.uid, "spots", spotId));
      setSpots((prev) => prev.filter((spot) => spot.id !== spotId));
    } catch (error) {
      console.error("Error deleting spot:", error);
    }
  };

  // Save new name to Firestore
  const saveNewName = async () => {
    if (!renameSpot || newName.trim().length === 0) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const spotRef = doc(
        db,
        "parkingHistory",
        user.uid,
        "spots",
        renameSpot.id
      );

      await updateDoc(spotRef, { name: newName.trim() });

      setSpots((prev) =>
        prev.map((spot) =>
          spot.id === renameSpot.id ? { ...spot, name: newName.trim() } : spot
        )
      );

      setRenameSpot(null);
      setNewName("");
    } catch (error) {
      console.error("Error renaming spot:", error);
    }
  };

  return (
    <div className="history-wrapper">
      <h1 className="history-title">Your Parking History</h1>

      {spots.length === 0 ? (
        <p className="no-history">No saved spots yet.</p>
      ) : (
        <div className="history-list">
          {spots.map((spot) => (
            <div key={spot.id} className="history-card">
              <p className="history-name">
                {spot.name ? `🚗 ${spot.name}` : "Unnamed Spot"}
              </p>

              <p className="history-time">
                {spot.timestamp?.toDate().toLocaleString()}
              </p>

              <p className="history-coords">
                📍 {spot.latitude}, {spot.longitude}
              </p>

              <div className="history-buttons">
                <button
                  className="navigate-btn"
                  onClick={() =>
                    navigateToSpot(spot.latitude, spot.longitude)
                  }
                >
                  Navigate
                </button>

                <button
                  className="rename-btn"
                  onClick={() => {
                    setRenameSpot(spot);
                    setNewName(spot.name || "");
                  }}
                >
                  Rename
                </button>

                <button
                  className="delete-btn"
                  onClick={() => deleteSpot(spot.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rename Modal */}
      {renameSpot && (
        <div className="rename-overlay">
          <div className="rename-modal">
            <h3>Rename Parking Spot</h3>

            <input
              autoFocus
              type="text"
              placeholder="New name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rename-input"
            />

            <div className="rename-modal-buttons">
              <button className="save-rename-btn" onClick={saveNewName}>
                Save
              </button>
              <button
                className="cancel-rename-btn"
                onClick={() => setRenameSpot(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
