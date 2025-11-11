import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import "../NavBar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Toggle dropdown menu
  const toggleMenu = () => setIsOpen((prev) => !prev);

  // Close when clicking outside
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

  return (
    <nav className="navbar-container">
      <div className="navbar-inner">
        {/* Left: App title / logo */}
        <div className="navbar-title">
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            🚗 Pin My Park
          </Link>
        </div>

        {/* Right: Hamburger menu */}
        <button
          ref={buttonRef}
          onClick={toggleMenu}
          className="navbar-toggle"
          aria-label="Toggle navigation menu"
        >
          <FaBars className="navbar-icon" />
        </button>

        {/* Dropdown menu */}
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
                role="menuitem"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                Login
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                About
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
