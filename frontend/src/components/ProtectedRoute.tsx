import React, { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePanic } from '../contexts/PanicContext';
import { useCrypto } from '../services/CryptoContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token } = useAuth();
  const { isPanicLocked, unlock: unlockPanic } = usePanic();
  const { lock, isUnlocked } = useCrypto();

  /**
   * When panic mode is triggered, lock the vault
   * This integrates panic mode with zero-knowledge architecture
   */
  useEffect(() => {
    if (isPanicLocked && isUnlocked) {
      console.log('🚨 Panic mode active - locking vault');
      lock('panic');
    }
  }, [isPanicLocked, isUnlocked, lock]);

  /**
   * When vault is unlocked successfully, also unlock panic state
   * This ensures both systems stay in sync
   */
  useEffect(() => {
    if (isUnlocked && isPanicLocked) {
      console.log('✅ Vault unlocked - clearing panic state');
      unlockPanic();
    }
  }, [isUnlocked, isPanicLocked, unlockPanic]);

  // If not authenticated, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // VaultGuard (wrapped around children in App.tsx) handles showing the lock screen
  // So we just return children here - the guard will block if vault is locked
  return <>{children}</>;
};

export default ProtectedRoute;
