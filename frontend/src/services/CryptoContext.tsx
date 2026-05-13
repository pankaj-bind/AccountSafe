// ═══════════════════════════════════════════════════════════════════════════════
// Zero-Knowledge Crypto Context
// ═══════════════════════════════════════════════════════════════════════════════
//
// This context manages the master encryption key in MEMORY ONLY.
// 
// CRITICAL SECURITY RULES:
// 1. [SEC] NEVER store masterKey in localStorage
// 2. [SEC] NEVER store masterKey in sessionStorage
// 3. [SEC] NEVER send masterKey to server
// 4. [OK] Keep masterKey in React state (memory only)
// 5. [OK] Wipe masterKey on logout/lock
// 6. [OK] Require re-authentication after inactivity
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import {
  deriveMasterKey,
  deriveAuthHash,
  deriveAllKeys,
  VaultData,
  encryptVault,
  decryptVault,
  createEmptyVault,
} from './cryptoService';
import apiClient from '../api/apiClient';
import { broadcastLogout } from '../hooks/useGlobalLogout';
import { logger } from '../utils/logger';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Auto-lock after 5 minutes of inactivity
  INACTIVITY_TIMEOUT_MS: 5 * 60 * 1000,
  
  // Warn user 30 seconds before auto-lock
  INACTIVITY_WARNING_MS: 30 * 1000,
  
  // Require re-auth after browser tab regains focus if > 1 minute
  REFOCUS_REAUTH_THRESHOLD_MS: 1 * 60 * 1000,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type LockReason = 'panic' | 'inactivity' | 'visibility' | 'manual' | 'logout' | null;

export interface CryptoContextValue {
  /** Whether the vault is currently unlocked */
  isUnlocked: boolean;
  
  /** Whether a crypto operation is in progress */
  isLoading: boolean;
  
  /** Current vault data (decrypted, in memory) */
  vault: VaultData | null;
  
  /** User's salt (safe to store/transmit) */
  salt: string | null;
  
  /** Time until auto-lock (ms), null if no timer */
  timeUntilLock: number | null;
  
  /** Whether we're in duress mode (ghost vault) */
  isDuressMode: boolean;
  
  /** Reason for the last lock (for UI messaging) */
  lockReason: LockReason;
  
  /**
   * Unlock vault with password
   * @param password - User's master password (NEVER stored)
   * @param salt - Salt from server (or generate new for registration)
   * @returns Success status and any error message
   */
  unlock: (password: string, salt?: string) => Promise<{ success: boolean; error?: string }>;
  
  /**
   * Lock vault and wipe key from memory
   * @param reason - Why the vault is being locked
   * Call this on logout, manual lock, or inactivity
   */
  lock: (reason?: LockReason) => void;
  
  /**
   * Update vault data (triggers encryption and sync to server)
   * @param updater - Function that receives current vault and returns updated vault
   */
  updateVault: (updater: (vault: VaultData) => VaultData) => Promise<void>;
  
  /**
   * Get the master key for encryption operations
   * @returns CryptoKey or null if locked
   */
  getMasterKey: () => CryptoKey | null;
  
  /**
   * Reset inactivity timer (call on user activity)
   */
  resetInactivityTimer: () => void;
  
  /**
   * Register a new user with zero-knowledge encryption
   * @param password - User's chosen password
   * @returns Salt and auth hash for server registration
   */
  register: (password: string) => Promise<{ salt: string; authHash: string }>;
  
  /**
   * Derive auth hash for login (safe to send to server)
   * @param password - User's password
   * @param salt - Salt from server
   * @returns Auth hash
   */
  getAuthHash: (password: string, salt: string) => string;
  
  /**
   * Set duress mode state (for mode switching during Session Verification)
   * @param isDuress - Whether to enable duress mode
   */
  setDuressMode?: (isDuress: boolean) => void;
  
  /**
   * Fast unlock for mode switching - skips auth verification since already verified
   * @param password - User's password
   * @param salt - Salt for key derivation
   * @param isDuress - Whether this is duress mode
   * @returns Success status
   */
  fastUnlockForModeSwitch?: (password: string, salt: string, isDuress: boolean) => Promise<{ success: boolean; error?: string }>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT CREATION
// ═══════════════════════════════════════════════════════════════════════════════

const CryptoContext = createContext<CryptoContextValue | undefined>(undefined);

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const CryptoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE - All sensitive data in memory only
  // ═══════════════════════════════════════════════════════════════════════════
  
  // ❌ CRITICAL: This key is NEVER stored persistently
  const masterKeyRef = useRef<CryptoKey | null>(null);
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vault, setVault] = useState<VaultData | null>(null);
  const [salt, setSalt] = useState<string | null>(null);
  const [timeUntilLock, setTimeUntilLock] = useState<number | null>(null);
  const [isDuressMode, setIsDuressMode] = useState(false);
  const [lockReason, setLockReason] = useState<LockReason>(null);
  
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const tabHiddenTimeRef = useRef<number | null>(null);

  // Log initial state for debugging
  useEffect(() => {
    logger.log('[KEY] CryptoContext initialized. Initial state:');
    logger.log('  - isUnlocked:', isUnlocked);
    logger.log('  - isLoading:', isLoading);
    logger.log('  - masterKey exists:', masterKeyRef.current !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCK - Wipe key from memory
  // ═══════════════════════════════════════════════════════════════════════════
  
  const lock = useCallback((reason: LockReason = 'manual') => {
    logger.log('[LOCK] Locking vault - wiping master key from memory. Reason:', reason);
    logger.debug('Lock function call stack:'); // Add stack trace to see who called lock
    
    // Store the reason for UI messaging
    setLockReason(reason);
    
    // Wipe the master key
    masterKeyRef.current = null;
    
    // Clear state
    setIsUnlocked(false);
    setVault(null);
    setIsDuressMode(false);
    setTimeUntilLock(null);
    
    // Clear timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    // Only broadcast logout for non-panic reasons
    // Panic mode should just lock the vault, NOT trigger full logout
    if (reason !== 'panic') {
      broadcastLogout('USER_LOGOUT');
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // INACTIVITY TIMER - DISABLED (Auto-lock removed per user request)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const resetInactivityTimer = useCallback(() => {
    // Auto-lock feature disabled - inactivity timer is no longer active
    // Only panic mode can lock the vault
    lastActivityRef.current = Date.now();
    
    // Clear any existing timers if they somehow exist
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    setTimeUntilLock(null);
    
    // DO NOT set new timer - auto-lock is disabled
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // USER ACTIVITY LISTENERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (!isUnlocked) return;
    
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };
    
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    
    // Initial timer
    resetInactivityTimer();
    
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [isUnlocked, resetInactivityTimer]);

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB VISIBILITY - Lock on long absence
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden - record time
        tabHiddenTimeRef.current = Date.now();
      } else {
        // Tab visible again
        if (tabHiddenTimeRef.current && isUnlocked) {
          const hiddenDuration = Date.now() - tabHiddenTimeRef.current;
          if (hiddenDuration > CONFIG.REFOCUS_REAUTH_THRESHOLD_MS) {
            logger.log('[TIMER] Tab was hidden too long - requiring re-authentication');
            lock();
          }
        }
        tabHiddenTimeRef.current = null;
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isUnlocked, lock]);

  // ═══════════════════════════════════════════════════════════════════════════
  // UNLOCK - Derive key and decrypt vault
  // ═══════════════════════════════════════════════════════════════════════════
  
  const unlock = useCallback(async (
    password: string,
    providedSalt?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      // Get salt from server if not provided
      let userSalt = providedSalt;
      if (!userSalt) {
        const response = await apiClient.get('/profile/');
        userSalt = response.data.encryption_salt;
      }
      
      if (!userSalt) {
        return { success: false, error: 'No encryption salt found. Please re-register.' };
      }
      
      logger.log('[CRYPTO] Deriving keys with Argon2id...');
      const startTime = Date.now();
      
      // Derive both master key and auth hash
      const { masterKey, authHash } = await deriveAllKeys(password, userSalt);
      
      const derivationTime = Date.now() - startTime;
      logger.log(`[OK] Key derivation completed in ${derivationTime}ms`);
      
      // ZERO-KNOWLEDGE: Verify auth_hash with server FIRST
      // This ensures we know if password is correct before trying to decrypt vault
      try {
        const verifyResponse = await apiClient.post('/zk/verify/', { auth_hash: authHash });
        if (!verifyResponse.data.verified) {
          logger.log('[SEC] Auth hash verification failed - wrong password');
          return { success: false, error: 'Invalid password' };
        }
        logger.log('[OK] Password verified via zero-knowledge auth');
      } catch (verifyError: unknown) {
        // If verify endpoint returns 401, password is wrong
        const status = (verifyError as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          logger.log('[SEC] Auth hash verification failed - wrong password');
          return { success: false, error: 'Invalid password' };
        }
        // Other errors - continue anyway (fallback to vault decryption check)
        console.warn('[WARN] Auth verification request failed, falling back to vault decryption', verifyError);
      }
      
      // Store key in memory only (NOT in storage)
      masterKeyRef.current = masterKey;
      setSalt(userSalt);
      
      // Fetch and decrypt vault from server
      try {
        const vaultResponse = await apiClient.get('/vault/');
        
        if (vaultResponse.data.vault_blob) {
          logger.log('[VAULT] Decrypting vault...');
          try {
            const decryptedVault = await decryptVault(vaultResponse.data.vault_blob, masterKey);
            setVault(decryptedVault);
            setIsDuressMode(false);
          } catch (decryptError) {
            // Main vault decryption failed - check if this might be duress mode
            if (vaultResponse.data.decoy_vault_blob) {
              try {
                logger.log('[UNLOCK] Attempting duress vault decryption...');
                const decoyVault = await decryptVault(
                  vaultResponse.data.decoy_vault_blob,
                  masterKey
                );
                setVault(decoyVault);
                setIsDuressMode(true);
                logger.log('[WARN] Duress mode activated - showing decoy vault');
              } catch {
                // Decoy decryption also failed - vault is corrupted
                // Password was already verified, so create fresh vault
                console.warn('[WARN] Vault corrupted. Creating new vault...');
                setVault(createEmptyVault());
              }
            } else {
              // Vault decryption failed but password was verified
              // This means vault data is corrupted - create fresh vault
              console.warn('[WARN] Vault decryption failed but password verified. Creating new vault...');
              setVault(createEmptyVault());
            }
          }
        } else {
          // No vault exists - create empty one
          logger.log('[VAULT] Creating new vault...');
          setVault(createEmptyVault());
        }
      } catch (vaultError: unknown) {
        // API error fetching vault
        console.error('Failed to fetch vault:', vaultError);
        masterKeyRef.current = null;
        return { success: false, error: 'Failed to fetch vault from server' };
      }
      
      setIsUnlocked(true);
      logger.log('[OK] Vault unlocked successfully! isUnlocked should now be true.');
      resetInactivityTimer();
      
      return { success: true };
    } catch (error: unknown) {
      console.error('Unlock failed:', error);
      masterKeyRef.current = null;
      const message = error instanceof Error ? error.message : 'Unlock failed';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [resetInactivityTimer]);

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE VAULT - Encrypt and sync to server
  // ═══════════════════════════════════════════════════════════════════════════
  
  const updateVault = useCallback(async (
    updater: (vault: VaultData) => VaultData
  ): Promise<void> => {
    if (!masterKeyRef.current || !vault) {
      throw new Error('Vault is locked');
    }
    
    // Update vault in memory
    const updatedVault = updater(vault);
    setVault(updatedVault);
    
    // Encrypt and sync to server
    logger.log('[SYNC] Encrypting and syncing vault...');
    const encryptedBlob = await encryptVault(updatedVault, masterKeyRef.current);
    
    await apiClient.put('/vault/', {
      vault_blob: encryptedBlob,
    });
    
    logger.log('[OK] Vault synced to server');
  }, [vault]);

  // ═══════════════════════════════════════════════════════════════════════════
  // GET MASTER KEY - For encryption operations
  // ═══════════════════════════════════════════════════════════════════════════
  
  const getMasterKey = useCallback((): CryptoKey | null => {
    return masterKeyRef.current;
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTER - Create new user with encryption
  // ═══════════════════════════════════════════════════════════════════════════
  
  const register = useCallback(async (password: string): Promise<{
    salt: string;
    authHash: string;
  }> => {
    const keys = await deriveAllKeys(password);
    return {
      salt: keys.salt,
      authHash: keys.authHash,
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // GET AUTH HASH - For login verification
  // ═══════════════════════════════════════════════════════════════════════════
  
  const getAuthHash = useCallback((password: string, userSalt: string): string => {
    return deriveAuthHash(password, userSalt);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // SET DURESS MODE - For switching between normal and duress mode
  // ═══════════════════════════════════════════════════════════════════════════
  
  const setDuressMode = useCallback((isDuress: boolean) => {
    logger.log('[CryptoContext] Setting duress mode:', isDuress);
    setIsDuressMode(isDuress);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // FAST UNLOCK FOR MODE SWITCH - Optimized for Session Verification
  // Skips auth verification since /zk/switch-mode/ already verified the password
  // ═══════════════════════════════════════════════════════════════════════════
  
  const fastUnlockForModeSwitch = useCallback(async (
    password: string,
    userSalt: string,
    isDuress: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      logger.log(`[CRYPTO] Fast unlock for ${isDuress ? 'DURESS' : 'NORMAL'} mode...`);
      const startTime = Date.now();
      
      // Derive master key only (skip auth hash since already verified by switch-mode)
      const masterKey = await deriveMasterKey(password, userSalt);
      
      const derivationTime = Date.now() - startTime;
      logger.log(`[OK] Key derivation completed in ${derivationTime}ms`);
      
      // Store key in memory only
      masterKeyRef.current = masterKey;
      setSalt(userSalt);
      
      // Fetch vault from server (will return correct vault based on DuressSession)
      try {
        const vaultResponse = await apiClient.get('/vault/');
        
        if (vaultResponse.data.vault_blob) {
          logger.log('[VAULT] Decrypting vault...');
          try {
            const decryptedVault = await decryptVault(vaultResponse.data.vault_blob, masterKey);
            setVault(decryptedVault);
          } catch (decryptError: unknown) {
            // Decryption failed - this could happen if vault is corrupted
            // Since password was verified by switch-mode, create empty vault
            const message = decryptError instanceof Error ? decryptError.message : 'Unknown error';
            console.warn('[WARN] Vault decryption failed, creating new vault:', message);
            setVault(createEmptyVault());
          }
        } else {
          // No vault exists - create empty one
          logger.log('[VAULT] Creating new vault...');
          setVault(createEmptyVault());
        }
      } catch (vaultError: unknown) {
        console.error('Failed to fetch vault:', vaultError);
        masterKeyRef.current = null;
        return { success: false, error: 'Failed to fetch vault from server' };
      }
      
      // Set duress mode state
      setIsDuressMode(isDuress);
      setIsUnlocked(true);
      resetInactivityTimer();
      
      logger.log(`[OK] Fast unlock complete in ${Date.now() - startTime}ms`);
      
      return { success: true };
    } catch (error: unknown) {
      console.error('Fast unlock failed:', error);
      masterKeyRef.current = null;
      const message = error instanceof Error ? error.message : 'Unlock failed';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [resetInactivityTimer]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT VALUE
  // ═══════════════════════════════════════════════════════════════════════════
  
  const contextValue = useMemo<CryptoContextValue>(() => ({
    isUnlocked,
    isLoading,
    vault,
    salt,
    timeUntilLock,
    isDuressMode,
    lockReason,
    unlock,
    lock,
    updateVault,
    getMasterKey,
    resetInactivityTimer,
    register,
    getAuthHash,
    setDuressMode,
    fastUnlockForModeSwitch,
  }), [
    isUnlocked,
    isLoading,
    vault,
    salt,
    timeUntilLock,
    isDuressMode,
    lockReason,
    unlock,
    lock,
    updateVault,
    getMasterKey,
    resetInactivityTimer,
    register,
    getAuthHash,
    setDuressMode,
    fastUnlockForModeSwitch,
  ]);

  return (
    <CryptoContext.Provider value={contextValue}>
      {children}
    </CryptoContext.Provider>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export const useCrypto = (): CryptoContextValue => {
  const context = useContext(CryptoContext);
  if (!context) {
    throw new Error('useCrypto must be used within a CryptoProvider');
  }
  return context;
};

export default CryptoContext;
