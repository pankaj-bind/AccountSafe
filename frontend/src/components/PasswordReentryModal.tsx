import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { storeKeyData } from '../services/encryptionService';
import { useCrypto } from '../services/CryptoContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/';

interface PasswordReentryModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

const LockIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

/**
 * PasswordReentryModal
 * 
 * Prompts user to re-enter password to unlock the vault.
 * Supports BOTH master and duress password while maintaining zero-knowledge architecture.
 */
const PasswordReentryModal: React.FC<PasswordReentryModalProps> = ({
  isOpen,
  onSuccess,
  onCancel
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { unlock } = useCrypto();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const username = localStorage.getItem('username');
      if (!username) {
        setError('Session expired. Please log in again.');
        window.location.href = '/login';
        return;
      }

      // Fetch both salts from server (both are public info)
      const saltResponse = await axios.get(`${API_URL}zk/salt/?username=${encodeURIComponent(username)}`);
      const masterSalt = saltResponse.data.salt;
      const duressSalt = saltResponse.data.duress_salt;

      if (!masterSalt) {
        setError('Encryption setup not found. Please contact support.');
        setIsLoading(false);
        return;
      }

      // Try unlock with master salt first
      let result = await unlock(password, masterSalt);
      
      if (result.success) {
        // Store salt for future reference (salt is public, safe to store)
        storeKeyData(masterSalt);
        localStorage.setItem(`encryption_salt_${username}`, masterSalt);
        
        setPassword('');
        onSuccess();
        return;
      }
      
      // If master salt failed and duress_salt exists, try with duress salt
      if (duressSalt) {
        console.log('🔄 Master password failed, trying duress password...');
        result = await unlock(password, duressSalt);
        
        if (result.success) {
          // Store duress salt for this session
          storeKeyData(duressSalt);
          localStorage.setItem(`encryption_salt_${username}`, duressSalt);
          
          setPassword('');
          onSuccess();
          return;
        }
      }
      
      // Both passwords failed
      setError('Invalid password. Please try again.');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        window.location.href = '/login';
      } else {
        setError('Failed to verify. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <LockIcon className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Session Verification
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Re-enter your password to decrypt your data
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="Enter your password"
                  required
                  autoFocus
                />
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Your password is needed to decrypt your stored credentials. It is never stored permanently.
              </p>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !password}
                  className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Verifying...' : 'Unlock'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PasswordReentryModal;
