import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/themes.css';

const Navbar = ({ pageTitle }) => {
  const [firstName, setFirstName] = useState("");
  const [notificationCount, setNotificationCount] = useState(2);
  const navigate = useNavigate();

  useEffect(() => {
    const storedName = localStorage.getItem("firstname");
    if (storedName) {
      setFirstName(storedName);
    }
    
    // Load notification count from localStorage or API
    const savedNotificationCount = localStorage.getItem('notificationCount');
    if (savedNotificationCount) {
      setNotificationCount(parseInt(savedNotificationCount));
    }
  }, []);

  const handleNotificationClick = () => {
    // Show notification dropdown or navigate to notifications page
    toast.success(`You have ${notificationCount} new notifications!`);
    
    // Optional: Reset notification count when clicked
    setNotificationCount(0);
    localStorage.setItem('notificationCount', '0');
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold theme-text-primary">{pageTitle}</h1>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              className="h-8 w-8 flex items-center justify-center theme-text-muted hover:theme-text-secondary transition-colors"
              onClick={handleNotificationClick}
              title="View notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </div>
          
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
