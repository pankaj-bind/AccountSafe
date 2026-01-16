import React, { useEffect, useCallback, useRef } from 'react';
import { clearEncryptionKeys } from '../services/encryptionService';
import { getPanicDuressSettings } from '../services/securityService';
import { usePanic } from '../contexts/PanicContext';

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
  const [isLoaded, setIsLoaded] = React.useState(false);
  const shortcutRef = useRef<string[]>([]);
  const fetchCountRef = useRef(0);
  const { isPanicLocked, triggerPanic: triggerPanicContext } = usePanic();

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
    
    // 3. Trigger global panic lock via context
    triggerPanicContext();
  }, [onPanic, triggerPanicContext]);

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

  // Set up global keyboard listeners
  useEffect(() => {
    if (!isLoaded || isPanicLocked) return;

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
  }, [isLoaded, isPanicLocked, triggerPanic]);

  // This component only handles keyboard detection
  // The lock screen is rendered by ProtectedRoute when isPanicLocked is true
  return null;
};

export default PanicListener;
