// src/features/vault/components/CredentialField.tsx
/**
 * CredentialField - Reusable credential display field
 *
 * Displays a single credential field with copy, show/hide functionality.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { maskSensitiveData } from '../../../utils/formatters';

// ═══════════════════════════════════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════════════════════════════════

const CopyIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const EyeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Props Interface
// ═══════════════════════════════════════════════════════════════════════════════

interface CredentialFieldProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  isCopied: boolean;
  onCopy: () => void;
  isPassword?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  mono?: boolean;
  isSensitive?: boolean;
  showSensitive?: boolean;
  onToggleSensitive?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

const CredentialField: React.FC<CredentialFieldProps> = ({
  label,
  value,
  icon,
  isCopied,
  onCopy,
  isPassword = false,
  showPassword = false,
  onTogglePassword,
  mono = false,
  isSensitive = false,
  showSensitive = true,
  onToggleSensitive
}) => {
  // Determine what to display
  const getDisplayValue = () => {
    if (isPassword && !showPassword) return '••••••••••••';
    if (isSensitive && !showSensitive) return maskSensitiveData(value, { type: 'username' });
    return value;
  };

  return (
    <motion.div
      className="group/field"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`flex-1 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 h-[42px] flex items-center gap-2 ${mono ? 'font-mono' : ''}`}>
          <span className={`flex-1 text-sm text-zinc-700 dark:text-zinc-200 break-all transition-all ${(isPassword && !showPassword) || (isSensitive && !showSensitive) ? 'tracking-wider' : ''}`}>
            {getDisplayValue()}
          </span>
          {(isPassword || isSensitive) && (onTogglePassword || onToggleSensitive) && (
            <button
              onClick={isPassword ? onTogglePassword : onToggleSensitive}
              className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              title={(isPassword ? showPassword : showSensitive) ? 'Hide' : 'Show'}
              aria-label={(isPassword ? showPassword : showSensitive) ? 'Hide value' : 'Show value'}
            >
              {(isPassword ? showPassword : showSensitive) ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onCopy}
          className={`h-[42px] px-3 flex items-center justify-center rounded-lg transition-all ${
            isCopied
              ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-300 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700'
          }`}
          title={isCopied ? 'Copied!' : 'Copy'}
          aria-label={isCopied ? 'Copied to clipboard' : 'Copy to clipboard'}
        >
          {isCopied ? <CheckIcon /> : <CopyIcon />}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default CredentialField;
