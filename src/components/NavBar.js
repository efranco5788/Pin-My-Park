import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaBars } from "react-icons/fa"; // Import the hamburger icon

import "../globalColor.css"
import "../NavBar.css"; // Import your CSS file for styling

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

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


   return (
    <nav className="bg-custom-gradient relative w-full fixed top-0 z-50 bg-gradient-to-r from-gray-900 to-gray-700 h-12 shadow-md px-4"
    style={{ }}
>

  <div>
    
      <div className="w-full flex items-center justify-between h-full"
      style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>

        <div className="flex-1 navbarItem" />
        <div className="navbarItem">
          <h1 className="text-white text-sm font-bold text-center">Pin My Park</h1>
        </div>
        <div className="flex-1 flex justify-end navbarItem">
          <button
            ref={buttonRef}
            onClick={toggleMenu}
            className="text-white p-2 flex items-center"
            style={{ background: "transparent", border: "none", outline: "none" }}
          >
            <FaBars className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div 
        ref={menuRef}
        style={dropdownStyle} 
        className="menuDiv bg-custom-gradient min-w-[150px] bg-gray-800 rounded-lg shadow-lg z-50">
          <ul className="flex flex-col items-start p-2 space-y-2">
            <li>
              <Link to="/" onClick={() => {
                setIsOpen(false)}} 
                className="text-white text-base block px-4 py-3 hover:bg-gray-700 rounded">
                Home
              </Link>
            </li>
            <li>
              <Link to="/login" onClick={() => {
                setIsOpen(false); // closes the menu
                }}
                className="text-white text-base block px-4 py-3 hover:bg-gray-700 rounded">
                  Login
                  </Link>
            </li>
          </ul>
        </div>
      )}

      </div>
      
    </nav>
  );
};

export default Navbar;