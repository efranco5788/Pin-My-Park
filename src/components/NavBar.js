import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { FaBars } from "react-icons/fa";
import "../NavBar.css";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  // Listen for login state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  const closeDrawer = () => setDrawerOpen(false);

  const handleLogout = async () => {
    await signOut(auth);
    closeDrawer();

    // Ensure clean redirect
    setTimeout(() => {
      navigate("/login", { replace: true });
      window.history.forward();
    }, 200);
  };

  return (
    <>
      {/* Top navbar bar */}
      <nav className="navbar-mobile">
        <div className="navbar-title">
          <Link to="/" onClick={closeDrawer}>
            Pin My Park
          </Link>
        </div>

        <button className="navbar-icon" onClick={toggleDrawer}>
          <FaBars size={22} />
        </button>
      </nav>

      {/* Slide-in drawer */}
      <div className={`drawer-overlay ${drawerOpen ? "open" : ""}`} onClick={closeDrawer}></div>

      <aside className={`drawer ${drawerOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <h3>Menu</h3>
          {user && <p className="drawer-email">{user.email}</p>}
        </div>

        <ul className="drawer-menu">
          <li>
            <Link to="/" onClick={closeDrawer}>Home</Link>
          </li>
          <li>
                <Link to="/parking" onClick={closeDrawer}>Parking</Link>
          </li>

          {user && (
            <>
              <li>
                <Link to="/profile" onClick={closeDrawer}>Profile</Link>
              </li>
              <li>
                <Link to="/history" onClick={closeDrawer}>Parking History</Link>
              </li>
            </>
          )}

          {!user ? (
            <li>
              <Link to="/login" onClick={closeDrawer}>Login</Link>
            </li>
          ) : (
            <li>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </li>
          )}
        </ul>
      </aside>
    </>
  );
};

export default Navbar;
