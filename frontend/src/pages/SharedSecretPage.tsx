import React, { useState, useLayoutEffect, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileLock, Copy, Check, Loader2, AlertTriangle, ShieldOff } from 'lucide-react';
import { useClipboard } from '../hooks/useClipboard';
import apiClient from '../api/apiClient';
import { decryptOneTimeShare } from '../services/cryptoService';

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
  if (/^\d+$/.test(org)) return false;
  if (org.length <= 2) return false;
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

const SharedSecretPage: React.FC = () => {
  useHideNavbar();
  
  const { secretId } = useParams<{ secretId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decryptedData, setDecryptedData] = useState<DecryptedData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [missingKey, setMissingKey] = useState(false);
  
  // Extract encryption key from URL fragment (never sent to server)
  const [shareKey, setShareKey] = useState<string | null>(null);
  
  useEffect(() => {
    // Get key from URL fragment (#key)
    const hash = location.hash;
    if (hash && hash.length > 1) {
      setShareKey(hash.substring(1)); // Remove # prefix
      setMissingKey(false);
    } else {
      setMissingKey(true);
    }
  }, [location.hash]);

  // Fetch and view the shared secret (burns the link)
  const handleViewSecret = async () => {
    if (!shareKey) {
      setError('Missing decryption key. The share link may be incomplete.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Get encrypted blob from server
      const response = await apiClient.get(`shared-secrets/${secretId}/`);
      
      if (!response.data.success) {
        setError(response.data.message || 'Failed to retrieve secret');
        setLoading(false);
        return;
      }

      const encryptedBlob = response.data.encrypted_blob;
      
      if (!encryptedBlob) {
        setError('Invalid share data received');
        setLoading(false);
        return;
      }
      
      // ═══════════════════════════════════════════════════════════════════════════
      // ZERO-KNOWLEDGE: Decrypt client-side using key from URL fragment
      // Server NEVER sees the decrypted data
      // ═══════════════════════════════════════════════════════════════════════════
      try {
        const data = await decryptOneTimeShare(encryptedBlob, shareKey);
        
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
      } catch (decryptError) {
        console.error('Decryption failed:', decryptError);
        setError('Decryption failed. The share link may be corrupted or incomplete.');
      }
      
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

  // Use secure clipboard hook with auto-clear
  const { copy: secureCopy } = useClipboard({ clearAfter: 30000 });

  const copyToClipboard = async (text: string, field: string) => {
    const success = await secureCopy(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-gray-400 font-medium">Retrieving secure data...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-gray-800 rounded-lg border border-gray-700 p-8 text-center"
        >
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
          >
            Return to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        
        {/* MISSING KEY ERROR */}
        {missingKey && !decryptedData && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-gray-800 rounded-lg border border-gray-700 p-8 text-center mx-auto"
          >
            <ShieldOff className="w-12 h-12 text-yellow-600 mx-auto mb-4" strokeWidth={1.5} />
            <h2 className="text-2xl font-bold text-white mb-2">Incomplete Link</h2>
            <p className="text-gray-400 mb-6">
              The decryption key is missing from this link. Make sure you copied the entire share URL including the part after the # symbol.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Return to Home
            </button>
          </motion.div>
        )}
        
        {/* LOCKED VIEW - Before Reveal */}
        {!decryptedData && !missingKey && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center"
          >
            <FileLock className="w-12 h-12 text-gray-400 mx-auto mb-6" strokeWidth={1} />
            <h1 className="text-2xl font-bold text-white mb-3">Restricted Access</h1>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              This credential is encrypted. Viewing it will permanently destroy this link.
            </p>
            <button
              onClick={handleViewSecret}
              disabled={loading}
              className="px-8 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Reveal Secret'}
            </button>
          </motion.div>
        )}

        {/* REVEALED VIEW - After Reveal */}
        {decryptedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Destruction Notice */}
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-center">
              <p className="text-red-400 text-sm font-medium">Link destroyed. Copy this now.</p>
            </div>

            {/* Data Card */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg divide-y divide-gray-700">
              
              {/* Title */}
              <div className="p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">TITLE</div>
                <div className="font-mono text-lg text-white">{decryptedData.title}</div>
              </div>

              {/* Organization */}
              {isValidOrganizationDisplay(decryptedData.organization) && (
                <div className="p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">ORGANIZATION</div>
                  <div className="font-mono text-white">{decryptedData.organization}</div>
                </div>
              )}

              {/* Username */}
              {decryptedData.username && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs uppercase tracking-wide text-gray-500">USERNAME</div>
                    <button
                      onClick={() => copyToClipboard(decryptedData.username!, 'username')}
                      className="p-2 hover:bg-gray-700 rounded transition-colors"
                    >
                      {copiedField === 'username' ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-white select-all">{decryptedData.username}</div>
                </div>
              )}

              {/* Password */}
              {decryptedData.password && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs uppercase tracking-wide text-gray-500">PASSWORD</div>
                    <button
                      onClick={() => copyToClipboard(decryptedData.password!, 'password')}
                      className="p-2 hover:bg-gray-700 rounded transition-colors"
                    >
                      {copiedField === 'password' ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-white select-all">{decryptedData.password}</div>
                </div>
              )}

              {/* Email */}
              {decryptedData.email && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs uppercase tracking-wide text-gray-500">EMAIL</div>
                    <button
                      onClick={() => copyToClipboard(decryptedData.email!, 'email')}
                      className="p-2 hover:bg-gray-700 rounded transition-colors"
                    >
                      {copiedField === 'email' ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-white select-all">{decryptedData.email}</div>
                </div>
              )}

              {/* Notes */}
              {decryptedData.notes && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs uppercase tracking-wide text-gray-500">NOTES</div>
                    <button
                      onClick={() => copyToClipboard(decryptedData.notes!, 'notes')}
                      className="p-2 hover:bg-gray-700 rounded transition-colors"
                    >
                      {copiedField === 'notes' ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-sm text-white whitespace-pre-wrap select-all">{decryptedData.notes}</div>
                </div>
              )}

              {/* Recovery Codes */}
              {decryptedData.recovery_codes && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs uppercase tracking-wide text-gray-500">RECOVERY CODES</div>
                    <button
                      onClick={() => copyToClipboard(decryptedData.recovery_codes!, 'recovery_codes')}
                      className="p-2 hover:bg-gray-700 rounded transition-colors"
                    >
                      {copiedField === 'recovery_codes' ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-sm text-white whitespace-pre-wrap select-all">{decryptedData.recovery_codes}</div>
                </div>
              )}

              {/* Document */}
              {decryptedData.document_url && (
                <div className="p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">DOCUMENT</div>
                  <a
                    href={decryptedData.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    Download Document
                  </a>
                </div>
              )}
            </div>

            {/* Return Button */}
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SharedSecretPage;
