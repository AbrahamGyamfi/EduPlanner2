import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Dashboard from "./Pages/Dashboard";
import CoursesPage from "./Pages/CoursesPage";
import Schedule from "./Pages/Schedule";
import Profile from "./Pages/Profile";
import Settings from "./Pages/Settings";
import CourseDetails from "./Pages/CourseDetails";
import CWAAnalysisPage from "./Pages/CWAAnalysisPage";
import Assignments from "./Pages/Assignments";

// Import styles
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Temporarily set to true for testing
  const [tasks, setTasks] = useState([]);

  const handleLogin = () => setIsAuthenticated(true);
  const handleSignup = () => setIsAuthenticated(true);

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<Signup onSignup={handleSignup} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard tasks={tasks} /> : <Navigate to="/login" />} />
          <Route path="/courses" element={isAuthenticated ? <CoursesPage /> : <Navigate to="/login" />} />
          <Route path="/assignments" element={isAuthenticated ? <Assignments /> : <Navigate to="/login" />} />
          <Route path="/schedule" element={isAuthenticated ? <Schedule tasks={tasks} setTasks={setTasks} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} />
          <Route path="/coursedetails/:courseId" element={isAuthenticated ? <CourseDetails /> : <Navigate to="/login" />} />
          <Route path="/course/:courseName" element={isAuthenticated ? <CourseDetails /> : <Navigate to="/login" />} />
          <Route path="/cwa-analysis" element={isAuthenticated ? <CWAAnalysisPage /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} /> {/* Catch all route */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
