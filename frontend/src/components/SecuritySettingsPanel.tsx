import React, { useState, useEffect, useCallback } from 'react';
import {
  getPanicDuressSettings,
  setPanicShortcut,
  clearPanicShortcut,
  setDuressPassword,
  clearDuressPassword,
  isForbiddenShortcut,
  formatKeyCombo,
  PanicDuressSettings
} from '../services/securityService';

// Icons
const KeyboardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const SecuritySettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<PanicDuressSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Panic shortcut states
  const [isRecordingShortcut, setIsRecordingShortcut] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  const [shortcutError, setShortcutError] = useState<string | null>(null);

  // Duress password states
  const [showDuressModal, setShowDuressModal] = useState(false);
  const [duressFormData, setDuressFormData] = useState({
    masterPassword: '',
    duressPassword: '',
    confirmDuressPassword: '',
    sosEmail: ''
  });
  const [duressError, setDuressError] = useState<string | null>(null);
  const [isSavingDuress, setIsSavingDuress] = useState(false);

  // Clear duress states
  const [showClearDuressModal, setShowClearDuressModal] = useState(false);
  const [clearMasterPassword, setClearMasterPassword] = useState('');
  const [isClearingDuress, setIsClearingDuress] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getPanicDuressSettings();
        setSettings(data);
      } catch (err: any) {
        setError('Failed to load security settings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Handle key recording
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isRecordingShortcut) return;
    
    event.preventDefault();
    event.stopPropagation();

    const keys: string[] = [];
    
    // Capture modifier keys
    if (event.ctrlKey || event.metaKey) keys.push('Ctrl');
    if (event.altKey) keys.push('Alt');
    if (event.shiftKey) keys.push('Shift');
    
    // Capture the main key (not a modifier)
    const mainKey = event.key;
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(mainKey)) {
      // Normalize the key
      const normalizedKey = mainKey.length === 1 ? mainKey.toUpperCase() : mainKey;
      if (!keys.includes(normalizedKey)) {
        keys.push(normalizedKey);
      }
    }
    
    // Update recorded keys and validate
    if (keys.length >= 2 && keys.length <= 3) {
      setRecordedKeys(keys);
      setShortcutError(null);
    } else if (keys.length === 1) {
      setRecordedKeys(keys);
      setShortcutError('Press a modifier key (Ctrl, Alt, Shift) with another key');
    } else if (keys.length > 3) {
      setShortcutError('Maximum 3 keys allowed');
    }
  }, [isRecordingShortcut]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!isRecordingShortcut) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    // Get the current combination from the event directly to avoid stale state
    const keys: string[] = [];
    if (event.ctrlKey || event.metaKey) keys.push('Ctrl');
    if (event.altKey) keys.push('Alt');
    if (event.shiftKey) keys.push('Shift');
    
    // If all modifier keys are released, save the shortcut
    if (keys.length === 0) {
      // Use the recorded keys from state
      setTimeout(() => {
        setRecordedKeys(currentKeys => {
          if (currentKeys.length >= 2 && currentKeys.length <= 3) {
            if (isForbiddenShortcut(currentKeys)) {
              setShortcutError('This key combination conflicts with browser shortcuts. Please choose another.');
              return [];
            }
            
            // Save the shortcut
            saveShortcut(currentKeys);
            return currentKeys;
          }
          return currentKeys;
        });
      }, 50);
    }
  }, [isRecordingShortcut]);

  useEffect(() => {
    if (isRecordingShortcut) {
      window.addEventListener('keydown', handleKeyDown, true);
      window.addEventListener('keyup', handleKeyUp, true);
      return () => {
        window.removeEventListener('keydown', handleKeyDown, true);
        window.removeEventListener('keyup', handleKeyUp, true);
      };
    }
  }, [isRecordingShortcut, handleKeyDown, handleKeyUp]);

  const startRecording = () => {
    setRecordedKeys([]);
    setShortcutError(null);
    setIsRecordingShortcut(true);
  };

  const cancelRecording = () => {
    setIsRecordingShortcut(false);
    setRecordedKeys([]);
    setShortcutError(null);
  };

  const saveShortcut = async (keys: string[]) => {
    setIsRecordingShortcut(false);
    
    try {
      const result = await setPanicShortcut(keys);
      setSettings(prev => prev ? { ...prev, panic_shortcut: result.panic_shortcut } : prev);
      setSuccess(`Panic shortcut saved: ${formatKeyCombo(keys)}`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Notify PanicListener to refetch the shortcut
      window.dispatchEvent(new CustomEvent('panicShortcutUpdated'));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save shortcut');
    } finally {
      setRecordedKeys([]);
    }
  };

  const handleClearShortcut = async () => {
    try {
      await clearPanicShortcut();
      setSettings(prev => prev ? { ...prev, panic_shortcut: [] } : prev);
      setSuccess('Panic shortcut cleared');
      setTimeout(() => setSuccess(null), 3000);
      
      // Notify PanicListener to refetch the shortcut
      window.dispatchEvent(new CustomEvent('panicShortcutUpdated'));
    } catch (err: any) {
      setError('Failed to clear shortcut');
    }
  };

  const handleSaveDuress = async () => {
    setDuressError(null);

    if (!duressFormData.masterPassword) {
      setDuressError('Please enter your master password');
      return;
    }

    if (!duressFormData.duressPassword || duressFormData.duressPassword.length < 8) {
      setDuressError('Duress password must be at least 8 characters');
      return;
    }

    if (duressFormData.duressPassword !== duressFormData.confirmDuressPassword) {
      setDuressError('Duress passwords do not match');
      return;
    }

    if (!duressFormData.sosEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(duressFormData.sosEmail)) {
      setDuressError('Please enter a valid SOS email address');
      return;
    }

    setIsSavingDuress(true);

    try {
      await setDuressPassword(
        duressFormData.masterPassword,
        duressFormData.duressPassword,
        duressFormData.sosEmail
      );
      setSettings(prev => prev ? { ...prev, has_duress_password: true, sos_email: duressFormData.sosEmail } : prev);
      setShowDuressModal(false);
      setDuressFormData({ masterPassword: '', duressPassword: '', confirmDuressPassword: '', sosEmail: '' });
      setSuccess('Ghost Vault configured successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setDuressError(err.response?.data?.error || 'Failed to save duress settings');
    } finally {
      setIsSavingDuress(false);
    }
  };

  const handleClearDuress = async () => {
    if (!clearMasterPassword) {
      setDuressError('Please enter your master password');
      return;
    }

    setIsClearingDuress(true);

    try {
      await clearDuressPassword(clearMasterPassword);
      setSettings(prev => prev ? { ...prev, has_duress_password: false, sos_email: null } : prev);
      setShowClearDuressModal(false);
      setClearMasterPassword('');
      setSuccess('Ghost Vault disabled');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setDuressError(err.response?.data?.error || 'Failed to clear duress settings');
    } finally {
      setIsClearingDuress(false);
    }
  };

  if (isLoading) {
    return (
      <div className="as-card p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="as-alert-success flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}
      {error && (
        <div className="as-alert-danger flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">×</button>
        </div>
      )}

      {/* Panic Button Section */}
      <div className="as-card p-6">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
          <span className="text-red-500 dark:text-red-400"><KeyboardIcon /></span>
          Panic Button Shortcut
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Set a keyboard shortcut to instantly lock your vault and clear encryption keys from memory.
        </p>

        {/* Trigger Panic Button */}
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h4 className="text-sm font-medium text-red-400">Emergency Lock</h4>
              <p className="text-xs text-zinc-500">Click to immediately lock your vault</p>
            </div>
            <button
              onClick={() => {
                // Dispatch a custom event that PanicListener will catch
                window.dispatchEvent(new CustomEvent('triggerPanicMode'));
              }}
              className="px-6 py-3 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-500 transition-all shadow-lg shadow-red-500/25 hover:shadow-red-500/40 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              PANIC MODE
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            {isRecordingShortcut ? (
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={recordedKeys.length > 0 ? formatKeyCombo(recordedKeys) : 'Press your shortcut...'}
                  className="as-input text-center font-mono animate-pulse border-red-500"
                  placeholder="Press keys..."
                />
                <button
                  onClick={cancelRecording}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                onClick={startRecording}
                className="as-input cursor-pointer text-center font-mono hover:border-blue-500 transition-colors"
              >
                {settings?.panic_shortcut && Array.isArray(settings.panic_shortcut) && settings.panic_shortcut.length > 0
                  ? formatKeyCombo(settings.panic_shortcut)
                  : 'Click to record shortcut'}
              </div>
            )}
            {shortcutError && (
              <p className="text-xs text-red-400 mt-1">{shortcutError}</p>
            )}
          </div>

          <div className="flex gap-2">
            {!isRecordingShortcut && (
              <>
                <button
                  onClick={startRecording}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
                >
                  {settings?.panic_shortcut && Array.isArray(settings.panic_shortcut) && settings.panic_shortcut.length > 0 ? 'Change' : 'Set'}
                </button>
                {settings?.panic_shortcut && Array.isArray(settings.panic_shortcut) && settings.panic_shortcut.length > 0 && (
                  <button
                    onClick={handleClearShortcut}
                    className="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-3">
          💡 Tip: Use a combination like <code className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded text-zinc-900 dark:text-zinc-100">Alt + X</code> or <code className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded text-zinc-900 dark:text-zinc-100">Ctrl + Shift + L</code>
        </p>
      </div>

      {/* Ghost Vault (Duress Password) Section - Hidden in duress mode */}
      {settings?.has_duress_password !== false && (
      <div className="as-card p-6 border-amber-500/30">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
          <span className="text-amber-500 dark:text-amber-400"><EyeSlashIcon /></span>
          Ghost Vault (Duress Password)
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Set a secondary password that, when used to log in, shows a decoy vault with fake credentials. 
          An alert email will be sent to your SOS contact immediately.
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${settings?.has_duress_password ? 'bg-green-500' : 'bg-zinc-600'}`}></div>
              <span className="text-sm text-zinc-300">
                {settings?.has_duress_password
                  ? `Active • SOS Email: ${settings.sos_email || 'Not set'}`
                  : 'Not configured'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowDuressModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-500 transition-colors"
            >
              {settings?.has_duress_password ? 'Update' : 'Configure'}
            </button>
            {settings?.has_duress_password && (
              <button
                onClick={() => setShowClearDuressModal(true)}
                className="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors"
              >
                Disable
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-xs text-amber-200">
            ⚠️ <strong>Important:</strong> The duress password must be different from your master password. 
            When used, you'll see fake accounts (Netflix, Spotify, etc.) while your real vault stays hidden.
          </p>
        </div>
      </div>
      )}

      {/* Duress Password Modal */}
      {showDuressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="as-modal max-w-md w-full rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-5 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
                <EyeSlashIcon />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-white">Configure Ghost Vault</h3>
                <p className="text-xs text-white/80">Set up duress authentication</p>
              </div>
            </div>

            <div className="px-6 py-6 bg-white dark:bg-zinc-950 space-y-4">
              {duressError && (
                <div className="as-alert-danger text-sm">{duressError}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Master Password (to confirm)
                </label>
                <input
                  type="password"
                  value={duressFormData.masterPassword}
                  onChange={e => setDuressFormData(prev => ({ ...prev, masterPassword: e.target.value }))}
                  className="as-input"
                  placeholder="Enter your master password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Duress Password
                </label>
                <input
                  type="password"
                  value={duressFormData.duressPassword}
                  onChange={e => setDuressFormData(prev => ({ ...prev, duressPassword: e.target.value }))}
                  className="as-input"
                  placeholder="Enter duress password (min 8 chars)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Confirm Duress Password
                </label>
                <input
                  type="password"
                  value={duressFormData.confirmDuressPassword}
                  onChange={e => setDuressFormData(prev => ({ ...prev, confirmDuressPassword: e.target.value }))}
                  className="as-input"
                  placeholder="Confirm duress password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  SOS Email Address
                </label>
                <input
                  type="email"
                  value={duressFormData.sosEmail}
                  onChange={e => setDuressFormData(prev => ({ ...prev, sosEmail: e.target.value }))}
                  className="as-input"
                  placeholder="Alert will be sent to this email"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  This email will receive an alert when the duress password is used.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
              <button
                onClick={handleSaveDuress}
                disabled={isSavingDuress}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isSavingDuress ? 'Saving...' : 'Save Configuration'}
              </button>
              <button
                onClick={() => {
                  setShowDuressModal(false);
                  setDuressError(null);
                  setDuressFormData({ masterPassword: '', duressPassword: '', confirmDuressPassword: '', sosEmail: '' });
                }}
                className="px-6 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Duress Modal */}
      {showClearDuressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="as-modal max-w-sm w-full rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-5">
              <h3 className="text-lg font-semibold text-white">Disable Ghost Vault</h3>
              <p className="text-xs text-white/80">Enter your master password to confirm</p>
            </div>

            <div className="px-6 py-6 bg-white dark:bg-zinc-950">
              {duressError && (
                <div className="as-alert-danger text-sm mb-4">{duressError}</div>
              )}
              <input
                type="password"
                value={clearMasterPassword}
                onChange={e => setClearMasterPassword(e.target.value)}
                className="as-input"
                placeholder="Enter master password"
              />
            </div>

            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
              <button
                onClick={handleClearDuress}
                disabled={isClearingDuress}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isClearingDuress ? 'Disabling...' : 'Disable Ghost Vault'}
              </button>
              <button
                onClick={() => {
                  setShowClearDuressModal(false);
                  setClearMasterPassword('');
                  setDuressError(null);
                }}
                className="px-6 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySettingsPanel;
