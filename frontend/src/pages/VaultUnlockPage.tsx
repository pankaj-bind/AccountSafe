// ═══════════════════════════════════════════════════════════════════════════════
// Vault Unlock Page
// ═══════════════════════════════════════════════════════════════════════════════
//
// This page appears when:
// 1. User is logged in but vault is locked (after inactivity timeout)
// 2. User returns to a tab that was locked
// 3. Initial vault unlock after login
//
// The master password is used ONLY to derive the encryption key locally.
// It is NEVER sent to the server.
//
// DURESS MODE (Ghost Vault):
// Users can unlock with duress password to reveal decoy vault while triggering SOS alerts
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCrypto } from '../services/CryptoContext';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';

const VaultUnlockPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDuressMode, setIsDuressMode] = useState(false);
  const [sosEmail, setSosEmail] = useState('');
  const [sosError, setSosError] = useState<string | null>(null);
  const [isDuressAlert, setIsDuressAlert] = useState(false);
  const [hasDuressPassword, setHasDuressPassword] = useState(false);
  
  const passwordInputRef = useRef<HTMLInputElement>(null);
  
  const { unlock, isUnlocked, isLoading } = useCrypto();
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Focus password input on mount
  useEffect(() => {
    passwordInputRef.current?.focus();
  }, []);

  // Check if user has duress password setup
  useEffect(() => {
    const checkDuressSetup = async () => {
      try {
        const response = await apiClient.get('/profile/');
        setHasDuressPassword(response.data.has_duress_password || false);
        setSosEmail(response.data.sos_email || '');
      } catch (err) {
        console.warn('Failed to check duress setup:', err);
      }
    };
    if (token) {
      checkDuressSetup();
    }
  }, [token]);
  
  // Redirect if already unlocked
  useEffect(() => {
    if (isUnlocked) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isUnlocked, navigate, location]);
  
  // Redirect to login if no token
  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);
  
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Please enter your master password');
      return;
    }
    
    setIsUnlocking(true);
    setError(null);
    setSosError(null);
    
    try {
      const result = await unlock(password);
      
      if (result.success) {
        // If in duress mode and SOS alert enabled, send alert
        if (isDuressAlert && sosEmail) {
          try {
            await apiClient.post('/zk/sos-alert/', {
              sos_email: sosEmail,
              timestamp: new Date().toISOString(),
            });
            console.log('🚨 SOS alert triggered');
          } catch (sosErr) {
            console.warn('Failed to send SOS alert:', sosErr);
            // Don't fail unlock if SOS alert fails
          }
        }
        
        // Clear password from state immediately
        setPassword('');
        
        // Navigate to intended destination
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Invalid password');
        // Clear password on failure
        setPassword('');
        passwordInputRef.current?.focus();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to unlock vault');
      setPassword('');
    } finally {
      setIsUnlocking(false);
    }
  };
  
  const handleLogout = () => {
    setPassword('');
    logout();
    navigate('/login', { replace: true });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Lock Icon */}
        <div className="flex justify-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl"
          >
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </motion.div>
        </div>
        
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Vault Locked</h1>
          <p className="text-gray-400">
            Enter your master password to unlock your vault
          </p>
        </div>
        
        {/* Unlock Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-slate-700/50"
        >
          <form onSubmit={handleUnlock}>
            {/* Password Input */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Master Password
              </label>
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter your master password"
                  disabled={isUnlocking || isLoading}
                  className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    error ? 'border-red-500' : 'border-slate-600'
                  }`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
        {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* SOS Error Message */}
            {sosError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-400 text-sm"
              >
                {sosError}
              </motion.div>
            )}
            
            {/* Duress Mode Section */}
            {hasDuressPassword && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDuressMode}
                    onChange={(e) => {
                      setIsDuressMode(e.target.checked);
                      if (e.target.checked && sosEmail) {
                        setIsDuressAlert(true);
                      }
                    }}
                    className="w-4 h-4 rounded"
                  />
                  <div className="flex items-center gap-2 text-red-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
                    </svg>
                    <span className="font-medium">Emergency Mode (SOS)</span>
                  </div>
                </label>
                {isDuressMode && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-sm text-red-300 ml-7"
                  >
                    Using duress password - alert{sosEmail ? ` will be sent to ${sosEmail}` : 's configured'}
                  </motion.p>
                )}
              </motion.div>
            )}
            
            {/* Unlock Button */}
            <button
              type="submit"
              disabled={isUnlocking || isLoading || !password.trim()}
              className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                isUnlocking || isLoading || !password.trim()
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isUnlocking || isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Unlocking vault...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Unlock Vault</span>
                </>
              )}
            </button>
          </form>
          
          {/* Logout Link */}
          <div className="mt-6 text-center">
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Switch account or logout
            </button>
          </div>
        </motion.div>
        
        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-500 text-xs flex items-center justify-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>Zero-knowledge encryption • Your password never leaves this device</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VaultUnlockPage;
