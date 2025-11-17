import React, { useEffect, memo } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

import Navbar from "./components/NavBar";
import LoginPage from "./LoginPage";
import HomePage from "./HomePage";
import HistoryPage from "./HistoryPage";
import ProfilePage from "./ProfilePage";
import ParkingPage from "./ParkingLocationPage";
import NotSupportedPage from "./NotSupportedPage";
import ProtectedRoute from "./components/ProtectedRoute";

import "./globalColor.css";

function CheckDevice() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile/i.test(
      navigator.userAgent
    );

    if (!isMobile && location.pathname !== "/not-supported") {
      navigate("/not-supported", { replace: true });
    }
  }, [navigate, location.pathname]);

  return null;
}

const MemoizedCheckDevice = memo(CheckDevice);

function App() {
  const location = useLocation();

  const hideNavbar =
    location.pathname === "/login" ||
    location.pathname === "/not-supported";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <MemoizedCheckDevice />

      <div style={{ paddingTop: hideNavbar ? "0px" : "60px" }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/parking" element={<ParkingPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route path="/not-supported" element={<NotSupportedPage />} />
        </Routes>
      </div>
    </>
  );
}

export default App;