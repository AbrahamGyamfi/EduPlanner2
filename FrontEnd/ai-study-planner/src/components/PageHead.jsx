import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationBell } from './notifications';
import '../styles/themes.css';

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
    <div className="card">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold theme-text-primary">{pageTitle}</h1>
        
        <div className="flex items-center space-x-4">
          {/* Notification Bell Component */}
          <NotificationBell />
          
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate("/profile")}
          >
            <div className="bg-indigo-600 text-white h-8 w-8 rounded-full flex items-center justify-center font-medium shadow-sm group-hover:bg-indigo-700 transition-colors">
              {firstName ? firstName.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="hidden md:block">
              <span className="text-sm font-medium theme-text-secondary block">{firstName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
