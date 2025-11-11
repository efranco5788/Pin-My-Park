import React, { useEffect, useState } from "react";
import { db, auth } from "./firebaseConfig";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

const HistoryPage = () => {
  const [spots, setSpots] = useState([]);

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

        setSpots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="history-page">
      <h1>Your Parking History</h1>
      {spots.length === 0 ? (
        <p>No parking spots saved yet.</p>
      ) : (
        <ul>
          {spots.map(spot => (
            <li key={spot.id}>
                <p>{"Timestamp - "} {spot.timestamp?.toDate().toLocaleString()}</p>
                <p>📍 {spot.latitude}, {spot.longitude} — {" "}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HistoryPage;
