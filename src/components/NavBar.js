import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { auth } from "../firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import "../globalColor.css";
import "../NavBar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [user, setUser] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Detect user login state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Toggle menu visibility
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Adjust dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "absolute",
        top: `${rect.bottom + 8}px`,
        right: "3%",
      });
    }
  }, [isOpen]);

  // Close menu when clicking outside
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

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  return (
    <nav className="navbar-container">
      <div className="navbar-inner">
        {/* Left: App title / logo */}
        <div className="navbar-title">
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            Pin My Park
          </Link>
        </div>

        {/* Right: Hamburger menu */}
        <button
          ref={buttonRef}
          onClick={toggleMenu}
          className="text-white p-2 flex items-center"
          style={{ background: "transparent", border: "none", outline: "none" }}
        >
          <FaBars className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className={`navbar-menu ${isOpen ? "open" : ""}`}
          role="menu"
          aria-expanded={isOpen}
        >
          <ul>
            <li>
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="text-white text-base block px-4 py-2 hover:bg-gray-700 rounded"
              >
                Home
              </Link>
            </li>

            {user && (
              <li>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="text-white text-base block px-4 py-2 hover:bg-gray-700 rounded"
                >
                  Profile
                </Link>
              </li>
            )}

            {user ? (
              <li>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="text-white text-base block px-4 py-2 hover:bg-gray-700 rounded w-full text-left"
                >
                  Logout
                </button>
              </li>
            ) : (
              <li>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-white text-base block px-4 py-2 hover:bg-gray-700 rounded"
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
