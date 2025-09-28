import axios from 'axios';

// API Configuration for Production
const API_CONFIG = {
  // Use the deployed backend URL in production, fallback to localhost in development
  BASE_URL: process.env.REACT_APP_API_URL || 'https://eduplanner2-3wye.onrender.com',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  }
};

// Export the base URL for direct use
export const API_BASE_URL = API_CONFIG.BASE_URL;

// Create axios instance with default configuration
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS
});

// Add request interceptor for debugging in development
if (process.env.NODE_ENV === 'development') {
  apiClient.interceptors.request.use((config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  });
}

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default API_CONFIG;