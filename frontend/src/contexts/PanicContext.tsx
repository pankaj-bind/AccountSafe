import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { clearEncryptionKeys } from '../services/encryptionService';
import { logger } from '../utils/logger';

interface PanicContextType {
  isPanicLocked: boolean;
  previousLocation: string | null;
  triggerPanic: (lockVault?: () => void) => void;
  unlock: () => void;
}

const PanicContext = createContext<PanicContextType | undefined>(undefined);

// localStorage key for panic state persistence (shared across all tabs)
const PANIC_STATE_KEY = 'accountsafe_panic_locked';
const PANIC_LOCATION_KEY = 'accountsafe_panic_location';

export const PanicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from localStorage to persist across ALL tabs
  const [isPanicLocked, setIsPanicLocked] = useState(() => {
    return localStorage.getItem(PANIC_STATE_KEY) === 'true';
  });
  
  const [previousLocation, setPreviousLocation] = useState<string | null>(() => {
    return localStorage.getItem(PANIC_LOCATION_KEY);
  });
  
  // Store the lock function reference
  const lockVaultRef = useRef<(() => void) | null>(null);

  // Sync to localStorage when state changes
  useEffect(() => {
    if (isPanicLocked) {
      localStorage.setItem(PANIC_STATE_KEY, 'true');
      // Broadcast to all tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: PANIC_STATE_KEY,
        newValue: 'true',
        url: window.location.href
      }));
    } else {
      localStorage.removeItem(PANIC_STATE_KEY);
      // Broadcast to all tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: PANIC_STATE_KEY,
        newValue: null,
        url: window.location.href
      }));
    }
  }, [isPanicLocked]);

  // Listen for storage changes from other tabs (cross-tab communication)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PANIC_STATE_KEY) {
        const newValue = e.newValue === 'true';
        logger.log('[PanicContext] Storage change detected from another tab:', newValue);
        setIsPanicLocked(newValue);
        
        // If panic was triggered in another tab, reload this tab to show lock screen
        if (newValue) {
          logger.log('🚨 PANIC MODE ACTIVATED IN ANOTHER TAB - Reloading...');
          window.location.reload();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const triggerPanic = useCallback((lockVault?: () => void) => {
    logger.log('🚨 PANIC MODE ACTIVATED - Locking ALL tabs');
    
    // Store current location so we can return to it after unlock
    const currentPath = window.location.pathname;
    localStorage.setItem(PANIC_LOCATION_KEY, currentPath);
    setPreviousLocation(currentPath);
    
    // Clear session password immediately (zero-knowledge security)
    clearEncryptionKeys();
    
    // Lock vault if function is provided
    if (lockVault) {
      lockVault();
      lockVaultRef.current = lockVault;
    } else if (lockVaultRef.current) {
      lockVaultRef.current();
    }
    
    setIsPanicLocked(true);
  }, []);

  const unlock = useCallback(() => {
    logger.log('✅ Panic mode unlocked');
    setIsPanicLocked(false);
    localStorage.removeItem(PANIC_STATE_KEY);
    // Keep previousLocation in memory for navigation, but remove from storage
    localStorage.removeItem(PANIC_LOCATION_KEY);
  }, []);

  return (
    <PanicContext.Provider value={{ isPanicLocked, previousLocation, triggerPanic, unlock }}>
      {children}
    </PanicContext.Provider>
  );
};

export const usePanic = () => {
  const context = useContext(PanicContext);
  if (!context) {
    throw new Error('usePanic must be used within a PanicProvider');
  }
  return context;
};
