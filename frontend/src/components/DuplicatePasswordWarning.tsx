import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCcw, Key, Lightbulb, AlertTriangle } from 'lucide-react';

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
          <RefreshCcw className="w-4 h-4 flex-shrink-0 animate-spin" />
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
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-yellow-500 dark:text-yellow-400 mt-0.5" />
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
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-orange-500 dark:text-orange-400 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <p className="text-sm font-bold text-orange-600 dark:text-orange-400">Password Reuse Detected</p>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                This password is already used in <span className="font-bold">{duplicateCount}</span> other profile{duplicateCount !== 1 ? 's' : ''}:
              </p>
              
              {/* List of duplicate profiles */}
              <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                {duplicates.slice(0, 5).map((dup, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-orange-800 dark:text-orange-200 bg-orange-500/5 rounded px-2 py-1.5">
                    <Key className="w-3.5 h-3.5 flex-shrink-0" />
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

              <div className="flex items-center gap-1.5 mt-2.5">
                <Lightbulb className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  Each account should have a unique password for better security.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DuplicatePasswordWarning;
