// src/features/auth/services/authService.ts
/**
 * Auth Service - Zero-Knowledge Authentication
 * 
 * CRITICAL SECURITY: Password is NEVER sent to the server!
 * 
 * Architecture:
 * - Password → Argon2id → auth_hash (sent to server)
 * - Server stores auth_hash, CANNOT derive encryption key
 * - Master key stays in browser memory ONLY
 */

import axios from 'axios';
import apiClient from '../../../api/apiClient';
import { 
  generateSalt, 
  deriveAuthHash, 
  deriveMasterKey,
  createEmptyVault, 
  encryptVault 
} from '../../../services/cryptoService';

const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL.replace(/\/+$/, '')}/` 
  : 'http://localhost:8000/api/';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface RegisterResult {
  key: string;
  salt: string;
  user?: {
    username: string;
    email: string;
  };
}

export interface LoginResult {
  key: string;
  salt: string;
  is_duress?: boolean;
  user?: {
    username: string;
    email: string;
  };
}

export interface SaltResponse {
  salt: string | null;
  duress_salt: string | null;
  has_duress_password: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Core Auth Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Register with TRUE zero-knowledge authentication.
 * Password is NEVER sent to the server!
 */
export async function register(
  username: string, 
  email: string, 
  password1: string, 
  password2: string, 
  turnstileToken?: string
): Promise<RegisterResult> {
  if (password1 !== password2) {
    throw new Error('Passwords do not match');
  }
  
  // Generate unique salt for this user
  const salt = generateSalt();
  
  // Derive auth_hash from password (this is what we send instead of password)
  const authHash = deriveAuthHash(password1, salt);
  
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
      const masterKey = await deriveMasterKey(password1, salt);
      const emptyVault = createEmptyVault();
      const encryptedVault = await encryptVault(emptyVault, masterKey);
      await apiClient.put('/vault/', { vault_blob: encryptedVault });
      console.log('✅ Zero-knowledge registration complete');
    } catch (error) {
      console.error('Failed to initialize vault:', error);
    }
  }
  
  return {
    ...response.data,
    salt
  };
}

/**
 * Login with TRUE zero-knowledge authentication.
 * Password is NEVER sent to the server!
 */
export async function login(
  username: string, 
  password: string, 
  turnstileToken?: string
): Promise<LoginResult> {
  // Get salts from server
  let salt: string | undefined;
  let duressSalt: string | undefined;
  
  try {
    const saltResponse = await axios.get<SaltResponse>(
      `${API_URL}zk/salt/?username=${encodeURIComponent(username)}`
    );
    salt = saltResponse.data.salt || undefined;
    duressSalt = saltResponse.data.duress_salt || undefined;
    
    if (!salt) {
      throw new Error('LEGACY_ACCOUNT_NEEDS_RESET');
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Invalid credentials');
    } else if (error.message === 'LEGACY_ACCOUNT_NEEDS_RESET') {
      throw new Error('Your account needs to be upgraded. Please use "Forgot Password" to reset your password.');
    }
    throw error;
  }
  
  // Derive auth_hash with master salt
  const authHash = deriveAuthHash(password, salt);
  
  try {
    const response = await apiClient.post('/zk/login/', { 
      username, 
      auth_hash: authHash,
      turnstile_token: turnstileToken 
    });
    
    const token = response.data.key;
    const responseSalt = response.data.salt || salt;
    const _isDuress = response.data.is_duress || false; // eslint-disable-line @typescript-eslint/no-unused-vars
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('username', username);
    localStorage.setItem(`encryption_salt_${username}`, responseSalt);
    
    console.log('✅ Zero-knowledge login successful');
    
    return {
      ...response.data,
      salt: responseSalt
    };
  } catch (error: any) {
    // Try duress salt if master auth failed
    if (error.response?.status === 401 && duressSalt) {
      const duressAuthHash = deriveAuthHash(password, duressSalt);
      
      const response = await apiClient.post('/zk/login/', { 
        username, 
        auth_hash: duressAuthHash,
        turnstile_token: turnstileToken 
      });
      
      const token = response.data.key;
      const responseSalt = response.data.salt || duressSalt;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('username', username);
      localStorage.setItem(`encryption_salt_${username}`, responseSalt);
      
      return {
        ...response.data,
        salt: responseSalt
      };
    }
    throw error;
  }
}

/**
 * Logout and clear all local storage.
 */
export function logout(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('username');
  
  // Clear encryption-related items
  const username = localStorage.getItem('username');
  if (username) {
    localStorage.removeItem(`encryption_salt_${username}`);
  }
  
  // Clear all session data
  sessionStorage.clear();
}

/**
 * Get the current auth token.
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

/**
 * Check if user is authenticated.
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Get the current username.
 */
export function getCurrentUsername(): string | null {
  return localStorage.getItem('username');
}
