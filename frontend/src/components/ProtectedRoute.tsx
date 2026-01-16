import React, { ReactNode, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePanic } from '../contexts/PanicContext';
import { clearEncryptionKeys, storeMasterPasswordForSession } from '../services/encryptionService';
import { relogin } from '../services/authService';
import PanicLockScreen from './PanicLockScreen';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token } = useAuth();
  const { isPanicLocked, unlock } = usePanic();

  /**
   * Handle unlock with password re-entry
   * Supports both master password (unlock) and duress password (re-login with fake vault)
   */
  const handleUnlock = useCallback(async (password: string) => {
    const username = localStorage.getItem('username');
    
    if (!username) {
      throw new Error('No username found');
    }
    
    try {
      const result = await relogin(username, password);
      
      if (result.success) {
        // Login successful - could be duress or master
        storeMasterPasswordForSession(password);
        
        // Unlock the panic state
        unlock();
        
        // Reload to fetch data with the new session
        console.log('✅ Re-login successful, reloading to apply new session...');
        window.location.reload();
        return;
      }
    } catch (err) {
      console.log('Re-login attempt failed:', err);
    }
    
    throw new Error('Incorrect password');
  }, [unlock]);

  // If not authenticated, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If panic locked, show lock screen INSTEAD of children
  // This completely blocks access to the protected content
  if (isPanicLocked) {
    return (
      <PanicLockScreen 
        isOpen={true} 
        onUnlock={handleUnlock}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
