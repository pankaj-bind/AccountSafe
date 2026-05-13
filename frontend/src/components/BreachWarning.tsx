import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldCheck, RefreshCcw, XCircle } from 'lucide-react';

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
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
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
          <RefreshCcw className="w-4 h-4 flex-shrink-0 animate-spin" />
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
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-yellow-500 dark:text-yellow-400 mt-0.5" />
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
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <p className="text-sm font-bold text-red-600 dark:text-red-400">Security Alert</p>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300">
              This password has been seen in <span className="font-bold">{breachCount.toLocaleString()}</span> data breach{breachCount !== 1 ? 'es' : ''}.
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                Do not use this password! Choose a unique password instead.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BreachWarning;
