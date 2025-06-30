import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from 'lucide-react';

const Navbar = ({ pageTitle }) => {
  const [firstName, setFirstName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedName = localStorage.getItem("firstname");
    if (storedName) {
      setFirstName(storedName);
    }
  }, []);

  return (
    <div className="bg-white shadow-md rounded-lg px-6 py-3">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">{pageTitle}</h1>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center">
              2
            </span>
          </div>
          
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate("/profile")}
          >
            <div className="bg-indigo-600 text-white h-8 w-8 rounded-full flex items-center justify-center font-medium shadow-sm group-hover:bg-indigo-700 transition-colors">
              {firstName ? firstName.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="hidden md:block">
              <span className="text-sm font-medium text-gray-700 block">{firstName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
