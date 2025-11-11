import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./components/NavBar";
import LoginPage from "./LoginPage";
import HomePage from "./HomePage";
import ProfilePage from "./ProfilePage";
import ParkingPage from "./ParkingLocationPage";
import NotSupportedPage from "./NotSupportedPage";

import "./globalColor.css"; // Import global styles

function CheckDevice() {
  const navigate = useNavigate();

  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (!isMobile && window.location.pathname !== "/not-supported") {
      navigate("/not-supported", { replace: true });
    }
  }, [navigate]);

  return null;
}

function App() {
  return (
    <>
    <Navbar />
    <CheckDevice />
    <div style={{ paddingTop: "60px" }}>
      <div className="pt-12"> {/* Push content below fixed navbar */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/parking" element={<ParkingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/not-supported" element={<NotSupportedPage />} />
        </Routes>
      </div>
    </div>
    </>
  );
}

export default App;