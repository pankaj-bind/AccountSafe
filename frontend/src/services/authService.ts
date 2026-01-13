// src/services/authService.ts
import axios from 'axios';
import apiClient from '../api/apiClient';
import { storeMasterPasswordForSession, storeKeyData } from './encryptionService';
import { generateSalt } from '../utils/encryption';

// Ensure consistent API URL with trailing slash
const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL.replace(/\/+$/, '')}/` 
  : 'http://localhost:8000/api/';

// --- Authentication functions ---
export const register = async (username: string, email: string, password1: string, password2: string) => {
  const response = await axios.post(`${API_URL}auth/registration/`, {
    username, email, password1, password2,
  });
  return response.data;
};

export const login = async (username: string, password: string) => {
  try {
    const response = await apiClient.post('/auth/login/', { username, password });
    const token = response.data.key;
    
    localStorage.setItem('authToken', token);
    
    // Store master password in session for encryption key derivation
    storeMasterPasswordForSession(password);
    
    // Retrieve or generate encryption salt for this user
    // In a real app, this would be fetched from backend or stored with user profile
    const existingSalt = localStorage.getItem(`encryption_salt_${username}`);
    if (!existingSalt) {
      const salt = generateSalt();
      localStorage.setItem(`encryption_salt_${username}`, salt);
      storeKeyData(salt);
    } else {
      storeKeyData(existingSalt);
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('authToken');
  // Clear encryption keys from session
  sessionStorage.removeItem('accountsafe_master_key');
};

export const deleteAccount = async (password: string) => {
  const response = await apiClient.post('/delete-account/', { password });
  return response.data;
};

export const checkUsername = async (username: string) => {
  if (!username) return { exists: false };
  const response = await axios.get(`${API_URL}check-username/?username=${username}`);
  return response.data;
};

// --- Password reset functions ---
export const requestPasswordResetOTP = async (email: string) => {
  const response = await axios.post(`${API_URL}password-reset/request-otp/`, { email });
  return response.data;
};

export const verifyPasswordResetOTP = async (email: string, otp: string) => {
  const response = await apiClient.post('/password-reset/verify-otp/', { email, otp });
  return response.data;
};

export const setNewPasswordWithOTP = async (email: string, otp: string, password: string) => {
  const response = await apiClient.post('/password-reset/set-new-password/', { email, otp, password });
  return response.data;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const response = await apiClient.post('/change-password/', {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return response.data;
};

// --- Profile API functions ---
export const getUserProfile = async () => {
  const response = await apiClient.get('/profile/');
  return response.data;
};

export const updateUserProfile = async (profileData: FormData) => {
  const response = await apiClient.put('/profile/update/', profileData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};
