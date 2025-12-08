import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./logo.png";

const Navbar = ({ onLogout, currentUser }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center">
        
        {/* Logo Section - aligned with sidebar */}
        <div className="w-64 flex items-center gap-3 px-4 py-3 border-r border-gray-200">
          <img
            src={logo}
            alt="AgriVision AI"
            className="h-10 w-auto"
          />
          <span className="text-xl font-semibold text-gray-900">
            AgriVision AI
          </span>
        </div>

        {/* Right section with profile */}
        <div className="flex-1 flex items-center justify-end px-4 py-3">
          <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="
              flex items-center gap-3 px-4 py-2
              bg-white-100 text-black-700
              hover:bg-green-50
              rounded-full shadow-sm
              border border-green-200
              transition-all duration-200
            "
          >
            {/* Avatar */}
            <img
              src={
                currentUser?.photoURL ||
                `https://ui-avatars.com/api/?background=4ade80&color=fff&name=${
                  currentUser?.displayName || currentUser?.email
                }`
              }
              alt="profile"
              className="w-8 h-8 rounded-full object-cover border border-white"
            />

            {/* Name */}
            <span className="text-sm font-medium hidden sm:block">
              {currentUser?.displayName || currentUser?.email}
            </span>

            {/* Icon */}
            <svg
              className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg border border-gray-200 rounded-lg py-2 animate-fadeIn">
              <button
                onClick={() => {
                  navigate("/profile");
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Profile
              </button>

              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
