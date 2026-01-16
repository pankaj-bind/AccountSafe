import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

interface PanicContextType {
  isPanicLocked: boolean;
  triggerPanic: () => void;
  unlock: () => void;
}

const PanicContext = createContext<PanicContextType | undefined>(undefined);

// localStorage key for panic state persistence (shared across all tabs)
const PANIC_STATE_KEY = 'accountsafe_panic_locked';

export const PanicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from localStorage to persist across ALL tabs
  const [isPanicLocked, setIsPanicLocked] = useState(() => {
    return localStorage.getItem(PANIC_STATE_KEY) === 'true';
  });

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
        console.log('[PanicContext] Storage change detected from another tab:', newValue);
        setIsPanicLocked(newValue);
        
        // If panic was triggered in another tab, reload this tab to show lock screen
        if (newValue) {
          console.log('🚨 PANIC MODE ACTIVATED IN ANOTHER TAB - Reloading...');
          window.location.reload();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const triggerPanic = useCallback(() => {
    console.log('🚨 PANIC MODE ACTIVATED - Locking ALL tabs');
    setIsPanicLocked(true);
  }, []);

  const unlock = useCallback(() => {
    console.log('✅ Panic mode unlocked');
    setIsPanicLocked(false);
    localStorage.removeItem(PANIC_STATE_KEY);
  }, []);

  return (
    <PanicContext.Provider value={{ isPanicLocked, triggerPanic, unlock }}>
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
