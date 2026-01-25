/**
 * Security Service
 * 
 * Handles security-related operations including:
 * - Health score calculation
 * - Password strength assessment (zxcvbn)
 * - HIBP breach checking using k-Anonymity
 * - Batch updates of security metrics
 * - Duress password with TRUE zero-knowledge (auth_hash only)
 */

import apiClient from '../api/apiClient';
import { logger } from '../utils/logger';
import { 
  generateSalt, 
  deriveAuthHash, 
  deriveMasterKey,
  encryptVault,
  createEmptyVault,
  VaultData
} from './cryptoService';

export interface SecurityHealthScore {
  overall_score: number;
  total_passwords: number;
  strength_score: number;
  uniqueness_score: number;
  integrity_score: number;
  hygiene_score: number;
  breakdown: {
    weak_passwords: number;
    reused_passwords: number;
    breached_passwords: number;
    outdated_passwords: number;
  };
}

export interface PasswordSecurityMetrics {
  profile_id: number;
  strength_score?: number;  // 0-4 from zxcvbn
  is_breached?: boolean;
  breach_count?: number;
}

/**
 * Fetch the current security health score for the user's vault
 */
export const fetchHealthScore = async (): Promise<SecurityHealthScore> => {
  const response = await apiClient.get('/security/health-score/');
  return response.data;
};

/**
 * Update password strength score for a single profile
 */
export const updatePasswordStrength = async (
  profileId: number,
  strengthScore: number
): Promise<void> => {
  await apiClient.post(`/security/profiles/${profileId}/strength/`, {
    strength_score: strengthScore
  });
};

/**
 * Update breach status for a single profile
 */
export const updateBreachStatus = async (
  profileId: number,
  isBreached: boolean,
  breachCount: number = 0
): Promise<void> => {
  await apiClient.post(`/security/profiles/${profileId}/breach/`, {
    is_breached: isBreached,
    breach_count: breachCount
  });
};

/**
 * Update password hash for uniqueness checking
 */
export const updatePasswordHash = async (
  profileId: number,
  password: string
): Promise<void> => {
  // Calculate SHA-256 hash of password
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  await apiClient.post(`/security/profiles/${profileId}/hash/`, {
    password_hash: hashHex
  });
};

/**
 * Batch update security metrics for multiple profiles
 * More efficient than individual updates
 */
export const batchUpdateSecurityMetrics = async (
  updates: PasswordSecurityMetrics[]
): Promise<void> => {
  await apiClient.post('/security/batch-update/', {
    updates
  });
};

/**
 * Convert string to SHA-1 hash
 */
async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.toUpperCase();
}

/**
 * Check if a password has been breached using HIBP k-Anonymity API
 * 
 * This sends only the first 5 characters of the SHA-1 hash to the API,
 * protecting privacy while checking for breaches.
 * 
 * @param password - The plaintext password to check
 * @returns Promise with breach status and count
 */
export const checkPasswordBreach = async (
  password: string
): Promise<{ isBreached: boolean; breachCount: number }> => {
  if (!password) {
    return { isBreached: false, breachCount: 0 };
  }

  try {
    // Generate SHA-1 hash of the password
    const sha1Hash = await sha1(password);
    const prefix = sha1Hash.substring(0, 5);
    const suffix = sha1Hash.substring(5);

    // Query HIBP API with first 5 characters
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'User-Agent': 'AccountSafe-SecurityChecker'
      }
    });

    if (!response.ok) {
      // If API fails, assume not breached to be safe
      console.error('HIBP API error:', response.statusText);
      return { isBreached: false, breachCount: 0 };
    }

    const text = await response.text();
    const hashes = text.split('\n');

    // Check if our hash suffix is in the results
    for (const line of hashes) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return {
          isBreached: true,
          breachCount: parseInt(count.trim(), 10)
        };
      }
    }

    return { isBreached: false, breachCount: 0 };
  } catch (error) {
    console.error('Error checking password breach:', error);
    // On error, assume not breached
    return { isBreached: false, breachCount: 0 };
  }
};

/**
 * Calculate password strength using zxcvbn
 * Note: zxcvbn should be imported separately in components that use this
 * 
 * @param password - The password to evaluate
 * @returns Strength score from 0-4
 */
export const getPasswordStrengthScore = (password: string): number => {
  // This is a placeholder - actual implementation should use zxcvbn library
  // Import zxcvbn in the component: import zxcvbn from 'zxcvbn';
  // Then call: zxcvbn(password).score
  
  // For now, return a basic estimate
  if (!password) return 0;
  if (password.length < 8) return 0;
  if (password.length < 12) return 1;
  
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  
  const variety = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  
  if (variety <= 2) return 1;
  if (variety === 3) return 2;
  if (password.length >= 16 && variety === 4) return 4;
  return 3;
};

// ===========================
// PANIC & DURESS SECURITY
// ===========================

export interface PanicDuressSettings {
  panic_shortcut: string[];
  has_duress_password: boolean;
  sos_email: string | null;
}

// Forbidden key combinations (common browser shortcuts)
export const FORBIDDEN_SHORTCUTS: string[][] = [
  ['Control', 'w'], // Close tab
  ['Control', 't'], // New tab
  ['Control', 'n'], // New window
  ['Control', 'r'], // Refresh
  ['Control', 'Shift', 'r'], // Hard refresh
  ['Control', 'f'], // Find
  ['Control', 'h'], // History
  ['Control', 'j'], // Downloads
  ['Control', 'd'], // Bookmark
  ['Control', 'p'], // Print
  ['Control', 's'], // Save
  ['Control', 'a'], // Select all
  ['Control', 'c'], // Copy
  ['Control', 'v'], // Paste
  ['Control', 'x'], // Cut
  ['Control', 'z'], // Undo
  ['Control', 'Shift', 'i'], // DevTools
  ['Control', 'Shift', 'j'], // DevTools console
  ['F5'], // Refresh
  ['F11'], // Fullscreen
  ['F12'], // DevTools
  ['Alt', 'F4'], // Close window
];

/**
 * Check if a key combination is a forbidden browser shortcut
 */
export function isForbiddenShortcut(keys: string[]): boolean {
  const normalizedKeys = keys.map(k => k.toLowerCase()).sort();
  
  return FORBIDDEN_SHORTCUTS.some(forbidden => {
    const normalizedForbidden = forbidden.map(k => k.toLowerCase()).sort();
    if (normalizedKeys.length !== normalizedForbidden.length) return false;
    return normalizedKeys.every((key, index) => key === normalizedForbidden[index]);
  });
}

/**
 * Format key combination for display
 */
export function formatKeyCombo(keys: string[]): string {
  if (!keys || keys.length === 0) return 'Not set';
  
  const keyMap: Record<string, string> = {
    'Control': 'Ctrl',
    'Meta': '⌘',
    ' ': 'Space',
  };
  
  return keys.map(key => keyMap[key] || key).join(' + ');
}

/**
 * Get security settings (panic shortcut, duress status)
 */
export async function getPanicDuressSettings(): Promise<PanicDuressSettings> {
  const response = await apiClient.get('/security/settings/');
  return response.data;
}

/**
 * Set panic button keyboard shortcut
 */
export async function setPanicShortcut(keys: string[]): Promise<{ panic_shortcut: string[] }> {
  const response = await apiClient.post('/security/settings/', {
    action: 'set_panic_shortcut',
    shortcut: keys
  });
  return response.data;
}

/**
 * Clear panic button shortcut
 */
export async function clearPanicShortcut(): Promise<void> {
  await apiClient.post('/security/settings/', {
    action: 'clear_panic_shortcut'
  });
}

/**
 * Set duress password, SOS email, and create decoy vault with TRUE zero-knowledge.
 * 
 * ZERO-KNOWLEDGE: Neither master nor duress password is sent to server!
 * Only auth_hash (derived from password) is transmitted.
 * 
 * The decoy vault is encrypted with duress password and stored on server.
 * Server cannot decrypt either the real vault or decoy vault.
 * 
 * @param masterPassword - For verification (derives auth_hash)
 * @param duressPassword - The duress password to set (derives auth_hash)
 * @param sosEmail - Email to notify on duress login
 * @param decoyVault - Optional decoy vault data (if not provided, creates empty vault)
 */
export async function setDuressPassword(
  masterPassword: string,
  duressPassword: string,
  sosEmail: string,
  decoyVault?: VaultData
): Promise<{ has_duress_password: boolean }> {
  // Get current salt for master password verification
  const username = localStorage.getItem('username');
  if (!username) {
    throw new Error('Not logged in');
  }
  
  // IMPORTANT: Fetch master salt from server, NOT from localStorage
  // When logged in with duress password, localStorage has duress_salt
  // We need the MASTER salt to derive the correct auth_hash for verification
  const saltResponse = await apiClient.get(`/zk/salt/?username=${encodeURIComponent(username)}`);
  const masterSalt = saltResponse.data.salt;  // This is always the MASTER salt
  
  if (!masterSalt) {
    throw new Error('Cannot find encryption salt');
  }
  
  // Derive master auth_hash for verification
  const masterAuthHash = deriveAuthHash(masterPassword, masterSalt);
  
  // Generate new salt for duress password
  const duressSalt = generateSalt();
  
  // Derive duress auth_hash
  const duressAuthHash = deriveAuthHash(duressPassword, duressSalt);
  
  // Create and encrypt decoy vault with duress key
  const duressKey = await deriveMasterKey(duressPassword, duressSalt);
  const decoyVaultData = decoyVault || createEmptyVault();
  const decoyVaultBlob = await encryptVault(decoyVaultData, duressKey);
  
  // Send auth_hashes only (password NEVER sent)
  const response = await apiClient.post('/zk/set-duress/', {
    master_auth_hash: masterAuthHash,
    duress_auth_hash: duressAuthHash,
    duress_salt: duressSalt,
    sos_email: sosEmail
  });
  
  // Store decoy vault blob on server
  await apiClient.put('/vault/', {
    decoy_vault_blob: decoyVaultBlob,
    duress_salt: duressSalt
  });
  
  logger.log('✅ Duress password and decoy vault set with zero-knowledge (password NEVER sent)');
  
  return response.data;
}

/**
 * Clear duress password with TRUE zero-knowledge verification.
 * 
 * ZERO-KNOWLEDGE: Master password is NOT sent to server!
 * Only auth_hash (derived from password) is transmitted.
 */
export async function clearDuressPassword(masterPassword: string): Promise<void> {
  // Get current salt for master password verification
  const username = localStorage.getItem('username');
  if (!username) {
    throw new Error('Not logged in');
  }
  
  // IMPORTANT: Fetch master salt from server, NOT from localStorage
  // When logged in with duress password, localStorage has duress_salt
  const saltResponse = await apiClient.get(`/zk/salt/?username=${encodeURIComponent(username)}`);
  const masterSalt = saltResponse.data.salt;  // This is always the MASTER salt
  
  if (!masterSalt) {
    throw new Error('Cannot find encryption salt');
  }
  
  // Derive master auth_hash for verification
  const masterAuthHash = deriveAuthHash(masterPassword, masterSalt);
  
  // Send auth_hash only (password NEVER sent)
  await apiClient.post('/zk/clear-duress/', {
    master_auth_hash: masterAuthHash
  });
  
  logger.log('✅ Duress password cleared with zero-knowledge (password NEVER sent)');
}

/**
 * Verify user password with TRUE zero-knowledge.
 * 
 * ZERO-KNOWLEDGE: Password is NOT sent to server!
 * Only auth_hash (derived from password) is transmitted.
 */
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    // Get current salt
    const username = localStorage.getItem('username');
    if (!username) {
      return false;
    }
    
    const salt = localStorage.getItem(`encryption_salt_${username}`);
    if (!salt) {
      return false;
    }
    
    // Derive auth_hash for verification
    const authHash = deriveAuthHash(password, salt);
    
    // Verify with auth_hash only (password NEVER sent)
    const response = await apiClient.post('/zk/verify/', {
      auth_hash: authHash
    });
    
    return response.data.verified;
  } catch (error) {
    return false;
  }
}
