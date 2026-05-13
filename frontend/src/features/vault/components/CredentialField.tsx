// src/features/vault/components/CredentialField.tsx
/**
 * CredentialField - Reusable credential display field
 *
 * Displays a single credential field with copy, show/hide functionality.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { maskSensitiveData } from '../../../utils/formatters';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════════════════════════════════

// Icon components replaced by Lucide imports
const CopyIcon = ({ className = "w-4 h-4" }: { className?: string }) => <Copy className={className} />;
const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => <Check className={className} />;
const EyeIcon = ({ className = "w-4 h-4" }: { className?: string }) => <Eye className={className} />;
const EyeOffIcon = ({ className = "w-4 h-4" }: { className?: string }) => <EyeOff className={className} />;

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
