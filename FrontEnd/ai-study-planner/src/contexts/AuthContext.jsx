import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedAuth = localStorage.getItem('isAuthenticated');
        const storedUser = localStorage.getItem('user');
        
        if (storedAuth === 'true' && storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
          console.log('🔐 Auth initialized for user:', userData.email);
        } else {
          // Clear any inconsistent auth state
          clearAuthData();
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen for storage changes across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'isAuthenticated') {
        if (e.newValue === 'true') {
          // User logged in from another tab
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
            console.log('🔐 Auth synced from another tab:', userData.email);
          }
        } else {
          // User logged out from another tab
          handleLogout(false); // Don't clear localStorage again
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const clearAuthData = () => {
    // Clear all authentication and user-specific data
    const keysToRemove = [
      'isAuthenticated',
      'token',
      'userId',
      'isLoggedIn',
      'user',
      'firstname',
      'lastname',
      'email',
      'currentUserId',
      // Clear all cached user data
      'courses',
      'assignments',
      'activeStudents',
      'cwa_behavior_data',
      'notifications',
      'quizzes',
      'summaries',
      'study_sessions',
      'activities',
      'schedules',
      'performance_data',
      'analytics_data'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear sessionStorage as well
    sessionStorage.clear();

    console.log('🧹 Cleared all authentication and user data');
  };

  const handleLogin = (userData) => {
    try {
      // First clear any previous user data
      clearAuthData();
      
      // Set new user data
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userId', userData.id);
      localStorage.setItem('currentUserId', userData.id);
      localStorage.setItem('firstname', userData.firstname);
      localStorage.setItem('lastname', userData.lastname);
      localStorage.setItem('email', userData.email);
      
      console.log('✅ User logged in successfully:', userData.email);
      
      // Broadcast login event for other components
      window.dispatchEvent(new CustomEvent('userLogin', { detail: userData }));
      
    } catch (error) {
      console.error('❌ Error during login:', error);
      throw error;
    }
  };

  const handleLogout = (clearStorage = true) => {
    try {
      // Clear React state
      setUser(null);
      setIsAuthenticated(false);
      
      if (clearStorage) {
        clearAuthData();
      }
      
      console.log('🔒 User logged out successfully');
      
      // Broadcast logout event for other components
      window.dispatchEvent(new CustomEvent('userLogout'));
      
      // Force a page reload to ensure complete state reset
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Force reload anyway to ensure clean state
      window.location.reload();
    }
  };

  const refreshUserData = async () => {
    if (!user?.id) return;

    try {
      // Call backend to get fresh user data
      const response = await fetch(`http://127.0.0.1:5000/user-profile/${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        const updatedUser = { ...user, ...data.profile };
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        console.log('🔄 User data refreshed');
      } else if (response.status === 401 || response.status === 403) {
        // User session is invalid
        console.warn('⚠️ User session invalid, logging out');
        handleLogout();
      }
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
    }
  };

  // Validate user session periodically
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const validateSession = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/user-profile/${user.id}`);
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403 || response.status === 404) {
            console.warn('⚠️ Session validation failed, logging out');
            handleLogout();
          }
        }
      } catch (error) {
        console.error('❌ Error validating session:', error);
      }
    };

    // Validate session every 5 minutes
    const interval = setInterval(validateSession, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    refreshUserData,
    clearAllData: clearAuthData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
