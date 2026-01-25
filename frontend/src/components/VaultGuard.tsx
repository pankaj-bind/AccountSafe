// ═══════════════════════════════════════════════════════════════════════════════
// VaultGuard Component
// ═══════════════════════════════════════════════════════════════════════════════
//
// ZERO-KNOWLEDGE ARCHITECTURE:
// This component ensures the vault is unlocked before rendering children.
// - NO auto-unlock from session storage (password is never stored)
// - Master key lives only in CryptoContext memory
// - If vault is locked, shows Session Verification screen
// - Uses unified PanicLockScreen for all lock scenarios
//
// Usage:
//   <VaultGuard>
//     <ProtectedContent />
//   </VaultGuard>
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrypto } from '../services/CryptoContext';
import { logger } from '../utils/logger';
import { usePanic } from '../contexts/PanicContext';
import { useAuth } from '../contexts/AuthContext';
import { storeKeyData } from '../services/encryptionService';
import { deriveAuthHash } from '../services/cryptoService';
import PanicLockScreen from './PanicLockScreen';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/';

interface VaultGuardProps {
  children: React.ReactNode;
}

const VaultGuard: React.FC<VaultGuardProps> = ({ children }) => {
  const { isUnlocked, isLoading, fastUnlockForModeSwitch } = useCrypto();
  const { isPanicLocked, unlock: unlockPanic } = usePanic();
  const { logout: authLogout } = useAuth();
  const navigate = useNavigate();

  // Handle unlock with password re-entry (same logic as GlobalPanicHandler)
  const handleUnlock = useCallback(async (password: string) => {
    const username = localStorage.getItem('username');
    const authToken = localStorage.getItem('authToken');
    
    if (!username) {
      throw new Error('No username found');
    }
    
    if (!authToken) {
      throw new Error('No auth token found - please login again');
    }
    
    const axiosConfig = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${authToken}`
      }
    };
    
    try {
      // Fetch both salts from server
      const saltResponse = await axios.get(`${API_URL}zk/salt/?username=${encodeURIComponent(username)}`);
      const masterSalt = saltResponse.data.salt;
      const duressSalt = saltResponse.data.duress_salt;
      
      if (!masterSalt) {
        throw new Error('Encryption salt not found');
      }
      
      // Try with master salt first
      const masterAuthHash = deriveAuthHash(password, masterSalt);
      
      try {
        const switchResponse = await axios.post(`${API_URL}zk/switch-mode/`, {
          auth_hash: masterAuthHash
        }, axiosConfig);
        
        if (switchResponse.data.verified) {
          const useSalt = switchResponse.data.salt;
          const isDuress = switchResponse.data.is_duress;
          
          if (fastUnlockForModeSwitch) {
            const result = await fastUnlockForModeSwitch(password, useSalt, isDuress);
            
            if (result.success) {
              storeKeyData(useSalt);
              localStorage.setItem(`encryption_salt_${username}`, useSalt);
              
              // Unlock panic state if it was locked
              if (isPanicLocked) {
                unlockPanic();
              }
              
              logger.log(`✅ Vault unlocked: ${isDuress ? 'DURESS' : 'NORMAL'} mode`);
              
              setTimeout(() => {
                window.dispatchEvent(new Event('vault-mode-changed'));
              }, 100);
              
              return;
            } else {
              throw new Error(result.error || 'Failed to unlock vault');
            }
          }
        }
      } catch (masterError: unknown) {
        // Master auth failed, try duress salt if available
        const axiosError = masterError as { response?: { status?: number } };
        if (axiosError.response?.status === 401 && duressSalt) {
          logger.log('🔄 Trying alternate password...');
          
          const duressAuthHash = deriveAuthHash(password, duressSalt);
          
          const switchResponse = await axios.post(`${API_URL}zk/switch-mode/`, {
            auth_hash: duressAuthHash
          }, axiosConfig);
          
          if (switchResponse.data.verified) {
            const useSalt = switchResponse.data.salt;
            const isDuress = switchResponse.data.is_duress;
            
            if (fastUnlockForModeSwitch) {
              const result = await fastUnlockForModeSwitch(password, useSalt, isDuress);
              
              if (result.success) {
                storeKeyData(useSalt);
                localStorage.setItem(`encryption_salt_${username}`, useSalt);
                
                if (isPanicLocked) {
                  unlockPanic();
                }
                
                logger.log(`✅ Vault unlocked: ${isDuress ? 'DURESS' : 'NORMAL'} mode`);
                
                setTimeout(() => {
                  window.dispatchEvent(new Event('vault-mode-changed'));
                }, 100);
                
                return;
              } else {
                throw new Error(result.error || 'Failed to unlock vault');
              }
            }
          }
        }
        
        // Re-throw error for handling
        throw masterError;
      }
    } catch (error: unknown) {
      console.error('Unlock error:', error);
      throw new Error('Incorrect password. Please try again.');
    }
  }, [fastUnlockForModeSwitch, isPanicLocked, unlockPanic]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await authLogout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      navigate('/login', { replace: true });
    }
  }, [authLogout, navigate]);

  // Show loading state while checking vault status
  if (isLoading) {
    logger.log('VaultGuard: Loading vault...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#09090b]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading vault...</p>
        </div>
      </div>
    );
  }

  // If vault is locked (for ANY reason), show the Session Verification screen
  if (!isUnlocked) {
    logger.log('VaultGuard: Vault is locked, showing Session Verification');
    return (
      <PanicLockScreen
        isOpen={true}
        onUnlock={handleUnlock}
        onLogout={handleLogout}
      />
    );
  }
  
  logger.log('VaultGuard: Vault is unlocked, rendering children');

  // Vault is unlocked - render children
  return <>{children}</>;
};

export default VaultGuard;
