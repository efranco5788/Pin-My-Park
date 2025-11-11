// src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import "../globalColor.css";
import "../NavBar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const toggleMenu = () => setIsOpen((prev) => !prev);

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
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <nav className="navbar-container">
      <div className="navbar-inner">
        <div className="flex-1" />
        <h1 className="navbar-title">Pin My Park</h1>
        <button
          ref={buttonRef}
          onClick={toggleMenu}
          aria-expanded={isOpen}
          aria-controls="navbar-menu"
          className="navbar-toggle"
        >
          <FaBars className="navbar-icon" />
        </button>
      </div>

      <div
        id="navbar-menu"
        ref={menuRef}
        className={`navbar-menu ${isOpen ? "open" : ""}`}
      >
        <ul>
          <li>
            <Link to="/" onClick={() => setIsOpen(false)}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/login" onClick={() => setIsOpen(false)}>
              Login
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
