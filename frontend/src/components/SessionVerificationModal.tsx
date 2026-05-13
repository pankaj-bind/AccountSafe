import React, { useState, useEffect, useRef } from 'react';
import { verifyPassword } from '../services/securityService';
import { Lock, AlertCircle, RefreshCcw } from 'lucide-react';

interface SessionVerificationModalProps {
  isOpen: boolean;
  onUnlock: () => void;
  username: string;
}

const SessionVerificationModal: React.FC<SessionVerificationModalProps> = ({ isOpen, onUnlock, username }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Prevent background interactions
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
    return undefined;
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsVerifying(true);

    try {
      // Verify password
      const isValid = await verifyPassword(password);
      if (!isValid) {
        throw new Error('Invalid password');
      }
      setPassword('');
      onUnlock();
    } catch (err) {
      setError('Incorrect password. Please try again.');
      setPassword('');
      inputRef.current?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    // For panic mode, we don't allow cancel - user must unlock
    // You could add logout functionality here if needed
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm">
      {/* Lock Screen Container */}
      <div className="w-full max-w-md px-4">
        {/* Logo and Lock Icon */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/20">
              <img src="/logo.png" alt="AccountSafe" className="w-16 h-16 object-contain" />
            </div>
          </div>
          <div className="flex justify-center mb-4">
            <Lock className="w-12 h-12 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Session Verification</h2>
          <p className="text-zinc-400">Re-enter your password to decrypt your data</p>
        </div>

        {/* Verification Card */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="session-password" className="block text-sm font-medium text-zinc-300 mb-2">
                Password
              </label>
              <input
                ref={inputRef}
                type="password"
                id="session-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                disabled={isVerifying}
                autoComplete="current-password"
              />
              <p className="mt-2 text-xs text-zinc-500">
                Your password is needed to decrypt your stored credentials. It is never stored permanently.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-3 bg-zinc-800 text-zinc-300 rounded-lg font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isVerifying}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying || !password}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <RefreshCcw className="animate-spin h-4 w-4" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  'Unlock'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Your vault has been locked for security
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionVerificationModal;
