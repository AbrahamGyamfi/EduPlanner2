import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Dashboard from "./Pages/Dashboard";
import CoursesPage from "./Pages/CoursesPage";
import Profile from "./Pages/Profile";
import Settings from "./Pages/Settings";
import CourseDetails from "./Pages/CourseDetails";
import CWAAnalysisPage from "./Pages/CWAAnalysisPage";
import Assignments from "./Pages/Assignments";
import Schedule from "./Pages/Schedule";
import Sidebar from "./components/sidebar";

// Import styles
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check localStorage for authentication state on app load
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const handleLogin = () => setIsAuthenticated(true);
  const handleSignup = () => setIsAuthenticated(true);

  return (
    <Router>
      <div className="app-container flex">
        {isAuthenticated && <Sidebar />}
        <div className="flex-1">
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup onSignup={handleSignup} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/courses" element={isAuthenticated ? <CoursesPage /> : <Navigate to="/login" />} />
            <Route path="/assignments" element={isAuthenticated ? <Assignments /> : <Navigate to="/login" />} />
            <Route path="/schedule" element={isAuthenticated ? <Schedule /> : <Navigate to="/login" />} />
            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} />
            <Route path="/coursedetails/:courseId" element={isAuthenticated ? <CourseDetails /> : <Navigate to="/login" />} />
            <Route path="/course/:courseName" element={isAuthenticated ? <CourseDetails /> : <Navigate to="/login" />} />
            <Route path="/cwa-analysis" element={isAuthenticated ? <CWAAnalysisPage /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} /> {/* Catch all route */}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
