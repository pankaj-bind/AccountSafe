// hooks/useGlobalLogout.ts
import { useEffect, useRef } from 'react';
import { logger } from '../utils/logger';

/**
 * Cross-Tab Global Logout Hook using Broadcast Channel API
 * 
 * Listens for logout events from other tabs and triggers the callback
 * when a logout signal is received. Ensures all tabs lock/logout simultaneously.
 * 
 * @param onLogout - Callback function to execute when logout is detected
 * 
 * @example
 * ```tsx
 * useGlobalLogout(() => {
 *   setToken(null);
 *   clearEncryptionKeys();
 *   navigate('/login');
 * });
 * ```
 */
export const useGlobalLogout = (onLogout: () => void) => {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // Check if BroadcastChannel API is supported
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('⚠️ BroadcastChannel API not supported in this browser');
      return;
    }

    // Create a broadcast channel for auth events
    const channel = new BroadcastChannel('accountsafe_auth_channel');
    channelRef.current = channel;

    // Listen for logout messages from other tabs
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'LOGOUT') {
        logger.log('🔒 Cross-tab logout detected - logging out this tab');
        onLogout();
      } else if (event.data?.type === 'SESSION_EXPIRED') {
        logger.log('⏱️ Cross-tab session expiry detected - logging out this tab');
        onLogout();
      }
    };

    channel.addEventListener('message', handleMessage);

    logger.log('✅ Global logout listener initialized');

    // Cleanup: Close the channel when component unmounts
    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
      channelRef.current = null;
      logger.log('🧹 Global logout listener cleaned up');
    };
  }, [onLogout]);

  return channelRef;
};

/**
 * Broadcast a logout event to all other tabs
 * 
 * @param reason - Optional reason for the logout (e.g., 'USER_LOGOUT', 'SESSION_EXPIRED')
 */
export const broadcastLogout = (reason: 'USER_LOGOUT' | 'SESSION_EXPIRED' = 'USER_LOGOUT') => {
  // Check if BroadcastChannel API is supported
  if (typeof BroadcastChannel === 'undefined') {
    console.warn('⚠️ BroadcastChannel API not supported - skipping broadcast');
    return;
  }

  try {
    const channel = new BroadcastChannel('accountsafe_auth_channel');
    
    const messageType = reason === 'SESSION_EXPIRED' ? 'SESSION_EXPIRED' : 'LOGOUT';
    
    channel.postMessage({
      type: messageType,
      timestamp: Date.now(),
      reason,
    });
    
    logger.log(`📡 Broadcast sent: ${messageType}`);
    
    // Close the channel after sending the message
    channel.close();
  } catch (error) {
    console.error('❌ Failed to broadcast logout:', error);
  }
};
