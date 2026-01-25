import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePanic } from '../contexts/PanicContext';
import { useCrypto } from '../services/CryptoContext';
import { storeKeyData } from '../services/encryptionService';
import { deriveAuthHash } from '../services/cryptoService';
import axios from 'axios';
import PanicLockScreen from './PanicLockScreen';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/';

/**
 * GlobalPanicHandler
 * 
 * This component renders the panic lock screen GLOBALLY whenever panic mode is triggered.
 * It ensures that no matter what page the user is on, they will see the lock screen.
 * 
 * Zero-Knowledge Architecture:
 * - Master key is wiped from memory on panic
 * - Session password is cleared
 * - User must re-enter password to unlock
 * - No sensitive data is stored permanently
 * - Supports BOTH master and duress password for unlock
 * - Can SWITCH between normal and duress mode based on which password is entered
 */
const GlobalPanicHandler: React.FC = () => {
  const { token, logout: authLogout } = useAuth();
  const { isPanicLocked, previousLocation, unlock: unlockPanic } = usePanic();
  const { fastUnlockForModeSwitch } = useCrypto();
  const navigate = useNavigate();

  /**
   * Handle unlock with password re-entry
   * 
   * Zero-knowledge mode switching:
   * - User can enter EITHER master OR duress password
   * - Server determines which password was used via auth_hash comparison
   * - Server switches DuressSession accordingly
   * - Client receives correct salt and unlocks appropriate vault
   * 
   * OPTIMIZED: Uses fastUnlockForModeSwitch which skips redundant auth verification
   * since /zk/switch-mode/ already verified the password.
   */
  const handleUnlock = useCallback(async (password: string) => {
    const username = localStorage.getItem('username');
    const authToken = localStorage.getItem('authToken');
    
    if (!username) {
      throw new Error('No username found');
    }
    
    if (!authToken) {
      throw new Error('No auth token found - please login again');
    }
    
    // Create axios config with auth header (bypass apiClient to avoid auto-logout on 401)
    const axiosConfig = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${authToken}`
      }
    };
    
    try {
      // Fetch both salts from server (both are public info)
      const saltResponse = await axios.get(`${API_URL}zk/salt/?username=${encodeURIComponent(username)}`);
      const masterSalt = saltResponse.data.salt;
      const duressSalt = saltResponse.data.duress_salt;
      
      if (!masterSalt) {
        throw new Error('Encryption salt not found');
      }
      
      // Try with master salt first - derive auth_hash and call switch-mode
      const masterAuthHash = deriveAuthHash(password, masterSalt);
      
      try {
        // Call switch-mode endpoint - verifies auth_hash and switches DuressSession
        const switchResponse = await axios.post(`${API_URL}zk/switch-mode/`, {
          auth_hash: masterAuthHash
        }, axiosConfig);
        
        if (switchResponse.data.verified) {
          const useSalt = switchResponse.data.salt;
          const isDuress = switchResponse.data.is_duress;
          
          // Use fast unlock - skips auth verification since switch-mode already verified
          if (fastUnlockForModeSwitch) {
            const result = await fastUnlockForModeSwitch(password, useSalt, isDuress);
            
            if (result.success) {
              storeKeyData(useSalt);
              localStorage.setItem(`encryption_salt_${username}`, useSalt);
              
              // Unlock panic state
              unlockPanic();
              
              const targetLocation = previousLocation || '/';
              console.log(`✅ Mode switch complete: ${isDuress ? 'DURESS' : 'NORMAL'} mode`);
              
              // Force navigation to refresh the page with new vault data
              navigate(targetLocation, { replace: true });
              
              // Trigger a small delay then force re-render by navigating
              setTimeout(() => {
                window.dispatchEvent(new Event('vault-mode-changed'));
              }, 100);
              
              return;
            } else {
              // Fast unlock failed - throw the error
              console.error('Fast unlock failed:', result.error);
              throw new Error(result.error || 'Failed to unlock vault');
            }
          }
        }
      } catch (masterError: unknown) {
        // Master auth failed, try duress salt if available
        const axiosError = masterError as { response?: { status?: number } };
        if (axiosError.response?.status === 401 && duressSalt) {
          console.log('🔄 Trying alternate password...');
          
          const duressAuthHash = deriveAuthHash(password, duressSalt);
          
          const switchResponse = await axios.post(`${API_URL}zk/switch-mode/`, {
            auth_hash: duressAuthHash
          }, axiosConfig);
          
          if (switchResponse.data.verified) {
            const useSalt = switchResponse.data.salt;
            const isDuress = switchResponse.data.is_duress;
            
            // Use fast unlock
            if (fastUnlockForModeSwitch) {
              const result = await fastUnlockForModeSwitch(password, useSalt, isDuress);
              
              if (result.success) {
                storeKeyData(useSalt);
                localStorage.setItem(`encryption_salt_${username}`, useSalt);
                
                unlockPanic();
                
                const targetLocation = previousLocation || '/';
                console.log(`✅ Mode switch complete: ${isDuress ? 'DURESS' : 'NORMAL'} mode`);
                
                navigate(targetLocation, { replace: true });
                
                setTimeout(() => {
                  window.dispatchEvent(new Event('vault-mode-changed'));
                }, 100);
                
                return;
              } else {
                // Fast unlock failed - throw the error
                console.error('Fast unlock failed:', result.error);
                throw new Error(result.error || 'Failed to unlock vault');
              }
            }
          }
        }
        
        throw masterError;
      }
      
      throw new Error('Invalid password');
    } catch (err: unknown) {
      console.error('Unlock failed:', err);
      const axiosError = err as { response?: { data?: { error?: string } }; message?: string };
      throw new Error(axiosError.response?.data?.error || axiosError.message || 'Incorrect password');
    }
  }, [fastUnlockForModeSwitch, unlockPanic, previousLocation, navigate]);
  
  /**
   * Handle logout from panic screen
   */
  const handleLogout = useCallback(() => {
    // Clear panic state first
    unlockPanic();
    // Then logout
    authLogout();
    navigate('/login', { replace: true });
  }, [authLogout, unlockPanic, navigate]);

  // Only show when logged in AND panic locked
  if (!token || !isPanicLocked) {
    return null;
  }

  return (
    <PanicLockScreen 
      isOpen={true} 
      onUnlock={handleUnlock}
      onLogout={handleLogout}
    />
  );
};

export default GlobalPanicHandler;
