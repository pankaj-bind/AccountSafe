// hooks/useSessionMonitor.ts
import { useEffect, useRef } from 'react';
import apiClient from '../api/apiClient';
import { forceLogout } from '../utils/logoutEvent';

interface UseSessionMonitorProps {
  onSessionInvalid?: () => void;
  intervalMs?: number;
  enabled?: boolean;
}

/**
 * Hook to monitor session validity by polling the backend.
 * Automatically logs out if session is revoked from another device.
 */
export const useSessionMonitor = ({ 
  onSessionInvalid, 
  intervalMs = 2000, // Poll every 2 seconds for instant detection
  enabled = true 
}: UseSessionMonitorProps = {}) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const checkSession = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          // No token, user not logged in
          return;
        }

        // Validate session with backend
        await apiClient.get('/api/sessions/validate/');
        
        // Session is valid, continue
      } catch (error: any) {
        // Session is invalid (401/403) or network error
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Call custom callback if provided, otherwise force logout
          if (onSessionInvalid) {
            onSessionInvalid();
          } else {
            forceLogout();
          }
        }
        // Ignore network errors - don't logout on temporary connection issues
      }
    };

    // Initial check
    checkSession();

    // Set up polling interval
    intervalRef.current = setInterval(checkSession, intervalMs);

    // Also check when tab becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, intervalMs, onSessionInvalid]);
};
