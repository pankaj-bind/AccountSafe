// ═══════════════════════════════════════════════════════════════════════════════
// Encryption Key Management Service
// ═══════════════════════════════════════════════════════════════════════════════

import { deriveKeyFromPassword, generateSalt, generateRecoveryKey } from '../utils/encryption';

interface KeyData {
  salt: string;
  recoveryKey?: string;
}

const STORAGE_KEY = 'accountsafe_key_data';
const SESSION_KEY = 'accountsafe_master_key';

/**
 * Initialize encryption for a new user during registration
 * Returns salt and recovery key that should be shown to user
 */
export async function initializeUserEncryption(): Promise<{ salt: string; recoveryKey: string }> {
  const salt = generateSalt();
  const recoveryKey = generateRecoveryKey();
  
  return { salt, recoveryKey };
}

/**
 * Store user's key data (salt) in localStorage
 * Note: We never store the master password or derived key permanently
 */
export function storeKeyData(salt: string, recoveryKey?: string): void {
  const keyData: KeyData = { salt, recoveryKey };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keyData));
}

/**
 * Get stored key data for the current user
 */
export function getKeyData(): KeyData | null {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Store master password in session storage (for current session only)
 * This allows us to re-derive the key without asking for password repeatedly
 */
export function storeMasterPasswordForSession(password: string): void {
  sessionStorage.setItem(SESSION_KEY, password);
}

/**
 * Get master password from session storage
 */
export function getMasterPasswordFromSession(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

/**
 * Derive encryption key from session password
 * Returns null if no session password exists
 */
export async function getSessionEncryptionKey(): Promise<CryptoKey | null> {
  const password = getMasterPasswordFromSession();
  const keyData = getKeyData();
  
  if (!password || !keyData) {
    return null;
  }
  
  return await deriveKeyFromPassword(password, keyData.salt);
}

/**
 * Clear all encryption keys from memory (logout)
 */
export function clearEncryptionKeys(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Check if user has encryption set up
 */
export function hasEncryptionSetup(): boolean {
  return getKeyData() !== null;
}

/**
 * Download recovery key as a text file
 */
export function downloadRecoveryKey(recoveryKey: string, username: string): void {
  const content = `AccountSafe Recovery Key
========================

Username: ${username}
Recovery Key: ${recoveryKey}
Generated: ${new Date().toLocaleString()}

⚠️  IMPORTANT: Keep this recovery key in a safe place!

This key allows you to recover your account if you forget your password.
Without it, your encrypted data cannot be recovered.

Do NOT share this key with anyone.
Do NOT store it in your password manager.

Recommended storage locations:
- Print and store in a fireproof safe
- Store in a secure password manager (separate from this account)
- Split and store in multiple secure locations

========================
AccountSafe - Zero-Knowledge Password Vault
`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `accountsafe-recovery-${username}-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
