import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearEncryptionKeys } from '../services/encryptionService';
import { useProfile } from '../contexts/ProfileContext';

interface PanicLockScreenProps {
  isOpen: boolean;
  onUnlock: (password: string) => void;
}

const LockIcon = () => (
  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const PanicLockScreen: React.FC<PanicLockScreenProps> = ({ isOpen, onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const { profilePicture, displayName } = useProfile();
  const username = displayName || localStorage.getItem('username') || 'User';
  const navigate = useNavigate();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setIsUnlocking(false);
    }
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const input = document.getElementById('panic-password-input');
      if (input) {
        setTimeout(() => input.focus(), 100);
      }
    }
  }, [isOpen]);

  // Block browser back button when panic mode is active
  useEffect(() => {
    if (isOpen) {
      // Push a state to prevent going back
      window.history.pushState(null, '', window.location.href);
      
      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        // Re-push state to keep user on the panic screen
        window.history.pushState(null, '', window.location.href);
      };
      
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setError(null);
    setIsUnlocking(true);

    try {
      await onUnlock(password);
      setPassword('');
    } catch (err: any) {
      setError('Incorrect password. Please try again.');
      setIsUnlocking(false);
      setPassword('');
      
      // Re-focus input after error
      setTimeout(() => {
        const input = document.getElementById('panic-password-input');
        if (input) input.focus();
      }, 100);
    }
  };

  const handleCancel = () => {
    // Properly log out the user
    localStorage.removeItem('authToken');
    clearEncryptionKeys();
    navigate('/');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[9999] bg-white dark:bg-zinc-950 flex items-start md:items-center justify-center p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-md my-auto py-4 md:py-0">
        {/* Logo and Title */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="p-2 md:p-3 bg-blue-500/10 dark:bg-blue-500/10 rounded-2xl border border-blue-500/20 dark:border-blue-500/20">
              <img src="/logo.png" alt="AccountSafe" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center justify-center gap-2">
            <LockIcon />
            Session Verification
          </h2>
          <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 px-4">
            Re-enter your password to decrypt your data
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-5 md:p-8 shadow-2xl">
          {/* User Info */}
          <div className="mb-5 md:mb-6 pb-5 md:pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt={username}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover ring-2 ring-blue-500/50"
                />
              ) : (
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-base md:text-lg">
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">Locked vault for</p>
                <p className="text-sm md:text-base font-medium text-zinc-900 dark:text-white">{username}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-5 md:mb-6 p-3 md:p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400 text-xs md:text-sm animate-in slide-in-from-top duration-200">
              <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            <div>
              <label htmlFor="panic-password-input" className="block text-xs md:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="panic-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                disabled={isUnlocking}
                autoComplete="current-password"
              />
              <p className="mt-2 text-[10px] md:text-xs text-zinc-500 dark:text-zinc-500">
                Your password is needed to decrypt your stored credentials. It is never stored permanently.
              </p>
            </div>

            <div className="flex gap-2.5 md:gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium transition-colors"
                disabled={isUnlocking}
              >
                Logout
              </button>
              <button
                type="submit"
                disabled={isUnlocking || !password}
                className="flex-1 px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUnlocking ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Unlocking...</span>
                  </>
                ) : (
                  <span>Unlock</span>
                )}
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-5 md:mt-6 pt-5 md:pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-start gap-2.5 md:gap-3 text-[10px] md:text-xs text-zinc-600 dark:text-zinc-500">
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <p>
                Your session was locked for security. Click "Logout" to sign out completely.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Hint */}
        <p className="mt-4 md:mt-6 text-center text-[10px] md:text-xs text-zinc-500 dark:text-zinc-600">
          🔐 End-to-end encrypted • Zero-knowledge architecture
        </p>
      </div>
    </div>
  );
};

export default PanicLockScreen;
