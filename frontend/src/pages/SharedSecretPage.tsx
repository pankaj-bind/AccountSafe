import React, { useState, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../api/apiClient';

// Hide navbar on this page for cleaner mobile experience
const useHideNavbar = () => {
  useLayoutEffect(() => {
    const navbar = document.querySelector('nav');
    if (navbar) {
      navbar.style.display = 'none';
    }
    return () => {
      if (navbar) {
        navbar.style.display = '';
      }
    };
  }, []);
};

// Check if organization looks like a raw ID or slug to hide
const isValidOrganizationDisplay = (org: string | undefined): boolean => {
  if (!org) return false;
  // Hide if it's just a number (raw ID)
  if (/^\d+$/.test(org)) return false;
  // Hide if it's too short (likely a slug)
  if (org.length <= 2) return false;
  // Hide if it looks like a UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(org)) return false;
  return true;
};

interface DecryptedData {
  title: string;
  username?: string;
  password?: string;
  email?: string;
  notes?: string;
  recovery_codes?: string;
  organization?: string;
  document_url?: string;
}

// Icon Components
const CopyIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const EyeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const FlameIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 23C7.654 23 4 19.346 4 15c0-3.09 1.445-5.656 3.283-7.745C9.058 5.309 11 3.38 11 2v-.5c0-.276.224-.5.5-.5s.5.224.5.5V2c0 1.38 1.942 3.309 3.717 5.255C17.555 9.344 19 11.91 19 15c0 4.346-3.654 8-7 8z" />
  </svg>
);

const SharedSecretPage: React.FC = () => {
  // Hide the navbar on this page for a cleaner mobile experience
  useHideNavbar();
  
  const { secretId } = useParams<{ secretId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decryptedData, setDecryptedData] = useState<DecryptedData | null>(null);
  const [burned, setBurned] = useState(false);
  const [acceptedWarning, setAcceptedWarning] = useState(false);
  const [maskedFields, setMaskedFields] = useState({
    password: true,
    recovery_codes: true,
    notes: true,
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Fetch and view the shared secret (burns the link)
  const handleViewSecret = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(`shared-secrets/${secretId}/`);
      
      if (!response.data.success) {
        setError(response.data.message || 'Failed to retrieve secret');
        setLoading(false);
        return;
      }

      const data = response.data.data;
      setBurned(true);
      
      // Data is already decrypted (plaintext from server)
      setDecryptedData({
        title: data.title || '',
        username: data.username || '',
        password: data.password || '',
        email: data.email || '',
        notes: data.notes || '',
        recovery_codes: data.recovery_codes || '',
        organization: data.organization || '',
        document_url: data.document_url || '',
      });
      
      setLoading(false);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('This link has expired or has already been viewed');
      } else if (err.response?.status === 410) {
        setError('This link has already been viewed and destroyed');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to load secret. Please try again.');
      }
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAllToClipboard = async () => {
    if (!decryptedData) return;

    const allData = `
═══════════════════════════════════════
🔐 ${decryptedData.title}
═══════════════════════════════════════

🏢 Organization: ${decryptedData.organization || 'N/A'}

👤 Username: ${decryptedData.username || 'N/A'}

🔑 Password: ${decryptedData.password || 'N/A'}

📧 Email: ${decryptedData.email || 'N/A'}

${decryptedData.notes ? `📝 Notes:\n${decryptedData.notes}\n\n` : ''}${decryptedData.recovery_codes ? `🛡️ Recovery Codes:\n${decryptedData.recovery_codes}\n\n` : ''}${decryptedData.document_url ? `📎 Document: ${decryptedData.document_url}\n\n` : ''}═══════════════════════════════════════
⚠️ This data was shared securely via AccountSafe
`.trim();

    await navigator.clipboard.writeText(allData);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  const toggleMask = (field: 'password' | 'recovery_codes' | 'notes') => {
    setMaskedFields(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Centered Logo Component for consistency
  const CenteredLogo = () => (
    <div className="text-center mb-6 sm:mb-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 sm:gap-3"
      >
        <div className="p-2 sm:p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg sm:rounded-xl border border-emerald-200 dark:border-emerald-500/20">
          <img src="/logo.png" alt="AccountSafe" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
        </div>
        <span className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
          AccountSafe
        </span>
      </motion.div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:to-slate-900 flex flex-col items-center justify-center p-4">
        <CenteredLogo />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 mx-auto mb-6"></div>
            <FlameIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-orange-500 animate-pulse" />
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-medium text-lg">Retrieving secure data...</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">This link will be destroyed after viewing</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:to-slate-900 flex flex-col items-center justify-center p-4">
        <CenteredLogo />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-red-200 dark:border-red-900 p-8"
        >
          <div className="text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-6"
            >
              <FlameIcon className="h-10 w-10 text-red-600 dark:text-red-400" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Link Destroyed</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full min-h-[48px] px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              Go to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 p-3 sm:p-4 lg:p-6 flex flex-col">
      {/* Centered Logo - Mobile friendly header */}
      <CenteredLogo />

      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col pb-20 sm:pb-24 lg:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[calc(100vh-8rem)] lg:max-h-[calc(100vh-12rem)]"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 sm:px-6 py-6 sm:py-8 lg:py-6 text-white overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 sm:gap-4 mb-2">
                <div className="p-2 sm:p-2.5 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Shared Credential</h1>
                  <p className="text-blue-100 text-xs sm:text-sm mt-0.5 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse"></span>
                    One-time access • End-to-end encrypted
                  </p>
                </div>
              </div>
              
              {/* Warning Banner After Burned */}
              <AnimatePresence>
                {burned && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 sm:mt-4 bg-amber-500 dark:bg-amber-600 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FlameIcon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm sm:text-base">⚠️ Warning: This link is now DEAD</p>
                        <p className="text-xs sm:text-sm mt-0.5 text-amber-50">
                          Do not close this tab until you have saved this data. It cannot be recovered.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 sm:p-6 lg:p-5 overflow-y-auto flex-1">
            {/* Before Reveal - Safety Gate */}
            {!decryptedData && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-2xl mx-auto"
              >
                <div className="text-center mb-6 sm:mb-8">
                  <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mb-4 sm:mb-5 border-3 sm:border-4 border-red-200 dark:border-red-800">
                    <FlameIcon className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Destructive Action Required
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed px-2">
                    Once you reveal this credential, <span className="font-bold text-red-600 dark:text-red-400">it will be permanently destroyed</span> and this link will become invalid. Make sure you're ready to save it.
                  </p>
                </div>

                {/* Safety Checkbox */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-5">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative flex items-center min-w-[44px] min-h-[44px] justify-center">
                      <input
                        type="checkbox"
                        checked={acceptedWarning}
                        onChange={(e) => setAcceptedWarning(e.target.checked)}
                        className="w-7 h-7 text-red-600 border-2 border-amber-400 dark:border-amber-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:ring-offset-2 cursor-pointer accent-red-600"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium text-base sm:text-lg leading-snug">
                        I understand this message will be <span className="text-red-600 dark:text-red-400 font-bold">deleted forever</span> after viewing
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                        There is no undo. No recovery. No second chance. Save the data before closing.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Reveal Button */}
                <button
                  onClick={handleViewSecret}
                  disabled={!acceptedWarning || loading}
                  className={`w-full px-8 py-5 rounded-2xl font-bold text-lg sm:text-xl transition-all shadow-xl transform ${
                    acceptedWarning && !loading
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white hover:scale-105 hover:shadow-2xl'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Destroying Link...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <FlameIcon className="w-6 h-6" />
                      Reveal & Destroy Forever
                    </span>
                  )}
                </button>

                {!acceptedWarning && (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                    ☝️ Check the box above to unlock the reveal button
                  </p>
                )}
              </motion.div>
            )}

            {/* Revealed Data - With Masking & Copy All */}
            <AnimatePresence>
              {decryptedData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 sm:space-y-4"
                >
                  {/* Credential Fields */}
                  <div className="space-y-4">
                    {/* Title */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-blue-200 dark:border-blue-800"
                    >
                      <h3 className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300 mb-1.5 sm:mb-2 uppercase tracking-wide">📋 Title</h3>
                      <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">{decryptedData.title}</p>
                    </motion.div>

                    {/* Organization - Only show if it looks like a real name, not an ID */}
                    {isValidOrganizationDisplay(decryptedData.organization) && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <h3 className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400 mb-1.5 sm:mb-2 uppercase tracking-wide">🏢 Organization</h3>
                        <p className="text-sm sm:text-base lg:text-lg text-gray-900 dark:text-white">{decryptedData.organization}</p>
                      </motion.div>
                    )}

                    {/* Username */}
                    {decryptedData.username && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">👤 Username</h3>
                          <button
                            onClick={() => copyToClipboard(decryptedData.username!, 'username')}
                            className={`min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all ${
                              copiedField === 'username'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600'
                            }`}
                          >
                            {copiedField === 'username' ? <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <CopyIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </button>
                        </div>
                        <p className="text-sm sm:text-base lg:text-lg font-mono text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl break-all">
                          {decryptedData.username}
                        </p>
                      </motion.div>
                    )}

                    {/* Password - Masked by Default */}
                    {decryptedData.password && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                        className="bg-amber-500/5 dark:bg-amber-900/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-amber-200/50 dark:border-amber-700/30 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <h3 className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide flex items-center gap-2">
                            🔑 Password
                            <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full">Sensitive</span>
                          </h3>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <button
                              onClick={() => toggleMask('password')}
                              className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600 transition-all"
                            >
                              {maskedFields.password ? <EyeIcon /> : <EyeOffIcon />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(decryptedData.password!, 'password')}
                              className={`min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all ${
                                copiedField === 'password'
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600'
                              }`}
                            >
                              {copiedField === 'password' ? <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <CopyIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                            </button>
                          </div>
                        </div>
                        <div className="relative">
                          <p className="text-sm sm:text-base lg:text-lg font-mono text-gray-900 dark:text-white bg-white dark:bg-gray-900 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl break-all">
                            {maskedFields.password ? '••••••••••••••••' : decryptedData.password}
                          </p>
                          {maskedFields.password && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/5 dark:bg-gray-900/20 backdrop-blur-sm rounded-lg sm:rounded-xl cursor-pointer" onClick={() => toggleMask('password')}>
                              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-lg">
                                Tap to reveal
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Email */}
                    {decryptedData.email && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <h3 className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">📧 Email</h3>
                          <button
                            onClick={() => copyToClipboard(decryptedData.email!, 'email')}
                            className={`min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all ${
                              copiedField === 'email'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600'
                            }`}
                          >
                            {copiedField === 'email' ? <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <CopyIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </button>
                        </div>
                        <p className="text-sm sm:text-base lg:text-lg text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl break-all">
                          {decryptedData.email}
                        </p>
                      </motion.div>
                    )}

                    {/* Notes - Masked by Default */}
                    {decryptedData.notes && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 }}
                        className="bg-amber-500/5 dark:bg-amber-900/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-amber-200/50 dark:border-amber-700/30 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <h3 className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide flex items-center gap-2">
                            📝 Notes
                            <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full">Sensitive</span>
                          </h3>
                          <button
                            onClick={() => toggleMask('notes')}
                            className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600 transition-all"
                          >
                            {maskedFields.notes ? <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <EyeOffIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </button>
                        </div>
                        <div className="relative">
                          <p className="text-sm sm:text-base text-gray-900 dark:text-white whitespace-pre-wrap bg-white dark:bg-gray-900 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl min-h-[60px] sm:min-h-[80px]">
                            {maskedFields.notes ? '████████████████████████████████████████████████████████' : decryptedData.notes}
                          </p>
                          {maskedFields.notes && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/5 dark:bg-gray-900/20 backdrop-blur-sm rounded-lg sm:rounded-xl cursor-pointer" onClick={() => toggleMask('notes')}>
                              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-lg">
                                Tap to reveal
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Recovery Codes - Masked by Default */}
                    {decryptedData.recovery_codes && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-purple-500/5 dark:bg-purple-900/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-purple-200/50 dark:border-purple-700/30 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <h3 className="text-xs sm:text-sm font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide flex items-center gap-2">
                            🛡️ Recovery Codes
                            <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full">Sensitive</span>
                          </h3>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <button
                              onClick={() => toggleMask('recovery_codes')}
                              className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 transition-all"
                            >
                              {maskedFields.recovery_codes ? <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <EyeOffIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(decryptedData.recovery_codes!, 'recovery_codes')}
                              className={`min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all ${
                                copiedField === 'recovery_codes'
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600'
                              }`}
                            >
                              {copiedField === 'recovery_codes' ? <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <CopyIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                            </button>
                          </div>
                        </div>
                        <div className="relative">
                          <p className="text-sm sm:text-base font-mono text-gray-900 dark:text-white whitespace-pre-wrap bg-white dark:bg-gray-900 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl min-h-[60px] sm:min-h-[80px]">
                            {maskedFields.recovery_codes ? '████ ████ ████\n████ ████ ████\n████ ████ ████' : decryptedData.recovery_codes}
                          </p>
                          {maskedFields.recovery_codes && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/5 dark:bg-gray-900/20 backdrop-blur-sm rounded-lg sm:rounded-xl cursor-pointer" onClick={() => toggleMask('recovery_codes')}>
                              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-lg">
                                Tap to reveal
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Document */}
                    {decryptedData.document_url && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 }}
                        className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <h3 className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2 sm:mb-3">📎 Attached Document</h3>
                        <a
                          href={decryptedData.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Document
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer - Sticky so it never scrolls off-screen */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 py-3 sm:py-4 lg:py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
            {decryptedData ? (
              <div className="flex flex-col lg:flex-row gap-2 lg:gap-3">
                <button
                  onClick={copyAllToClipboard}
                  className={`hidden lg:flex flex-1 min-h-[44px] px-5 py-2.5 rounded-xl font-semibold shadow-lg transition-all items-center justify-center gap-2 ${
                    copiedAll
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                  }`}
                >
                  {copiedAll ? (
                    <>
                      <CheckIcon className="w-5 h-5" />
                      <span>All Data Copied!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-5 h-5" />
                      <span>Copy All to Clipboard</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full lg:flex-1 min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 text-white rounded-xl font-semibold hover:from-gray-800 hover:to-black transition-all shadow-lg hover:shadow-xl"
                >
                  Close & Return Home
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="w-full min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 text-white rounded-xl font-semibold hover:from-gray-800 hover:to-black transition-all shadow-lg hover:shadow-xl"
              >
                Close & Return Home
              </button>
            )}
          </div>
        </motion.div>

        {/* Fixed Bottom Copy All Button - Mobile Friendly */}
        {decryptedData && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 lg:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 shadow-2xl"
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={copyAllToClipboard}
              className={`w-full min-h-[52px] sm:min-h-[56px] px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-xl transition-all flex items-center justify-center gap-2 sm:gap-3 ${
                copiedAll
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800'
              }`}
            >
              {copiedAll ? (
                <>
                  <CheckIcon className="w-6 h-6" />
                  <span>All Data Copied!</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-6 h-6" />
                  <span>Copy All to Clipboard</span>
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SharedSecretPage;
