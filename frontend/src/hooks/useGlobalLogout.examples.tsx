// Cross-Tab Global Logout - Implementation Documentation

/**
 * ARCHITECTURE OVERVIEW
 * =====================
 * 
 * This implementation uses the Broadcast Channel API to synchronize logout
 * events across all browser tabs. When a user logs out or their session expires
 * in ONE tab, ALL other tabs instantly lock/logout.
 * 
 * FLOW:
 * 1. User logs out in Tab A
 * 2. authService.logout() broadcasts "LOGOUT" message via BroadcastChannel
 * 3. Tab B, Tab C, etc. receive the broadcast via useGlobalLogout hook
 * 4. All tabs execute logout callback (clear state, redirect to login)
 * 5. BroadcastChannel automatically cleans up on component unmount
 * 
 * COMPONENTS:
 * -----------
 * 
 * 1. useGlobalLogout.ts (NEW)
 *    - Custom hook that listens for cross-tab logout broadcasts
 *    - Automatically cleans up with channel.close() on unmount
 *    - Supports both USER_LOGOUT and SESSION_EXPIRED events
 * 
 * 2. authService.ts (UPDATED)
 *    - logout() function now broadcasts to other tabs
 *    - Imported broadcastLogout helper
 * 
 * 3. logoutEvent.ts (UPDATED)
 *    - forceLogout() now broadcasts SESSION_EXPIRED
 *    - Used by session monitor for automatic logouts
 * 
 * 4. AuthContext.tsx (UPDATED)
 *    - Integrated useGlobalLogout hook
 *    - Listens for broadcasts and triggers logout
 * 
 * EDGE CASES HANDLED:
 * -------------------
 * 
 * ✅ Memory Leaks: channel.close() called on component unmount
 * ✅ Browser Support: Graceful degradation if BroadcastChannel unavailable
 * ✅ Session Expiry: Separate event type for expired sessions
 * ✅ Multiple Tabs: Works with unlimited number of open tabs
 * ✅ Same Origin: Only communicates between same-origin tabs (security)
 * 
 * TESTING:
 * --------
 * 
 * 1. Open 3+ tabs with your app logged in
 * 2. Click logout in one tab
 * 3. Verify all other tabs instantly redirect to login
 * 4. Open DevTools console to see broadcast logs
 * 
 * Expected Console Output:
 * Tab A (logout initiator): "📡 Broadcast sent: LOGOUT"
 * Tab B (receiver): "🔒 Cross-tab logout detected - logging out this tab"
 * Tab C (receiver): "🔒 Cross-tab logout detected - logging out this tab"
 * 
 * BROWSER SUPPORT:
 * ----------------
 * 
 * ✅ Chrome 54+
 * ✅ Edge 79+
 * ✅ Firefox 38+
 * ✅ Safari 15.4+
 * ✅ Opera 41+
 * ❌ IE (not supported - graceful degradation)
 * 
 * SECURITY CONSIDERATIONS:
 * ------------------------
 * 
 * 1. Same-Origin Policy: BroadcastChannel only works between same-origin tabs
 * 2. No sensitive data in broadcasts: Only event type and timestamp
 * 3. Complements (not replaces) backend session validation
 * 4. Works with existing useSessionMonitor for backend-driven logouts
 */

import { useGlobalLogout, broadcastLogout } from '../hooks/useGlobalLogout';

// USAGE EXAMPLE 1: In a React component
export const Example1 = () => {
  useGlobalLogout(() => {
    console.log('Logout detected in another tab!');
    // Your logout logic here
  });

  return <div>Your component</div>;
};

// USAGE EXAMPLE 2: Manual broadcast
export const Example2 = () => {
  const handleLogout = () => {
    // Do local logout
    localStorage.removeItem('authToken');
    
    // Broadcast to other tabs
    broadcastLogout('USER_LOGOUT');
  };

  return <button onClick={handleLogout}>Logout All Tabs</button>;
};

// USAGE EXAMPLE 3: Session expiry
export const Example3 = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSessionExpired = () => {
    // Clear session data
    sessionStorage.clear();
    
    // Broadcast session expiry to other tabs
    broadcastLogout('SESSION_EXPIRED');
  };

  return <div>Session monitor</div>;
};
