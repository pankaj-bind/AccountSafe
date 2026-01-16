import React, { useEffect, useCallback, useState, useRef } from 'react';
import { clearEncryptionKeys, storeMasterPasswordForSession } from '../services/encryptionService';
import { getPanicDuressSettings, verifyPassword } from '../services/securityService';
import { relogin } from '../services/authService';
import PanicLockScreen from './PanicLockScreen';

interface PanicListenerProps {
  onPanic?: () => void;
}

/**
 * PanicListener Component
 * 
 * A global keyboard listener that monitors for the user's configured panic shortcut.
 * When triggered:
 * 1. Clears encryption keys from memory
 * 2. Shows a Windows Lock Screen-style modal
 * 3. Requires password re-entry to decrypt data
 * 
 * Listens for 'panicShortcutUpdated' custom event to refetch settings when changed.
 */
const PanicListener: React.FC<PanicListenerProps> = ({ onPanic }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const shortcutRef = useRef<string[]>([]);
  const fetchCountRef = useRef(0);

  // Fetch panic shortcut configuration
  const fetchPanicSettings = useCallback(async () => {
    try {
      fetchCountRef.current += 1;
      console.log(`[PanicListener] Fetching settings (attempt ${fetchCountRef.current})...`);
      
      const settings = await getPanicDuressSettings();
      
      if (settings && settings.panic_shortcut && Array.isArray(settings.panic_shortcut) && settings.panic_shortcut.length > 0) {
        shortcutRef.current = settings.panic_shortcut;
        console.log('[PanicListener] Panic shortcut loaded:', settings.panic_shortcut);
      } else {
        shortcutRef.current = [];
        console.log('[PanicListener] No panic shortcut configured');
      }
    } catch (error) {
      // Silently fail - user may not be logged in
      console.debug('[PanicListener] Could not fetch panic settings');
      shortcutRef.current = [];
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchPanicSettings();
  }, [fetchPanicSettings]);

  // Listen for shortcut updates from SecuritySettingsPanel
  useEffect(() => {
    const handleShortcutUpdate = () => {
      console.log('[PanicListener] Received panicShortcutUpdated event, refetching...');
      fetchPanicSettings();
    };

    window.addEventListener('panicShortcutUpdated', handleShortcutUpdate);
    
    return () => {
      window.removeEventListener('panicShortcutUpdated', handleShortcutUpdate);
    };
  }, [fetchPanicSettings]);

  /**
   * Handle panic mode activation
   */
  const triggerPanic = useCallback(() => {
    console.log('🚨 PANIC MODE ACTIVATED');
    
    // 1. Clear all encryption keys from memory immediately
    clearEncryptionKeys();
    sessionStorage.clear();
    
    // 2. Call optional callback for additional cleanup
    if (onPanic) {
      onPanic();
    }
    
    // 3. Show lock screen modal
    setIsLocked(true);
  }, [onPanic]);

  // Listen for panic mode trigger from the UI button
  useEffect(() => {
    const handleTriggerPanic = () => {
      console.log('[PanicListener] Received triggerPanicMode event from UI button');
      triggerPanic();
    };

    window.addEventListener('triggerPanicMode', handleTriggerPanic);
    
    return () => {
      window.removeEventListener('triggerPanicMode', handleTriggerPanic);
    };
  }, [triggerPanic]);

  /**
   * Handle unlock with password re-entry
   * Supports both master password (unlock) and duress password (re-login with fake vault)
   */
  const handleUnlock = useCallback(async (password: string) => {
    const username = localStorage.getItem('username');
    
    if (!username) {
      throw new Error('No username found');
    }
    
    // Always re-login to get a fresh token (master or duress)
    // This ensures:
    // 1. Switching from duress to master clears the duress session
    // 2. Switching from master to duress creates a new duress session
    // 3. Re-entering same password type refreshes the session
    try {
      const result = await relogin(username, password);
      
      if (result.success) {
        // Login successful - could be duress or master
        // Store the password for encryption key derivation
        storeMasterPasswordForSession(password);
        
        // Reload the page to fetch data with the new token
        // This will show fake vault if it was a duress login
        // or real vault if it was a master login
        console.log('✅ Re-login successful, reloading to apply new session...');
        window.location.reload();
        return;
      }
    } catch (err) {
      console.log('Re-login attempt failed:', err);
    }
    
    // Login failed
    throw new Error('Incorrect password');
  }, []);

  // Set up global keyboard listeners
  useEffect(() => {
    if (!isLoaded || isLocked) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      try {
        const shortcut = shortcutRef.current;
        if (!shortcut || !Array.isArray(shortcut) || shortcut.length === 0) return;

        const currentKeys: string[] = [];
        
        // Capture modifiers
        if (event.ctrlKey || event.metaKey) currentKeys.push('Ctrl');
        if (event.altKey) currentKeys.push('Alt');
        if (event.shiftKey) currentKeys.push('Shift');
        
        // Capture main key - with null check
        const mainKey = event.key;
        if (mainKey && typeof mainKey === 'string' && !['Control', 'Alt', 'Shift', 'Meta'].includes(mainKey)) {
          const normalizedKey = mainKey.length === 1 ? mainKey.toUpperCase() : mainKey;
          if (!currentKeys.includes(normalizedKey)) {
            currentKeys.push(normalizedKey);
          }
        }

        // Debug: Log every key combo when debugging
        // Uncomment next line for debugging:
        // console.log('[PanicListener] Key pressed:', currentKeys, 'Expected:', shortcut);

        // Check if lengths match
        if (currentKeys.length !== shortcut.length) return;

        // Sort and compare
        const normalizedPressed = currentKeys.map(k => k.toLowerCase()).sort();
        const normalizedShortcut = shortcut.map(k => k.toLowerCase()).sort();

        const matches = normalizedPressed.every((key, index) => key === normalizedShortcut[index]);
        
        console.log('[PanicListener] Checking match:', {
          pressed: normalizedPressed,
          expected: normalizedShortcut,
          matches
        });
        
        if (matches) {
          console.log('🚨 Panic shortcut detected!', shortcut);
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          triggerPanic();
        }
      } catch (err) {
        console.error('Error in panic listener:', err);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isLoaded, isLocked, triggerPanic]);

  return (
    <>
      <PanicLockScreen isOpen={isLocked} onUnlock={handleUnlock} />
    </>
  );
};

export default PanicListener;
