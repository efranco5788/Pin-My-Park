import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribe();
  }, []);

  // Still checking auth state → show nothing momentarily
  if (user === undefined) return null;

  // Not logged in → redirect to login
  if (user === null) return <Navigate to="/login" replace />;

  // Logged in → allow the page to render
  return children;
}
