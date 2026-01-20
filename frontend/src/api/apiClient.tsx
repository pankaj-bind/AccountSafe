// src/api/apiClient.ts
import axios from 'axios';
import { forceLogout } from '../utils/logoutEvent';

// Use environment variable or fallback to production backend
const API_URL = process.env.REACT_APP_API_URL || 'https://accountsafe.pythonanywhere.com/api/';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add token to headers
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle 401 errors (revoked sessions)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If session was revoked (401 Unauthorized), logout immediately
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      
      // Don't redirect if already on login/register pages
      if (!['/login', '/register', '/reset-password'].includes(currentPath)) {
        forceLogout();
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

