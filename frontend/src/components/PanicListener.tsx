import React, { useEffect, useCallback, useRef } from 'react';
import { getPanicDuressSettings } from '../services/securityService';
import { usePanic } from '../contexts/PanicContext';
import { logger } from '../utils/logger';
import { useCrypto } from '../services/CryptoContext';

interface PanicListenerProps {
  onPanic?: () => void;
}

/**
 * PanicListener Component
 * 
 * A global keyboard listener that monitors for the user's configured panic shortcut.
 * When triggered:
 * 1. Locks the vault via CryptoContext (wipes master key from memory)
 * 2. Triggers panic state for cross-tab synchronization
 * 3. Shows the unified lock screen
 * 
 * ZERO-KNOWLEDGE: No encryption keys are stored in sessionStorage anymore.
 * The master key is wiped directly from memory.
 */
const PanicListener: React.FC<PanicListenerProps> = ({ onPanic }) => {
  const shortcutRef = useRef<string[]>([]);
  const fetchCountRef = useRef(0);
  const { isPanicLocked, triggerPanic: triggerPanicContext } = usePanic();
  const { lock } = useCrypto();

  // Fetch panic shortcut configuration
  const fetchPanicSettings = useCallback(async () => {
    try {
      fetchCountRef.current += 1;
      logger.log(`[PanicListener] Fetching settings (attempt ${fetchCountRef.current})...`);
      
      const settings = await getPanicDuressSettings();
      
      if (settings && settings.panic_shortcut && Array.isArray(settings.panic_shortcut) && settings.panic_shortcut.length > 0) {
        shortcutRef.current = settings.panic_shortcut;
        logger.log('[PanicListener] Panic shortcut loaded:', settings.panic_shortcut);
      } else {
        // Default fallback: Escape key
        shortcutRef.current = ['Escape'];
        logger.log('[PanicListener] Using default panic shortcut: Escape');
      }
    } catch (error) {
      // Silently fail - use default shortcut
      console.debug('[PanicListener] Could not fetch panic settings, using default Escape key');
      shortcutRef.current = ['Escape'];
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchPanicSettings();
  }, [fetchPanicSettings]);

  // Listen for shortcut updates from SecuritySettingsPanel
  useEffect(() => {
    const handleShortcutUpdate = () => {
      logger.log('[PanicListener] Received panicShortcutUpdated event, refetching...');
      fetchPanicSettings();
    };

    window.addEventListener('panicShortcutUpdated', handleShortcutUpdate);
    
    return () => {
      window.removeEventListener('panicShortcutUpdated', handleShortcutUpdate);
    };
  }, [fetchPanicSettings]);

  /**
   * Handle panic mode activation
   * Uses zero-knowledge architecture - wipes master key from memory
   */
  const triggerPanic = useCallback(() => {
    logger.log('🚨 PANIC MODE ACTIVATED');
    
    // 1. Call optional callback for additional cleanup
    if (onPanic) {
      onPanic();
    }
    
    // 2. Trigger global panic lock via context (includes vault lock)
    // Pass the lock function to ensure vault is locked
    triggerPanicContext(() => lock('panic'));
  }, [lock, onPanic, triggerPanicContext]);

  // Listen for panic mode trigger from the UI button
  useEffect(() => {
    const handleTriggerPanic = () => {
      logger.log('[PanicListener] Received triggerPanicMode event from UI button');
      triggerPanic();
    };

    window.addEventListener('triggerPanicMode', handleTriggerPanic);
    
    return () => {
      window.removeEventListener('triggerPanicMode', handleTriggerPanic);
    };
  }, [triggerPanic]);

  // Set up global keyboard listeners - always active
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if already in panic mode (don't trigger again)
      if (isPanicLocked) {
        return;
      }
      
      try {
        const shortcut = shortcutRef.current;
        
        // Build current key combination
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
        
        // Skip if no shortcut configured (but should have default Escape)
        if (!shortcut || !Array.isArray(shortcut) || shortcut.length === 0) {
          // Use Escape as emergency fallback
          if (mainKey === 'Escape') {
            logger.log('🚨 Emergency Escape key detected!');
            event.preventDefault();
            event.stopPropagation();
            triggerPanic();
          }
          return;
        }

        // Check if lengths match
        if (currentKeys.length !== shortcut.length) return;

        // Sort and compare
        const normalizedPressed = currentKeys.map(k => k.toLowerCase()).sort();
        const normalizedShortcut = shortcut.map(k => k.toLowerCase()).sort();

        const matches = normalizedPressed.every((key, index) => key === normalizedShortcut[index]);
        
        if (matches) {
          logger.log('🚨 Panic shortcut detected!', shortcut);
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          triggerPanic();
        }
      } catch (err) {
        console.error('Error in panic listener:', err);
      }
    };

    // Add listener with capture phase to catch events early
    // Keep listener active all the time - check isPanicLocked inside handler
    logger.log('[PanicListener] Setting up keyboard listener. Shortcut:', shortcutRef.current);
    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [triggerPanic, isPanicLocked]);

  // This component only handles keyboard detection
  // The lock screen is rendered by GlobalPanicHandler when isPanicLocked is true
  return null;
};

export default PanicListener;
