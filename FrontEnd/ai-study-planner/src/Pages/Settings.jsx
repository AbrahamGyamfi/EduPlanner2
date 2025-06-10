import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar";
// import PageHeader from "../components/PageHeader";
import Switch from "../components/Switch";
import { IoIosArrowDown } from "react-icons/io";
import Navbar from '../components/PageHead';

const Settings = () => {
  const navigate = useNavigate();
  // const [userInfo, setUserInfo] = useState({
  //   firstName: localStorage.getItem("firstname") || "",
  //   lastName: localStorage.getItem("lastname") || "",
  //   email: localStorage.getItem("email") || "",
  ;
  
  // Settings states
  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState("medium");
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoplayVideos, setAutoplayVideos] = useState(false);
  const [language, setLanguage] = useState("English");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showEraseModal, setShowEraseModal] = useState(false);
  
  // Apply theme changes
  useEffect(() => {
    document.body.className = theme === "dark" ? "dark-theme" : "";
    localStorage.setItem("theme", theme);
  }, [theme]);
  
  // Apply font size changes
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);
  
  // Load saved preferences on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const savedFontSize = localStorage.getItem("fontSize");
    const savedPushNotifications = localStorage.getItem("pushNotifications");
    const savedEmailNotifications = localStorage.getItem("emailNotifications");
    const savedAutoplayVideos = localStorage.getItem("autoplayVideos");
    const savedLanguage = localStorage.getItem("language");
    
    if (savedTheme) setTheme(savedTheme);
    if (savedFontSize) setFontSize(savedFontSize);
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
    <div className="flex min-h-screen bg-[#f7f9fc]">
      <Sidebar activePage="settings" />
      <div className="flex-1 p-8">
        {/* Navbar */}
        <div className="mb-8">
          <Navbar pageTitle="Settings" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h2 className="text-xl font-medium text-gray-700 mb-1">Settings</h2>
          <p className="text-sm text-gray-500 mb-8">Manage your account and application preferences.</p>
          
          {/* Appearance Section */}
          <section className="mb-8">
            <h3 className="text-base font-medium text-gray-600 mb-4">Appearance</h3>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              {/* Theme Selection */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Theme</h4>
                    <p className="text-xs text-gray-500">Change the appearance of EduPlanner</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setTheme("light")}
                      className={`px-4 py-2 text-sm rounded-full ${
                        theme === "light" 
                          ? "bg-indigo-600 text-white" 
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Light
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`px-4 py-2 text-sm rounded-full ${
                        theme === "dark" 
                          ? "bg-indigo-600 text-white" 
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Dark
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Font Size */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Font Size</h4>
                    <p className="text-xs text-gray-500">Adjust the text size</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setFontSize("small")}
                      className={`px-4 py-2 text-sm rounded-full ${
                        fontSize === "small" 
                          ? "bg-indigo-600 text-white" 
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Small
                    </button>
                    <button
                      onClick={() => setFontSize("medium")}
                      className={`px-4 py-2 text-sm rounded-full ${
                        fontSize === "medium" 
                          ? "bg-indigo-600 text-white" 
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => setFontSize("large")}
                      className={`px-4 py-2 text-sm rounded-full ${
                        fontSize === "large" 
                          ? "bg-indigo-600 text-white" 
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
            <h3 className="text-base font-medium text-gray-600 mb-4">Notifications</h3>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              {/* Push Notifications */}
              <div className="flex justify-between items-center py-4 border-b border-gray-100">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Push Notifications</h4>
                  <p className="text-xs text-gray-500">Receive notifications about your courses and assignments</p>
                </div>
                <Switch 
                  enabled={pushNotifications} 
                  setEnabled={(value) => handleNotificationChange('push', value)} 
                />
              </div>
              
              {/* Email Notifications */}
              <div className="flex justify-between items-center py-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Email Notifications</h4>
                  <p className="text-xs text-gray-500">Receive email updates about your progress</p>
                </div>
                <Switch 
                  enabled={emailNotifications} 
                  setEnabled={(value) => handleNotificationChange('email', value)} 
                />
              </div>
            </div>
          </section>
          
          {/* Content Section */}
          <section className="mb-8">
            <h3 className="text-base font-medium text-gray-600 mb-4">Content</h3>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              {/* Autoplay Videos */}
              <div className="flex justify-between items-center py-4 border-b border-gray-100">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Autoplay Videos</h4>
                  <p className="text-xs text-gray-500">Automatically play tutorial videos</p>
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
                    <h4 className="text-sm font-medium text-gray-700">Language</h4>
                    <p className="text-xs text-gray-500">Change interface language</p>
                  </div>
                  <div className="relative">
                    <button
                      className="flex items-center justify-between w-32 px-3 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200"
                      onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    >
                      <span>{language}</span>
                      <IoIosArrowDown className={`transform ${showLanguageDropdown ? 'rotate-180' : ''} transition-transform`} />
                    </button>
                    
                    {showLanguageDropdown && (
                      <div className="absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white z-10">
                        <div className="py-1">
                          <button
                            className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                            onClick={() => changeLanguage("English")}
                          >
                            English
                          </button>
                          <button
                            className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                            onClick={() => changeLanguage("Español")}
                          >
                            Español
                          </button>
                          <button
                            className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
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
            <h3 className="text-base font-medium text-gray-600 mb-4">Account</h3>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              {/* Sign Out */}
              <div className="flex justify-between items-center py-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Sign Out</h4>
                  <p className="text-xs text-gray-500">Sign out from your EduPlanner account</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </section>
          
          {/* Learning Preferences Section */}
          <section className="mb-8">
            <h3 className="text-base font-medium text-gray-600 mb-4">Learning Preferences</h3>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              {/* Update Learning Preferences */}
              <div className="flex justify-between items-center py-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Update Learning Preferences</h4>
                  <p className="text-xs text-gray-500">Change your subjects, learning style, and other educational preferences</p>
                </div>
                <button
                  onClick={handleUpdateLearningPreferences}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Update Preferences
                </button>
              </div>
            </div>
          </section>
          
          {/* Danger Zone Section */}
          <section>
            <h3 className="text-base font-medium text-red-500 mb-4">Danger Zone</h3>
            <p className="text-xs text-gray-500 mb-3">These actions are irreversible. Please proceed with caution.</p>
            <div className="bg-white rounded-lg shadow border border-red-100">
              {/* Erase Chat History */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Erase All Chat History</h4>
                  <p className="text-xs text-gray-500">Permanently delete all your chat messages and conversations</p>
                </div>
                <button
                  onClick={() => setShowEraseModal(true)}
                  className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Erase Chats
                </button>
              </div>
              
              {/* Delete Account */}
              <div className="flex justify-between items-center p-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Delete Account</h4>
                  <p className="text-xs text-gray-500">Permanently delete your account and all associated data</p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center text-red-500 mb-4">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Delete Your Account</h3>
            <p className="text-gray-600 text-center mb-6">
              This action cannot be undone. This will permanently delete your account and remove all associated data.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please type "DELETE" to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Erase Chat History</h3>
            <p className="text-gray-600 mb-6">
              This will permanently erase all your chat messages and conversations. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEraseModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleEraseChatHistory}
                className="px-4 py-2 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600"
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
