import { useState, useEffect, useRef, useCallback } from 'react';

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
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

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
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.error('Clipboard not supported in this browser');
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
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.success(
          `Copied to clipboard! Will clear in ${clearAfter / 1000} seconds.`,
          { duration: 3000 }
        );
      }

      // Fire onCopy callback
      if (onCopy) {
        onCopy();
      }

      // Step 4 & 5: Start the auto-clear timer
      clearTimeoutRef.current = setTimeout(async () => {
        try {
          // Blind clear - write empty string
          await navigator.clipboard.writeText('');

          // Show info toast
          if (typeof window !== 'undefined' && (window as any).toast) {
            (window as any).toast.info('Clipboard cleared.', { duration: 2000 });
          }

          // Fire onClear callback
          if (onClear) {
            onClear();
          }
        } catch (clearError) {
          console.warn('[useClipboard] Failed to clear clipboard:', clearError);
        } finally {
          clearTimeoutRef.current = null;
        }
      }, clearAfter);

      return true;

    } catch (error) {
      console.error('[useClipboard] Failed to copy:', error);
      
      // Show error toast
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.error('Failed to copy to clipboard');
      }
      
      return false;
    }
  }, [isSupported, clearAfter, feedbackDuration, onCopy, onClear, cleanup]);

  return {
    copy,
    isCopied,
    isSupported,
  };
};

export default useClipboard;
