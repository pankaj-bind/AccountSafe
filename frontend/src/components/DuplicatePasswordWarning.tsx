import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DuplicateProfile {
  id: number;
  title: string;
  organizationName: string;
  organizationId: number;
}

interface DuplicatePasswordWarningProps {
  /** Number of profiles using the same password */
  duplicateCount: number;
  /** List of profiles with duplicate passwords */
  duplicates?: DuplicateProfile[];
  /** Whether the duplicate check is currently in progress */
  isChecking?: boolean;
  /** Error message if duplicate check failed */
  error?: string | null;
  /** Custom className for styling */
  className?: string;
}

/**
 * Component to display warnings when a password is reused across profiles
 * 
 * **Display Logic:**
 * - duplicateCount > 0: Show orange/red warning with list of duplicates
 * - duplicateCount === 0: Show nothing (password is unique)
 * - isChecking: Show loading indicator
 * - error: Show error message
 */
const DuplicatePasswordWarning: React.FC<DuplicatePasswordWarningProps> = ({
  duplicateCount,
  duplicates = [],
  isChecking = false,
  error = null,
  className = '',
}) => {
  // Don't render anything if password is unique and not checking
  if (!isChecking && duplicateCount === 0 && !error) {
    return null;
  }

  return (
    <AnimatePresence>
      {isChecking && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 mt-2 ${className}`}
        >
          <svg className="w-4 h-4 flex-shrink-0 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Checking for password reuse...</span>
        </motion.div>
      )}

      {error && !isChecking && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mt-2 ${className}`}
        >
          <svg className="w-5 h-5 flex-shrink-0 text-yellow-500 dark:text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Unable to check for duplicates</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-0.5">{error}</p>
          </div>
        </motion.div>
      )}

      {duplicateCount > 0 && !isChecking && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg mt-2 ${className}`}
        >
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 text-orange-500 dark:text-orange-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-bold text-orange-600 dark:text-orange-400">⚠️ Password Reuse Detected</p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                This password is already used in <span className="font-bold">{duplicateCount}</span> other profile{duplicateCount !== 1 ? 's' : ''}:
              </p>
              
              {/* List of duplicate profiles */}
              <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                {duplicates.slice(0, 5).map((dup, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-orange-800 dark:text-orange-200 bg-orange-500/5 rounded px-2 py-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span className="font-medium">{dup.title}</span>
                    <span className="text-orange-600 dark:text-orange-400">•</span>
                    <span className="text-orange-600 dark:text-orange-400">{dup.organizationName}</span>
                  </div>
                ))}
                {duplicateCount > 5 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 italic px-2 py-1">
                    ...and {duplicateCount - 5} more
                  </p>
                )}
              </div>

              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">
                💡 Each account should have a unique password for better security.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DuplicatePasswordWarning;
