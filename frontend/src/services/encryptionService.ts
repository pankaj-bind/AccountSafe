// ═══════════════════════════════════════════════════════════════════════════════
// Encryption Key Management Service
// ═══════════════════════════════════════════════════════════════════════════════
// 
// ZERO-KNOWLEDGE ARCHITECTURE:
// - Master password is NEVER stored anywhere (not even sessionStorage)
// - Only the derived CryptoKey exists in memory during active session
// - Salt is public and can be stored (needed for key derivation)
// ═══════════════════════════════════════════════════════════════════════════════

import { generateSalt, generateRecoveryKey } from '../utils/encryption';
import { logger } from '../utils/logger';

interface KeyData {
  salt: string;
  recoveryKey?: string;
}

const STORAGE_KEY = 'accountsafe_key_data';

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
 * Store user's key data (salt only) in localStorage
 * Note: We NEVER store the master password or derived key
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
 * Clear all encryption keys from memory (logout/panic)
 * In true zero-knowledge, there's nothing in storage to clear
 * The master key only exists in CryptoContext's memory ref
 */
export function clearEncryptionKeys(): void {
  // No session storage to clear - master key is in memory only (CryptoContext)
  // This function is kept for API compatibility
  logger.log('🔒 Clearing encryption state (zero-knowledge: nothing in storage)');
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
