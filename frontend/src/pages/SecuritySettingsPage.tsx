import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getUserProfile, deleteAccount, requestPasswordResetOTP, verifyPasswordResetOTP, changePassword } from "../services/authService";
import { getPinStatus, resetPin, clearPin } from "../services/pinService";
import { useAuth } from "../contexts/AuthContext";
import SecuritySettingsPanel from "../components/SecuritySettingsPanel";
import ActiveSessionsList from "../components/ActiveSessionsList";
import ImportCredentialsModal from "../features/vault/components/ImportCredentialsModal";
import ExportVaultModal from "../features/vault/components/ExportVaultModal";

// Icons
const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const SecuritySettingsPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Delete account states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // PIN reset states
  const [showPinResetModal, setShowPinResetModal] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [pinResetStep, setPinResetStep] = useState<'request' | 'verify' | 'newpin'>('request');
  const [pinResetOtp, setPinResetOtp] = useState('');
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmNewPin, setConfirmNewPin] = useState(['', '', '', '']);
  const [isPinResetting, setIsPinResetting] = useState(false);
  const [pinResetError, setPinResetError] = useState<string | null>(null);
  const [pinResetSuccess, setPinResetSuccess] = useState<string | null>(null);

  // Clear PIN states
  const [showClearPinModal, setShowClearPinModal] = useState(false);
  const [isClearingPin, setIsClearingPin] = useState(false);
  const [clearPinError, setClearPinError] = useState<string | null>(null);

  // Import credentials modal state
  const [showImportModal, setShowImportModal] = useState(false);

  // Export vault modal state
  const [showExportModal, setShowExportModal] = useState(false);

  const { logout: authLogout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileData = await getUserProfile();
        setEmail(profileData.email || "");
        
        // Check PIN status
        try {
          const pinStatus = await getPinStatus();
          setHasPin(pinStatus.has_pin);
        } catch {
          // Ignore PIN status errors
        }
      } catch (err: unknown) {
        console.error("Profile fetch error:", err);
        setError("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Password change handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword) {
      setPasswordError("Both current and new password are required");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long");
      return;
    }

    setIsChangingPassword(true);

    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      console.error("Password change error:", err);
      const axiosError = err as { response?: { data?: { error?: string } } };
      const errorMessage = axiosError.response?.data?.error || "Failed to change password";
      setPasswordError(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // PIN Reset handlers
  const handleRequestPinResetOtp = async () => {
    if (!email) {
      setPinResetError("Email is required");
      return;
    }

    setIsPinResetting(true);
    setPinResetError(null);

    try {
      await requestPasswordResetOTP(email);
      setPinResetStep('verify');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setPinResetError(axiosError.response?.data?.error || "Failed to send OTP");
    } finally {
      setIsPinResetting(false);
    }
  };

  const handleVerifyPinResetOtp = async () => {
    if (!pinResetOtp || pinResetOtp.length !== 6) {
      setPinResetError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsPinResetting(true);
    setPinResetError(null);

    try {
      await verifyPasswordResetOTP(email, pinResetOtp);
      setPinResetStep('newpin');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setPinResetError(axiosError.response?.data?.error || "Invalid OTP");
    } finally {
      setIsPinResetting(false);
    }
  };

  const handleSetNewPin = async () => {
    const pinValue = newPin.join('');
    const confirmValue = confirmNewPin.join('');

    if (pinValue.length !== 4) {
      setPinResetError("Please enter a 4-digit PIN");
      return;
    }

    if (pinValue !== confirmValue) {
      setPinResetError("PINs do not match");
      return;
    }

    setIsPinResetting(true);
    setPinResetError(null);

    try {
      await resetPin(email, pinResetOtp, pinValue);
      setPinResetSuccess("PIN reset successfully!");
      setHasPin(true);
      setTimeout(() => {
        setShowPinResetModal(false);
        setPinResetStep('request');
        setPinResetOtp('');
        setNewPin(['', '', '', '']);
        setConfirmNewPin(['', '', '', '']);
        setPinResetSuccess(null);
      }, 2000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setPinResetError(axiosError.response?.data?.error || "Failed to reset PIN");
    } finally {
      setIsPinResetting(false);
    }
  };

  const closePinResetModal = () => {
    setShowPinResetModal(false);
    setPinResetStep('request');
    setPinResetOtp('');
    setNewPin(['', '', '', '']);
    setConfirmNewPin(['', '', '', '']);
    setPinResetError(null);
    setPinResetSuccess(null);
  };

  // Clear PIN handler
  const handleClearPin = async () => {
    setIsClearingPin(true);
    setClearPinError(null);

    try {
      await clearPin();
      setHasPin(false);
      setShowClearPinModal(false);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setClearPinError(axiosError.response?.data?.error || "Failed to clear PIN");
    } finally {
      setIsClearingPin(false);
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Please enter your password");
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      await deleteAccount(deletePassword);
      authLogout();
      navigate("/login", { state: { message: "Your account has been deleted successfully" } });
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setDeleteError(axiosError.response?.data?.error || "Failed to delete account. Please check your password.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--as-bg-base)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-800 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading security settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--as-bg-base)] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </span>
            Security Settings
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Manage your security preferences, PIN, and emergency features
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="as-alert-danger mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="hover:opacity-70 transition-opacity">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="as-alert-success mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="hover:opacity-70 transition-opacity">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Update Password Section */}
        <div className="as-card p-4 md:p-6 mb-6">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="text-blue-500 dark:text-blue-400">
              <LockIcon />
            </span>
            Update Password
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Change your account password to keep your account secure
          </p>
          
          {/* Password Feedback Messages */}
          {passwordError && (
            <div className="as-alert-danger mb-4 flex items-center gap-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="as-alert-success mb-4 flex items-center gap-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {passwordSuccess}
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <LockIcon />
                  </div>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordError(null);
                      setPasswordSuccess(null);
                    }}
                    className="as-input pl-10"
                    placeholder="Enter current password"
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <LockIcon />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError(null);
                      setPasswordSuccess(null);
                    }}
                    className="as-input pl-10"
                    placeholder="Enter new password (min 8 characters)"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Enter your current password and new password above
                </span>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={isChangingPassword || !currentPassword || !newPassword}
                className="as-btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <LockIcon />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security PIN Section */}
        <div className="as-card p-4 md:p-6 mb-6">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="text-purple-500 dark:text-purple-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            Security PIN
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            {hasPin 
              ? "Your 4-digit PIN is set. You can reset it below if needed."
              : "Set up a 4-digit PIN to secure access to your organizations."}
          </p>
          <button
            type="button"
            onClick={() => setShowPinResetModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {hasPin ? 'Reset PIN' : 'Set Up PIN'}
          </button>
          
          {/* Clear PIN Button - only show when PIN is set */}
          {hasPin && (
            <button
              type="button"
              onClick={() => setShowClearPinModal(true)}
              className="ml-3 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear PIN
            </button>
          )}
        </div>

        {/* Data Management Section */}
        <div className="as-card p-4 md:p-6 mb-6">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="text-blue-500 dark:text-blue-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </span>
            Data Management
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Import your passwords from browsers or other password managers
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Import from Browser */}
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-zinc-900 dark:text-white">Import from Browser</h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Chrome, Edge, Firefox CSV</p>
              </div>
              <svg className="w-5 h-5 text-zinc-400 ml-auto group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Export Vault */}
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-zinc-900 dark:text-white">Export Vault</h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Download encrypted backup</p>
              </div>
              <svg className="w-5 h-5 text-zinc-400 ml-auto group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            Zero-Knowledge: Files are processed locally and never sent to our servers unencrypted
          </p>
        </div>

        {/* Security & Safety Section (Panic Button + Ghost Vault) */}
        <div className="mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Security & Safety
            </h2>
            <p className="text-sm text-zinc-500 mt-1">Advanced security features for emergency situations</p>
          </div>
          <SecuritySettingsPanel />
        </div>

        {/* Active Sessions Section */}
        <div className="mb-6">
          <ActiveSessionsList />
        </div>

        {/* Danger Zone - Delete Account */}
        <div className="as-card p-4 md:p-6 border-red-500/30">
          <h3 className="text-base font-semibold text-red-400 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Danger Zone
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="as-modal max-w-md w-full rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-5 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <h3 className="text-lg font-semibold text-white">Delete Account</h3>
            </div>

            {/* Content */}
            <div className="px-6 py-6 bg-white dark:bg-zinc-950">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
              </p>
              {deleteError && (
                <div className="as-alert-danger mb-4">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {deleteError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Enter your password to confirm
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                    <LockIcon />
                  </div>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      setDeleteError(null);
                    }}
                    className="as-input pl-10"
                    placeholder="Enter your password"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-b-2xl">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || !deletePassword}
                className="w-full mb-3 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeletingAccount ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Account
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                  setDeleteError(null);
                }}
                className="w-full as-btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Reset Modal */}
      {showPinResetModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="as-modal max-w-md w-full rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-5 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <div>
                <h3 className="text-lg font-semibold text-white leading-tight">{hasPin ? 'Reset' : 'Set Up'} Security PIN</h3>
                <p className="text-xs text-white/80 mt-0.5">
                  {pinResetStep === 'request' && 'Verify your email to continue'}
                  {pinResetStep === 'verify' && 'Enter the OTP sent to your email'}
                  {pinResetStep === 'newpin' && 'Enter your new 4-digit PIN'}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 bg-white dark:bg-zinc-950">
              {pinResetError && (
                <div className="as-alert-danger mb-4">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {pinResetError}
                </div>
              )}

              {pinResetSuccess && (
                <div className="as-alert-success mb-4">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {pinResetSuccess}
                </div>
              )}

              {/* Step 1: Request OTP */}
              {pinResetStep === 'request' && (
                <div>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-center">
                    We'll send a verification code to your email: <strong className="text-zinc-900 dark:text-white">{email}</strong>
                  </p>
                  <button
                    onClick={handleRequestPinResetOtp}
                    disabled={isPinResetting}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPinResetting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sending OTP...
                      </>
                    ) : 'Send OTP'}
                  </button>
                </div>
              )}

              {/* Step 2: Verify OTP */}
              {pinResetStep === 'verify' && (
                <div>
                  <p className="text-zinc-400 mb-4 text-center">
                    Enter the 6-digit code sent to your email
                  </p>
                  <input
                    type="text"
                    maxLength={6}
                    value={pinResetOtp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setPinResetOtp(value);
                      // Auto-submit when 6 digits entered
                      if (value.length === 6 && !isPinResetting) {
                        setTimeout(() => handleVerifyPinResetOtp(), 100);
                      }
                    }}
                    className="as-input text-center text-xl tracking-widest mb-4 font-mono"
                    placeholder="000000"
                    autoFocus
                    inputMode="numeric"
                  />
                  <button
                    onClick={handleVerifyPinResetOtp}
                    disabled={isPinResetting || pinResetOtp.length !== 6}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPinResetting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Verifying...
                      </>
                    ) : 'Verify OTP'}
                  </button>
                </div>
              )}

              {/* Step 3: Set New PIN */}
              {pinResetStep === 'newpin' && (
                <div>
                  <p className="text-zinc-400 mb-4 text-center">Enter your new PIN</p>
                  <div className="flex justify-center gap-3 mb-4">
                    {newPin.map((digit, index) => (
                      <input
                        key={`new-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit ? '•' : ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9•]/g, '').replace('•', '');
                          const updated = [...newPin];
                          updated[index] = val.slice(-1);
                          setNewPin(updated);
                          if (val && index < 3) {
                            const next = document.getElementById(`new-pin-${index + 1}`);
                            next?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !newPin[index] && index > 0) {
                            const prev = document.getElementById(`new-pin-${index - 1}`);
                            prev?.focus();
                          }
                        }}
                        id={`new-pin-${index}`}
                        className="w-12 h-12 text-center text-xl font-bold as-input rounded-lg"
                        inputMode="numeric"
                        autoComplete="off"
                      />
                    ))}
                  </div>
                  <p className="text-zinc-400 mb-4 text-center">Confirm your new PIN</p>
                  <div className="flex justify-center gap-3 mb-4">
                    {confirmNewPin.map((digit, index) => (
                      <input
                        key={`confirm-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit ? '•' : ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9•]/g, '').replace('•', '');
                          const updated = [...confirmNewPin];
                          updated[index] = val.slice(-1);
                          setConfirmNewPin(updated);
                          if (val && index < 3) {
                            const next = document.getElementById(`confirm-pin-${index + 1}`);
                            next?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !confirmNewPin[index] && index > 0) {
                            const prev = document.getElementById(`confirm-pin-${index - 1}`);
                            prev?.focus();
                          }
                        }}
                        id={`confirm-pin-${index}`}
                        className="w-12 h-12 text-center text-xl font-bold as-input rounded-lg"
                        inputMode="numeric"
                        autoComplete="off"
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleSetNewPin}
                    disabled={isPinResetting || newPin.join('').length !== 4 || confirmNewPin.join('').length !== 4}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPinResetting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Setting PIN...
                      </>
                    ) : 'Set New PIN'}
                  </button>
                </div>
              )}

              {/* Cancel Button */}
              <button
                onClick={closePinResetModal}
                className="w-full mt-3 as-btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear PIN Confirmation Modal */}
      {showClearPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (!isClearingPin) {
                setShowClearPinModal(false);
                setClearPinError(null);
              }
            }}
          ></div>
          <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-100 dark:bg-red-500/20 rounded-xl">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Clear Security PIN?</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              Clearing your PIN will remove the additional security layer from your vault. 
              Anyone with access to your account will be able to view organization details without entering a PIN.
            </p>

            {clearPinError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-sm text-red-600 dark:text-red-400">
                {clearPinError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowClearPinModal(false);
                  setClearPinError(null);
                }}
                disabled={isClearingPin}
                className="flex-1 as-btn-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearPin}
                disabled={isClearingPin}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isClearingPin ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Clearing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear PIN
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Credentials Modal */}
      <ImportCredentialsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => {
          setSuccess("Credentials imported successfully!");
          setShowImportModal(false);
        }}
      />

      {/* Export Vault Modal */}
      <ExportVaultModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};

export default SecuritySettingsPage;
