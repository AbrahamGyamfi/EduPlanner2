// Central API configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://eduplanner2-3wye.onrender.com';

console.log('API Configuration:', {
  API_BASE_URL,
  Environment: process.env.NODE_ENV,
  REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL
});

export { API_BASE_URL };
export default API_BASE_URL;