import { useState, useEffect, useRef, useCallback } from 'react';

// Type-safe toast interface for global window.toast
interface ToastFunction {
  info: (message: string, options?: { duration?: number }) => void;
  success: (message: string, options?: { duration?: number }) => void;
  error: (message: string, options?: { duration?: number }) => void;
}

// Extend Window interface for toast
declare global {
  interface Window {
    toast?: ToastFunction;
  }
}

interface UseClipboardOptions {
  clearAfter?: number; // milliseconds (default: 30000 = 30s)
  feedbackDuration?: number; // how long isCopied stays true (default: 2000ms)
  onCopy?: () => void;
  onClear?: () => void;
}

interface UseClipboardReturn {
  copy: (text: string) => Promise<boolean>;
  isCopied: boolean;
  isSupported: boolean;
}

/**
 * useClipboard - Secure clipboard hook with "Blind Auto-Clear"
 * 
 * Web-only implementation that avoids navigator.clipboard.readText()
 * to prevent annoying permission popups in browsers.
 * 
 * Strategy: Write to clipboard, then blindly clear after 30 seconds.
 * Trade-off: May overwrite user's newer clipboard data (accepted for security).
 * 
 * @example
 * const { copy, isCopied } = useClipboard();
 * 
 * <button onClick={() => copy(password)}>
 *   {isCopied ? <CheckIcon /> : <CopyIcon />}
 * </button>
 */
export const useClipboard = (options: UseClipboardOptions = {}): UseClipboardReturn => {
  const {
    clearAfter = 30000, // 30 seconds default
    feedbackDuration = 2000, // 2 seconds for icon feedback
    onCopy,
    onClear,
  } = options;

  // State for UI feedback (icon animation)
  const [isCopied, setIsCopied] = useState(false);

  // Refs for timer management
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Track when clipboard should be cleared (absolute timestamp)
  const clearAtRef = useRef<number | null>(null);

  // Check if Clipboard API is supported
  const isSupported = typeof navigator !== 'undefined' && 
                      typeof navigator.clipboard !== 'undefined' &&
                      typeof navigator.clipboard.writeText === 'function';

  /**
   * Cleanup all timers
   */
  const cleanup = useCallback(() => {
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    clearAtRef.current = null;
  }, []);

  /**
   * Actually clear the clipboard
   */
  const performClear = useCallback(async () => {
    try {
      await navigator.clipboard.writeText('');
      
      // Show info toast
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.info('Clipboard cleared.', { duration: 2000 });
      }

      // Fire onClear callback
      if (onClear) {
        onClear();
      }
      
      clearAtRef.current = null;
    } catch (clearError) {
      console.warn('[useClipboard] Failed to clear clipboard:', clearError);
    }
  }, [onClear]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Handle visibility change - clear clipboard when tab regains focus if time has passed
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && clearAtRef.current) {
        // Check if we have a pending clear that should have happened
        if (Date.now() >= clearAtRef.current) {
          // Time has passed, clear the clipboard now
          await performClear();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [performClear]);

  /**
   * Copy text to clipboard with auto-clear
   * 
   * @param text - The sensitive text to copy
   * @returns Promise<boolean> - true if copy succeeded
   */
  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!isSupported) {
      console.error('[useClipboard] Clipboard API not supported');
      // Fallback toast
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Clipboard not supported in this browser');
      }
      return false;
    }

    try {
      // Step 1: Cleanup any existing timers from previous copy
      cleanup();

      // Step 2: Write to clipboard
      await navigator.clipboard.writeText(text);

      // Step 3: UI Feedback
      setIsCopied(true);

      // Reset isCopied after feedbackDuration (for icon animation)
      feedbackTimeoutRef.current = setTimeout(() => {
        setIsCopied(false);
      }, feedbackDuration);

      // Show success toast
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.success(
          `Copied to clipboard! Will clear in ${clearAfter / 1000} seconds.`,
          { duration: 3000 }
        );
      }

      // Fire onCopy callback
      if (onCopy) {
        onCopy();
      }

      // Step 4: Set the absolute time when clipboard should be cleared
      const clearTime = Date.now() + clearAfter;
      clearAtRef.current = clearTime;

      // Step 5: Start the auto-clear timer
      clearTimeoutRef.current = setTimeout(async () => {
        // Only clear if document is focused, otherwise let visibilitychange handle it
        if (document.hasFocus()) {
          await performClear();
        }
        // Note: If not focused, clearAtRef is still set, so visibilitychange will handle it
        clearTimeoutRef.current = null;
      }, clearAfter);

      return true;

    } catch (error) {
      console.error('[useClipboard] Failed to copy:', error);
      
      // Show error toast
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Failed to copy to clipboard');
      }
      
      return false;
    }
  }, [isSupported, clearAfter, feedbackDuration, onCopy, performClear, cleanup]);

  return {
    copy,
    isCopied,
    isSupported,
  };
};

export default useClipboard;
