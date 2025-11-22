import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { auth } from "../firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import "../globalColor.css";
import "../NavBar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  /** ------------------------------
   *  Detect user login state
   * ------------------------------- */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  /** ------------------------------
   *  Toggle dropdown menu
   * ------------------------------- */
  const toggleMenu = () => setIsOpen(!isOpen);

  /** ------------------------------
   *  Close menu when clicking outside
   * ------------------------------- */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  /** ------------------------------
   *  Logout with clean redirect flow
   * ------------------------------- */
  const handleLogout = async () => {
    try {
      await signOut(auth);

      setIsOpen(false);

      // Delay to allow Firebase to update state
      setTimeout(() => {
        navigate("/login", { replace: true });

        // Prevent returning to protected pages
        setTimeout(() => {
          window.history.forward();
        }, 0);
      }, 200);
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  return (
    <nav className="navbar-container">
      <div className="navbar-inner">
        {/* App Logo / Title */}
        <div className="navbar-title">
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            Pin My Park
          </Link>
        </div>

        {/* Hamburger Menu */}
        <button
          ref={buttonRef}
          onClick={toggleMenu}
          className="text-white p-2 flex items-center"
          style={{ background: "transparent", border: "none" }}
        >
          <FaBars className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div ref={menuRef} className="navbar-menu open" role="menu">
          <ul>
            <li>
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="navbar-link"
              >
                Home
              </Link>
            </li>

            {user && (
              <li>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="navbar-link"
                >
                  Profile
                </Link>
              </li>
            )}

            {user && (
              <li>
                <Link
                  to="/history"
                  onClick={() => setIsOpen(false)}
                  className="navbar-link"
                >
                  Parking History
                </Link>
              </li>
            )}

            {user ? (
              <li>
                <Link
                  onClick={handleLogout}
                  className="navbar-link"
                >
                  Logout
                </Link>
              </li>
            ) : (
              <li>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="navbar-link"
                >
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;