import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPassword from "./Pages/ResetPassword";
import Dashboard from "./Pages/Dashboard";
import CoursesPage from "./Pages/CoursesPage";
import Profile from "./Pages/Profile";
import Settings from "./Pages/Settings";
import CourseDetails from "./Pages/CourseDetails";
import CWAAnalysisPage from "./Pages/CWAAnalysisPage";
import Assignments from "./Pages/Assignments";
import Schedule from "./Pages/Schedule";
import SummaryPage from "./Pages/SummaryPage";
import QuizPage from "./Pages/QuizPage";
import InteractiveKnowledgeCheck from "./Pages/InteractiveKnowledgeCheck";
import Sidebar from "./components/sidebar";
import { ThemeProvider } from "./contexts/ThemeContext";
import LoadingTransition from "./components/LoadingTransition";
import { NavigationLoadingProvider, useNavigationLoading } from "./contexts/NavigationLoadingContext";

// Import styles
import './App.css';

const AppContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check localStorage for authentication state on app load
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const { isLoading, loadingMessage, loadingSubMessage } = useNavigationLoading();

  // Simulate checking authentication status on app startup
  React.useEffect(() => {
    const checkAuthStatus = () => {
      // Add a small delay to simulate auth check (optional)
      setTimeout(() => {
        const authStatus = localStorage.getItem('isAuthenticated') === 'true';
        setIsAuthenticated(authStatus);
        setIsCheckingAuth(false);
      }, 500);
    };
    
    checkAuthStatus();
  }, []);

  const handleLogin = () => setIsAuthenticated(true);
  const handleSignup = () => setIsAuthenticated(true);
  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('firstname');
    localStorage.removeItem('lastname');
    localStorage.removeItem('email');
    setIsAuthenticated(false);
  };

  // Listen for storage changes (useful for logout from other tabs)
  React.useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'isAuthenticated') {
        setIsAuthenticated(e.newValue === 'true');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">📚 EduPlanner</h1>
          <p className="text-gray-600">Loading your study dashboard...</p>
        </div>
      </div>
    );
  }

  // Hide sidebar on login and signup pages
  const hideSidebarRoutes = ["/login", "/signup"]; 
  const currentPath = window.location.pathname;
  const showSidebar = isAuthenticated && !hideSidebarRoutes.includes(currentPath);

  return (
    <div className="app-container flex">
      {showSidebar && <Sidebar onLogout={handleLogout} />}
      <div className="flex-1">
        <Routes>
          {/* Default route - always redirect to login if not authenticated */}
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          } />
          
          {/* Authentication routes - accessible to everyone */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/signup" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup onSignup={handleSignup} />
          } />
          <Route path="/forgot-password" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPassword />
          } />
          <Route path="/reset-password" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPassword />
          } />
          
          {/* Protected routes - require authentication */}
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/courses" element={isAuthenticated ? <CoursesPage /> : <Navigate to="/login" replace />} />
          <Route path="/assignments" element={isAuthenticated ? <Assignments /> : <Navigate to="/login" replace />} />
          <Route path="/knowledge-check" element={isAuthenticated ? <InteractiveKnowledgeCheck /> : <Navigate to="/login" replace />} />
          <Route path="/schedule" element={isAuthenticated ? <Schedule /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />} />
          <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" replace />} />
          <Route path="/coursedetails/:courseId" element={isAuthenticated ? <CourseDetails /> : <Navigate to="/login" replace />} />
          <Route path="/course/:courseName" element={isAuthenticated ? <CourseDetails /> : <Navigate to="/login" replace />} />
          <Route path="/cwa-analysis" element={isAuthenticated ? <CWAAnalysisPage /> : <Navigate to="/login" replace />} />
          <Route path="/performance-analysis" element={isAuthenticated ? <CWAAnalysisPage /> : <Navigate to="/login" replace />} />
          <Route path="/summary" element={isAuthenticated ? <SummaryPage /> : <Navigate to="/login" replace />} />
          <Route path="/quiz" element={isAuthenticated ? <QuizPage /> : <Navigate to="/login" replace />} />
          
          {/* Catch all route - redirect to login if not authenticated, dashboard if authenticated */}
          <Route path="*" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          } />
        </Routes>
      </div>
      {/* Global Loading Transition */}
      <LoadingTransition 
        isOpen={isLoading} 
        message={loadingMessage} 
        subMessage={loadingSubMessage} 
      />
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <NavigationLoadingProvider>
          <AppContent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#f87171',
                  secondary: '#fff',
                },
              },
            }}
          />
        </NavigationLoadingProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
