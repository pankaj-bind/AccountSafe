// src/services/authService.ts
// ═══════════════════════════════════════════════════════════════════════════════
// TRUE Zero-Knowledge Authentication Service
// ═══════════════════════════════════════════════════════════════════════════════
//
// CRITICAL SECURITY: Password is NEVER sent to the server!
// 
// How it works:
// 1. Password is used ONLY for local key derivation (Argon2id)
// 2. auth_hash (derived from password) is sent instead of password
// 3. Server stores auth_hash for verification, CANNOT derive encryption key
// 4. Master encryption key stays in browser memory ONLY
//
// Flow:
// 1. Login: Derive auth_hash → Send auth_hash → Server compares
// 2. Register: Derive auth_hash → Send auth_hash → Server stores
// 3. All sensitive operations use auth_hash, NEVER password
// ═══════════════════════════════════════════════════════════════════════════════

import axios from 'axios';
import apiClient from '../api/apiClient';
import { logger } from '../utils/logger';
import { broadcastLogout } from '../hooks/useGlobalLogout';
import { generateSalt, deriveAuthHash, createEmptyVault, encryptVault, deriveMasterKey } from './cryptoService';

// Ensure consistent API URL with trailing slash
const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL.replace(/\/+$/, '')}/` 
  : 'http://localhost:8000/api/';

// ═══════════════════════════════════════════════════════════════════════════════
// TRUE Zero-Knowledge Authentication Functions
// Password is NEVER sent to server - only auth_hash (derived)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Register a new user with TRUE zero-knowledge authentication.
 * 
 * ZERO-KNOWLEDGE: Password is NEVER sent to the server!
 * 
 * Flow:
 * 1. Generate salt client-side
 * 2. Derive auth_hash from password (Argon2id + SHA-256)
 * 3. Send username, email, auth_hash, salt to server
 * 4. Server stores auth_hash (cannot reverse to get password)
 * 5. Create and encrypt empty vault
 * 
 * Returns: response data + salt (so caller can use it)
 */
export const register = async (
  username: string, 
  email: string, 
  password1: string, 
  password2: string, 
  turnstileToken?: string
) => {
  // Validate passwords match
  if (password1 !== password2) {
    throw new Error('Passwords do not match');
  }
  
  // Step 1: Generate unique salt for this user
  const salt = generateSalt();
  
  // Step 2: Derive auth_hash from password (this is what we send instead of password)
  const authHash = deriveAuthHash(password1, salt);
  
  // Step 3: Register with TRUE zero-knowledge endpoint
  // ❌ Password is NOT sent
  // ✅ Only auth_hash (derived) is sent
  const response = await axios.post(`${API_URL}zk/register/`, {
    username,
    email,
    auth_hash: authHash,
    salt: salt,
    turnstile_token: turnstileToken,
  });
  
  const token = response.data.key;
  if (token) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('username', username);
    localStorage.setItem(`encryption_salt_${username}`, salt);
    
    try {
      // Derive master key for vault encryption (stays in memory only)
      const masterKey = await deriveMasterKey(password1, salt);
      
      // Create and encrypt empty vault
      const emptyVault = createEmptyVault();
      const encryptedVault = await encryptVault(emptyVault, masterKey);
      
      // Store encrypted vault on server (server cannot decrypt)
      await apiClient.put('/vault/', { vault_blob: encryptedVault });
      
      logger.log('✅ Zero-knowledge registration complete (password NEVER sent to server)');
    } catch (error) {
      console.error('Failed to initialize vault (user can set up later):', error);
    }
  }
  
  return {
    ...response.data,
    salt: salt  // Return salt so caller can use it for recovery key generation
  };
};

/**
 * Login with TRUE zero-knowledge authentication.
 * 
 * ZERO-KNOWLEDGE: Password is NEVER sent to the server!
 * 
 * Flow:
 * 1. Get salts from server (both master and duress salts are public info)
 * 2. If user needs migration, redirect them to password reset
 * 3. Try login with master salt first
 * 4. If that fails and duress_salt exists, try with duress salt
 * 5. Server compares auth_hash, returns token if match
 * 
 * Duress mode support:
 * - Both salts are returned from server (public info, safe to expose)
 * - Client tries auth_hash with both salts to support either password
 * - This maintains zero-knowledge while enabling duress mode
 */
export const login = async (username: string, password: string, turnstileToken?: string) => {
  // Step 1: Get salts from server (needed for key derivation)
  let salt: string | undefined = undefined;
  let duressSalt: string | undefined = undefined;
  
  try {
    const saltResponse = await axios.get(`${API_URL}zk/salt/?username=${encodeURIComponent(username)}`);
    salt = saltResponse.data.salt;
    duressSalt = saltResponse.data.duress_salt;  // May be undefined if not configured
    
    if (!salt) {
      // User exists but no ZK auth - must use password reset
      throw new Error('LEGACY_ACCOUNT_NEEDS_RESET');
    }
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    if (axiosError.response?.status === 404) {
      // User doesn't exist or has no ZK auth
      throw new Error('Invalid credentials');
    } else if (axiosError.message === 'LEGACY_ACCOUNT_NEEDS_RESET') {
      throw new Error('Your account needs to be upgraded. Please use "Forgot Password" to reset your password and enable zero-knowledge encryption.');
    } else {
      throw error;
    }
  }
  
  // Step 2: Derive auth_hash with master salt first
  const authHash = deriveAuthHash(password, salt);
  
  // Step 3: Login with TRUE zero-knowledge endpoint
  // ❌ Password is NOT sent
  // ✅ Only auth_hash (derived) is sent
  try {
    const response = await apiClient.post('/zk/login/', { 
      username, 
      auth_hash: authHash,
      turnstile_token: turnstileToken 
    });
    
    const token = response.data.key;
    const responseSalt = response.data.salt || salt;  // Use returned salt
    const isDuress = response.data.is_duress || false;
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('username', username);
    localStorage.setItem(`encryption_salt_${username}`, responseSalt);
    
    if (isDuress) {
      logger.log('⚠️ Duress mode detected - will show decoy vault');
    }
    
    logger.log('✅ Zero-knowledge login successful (password NEVER sent to server)');
    
    return {
      ...response.data,
      salt: responseSalt  // Return correct salt for CryptoContext to use
    };
  } catch (error: unknown) {
    // If login failed and duress_salt exists, try with duress salt
    const axiosError = error as { response?: { status?: number } };
    if (axiosError.response?.status === 401 && duressSalt) {
      logger.log('🔄 Master auth failed, trying duress salt...');
      
      const duressAuthHash = deriveAuthHash(password, duressSalt);
      
      const response = await apiClient.post('/zk/login/', { 
        username, 
        auth_hash: duressAuthHash,
        turnstile_token: turnstileToken 
      });
      
      const token = response.data.key;
      const responseSalt = response.data.salt || duressSalt;  // Should be duress_salt
      const isDuress = response.data.is_duress || false;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('username', username);
      localStorage.setItem(`encryption_salt_${username}`, responseSalt);
      
      if (isDuress) {
        logger.log('⚠️ Duress mode activated - showing decoy vault');
      }
      
      logger.log('✅ Zero-knowledge login successful with duress mode (password NEVER sent to server)');
      
      return {
        ...response.data,
        salt: responseSalt
      };
    }
    
    // Re-throw original error if duress login also failed or doesn't exist
    throw error;
  }
};

// REMOVED: migrateAndLogin function - migration endpoint disabled
// Legacy users must use password reset via email OTP to set up ZK auth
// This ensures password is NEVER sent to server, maintaining TRUE zero-knowledge

/**
 * Logout and clear all sensitive data.
 * Broadcasts logout to all tabs for cross-tab synchronization.
 */
export const logout = () => {
  localStorage.removeItem('authToken');
  
  // 📡 Broadcast logout to all other tabs
  broadcastLogout('USER_LOGOUT');
  
  logger.log('🔒 Logged out - all sensitive data cleared');
};

/**
 * Re-login after panic mode with TRUE zero-knowledge authentication.
 * 
 * ZERO-KNOWLEDGE: Password is NEVER sent to the server!
 * 
 * Supports both master password and duress password for Session Verification.
 */
export const relogin = async (username: string, password: string): Promise<{ success: boolean; salt?: string; isDuress?: boolean }> => {
  try {
    let salt: string | undefined;
    let duressSalt: string | undefined;
    
    // Try to get salts from server
    try {
      const saltResponse = await axios.get(`${API_URL}zk/salt/?username=${encodeURIComponent(username)}`);
      salt = saltResponse.data.salt;
      duressSalt = saltResponse.data.duress_salt;
      if (!salt) {
        // Legacy account - cannot re-login without ZK auth
        return { success: false };
      }
    } catch (_error: unknown) {
      return { success: false };
    }
    
    // Derive auth_hash with master salt first
    const authHash = deriveAuthHash(password, salt!);
    
    // Try login with master auth_hash
    try {
      const response = await apiClient.post('/zk/login/', { 
        username, 
        auth_hash: authHash,
        is_relogin: true
      });
      
      const token = response.data.key;
      const responseSalt = response.data.salt || salt;
      const isDuress = response.data.is_duress || false;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('username', username);
      localStorage.setItem(`encryption_salt_${username}`, responseSalt!);
      
      logger.log('✅ Zero-knowledge re-login successful (password NEVER sent to server)');
      
      return { success: true, salt: responseSalt, isDuress };
    } catch (error: unknown) {
      // If login failed and duress_salt exists, try with duress salt
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 401 && duressSalt) {
        logger.log('🔄 Master auth failed in relogin, trying duress salt...');
        
        const duressAuthHash = deriveAuthHash(password, duressSalt);
        
        const response = await apiClient.post('/zk/login/', { 
          username, 
          auth_hash: duressAuthHash,
          is_relogin: true
        });
        
        const token = response.data.key;
        const responseSalt = response.data.salt || duressSalt;
        const isDuress = response.data.is_duress || false;
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('username', username);
        localStorage.setItem(`encryption_salt_${username}`, responseSalt!);
        
        logger.log('✅ Zero-knowledge re-login with duress mode successful (password NEVER sent to server)');
        
        return { success: true, salt: responseSalt, isDuress };
      }
      
      return { success: false };
    }
  } catch (error) {
    return { success: false };
  }
};

/**
 * Delete account with TRUE zero-knowledge verification.
 * 
 * ZERO-KNOWLEDGE: Password is NEVER sent to the server!
 */
export const deleteAccount = async (password: string) => {
  // Get username and salt
  const username = localStorage.getItem('username');
  if (!username) {
    throw new Error('Not logged in');
  }
  
  const salt = localStorage.getItem(`encryption_salt_${username}`);
  if (!salt) {
    // Try to get salt from server
    const saltResponse = await axios.get(`${API_URL}zk/salt/?username=${encodeURIComponent(username)}`);
    if (!saltResponse.data.salt) {
      throw new Error('Cannot verify identity');
    }
  }
  
  // Derive auth_hash for verification
  const authHash = deriveAuthHash(password, salt || '');
  
  // Delete with auth_hash (password NEVER sent)
  const response = await apiClient.post('/zk/delete-account/', { 
    auth_hash: authHash 
  });
  
  logger.log('✅ Account deleted with zero-knowledge verification (password NEVER sent)');
  
  return response.data;
};

export const checkUsername = async (username: string) => {
  if (!username) return { exists: false };
  const response = await axios.get(`${API_URL}check-username/?username=${username}`);
  return response.data;
};

// --- Password reset functions ---
// NOTE: Password reset requires special handling - see implementation notes below
export const requestPasswordResetOTP = async (email: string, turnstileToken?: string) => {
  const response = await axios.post(`${API_URL}password-reset/request-otp/`, { email, turnstile_token: turnstileToken });
  return response.data;
};

export const verifyPasswordResetOTP = async (email: string, otp: string) => {
  const response = await apiClient.post('/password-reset/verify-otp/', { email, otp });
  return response.data;
};

/**
 * Set new password after OTP verification with TRUE zero-knowledge.
 * 
 * IMPORTANT: This generates a NEW salt and auth_hash.
 * The old vault data will be LOST (cannot decrypt without old password).
 * User should export/backup vault before password reset!
 */
export const setNewPasswordWithOTP = async (email: string, otp: string, password: string) => {
  // Generate new salt for the new password
  const newSalt = generateSalt();
  
  // Derive new auth_hash
  const newAuthHash = deriveAuthHash(password, newSalt);
  
  // Set new password with zero-knowledge
  const response = await axios.post(`${API_URL}password-reset/set-new-password/`, { 
    email, 
    otp, 
    new_auth_hash: newAuthHash,
    new_salt: newSalt
  });
  
  logger.log('✅ Password reset complete with zero-knowledge (password NEVER sent)');
  logger.log('⚠️ WARNING: Old vault data cannot be decrypted with new password');
  
  return response.data;
};

/**
 * Change password with TRUE zero-knowledge verification.
 * 
 * ZERO-KNOWLEDGE: Neither old nor new password is sent to the server!
 * 
 * Flow:
 * 1. Derive auth_hash from current password
 * 2. Generate new salt
 * 3. Derive new auth_hash from new password
 * 4. Send current_auth_hash + new_auth_hash + new_salt
 * 5. Server verifies current, stores new
 * 
 * NOTE: Client must re-encrypt vault with new key separately!
 */
export const changePassword = async (currentPassword: string, newPassword: string) => {
  // Get username and salt
  const username = localStorage.getItem('username');
  if (!username) {
    throw new Error('Not logged in');
  }
  
  let currentSalt = localStorage.getItem(`encryption_salt_${username}`);
  if (!currentSalt) {
    // Try to get salt from server
    const saltResponse = await axios.get(`${API_URL}zk/salt/?username=${encodeURIComponent(username)}`);
    currentSalt = saltResponse.data.salt;
    if (!currentSalt) {
      throw new Error('Cannot find encryption salt');
    }
  }
  
  // Derive current auth_hash for verification
  const currentAuthHash = deriveAuthHash(currentPassword, currentSalt);
  
  // Generate new salt for new password
  const newSalt = generateSalt();
  
  // Derive new auth_hash
  const newAuthHash = deriveAuthHash(newPassword, newSalt);
  
  // Change password with zero-knowledge
  const response = await apiClient.post('/zk/change-password/', {
    current_auth_hash: currentAuthHash,
    new_auth_hash: newAuthHash,
    new_salt: newSalt
  });
  
  // Update local salt storage
  localStorage.setItem(`encryption_salt_${username}`, newSalt);
  
  logger.log('✅ Password changed with zero-knowledge (password NEVER sent)');
  
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
