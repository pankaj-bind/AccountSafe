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
    
    // Check for existing salt in localStorage first (for migration of existing users)
    const existingLocalSalt = localStorage.getItem(`encryption_salt_${username}`);
    console.log('[Auth] Login - existingLocalSalt:', existingLocalSalt ? 'found' : 'not found');
    
    // Fetch encryption salt from backend (stored in UserProfile)
    try {
      const profileResponse = await apiClient.get('/profile/');
      const backendSalt = profileResponse.data.encryption_salt;
      console.log('[Auth] Login - backendSalt:', backendSalt ? 'found' : 'not found');
      
      if (backendSalt) {
        // User has encryption salt stored on backend - use it (priority: backend)
        console.log('[Auth] Using backend salt');
        localStorage.setItem(`encryption_salt_${username}`, backendSalt);
        storeKeyData(backendSalt);
      } else if (existingLocalSalt) {
        // Migrate existing local salt to backend (for existing users)
        console.log('[Auth] Migrating local salt to backend');
        storeKeyData(existingLocalSalt);
        
        // Save to backend for future logins from other devices
        try {
          await apiClient.put('/profile/update/', { encryption_salt: existingLocalSalt });
          console.log('[Auth] Salt saved to backend successfully');
        } catch (err) {
          console.error('[Auth] Failed to save encryption salt to backend:', err);
        }
      } else {
        // Brand new user with no salt anywhere - generate and save one
        console.log('[Auth] Generating new salt for new user');
        const salt = generateSalt();
        localStorage.setItem(`encryption_salt_${username}`, salt);
        storeKeyData(salt);
        
        // Save to backend for future logins
        try {
          await apiClient.put('/profile/update/', { encryption_salt: salt });
          console.log('[Auth] New salt saved to backend successfully');
        } catch (err) {
          console.error('[Auth] Failed to save encryption salt to backend:', err);
        }
      }
    } catch (err) {
      console.error('[Auth] Failed to fetch user profile:', err);
      // Fallback: use localStorage if backend fetch fails
      if (existingLocalSalt) {
        console.log('[Auth] Using fallback local salt');
        storeKeyData(existingLocalSalt);
      } else {
        const salt = generateSalt();
        localStorage.setItem(`encryption_salt_${username}`, salt);
        storeKeyData(salt);
      }
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
