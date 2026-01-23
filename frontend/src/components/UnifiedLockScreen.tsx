// ═══════════════════════════════════════════════════════════════════════════════
// Unified Lock Screen Component
// ═══════════════════════════════════════════════════════════════════════════════
//
// This is the SINGLE lock screen for AccountSafe, handling:
// 1. Panic mode lock (user pressed panic button)
// 2. Inactivity lock (vault auto-locked)
// 3. Tab visibility lock (user returned after being away)
//
// ZERO-KNOWLEDGE ARCHITECTURE:
// - Password is used to derive master key via Argon2id (memory-hard)
// - Key derivation happens entirely client-side
// - Password NEVER leaves this component
// - Server only receives encrypted vault blobs
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrypto, LockReason } from '../services/CryptoContext';
import { useProfile } from '../contexts/ProfileContext';
import { logout } from '../services/authService';
import { storeKeyData } from '../services/encryptionService';
import apiClient from '../api/apiClient';

interface UnifiedLockScreenProps {
  reason?: LockReason;
}

const LockIcon = () => (
  <svg className="w-10 h-10 md:w-12 md:h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-4 h-4 md:w-5 md:h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const UnifiedLockScreen: React.FC<UnifiedLockScreenProps> = ({ reason: propReason }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [derivationProgress, setDerivationProgress] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { unlock, isLoading: cryptoLoading, lockReason } = useCrypto();
  const { profilePicture, displayName } = useProfile();
  const username = displayName || localStorage.getItem('username') || 'User';
  
  // Use prop reason or fall back to context's lockReason
  const reason = propReason || lockReason || 'inactivity';

  // Get reason-specific messaging
  const getReasonMessage = () => {
    switch (reason) {
      case 'panic':
        return 'Session locked for security';
      case 'visibility':
        return 'Session locked while you were away';
      case 'manual':
        return 'Session manually locked';
      case 'logout':
        return 'Please log in again';
      default:
        return 'Session locked due to inactivity';
    }
  };

  // Block browser back button when lock screen is active
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Focus password input on mount
  useEffect(() => {
    const input = document.getElementById('unlock-password-input');
    if (input) setTimeout(() => input.focus(), 100);
  }, []);

  /**
   * Handle vault unlock with zero-knowledge architecture
   * 
   * Flow:
   * 1. Password entered by user
   * 2. Argon2id derives master key (memory-hard, ~2 seconds)
   * 3. Master key decrypts vault blob locally
   * 4. Vault data available in memory only
   * 5. ZERO-KNOWLEDGE: Password is NOT stored - only CryptoKey lives in memory
   */
  const handleUnlock = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setError(null);
    setIsUnlocking(true);
    setDerivationProgress('Deriving encryption key...');

    try {
      // This happens entirely client-side using Argon2id
      // Password is used to derive the key
      const result = await unlock(password);
      
      if (result.success) {
        setDerivationProgress('Decrypting vault...');
        
        // ZERO-KNOWLEDGE: Password is NOT stored anywhere
        // Only the derived CryptoKey lives in CryptoContext memory
        
        // Only store salt (public data, safe to store)
        try {
          const profileResponse = await apiClient.get('/profile/');
          const salt = profileResponse.data.encryption_salt;
          const username = profileResponse.data.username;
          if (salt) {
            storeKeyData(salt);
            localStorage.setItem(`encryption_salt_${username}`, salt);
          }
        } catch (err) {
          console.error('Failed to store encryption data:', err);
        }
        
        setPassword('');
        // Success! CryptoContext now has the vault unlocked
      } else {
        setError(result.error || 'Invalid password');
        setPassword('');
        setIsUnlocking(false);
        setDerivationProgress(null);
        
        // Re-focus input after error
        setTimeout(() => {
          const input = document.getElementById('unlock-password-input');
          if (input) input.focus();
        }, 100);
      }
    } catch (err: any) {
      console.error('Unlock error:', err);
      setError(err.message || 'Failed to unlock vault');
      setPassword('');
      setIsUnlocking(false);
      setDerivationProgress(null);
    }
  }, [password, unlock]);

  /**
   * Handle logout - clears all data and redirects to home
   */
  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 flex items-center justify-center p-4 overflow-y-auto">
      {/* Animated background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
            <img 
              src="/logo.png" 
              alt="AccountSafe" 
              className="w-14 h-14 object-contain"
              onError={(e) => {
                // Fallback if logo doesn't exist
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Lock Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30">
            <LockIcon />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Vault Locked
          </h1>
          <p className="text-sm md:text-base text-zinc-400">
            {getReasonMessage()}
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-2xl p-6 md:p-8 shadow-2xl">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-700/50">
            {profilePicture ? (
              <img 
                src={profilePicture} 
                alt={username}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/50"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs text-zinc-500">Locked vault for</p>
              <p className="font-medium text-white">{username}</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top duration-200">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Derivation Progress */}
          {derivationProgress && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-3 text-blue-400 text-sm">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {derivationProgress}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleUnlock} className="space-y-6">
            <div>
              <label htmlFor="unlock-password-input" className="block text-sm font-medium text-zinc-300 mb-2">
                Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="unlock-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                  placeholder="Enter your master password"
                  disabled={isUnlocking || cryptoLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Your password is used locally to decrypt your vault. It never leaves your device.
              </p>
            </div>

            <button
              type="submit"
              disabled={isUnlocking || cryptoLoading || !password}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {isUnlocking || cryptoLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Unlocking...</span>
                </>
              ) : (
                <>
                  <LockIcon />
                  <span>Unlock Vault</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isUnlocking}
              className="w-full px-4 py-2 text-zinc-400 hover:text-white text-sm transition-colors"
            >
              Switch account or logout
            </button>
          </form>
        </div>

        {/* Security Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
            <ShieldIcon />
            <span>Zero-knowledge encryption • Your password never leaves this device</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLockScreen;
