// utils/logoutEvent.ts
import { broadcastLogout } from '../hooks/useGlobalLogout';

/**
 * Simple event emitter for logout events.
 * Allows components to trigger and listen to logout events.
 */
class LogoutEventEmitter {
  private listeners: Array<() => void> = [];

  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  emit() {
    this.listeners.forEach(callback => callback());
  }
}

export const logoutEvent = new LogoutEventEmitter();

/**
 * Force logout by clearing all auth data and triggering logout event
 */
export const forceLogout = () => {
  console.warn('🔒 Force logout triggered - session revoked');
  
  // Clear all auth-related data
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  sessionStorage.clear();
  
  // 📡 Broadcast session expiry to all other tabs
  broadcastLogout('SESSION_EXPIRED');
  
  // Emit logout event to all listeners
  logoutEvent.emit();
  
  // Force redirect with replace to prevent back button
  window.location.replace('/login');
};
