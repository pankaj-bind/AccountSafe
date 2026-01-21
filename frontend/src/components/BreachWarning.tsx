import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BreachWarningProps {
  /** Number of times password appears in data breaches (0 = safe) */
  breachCount: number;
  /** Whether the breach check is currently in progress */
  isChecking?: boolean;
  /** Error message if breach check failed */
  error?: string | null;
  /** Custom className for styling */
  className?: string;
}

/**
 * Component to display real-time password breach warnings
 * using data from the HaveIBeenPwned API.
 * 
 * **Display Logic:**
 * - breachCount > 0: Show red warning with breach count
 * - breachCount === 0: Show subtle green checkmark
 * - isChecking: Show loading indicator
 * - error: Show error message
 */
const BreachWarning: React.FC<BreachWarningProps> = ({
  breachCount,
  isChecking = false,
  error = null,
  className = '',
}) => {
  // Don't render anything if not checking, no breaches, and no error
  if (!isChecking && breachCount === 0 && !error) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-2 text-xs text-emerald-500 dark:text-emerald-400 mt-2 ${className}`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Password not found in known breaches</span>
        </motion.div>
      </AnimatePresence>
    );
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
          <span>Checking breach database...</span>
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
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Unable to verify breach status</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-0.5">{error}</p>
          </div>
        </motion.div>
      )}

      {breachCount > 0 && !isChecking && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg mt-2 ${className}`}
        >
          <svg className="w-5 h-5 flex-shrink-0 text-red-500 dark:text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-600 dark:text-red-400">⚠️ Security Alert</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              This password has been seen in <span className="font-bold">{breachCount.toLocaleString()}</span> data breach{breachCount !== 1 ? 'es' : ''}.
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium">
              ⛔ Do not use this password! Choose a unique password instead.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BreachWarning;
