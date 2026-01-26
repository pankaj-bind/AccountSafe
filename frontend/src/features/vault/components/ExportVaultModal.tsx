// src/features/vault/components/ExportVaultModal.tsx
/**
 * Export Vault Modal - Zero-Knowledge Export UI
 * 
 * SECURITY FEATURES:
 * 1. Displays prominent warning about unencrypted export
 * 2. Requires master password re-entry for authorization
 * 3. Format selector (CSV/JSON)
 * 4. Progress indicator during export
 * 5. Memory hygiene - data is cleared after download
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExport, type ExportFormat } from '../hooks/useExport';

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const DownloadIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const WarningIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const LockIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const XIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const DocumentIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const TableIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════════════════════

interface ExportVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const ExportVaultModal: React.FC<ExportVaultModalProps> = ({ isOpen, onClose }) => {
  // Form state
  const [password, setPassword] = useState('');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [showPassword, setShowPassword] = useState(false);
  
  // Export hook
  const {
    phase,
    progress,
    progressMessage,
    error,
    result,
    exportVault,
    reset,
  } = useExport();
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      reset();
    }
  }, [isOpen, reset]);
  
  // Handle export
  const handleExport = async () => {
    await exportVault(password, format);
  };
  
  // Handle close
  const handleClose = () => {
    // Clear password immediately
    setPassword('');
    reset();
    onClose();
  };
  
  // Check if we're in a loading/processing state
  const isProcessing = ['VERIFYING', 'FETCHING', 'DECRYPTING', 'FORMATTING', 'DOWNLOADING'].includes(phase);
  const isDone = phase === 'DONE';
  const hasError = phase === 'ERROR';
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={!isProcessing ? handleClose : undefined}
        />
        
        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg bg-white dark:bg-[var(--as-bg-card)] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center">
                  <DownloadIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Export Vault</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Download your credentials</p>
                </div>
              </div>
              {!isProcessing && (
                <button
                  onClick={handleClose}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Security Warning */}
              {!isDone && !hasError && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4">
                  <div className="flex gap-3">
                    <WarningIcon className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
                        Security Warning
                      </h4>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        This export file will contain <strong>unencrypted passwords</strong>. 
                        Anyone with access to this file can see all your credentials. 
                        Store it securely and delete it when no longer needed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Form - only show when not processing/done */}
              {phase === 'IDLE' && (
                <>
                  {/* Format Selection */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                      Export Format
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* CSV Option */}
                      <button
                        type="button"
                        onClick={() => setFormat('csv')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          format === 'csv'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                        }`}
                      >
                        <TableIcon className={`w-8 h-8 ${
                          format === 'csv' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'
                        }`} />
                        <div className="text-center">
                          <p className={`font-medium ${
                            format === 'csv' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'
                          }`}>
                            CSV
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Spreadsheet format
                          </p>
                        </div>
                        {format === 'csv' && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <CheckIcon className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                      
                      {/* JSON Option */}
                      <button
                        type="button"
                        onClick={() => setFormat('json')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          format === 'json'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                        }`}
                      >
                        <DocumentIcon className={`w-8 h-8 ${
                          format === 'json' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'
                        }`} />
                        <div className="text-center">
                          <p className={`font-medium ${
                            format === 'json' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'
                          }`}>
                            JSON
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Structured data
                          </p>
                        </div>
                        {format === 'json' && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <CheckIcon className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      <div className="flex items-center gap-2">
                        <LockIcon className="w-4 h-4" />
                        Confirm Master Password
                      </div>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && password && handleExport()}
                        placeholder="Enter your master password"
                        className="w-full px-4 py-3 bg-white dark:bg-[var(--as-bg-base)] border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      Your password is used to decrypt credentials locally. It is never sent to our servers.
                    </p>
                  </div>
                </>
              )}
              
              {/* Progress State */}
              {isProcessing && (
                <div className="py-8">
                  <div className="flex flex-col items-center gap-4">
                    {/* Spinner */}
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-zinc-200 dark:border-zinc-700 rounded-full" />
                      <div 
                        className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"
                        style={{ animationDuration: '1s' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-500">{progress}%</span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    
                    {/* Message */}
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
                      {progressMessage}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Success State */}
              {isDone && result && (
                <div className="py-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                      <CheckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                        Export Complete!
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Successfully exported <strong>{result.profilesExported}</strong> credentials 
                        from <strong>{result.organizationsProcessed}</strong> organizations.
                      </p>
                    </div>
                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg px-4 py-2">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Format: <span className="font-medium text-zinc-900 dark:text-white">{result.format.toUpperCase()}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Error State */}
              {hasError && error && (
                <div className="py-4">
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4">
                    <div className="flex gap-3">
                      <XIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-800 dark:text-red-300 mb-1">
                          Export Failed
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-400">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 rounded-b-2xl">
              {phase === 'IDLE' && (
                <>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={!password}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-500 disabled:bg-zinc-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <DownloadIcon className="w-4 h-4" />
                    Download Export
                  </button>
                </>
              )}
              
              {isProcessing && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Please wait, do not close this window...
                </p>
              )}
              
              {isDone && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                  Done
                </button>
              )}
              
              {hasError && (
                <>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ExportVaultModal;
