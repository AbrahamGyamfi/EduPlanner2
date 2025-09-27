import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Switch from "../components/Switch";
import Navbar from '../components/PageHead';
import NotificationSettings from '../components/NotificationSettings';
import { IoIosArrowDown } from "react-icons/io";
import { useTheme } from '../contexts/ThemeContext';
import '../styles/themes.css';

const Settings = () => {
  const navigate = useNavigate();
  
  // Use the theme context
  const { 
    theme, 
    fontSize, 
    changeTheme, 
    changeFontSize, 
    themes, 
    fontSizes,
    isDark 
  } = useTheme();
  
  // Other settings states
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoplayVideos, setAutoplayVideos] = useState(false);
  const [language, setLanguage] = useState("English");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showEraseModal, setShowEraseModal] = useState(false);
  
  // Load saved preferences on mount
  useEffect(() => {
    const savedPushNotifications = localStorage.getItem("pushNotifications");
    const savedEmailNotifications = localStorage.getItem("emailNotifications");
    const savedAutoplayVideos = localStorage.getItem("autoplayVideos");
    const savedLanguage = localStorage.getItem("language");
    
    if (savedPushNotifications !== null) setPushNotifications(savedPushNotifications === "true");
    if (savedEmailNotifications !== null) setEmailNotifications(savedEmailNotifications === "true");
    if (savedAutoplayVideos !== null) setAutoplayVideos(savedAutoplayVideos === "true");
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);
  
  // Save notification preferences
  const handleNotificationChange = (type, value) => {
    if (type === 'push') {
      setPushNotifications(value);
      localStorage.setItem("pushNotifications", value);
    } else if (type === 'email') {
      setEmailNotifications(value);
      localStorage.setItem("emailNotifications", value);
    }
  };
  
  // Handle autoplay preference
  const handleAutoplayChange = (value) => {
    setAutoplayVideos(value);
    localStorage.setItem("autoplayVideos", value);
  };
  
  // Handle language change
  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    setShowLanguageDropdown(false);
  };
  
  // Handle sign out
  const handleSignOut = () => {
    localStorage.removeItem("isLoggedIn");
    // Clear other user-related data but preserve preferences
    localStorage.removeItem("firstname");
    localStorage.removeItem("lastname");
    localStorage.removeItem("email");
    localStorage.removeItem("token");
    navigate("/login");
  };
  
  // Handle erase chat history
  const handleEraseChatHistory = () => {
    localStorage.removeItem("chatHistory");
    setShowEraseModal(false);
    // Show success message
    alert("Chat history has been successfully erased.");
  };
  
  // Handle account deletion
  const handleDeleteAccount = () => {
    if (deleteConfirmText !== "DELETE") {
      alert("Please type DELETE to confirm account deletion.");
      return;
    }
    
    // Clear ALL localStorage data
    localStorage.clear();
    setShowDeleteModal(false);
    navigate("/login");
  };
  
  // Handle learning preferences update
  const handleUpdateLearningPreferences = () => {
    navigate("/learning-preferences");
  };
  
  return (
    <div className="flex min-h-screen theme-bg-secondary">
      {/* <Sidebar activePage="settings" /> */}
      <div className="flex-1 p-8">
        {/* Navbar */}
        <div className="mb-8">
          <Navbar pageTitle="Settings" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h2 className="text-xl font-medium theme-text-primary mb-1">Settings</h2>
          <p className="text-sm theme-text-muted mb-8">Manage your account and application preferences.</p>
          
          {/* Appearance Section */}
          <section className="mb-8">
            <h3 className="section-header">Appearance</h3>
            <div className="card">
              {/* Theme Selection */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="card-title">Theme</h4>
                    <p className="card-subtitle">Change the appearance of EduPlanner</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => changeTheme("light")}
                      className={`btn ${
                        theme === "light" 
                          ? "btn-primary" 
                          : "btn-secondary"
                      }`}
                    >
                      Light
                    </button>
                    <button
                      onClick={() => changeTheme("dark")}
                      className={`btn ${
                        theme === "dark" 
                          ? "btn-primary" 
                          : "btn-secondary"
                      }`}
                    >
                      Dark
                    </button>
                    <button
                      onClick={() => changeTheme("system")}
                      className={`btn ${
                        theme === "system" 
                          ? "btn-primary" 
                          : "btn-secondary"
                      }`}
                    >
                      System
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Font Size */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="card-title">Font Size</h4>
                    <p className="card-subtitle">Adjust the text size</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => changeFontSize("small")}
                      className={`btn ${
                        fontSize === "small" 
                          ? "btn-primary" 
                          : "btn-secondary"
                      }`}
                    >
                      Small
                    </button>
                    <button
                      onClick={() => changeFontSize("medium")}
                      className={`btn ${
                        fontSize === "medium" 
                          ? "btn-primary" 
                          : "btn-secondary"
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => changeFontSize("large")}
                      className={`btn ${
                        fontSize === "large" 
                          ? "btn-primary" 
                          : "btn-secondary"
                      }`}
                    >
                      Large
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Notifications Section */}
          <section className="mb-8">
            <h3 className="section-header">Notifications</h3>
            <div className="card">
              {/* Push Notifications */}
              <div className="flex justify-between items-center py-4 border-b theme-border">
                <div>
                  <h4 className="card-title">Push Notifications</h4>
                  <p className="card-subtitle">Receive notifications about your courses and assignments</p>
                </div>
                <Switch 
                  enabled={pushNotifications} 
                  setEnabled={(value) => handleNotificationChange('push', value)} 
                />
              </div>
              
              {/* Email Notifications */}
              <div className="flex justify-between items-center py-4">
                <div>
                  <h4 className="card-title">Email Notifications</h4>
                  <p className="card-subtitle">Receive email updates about your progress</p>
                </div>
                <Switch 
                  enabled={emailNotifications} 
                  setEnabled={(value) => handleNotificationChange('email', value)} 
                />
              </div>
            </div>
            
            {/* Advanced Notification Settings */}
            <NotificationSettings userId={localStorage.getItem('userId') || 'default-user'} />
          </section>
          
          {/* Content Section */}
          <section className="mb-8">
            <h3 className="section-header">Content</h3>
            <div className="card">
              {/* Autoplay Videos */}
              <div className="flex justify-between items-center py-4 border-b theme-border">
                <div>
                  <h4 className="card-title">Autoplay Videos</h4>
                  <p className="card-subtitle">Automatically play tutorial videos</p>
                </div>
                <Switch 
                  enabled={autoplayVideos} 
                  setEnabled={handleAutoplayChange} 
                />
              </div>
              
              {/* Language Selection */}
              <div className="py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="card-title">Language</h4>
                    <p className="card-subtitle">Change interface language</p>
                  </div>
                  <div className="relative">
                    <button
                      className="btn btn-secondary w-32 justify-between"
                      onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    >
                      <span>{language}</span>
                      <IoIosArrowDown className={`transform ${showLanguageDropdown ? 'rotate-180' : ''} transition-transform`} />
                    </button>
                    
                    {showLanguageDropdown && (
                      <div className="absolute right-0 mt-2 w-32 rounded-md shadow-lg theme-bg-primary theme-border border z-10">
                        <div className="py-1">
                          <button
                            className="block w-full px-4 py-2 text-sm text-left theme-text-primary hover:theme-bg-tertiary transition-colors"
                            onClick={() => changeLanguage("English")}
                          >
                            English
                          </button>
                          <button
                            className="block w-full px-4 py-2 text-sm text-left theme-text-primary hover:theme-bg-tertiary transition-colors"
                            onClick={() => changeLanguage("Español")}
                          >
                            Español
                          </button>
                          <button
                            className="block w-full px-4 py-2 text-sm text-left theme-text-primary hover:theme-bg-tertiary transition-colors"
                            onClick={() => changeLanguage("Français")}
                          >
                            Français
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Account Section */}
          <section className="mb-8">
            <h3 className="section-header">Account</h3>
            <div className="card">
              {/* Sign Out */}
              <div className="flex justify-between items-center py-4">
                <div>
                  <h4 className="card-title">Sign Out</h4>
                  <p className="card-subtitle">Sign out from your EduPlanner account</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="btn btn-secondary"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </section>
          
          {/* Learning Preferences Section */}
          <section className="mb-8">
            <h3 className="section-header">Learning Preferences</h3>
            <div className="card">
              {/* Update Learning Preferences */}
              <div className="flex justify-between items-center py-4">
                <div>
                  <h4 className="card-title">Update Learning Preferences</h4>
                  <p className="card-subtitle">Change your subjects, learning style, and other educational preferences</p>
                </div>
                <button
                  onClick={handleUpdateLearningPreferences}
                  className="btn btn-primary"
                >
                  Update Preferences
                </button>
              </div>
            </div>
          </section>
          
          {/* Danger Zone Section */}
          <section>
            <h3 className="section-header text-red-500 dark:text-red-400">Danger Zone</h3>
            <p className="text-xs theme-text-muted mb-3">These actions are irreversible. Please proceed with caution.</p>
            <div className="card border-2 border-red-200 dark:border-red-900">
              {/* Erase Chat History */}
              <div className="flex justify-between items-center p-6 border-b theme-border">
                <div>
                  <h4 className="card-title">Erase All Chat History</h4>
                  <p className="card-subtitle">Permanently delete all your chat messages and conversations</p>
                </div>
                <button
                  onClick={() => setShowEraseModal(true)}
                  className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Erase Chats
                </button>
              </div>
              
              {/* Delete Account */}
              <div className="flex justify-between items-center p-6">
                <div>
                  <h4 className="card-title">Delete Account</h4>
                  <p className="card-subtitle">Permanently delete your account and all associated data</p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
      
      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-center text-red-500 mb-4">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center theme-text-primary mb-2">Delete Your Account</h3>
            <p className="theme-text-secondary text-center mb-6">
              This action cannot be undone. This will permanently delete your account and remove all associated data.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium theme-text-primary mb-2">
                Please type "DELETE" to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 theme-border border rounded-md theme-bg-secondary theme-text-primary focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Erase Chat History Modal */}
      {showEraseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h3 className="text-xl font-bold theme-text-primary mb-4">Erase Chat History</h3>
            <p className="theme-text-secondary mb-6">
              This will permanently erase all your chat messages and conversations. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEraseModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleEraseChatHistory}
                className="px-4 py-2 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
              >
                Erase Chats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
