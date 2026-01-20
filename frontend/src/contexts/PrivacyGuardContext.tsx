// src/contexts/PrivacyGuardContext.tsx

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';

interface PrivacyGuardContextType {
  isBlurred: boolean;
  enablePrivacyBlur: boolean;
  togglePrivacyBlur: () => void;
  setEnablePrivacyBlur: (enabled: boolean) => void;
}

const PrivacyGuardContext = createContext<PrivacyGuardContextType | undefined>(undefined);

export const PrivacyGuardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // User preference - stored in localStorage
  const [enablePrivacyBlur, setEnablePrivacyBlurState] = useState<boolean>(() => {
    const saved = localStorage.getItem('enablePrivacyBlur');
    return saved !== null ? JSON.parse(saved) : true; // Default enabled
  });

  // Active blur state
  const [isBlurred, setIsBlurred] = useState<boolean>(false);

  // Toggle preference
  const togglePrivacyBlur = useCallback(() => {
    setEnablePrivacyBlurState(prev => {
      const newValue = !prev;
      localStorage.setItem('enablePrivacyBlur', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  // Set preference directly
  const setEnablePrivacyBlur = useCallback((enabled: boolean) => {
    setEnablePrivacyBlurState(enabled);
    localStorage.setItem('enablePrivacyBlur', JSON.stringify(enabled));
  }, []);

  // Consolidated security check function
  const checkSecurity = useCallback(() => {
    if (!enablePrivacyBlur) {
      setIsBlurred(false);
      return;
    }

    // Aggressive check: Blur if EITHER condition is true
    const shouldBlur = document.hidden || !document.hasFocus();
    setIsBlurred(shouldBlur);
  }, [enablePrivacyBlur]);

  // Handle all visibility/focus events
  useEffect(() => {
    if (!enablePrivacyBlur) {
      setIsBlurred(false);
      return;
    }

    // Initial check on mount (handles background app opening)
    checkSecurity();

    // Event listeners for all scenarios
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
      } else {
        // Small delay to prevent flash on rapid tab switching
        setTimeout(() => {
          checkSecurity();
        }, 100);
      }
    };

    const handleWindowBlur = () => {
      // Triggered on Alt-Tab, clicking outside, etc.
      setIsBlurred(true);
    };

    const handleWindowFocus = () => {
      // Window regained focus - check if we should unblur
      setTimeout(() => {
        checkSecurity();
      }, 100);
    };

    // Register all event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [enablePrivacyBlur, checkSecurity]);

  return (
    <PrivacyGuardContext.Provider value={{ 
      isBlurred, 
      enablePrivacyBlur, 
      togglePrivacyBlur,
      setEnablePrivacyBlur 
    }}>
      {children}
    </PrivacyGuardContext.Provider>
  );
};

export const usePrivacyGuard = () => {
  const context = useContext(PrivacyGuardContext);
  if (context === undefined) {
    throw new Error('usePrivacyGuard must be used within a PrivacyGuardProvider');
  }
  return context;
};
