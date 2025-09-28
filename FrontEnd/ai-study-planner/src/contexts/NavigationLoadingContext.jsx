import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const NavigationLoadingContext = createContext();

export const useNavigationLoading = () => {
  const context = useContext(NavigationLoadingContext);
  if (!context) {
    throw new Error('useNavigationLoading must be used within a NavigationLoadingProvider');
  }
  return context;
};

export const NavigationLoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [loadingSubMessage, setLoadingSubMessage] = useState('');
  const navigate = useNavigate();

  const navigateWithLoading = useCallback(async (
    path, 
    options = {}, 
    customMessage = 'Loading...', 
    customSubMessage = '',
    delay = 800
  ) => {
    // Start loading
    setIsLoading(true);
    setLoadingMessage(customMessage);
    setLoadingSubMessage(customSubMessage);

    try {
      // Add a minimum delay for smooth UX (prevents flash)
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Navigate to the new route
      navigate(path, options);
      
      // Keep loading for a bit more to allow page to render
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      // Stop loading
      setIsLoading(false);
      setLoadingMessage('Loading...');
      setLoadingSubMessage('');
    }
  }, [navigate]);

  const showLoading = useCallback((message = 'Loading...', subMessage = '') => {
    setIsLoading(true);
    setLoadingMessage(message);
    setLoadingSubMessage(subMessage);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage('Loading...');
    setLoadingSubMessage('');
  }, []);

  const value = {
    isLoading,
    loadingMessage,
    loadingSubMessage,
    navigateWithLoading,
    showLoading,
    hideLoading
  };

  return (
    <NavigationLoadingContext.Provider value={value}>
      {children}
    </NavigationLoadingContext.Provider>
  );
};
