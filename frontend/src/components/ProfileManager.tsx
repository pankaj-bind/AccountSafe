import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import zxcvbn from 'zxcvbn';
import QRCode from 'qrcode';
import apiClient from '../api/apiClient';
import { generatePassword, getPasswordStrength } from '../utils/passwordGenerator';
import { maskSensitiveData } from '../utils/formatters';
import { encryptCredentialFields, decryptCredentialFields } from '../utils/encryption';
import { useCrypto } from '../services/CryptoContext';
import { checkPasswordBreach, updatePasswordStrength, updateBreachStatus, updatePasswordHash } from '../services/securityService';
import { useClipboard } from '../hooks/useClipboard';
import { usePwnedCheck } from '../hooks/usePwnedCheck';
import { useDuplicatePasswordCheck } from '../hooks/useDuplicatePasswordCheck';
import { trackAccess, sortByFrequency } from '../utils/frequencyTracker';
import PasswordReentryModal from './PasswordReentryModal';
import BreachWarning from './BreachWarning';
import DuplicatePasswordWarning from './DuplicatePasswordWarning';

// ═══════════════════════════════════════════════════════════════════════════════
// Icon Components
// ═══════════════════════════════════════════════════════════════════════════════

const ArrowLeftIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const PlusIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const UserIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const KeyIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const MailIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const DocumentIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const NotesIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

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

const PencilIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ShieldIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ClockIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SparklesIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const QRCodeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
  </svg>
);

const ShareIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const StarIcon = ({ className = "w-4 h-4", filled = false }: { className?: string; filled?: boolean }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const DotsVerticalIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface Organization {
  id: number;
  name: string;
  logo_url: string | null;
  logo_image: string | null;
  website_link?: string | null;
}

interface Profile {
  id: number;
  title: string;
  organization: number;
  username: string | null;
  password?: string;
  email: string | null;
  recovery_codes: string | null;
  document: string | null;
  document_url: string | null;
  notes: string | null;
  created_at: string;
  // Encrypted field pairs
  username_encrypted?: string | null;
  username_iv?: string | null;
  password_encrypted?: string | null;
  password_iv?: string | null;
  email_encrypted?: string | null;
  email_iv?: string | null;
  notes_encrypted?: string | null;
  notes_iv?: string | null;
  recovery_codes_encrypted?: string | null;
  recovery_codes_iv?: string | null;
  // Security tracking
  is_breached?: boolean;
  last_breach_check_date?: string | null;
  password_strength?: number | null;
  password_hash?: string | null;
  last_password_update?: string | null;
  // User preferences
  is_pinned?: boolean;
}

interface ProfileManagerProps {
  organization: Organization;
  onBack: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Credential Field Component
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
        {/* Sensitive badge removed per design */}
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
          className={`h-[42px] px-3 flex items-center justify-center rounded-lg transition-all ${isCopied
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

// ═══════════════════════════════════════════════════════════════════════════════
// Profile Card Component
// ═══════════════════════════════════════════════════════════════════════════════

interface ProfileCardProps {
  profile: Profile;
  recoveryCodes: string[];
  showPassword: boolean;
  showUsername: boolean;
  showEmail: boolean;
  expandedNotes: boolean;
  isExpanded: boolean;
  copiedField: string | null;
  isPinned: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  onTogglePin: () => void;
  onCopy: (text: string, field: string) => void;
  onTogglePassword: () => void;
  onToggleUsername: () => void;
  onToggleEmail: () => void;
  onToggleNotes: () => void;
  onToggleExpand: () => void;
  onCopyRecoveryCode: (code: string, index: number) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  recoveryCodes,
  showPassword,
  showUsername,
  showEmail,
  expandedNotes,
  isExpanded,
  copiedField,
  isPinned,
  onEdit,
  onDelete,
  onShare,
  onTogglePin,
  onCopy,
  onTogglePassword,
  onToggleUsername,
  onToggleEmail,
  onToggleNotes,
  onToggleExpand,
  onCopyRecoveryCode
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Close expanded card when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node) && isExpanded) {
        onToggleExpand();
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded, onToggleExpand]);

  const hasCredentials = profile.username || profile.password || profile.email;
  const hasSecondaryFields = profile.email || profile.notes || profile.document_url || (recoveryCodes && recoveryCodes.length > 0);

  return (
    <div ref={cardRef} className="as-card p-0 rounded-lg relative sm:overflow-hidden overflow-visible group hover:border-zinc-400 dark:hover:border-zinc-700 transition-all">
      {/* Card Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/30 rounded-t-lg overflow-visible">
        <div className="py-2.5 sm:px-4 sm:py-3 -mt-2 sm:mt-0 flex items-center justify-between gap-2 rounded-t-lg">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
              <KeyIcon className="w-4 h-4 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white truncate">
                {profile.title || 'Untitled Profile'}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <ClockIcon className="w-3 h-3 text-zinc-400 dark:text-zinc-600" />
                <span className="text-xs text-zinc-500 dark:text-zinc-500 whitespace-nowrap">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Pin/Favorite Star and Kebab Menu */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Pin/Favorite Star */}
            <button
              onClick={onTogglePin}
              className={`p-1.5 flex items-center justify-center rounded-lg transition-colors ${isPinned
                  ? 'text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-500'
                  : 'text-zinc-400 dark:text-zinc-600 hover:text-yellow-500 dark:hover:text-yellow-400'
                }`}
              title={isPinned ? 'Unpin' : 'Pin'}
            >
              <StarIcon filled={isPinned} />
            </button>

            {/* Kebab Menu - Always visible on mobile, hover-only on desktop */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 sm:p-1.5 flex items-center justify-center text-zinc-400 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md sm:rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                title="More options"
              >
                <DotsVerticalIcon />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 mt-2 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 z-50 sm:w-40 w-auto sm:py-1"
                >
                  {/* Mobile: Icon-only horizontal layout */}
                  <div className="flex sm:hidden items-center gap-1 p-1.5">
                    <button
                      onClick={() => {
                        onShare();
                        setShowMenu(false);
                      }}
                      className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Share"
                    >
                      <ShareIcon className="w-5 h-5 text-green-500" />
                    </button>
                    <button
                      onClick={() => {
                        onEdit();
                        setShowMenu(false);
                      }}
                      className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="w-5 h-5 text-blue-500" />
                    </button>
                    <button
                      onClick={() => {
                        onDelete();
                        setShowMenu(false);
                      }}
                      className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="w-5 h-5 text-red-500" />
                    </button>
                  </div>

                  {/* Desktop: Text + Icon vertical layout */}
                  <div className="hidden sm:block">
                    <button
                      onClick={() => {
                        onShare();
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <ShareIcon className="w-4 h-4 text-green-500" />
                      <span>Share</span>
                    </button>
                    <button
                      onClick={() => {
                        onEdit();
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4 text-blue-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        onDelete();
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4 text-red-500" />
                      <span>Delete</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Body - Content with padding */}
      <div className="pt-3 pb-10 sm:pb-4 sm:px-4 sm:py-4 space-y-3">
        {/* Primary Credentials - Always Visible */}
        {hasCredentials && (
          <div className="space-y-3">
            {profile.username && (
              <CredentialField
                label="USERNAME"
                value={profile.username}
                icon={<UserIcon className="w-4 h-4" />}
                isCopied={copiedField === `username-${profile.id}`}
                onCopy={() => onCopy(profile.username!, `username-${profile.id}`)}
                isSensitive
                showSensitive={showUsername}
                onToggleSensitive={onToggleUsername}
              />
            )}

            {profile.password && (
              <CredentialField
                label="PASSWORD"
                value={profile.password}
                icon={<KeyIcon className="w-4 h-4" />}
                isCopied={copiedField === `password-${profile.id}`}
                onCopy={() => onCopy(profile.password!, `password-${profile.id}`)}
                isPassword
                showPassword={showPassword}
                onTogglePassword={onTogglePassword}
                mono
              />
            )}
          </div>
        )}

        {/* Expanded Section - Email, Notes, Documents, Recovery Codes */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800"
          >
            {profile.email && (
              <CredentialField
                label="Email"
                value={profile.email}
                icon={<MailIcon className="w-4 h-4" />}
                isCopied={copiedField === `email-${profile.id}`}
                onCopy={() => onCopy(profile.email!, `email-${profile.id}`)}
                isSensitive
                showSensitive={showEmail}
                onToggleSensitive={onToggleEmail}
              />
            )}

            {/* Recovery Codes */}
            {recoveryCodes && recoveryCodes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-zinc-400 dark:text-zinc-500"><ShieldIcon className="w-4 h-4" /></span>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Recovery Codes
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded">
                    {recoveryCodes.length} left
                  </span>
                </div>
                <div className="relative">
                  <div className="flex flex-wrap gap-2">
                    {recoveryCodes.map((code, index) => (
                      <button
                        key={index}
                        onClick={() => onCopyRecoveryCode(code, index)}
                        className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${copiedField === `recovery-${profile.id}-${index}`
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/30'
                          } filter blur-sm hover:blur-none`}
                        title="Click to copy & remove"
                      >
                        {code}
                      </button>
                    ))}
                  </div>

                  {/* Blurred overlay retained for subtle background effect (non-blocking) */}
                  <div className="absolute inset-0 backdrop-blur-[2px] bg-zinc-100/50 dark:bg-zinc-900/50 rounded-lg pointer-events-none" />
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-2">
                  Click a code to copy it. Codes are removed after copying.
                </p>
              </div>
            )}

            {/* Document */}
            {profile.document_url && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-zinc-400 dark:text-zinc-500"><DocumentIcon className="w-4 h-4" /></span>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Document</span>
                </div>
                <a
                  href={profile.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400 text-sm hover:bg-blue-500/20 transition-colors"
                >
                  <DocumentIcon className="w-4 h-4" />
                  <span>View Document</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}

            {/* Notes */}
            {profile.notes && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-zinc-400 dark:text-zinc-500"><NotesIcon className="w-4 h-4" /></span>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Notes</span>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3">
                  <p className={`text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap ${!expandedNotes ? 'line-clamp-3' : ''}`}>
                    {profile.notes}
                  </p>
                  {profile.notes.length > 150 && (
                    <button
                      onClick={onToggleNotes}
                      className="text-xs text-blue-400 hover:text-blue-300 mt-2 font-medium"
                    >
                      {expandedNotes ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!hasCredentials && !profile.notes && !profile.document_url && recoveryCodes.length === 0 && (
          <div className="text-center py-4 text-zinc-400 dark:text-zinc-500 text-sm">
            No credentials or data stored yet
          </div>
        )}
      </div>

      {/* Footer Section - Full Bleed (directly inside outer card, no wrapper) */}
      {hasSecondaryFields && (
        <button
          onClick={onToggleExpand}
          className={`w-full py-2.5 sm:py-2 flex items-center justify-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 border-t-0 sm:border-t border-zinc-200 dark:border-zinc-800 sm:relative absolute left-0 right-0 bottom-0 h-15 sm:h-12 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all cursor-pointer sm:mt-1 rounded-b-lg ${!isExpanded ? 'rounded-t-lg' : ''}`}
        >
          <span>{isExpanded ? 'Show Less' : 'View Details'}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''
              }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

const ProfileManager: React.FC<ProfileManagerProps> = ({ organization, onBack }) => {
  // Get master key from CryptoContext (zero-knowledge: key exists only in memory)
  const { getMasterKey } = useCrypto();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orgData, setOrgData] = useState<Organization>(organization);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: number]: boolean }>({});
  const [showUsername, setShowUsername] = useState<{ [key: number]: boolean }>({});
  const [showEmail, setShowEmail] = useState<{ [key: number]: boolean }>({});
  const [expandedCard, setExpandedCard] = useState<{ [key: number]: boolean }>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<{ [key: number]: string[] }>({});
  const [expandedNotes, setExpandedNotes] = useState<{ [key: number]: boolean }>({});
  const [showPasswordReentry, setShowPasswordReentry] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareProfileId, setShareProfileId] = useState<number | null>(null);
  const [shareExpiryHours, setShareExpiryHours] = useState(24);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQRCodeUrl] = useState<string | null>(null);
  const [qrProfileTitle, setQRProfileTitle] = useState<string>('');
  const [newProfile, setNewProfile] = useState({
    title: '',
    username: '',
    password: '',
    email: '',
    recovery_codes: '',
    notes: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Real-time password breach detection
  const { breachCount, isChecking, error: breachError } = usePwnedCheck(newProfile.password);
  
  // Real-time duplicate password detection (pass getMasterKey for zero-knowledge decryption)
  const { duplicateCount, duplicates, isChecking: isDuplicateChecking, error: duplicateError } = useDuplicatePasswordCheck(
    newProfile.password,
    editingProfile?.id,
    getMasterKey
  );

  useEffect(() => {
    fetchOrganizationData();
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization.id]);

  // Listen for mode changes (normal ↔ duress) to refetch data
  useEffect(() => {
    const handleModeChange = () => {
      console.log('🔄 Mode changed - refetching profiles...');
      fetchOrganizationData();
      fetchProfiles();
    };
    
    window.addEventListener('vault-mode-changed', handleModeChange);
    return () => {
      window.removeEventListener('vault-mode-changed', handleModeChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization.id]);

  // Initialize recovery codes for each profile
  useEffect(() => {
    const codes: { [key: number]: string[] } = {};
    profiles.forEach(profile => {
      if (profile.recovery_codes) {
        // Split by whitespace and filter out empty strings
        codes[profile.id] = profile.recovery_codes.split(/\s+/).filter(code => code.trim() !== '');
      }
    });
    setRecoveryCodes(codes);
  }, [profiles]);

  const fetchOrganizationData = async () => {
    try {
      const response = await apiClient.get(`organizations/${organization.id}/`);
      setOrgData(response.data);
    } catch (err: any) {
      console.error('Error fetching organization:', err);
    }
  };

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`organizations/${organization.id}/profiles/`);

      // Decrypt credentials client-side
      const encryptionKey = getMasterKey();
      if (!encryptionKey) {
        // Show password re-entry modal
        setShowPasswordReentry(true);
        setLoading(false);
        return;
      }

      const decryptedProfiles = await Promise.all(
        response.data.map(async (profile: any) => {
          try {
            const decryptedFields = await decryptCredentialFields(profile, encryptionKey);
            return {
              ...profile,
              username: decryptedFields.username || null,
              password: decryptedFields.password || null,
              email: decryptedFields.email || null,
              notes: decryptedFields.notes || null,
              recovery_codes: decryptedFields.recovery_codes || null,
            };
          } catch (error) {
            console.error(`Failed to decrypt profile ${profile.id}:`, error);
            return {
              ...profile,
              username: null,
              password: null,
              email: null,
              notes: null,
              recovery_codes: null,
            };
          }
        })
      );

      setProfiles(decryptedProfiles);
    } catch (err: any) {
      console.error('Error:', err.response || err);
      setError('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check password security metrics
  const checkPasswordSecurity = async (profileId: number, password: string) => {
    if (!password) return;

    try {
      // 1. Calculate password strength using zxcvbn (0-4 scale)
      const strengthResult = zxcvbn(password);
      await updatePasswordStrength(profileId, strengthResult.score);

      // 2. Check if password has been breached using HIBP
      const breachResult = await checkPasswordBreach(password);
      await updateBreachStatus(profileId, breachResult.isBreached, breachResult.breachCount);

      // 3. Update password hash for uniqueness checking
      await updatePasswordHash(profileId, password);

      console.log(`Security metrics updated for profile ${profileId}:`, {
        strength: strengthResult.score,
        breached: breachResult.isBreached,
        breachCount: breachResult.breachCount
      });
    } catch (error) {
      console.error('Failed to update security metrics:', error);
      // Don't fail the profile creation/update if security check fails
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Get encryption key from CryptoContext (memory only)
      const encryptionKey = getMasterKey();
      if (!encryptionKey) {
        setShowPasswordReentry(true);
        return;
      }

      // Encrypt sensitive fields client-side
      const encryptedFields = await encryptCredentialFields(
        {
          username: newProfile.username,
          password: newProfile.password,
          email: newProfile.email,
          notes: newProfile.notes,
          recovery_codes: newProfile.recovery_codes,
        },
        encryptionKey
      );

      const formData = new FormData();
      // Append non-encrypted fields
      formData.append('title', newProfile.title || '');

      // Append encrypted fields
      if (encryptedFields.username_encrypted) {
        formData.append('username_encrypted', encryptedFields.username_encrypted);
        formData.append('username_iv', encryptedFields.username_iv!);
      }
      if (encryptedFields.password_encrypted) {
        formData.append('password_encrypted', encryptedFields.password_encrypted);
        formData.append('password_iv', encryptedFields.password_iv!);
      }
      if (encryptedFields.email_encrypted) {
        formData.append('email_encrypted', encryptedFields.email_encrypted);
        formData.append('email_iv', encryptedFields.email_iv!);
      }
      if (encryptedFields.notes_encrypted) {
        formData.append('notes_encrypted', encryptedFields.notes_encrypted);
        formData.append('notes_iv', encryptedFields.notes_iv!);
      }
      if (encryptedFields.recovery_codes_encrypted) {
        formData.append('recovery_codes_encrypted', encryptedFields.recovery_codes_encrypted);
        formData.append('recovery_codes_iv', encryptedFields.recovery_codes_iv!);
      }

      if (selectedFile) formData.append('document', selectedFile);

      if (editingProfile) {
        const response = await apiClient.put(
          `profiles/${editingProfile.id}/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        // Decrypt the response data before updating state
        try {
          const decryptedFields = await decryptCredentialFields(response.data, encryptionKey);
          const decryptedProfile = {
            ...response.data,
            username: decryptedFields.username || null,
            password: decryptedFields.password || null,
            email: decryptedFields.email || null,
            notes: decryptedFields.notes || null,
            recovery_codes: decryptedFields.recovery_codes || null,
          };
          setProfiles(profiles.map(p => p.id === editingProfile.id ? decryptedProfile : p));

          // Check password security metrics (strength + breach check)
          if (newProfile.password) {
            await checkPasswordSecurity(response.data.id, newProfile.password);
          }
        } catch (error) {
          console.error(`Failed to decrypt updated profile:`, error);
          setProfiles(profiles.map(p => p.id === editingProfile.id ? response.data : p));
        }
      } else {
        const response = await apiClient.post(
          `organizations/${organization.id}/profiles/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        // Decrypt the response data before adding to state
        try {
          const decryptedFields = await decryptCredentialFields(response.data, encryptionKey);
          const decryptedProfile = {
            ...response.data,
            username: decryptedFields.username || null,
            password: decryptedFields.password || null,
            email: decryptedFields.email || null,
            notes: decryptedFields.notes || null,
            recovery_codes: decryptedFields.recovery_codes || null,
          };
          setProfiles([...profiles, decryptedProfile]);

          // Check password security metrics (strength + breach check)
          if (newProfile.password) {
            await checkPasswordSecurity(response.data.id, newProfile.password);
          }
        } catch (error) {
          console.error(`Failed to decrypt new profile:`, error);
          setProfiles([...profiles, response.data]);
        }
      }

      setShowModal(false);
      setEditingProfile(null);
      setNewProfile({ title: '', username: '', password: '', email: '', recovery_codes: '', notes: '' });
      setSelectedFile(null);
    } catch (err: any) {
      console.error('Error:', err.response || err);
      setError(editingProfile ? 'Failed to update profile' : 'Failed to create profile');
    }
  };

  const handleDeleteProfile = async (profileId: number) => {
    if (!window.confirm('Delete this profile?')) return;

    try {
      await apiClient.delete(`profiles/${profileId}/`);
      setProfiles(profiles.filter(p => p.id !== profileId));
    } catch (err: any) {
      setError('Failed to delete profile');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setNewProfile({
      title: profile.title || '',
      username: profile.username || '',
      password: profile.password || '',
      email: profile.email || '',
      recovery_codes: profile.recovery_codes || '',
      notes: profile.notes || '',
    });
    setShowModal(true);
    setError(null);
  };

  // Use secure clipboard hook with auto-clear
  const { copy: secureCopy } = useClipboard({ clearAfter: 30000 });

  const copyToClipboard = async (text: string, field: string) => {
    // Extract profile ID from field (format: "field-profileId")
    const profileId = field.split('-').pop();
    if (profileId) {
      trackAccess(profileId, 'profile');
    }
    const success = await secureCopy(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      setCopiedField(null);
    }
  };

  const togglePasswordVisibility = (profileId: number) => {
    trackAccess(profileId, 'profile');
    setShowPassword(prev => ({
      ...prev,
      [profileId]: !prev[profileId]
    }));
  };

  const toggleUsernameVisibility = (profileId: number) => {
    trackAccess(profileId, 'profile');
    setShowUsername(prev => ({
      ...prev,
      [profileId]: !prev[profileId]
    }));
  };

  const toggleEmailVisibility = (profileId: number) => {
    trackAccess(profileId, 'profile');
    setShowEmail(prev => ({
      ...prev,
      [profileId]: !prev[profileId]
    }));
  };

  const toggleNotesExpansion = (profileId: number) => {
    setExpandedNotes(prev => ({
      ...prev,
      [profileId]: !prev[profileId]
    }));
  };

  const togglePinProfile = async (profileId: number) => {
    try {
      const profile = profiles.find(p => p.id === profileId);
      if (!profile) return;

      const formData = new FormData();
      formData.append('is_pinned', String(!profile.is_pinned));

      await apiClient.patch(`profiles/${profileId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update local state
      setProfiles(prev => prev.map(p =>
        p.id === profileId ? { ...p, is_pinned: !p.is_pinned } : p
      ));
    } catch (err: any) {
      console.error('Error toggling pin status:', err);
    }
  };

  const handleCopyRecoveryCode = async (profileId: number, code: string, index: number) => {
    const success = await secureCopy(code);
    if (success) {
      setCopiedField(`recovery-${profileId}-${index}`);
      setTimeout(() => setCopiedField(null), 1000);

      // Remove the copied code from the list
      setRecoveryCodes(prev => {
        const updated = { ...prev };
        if (updated[profileId]) {
          updated[profileId] = updated[profileId].filter((_, i) => i !== index);

          // Update the profile with the new recovery codes
          const updatedCodes = updated[profileId].join(' ');
          updateProfileRecoveryCodes(profileId, updatedCodes);
        }
        return updated;
      });
    } else {
      console.error('Failed to copy recovery code');
    }
  };

  const updateProfileRecoveryCodes = async (profileId: number, newCodes: string) => {
    try {
      const formData = new FormData();
      formData.append('recovery_codes', newCodes);

      await apiClient.put(`profiles/${profileId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update the profiles list
      setProfiles(profiles.map(p =>
        p.id === profileId ? { ...p, recovery_codes: newCodes } : p
      ));
    } catch (err) {
      console.error('Failed to update recovery codes:', err);
    }
  };

  const handlePasswordReentrySuccess = () => {
    setShowPasswordReentry(false);
    // Retry fetching profiles after successful password re-entry
    fetchProfiles();
  };

  const handleShareProfile = async (profileId: number) => {
    setShareProfileId(profileId);
    setShowShareModal(true);
  };

  const handleCreateShareLink = async () => {
    if (!shareProfileId) return;

    try {
      // Find the profile to share
      const profile = profiles.find(p => p.id === shareProfileId);
      if (!profile) {
        setError('Profile not found');
        return;
      }

      // Get the master encryption key from CryptoContext (memory only)
      const masterKey = getMasterKey();
      if (!masterKey) {
        setError('Session expired. Please re-enter your master password.');
        setShowPasswordReentry(true);
        return;
      }

      // Decrypt all fields before encrypting for sharing
      const decryptedFields = await decryptCredentialFields(
        {
          username_encrypted: profile.username_encrypted,
          username_iv: profile.username_iv,
          password_encrypted: profile.password_encrypted,
          password_iv: profile.password_iv,
          email_encrypted: profile.email_encrypted,
          email_iv: profile.email_iv,
          notes_encrypted: profile.notes_encrypted,
          notes_iv: profile.notes_iv,
          recovery_codes_encrypted: profile.recovery_codes_encrypted,
          recovery_codes_iv: profile.recovery_codes_iv,
        },
        masterKey
      );

      // Build data object for sharing
      const shareData: Record<string, any> = {
        title: profile.title,
        organization: orgData.name,
      };
      
      if (decryptedFields.username) shareData.username = decryptedFields.username;
      if (decryptedFields.password) shareData.password = decryptedFields.password;
      if (decryptedFields.email) shareData.email = decryptedFields.email;
      if (decryptedFields.notes) shareData.notes = decryptedFields.notes;
      if (decryptedFields.recovery_codes) shareData.recovery_codes = decryptedFields.recovery_codes;

      // ═══════════════════════════════════════════════════════════════════════════
      // ZERO-KNOWLEDGE: Encrypt client-side before sending to server
      // Server NEVER sees the decrypted data
      // ═══════════════════════════════════════════════════════════════════════════
      const { encryptForOneTimeShare } = await import('../services/cryptoService');
      const { encryptedBlob, shareKey } = await encryptForOneTimeShare(shareData);

      // Send ONLY the encrypted blob to server (server cannot decrypt)
      const response = await apiClient.post('shared-secrets/create/', {
        profile_id: shareProfileId,
        expiry_hours: shareExpiryHours,
        encrypted_blob: encryptedBlob,
      });

      if (response.data.success) {
        // Append the encryption key as URL fragment (# not sent to server)
        const fullShareUrl = `${response.data.share_url}#${shareKey}`;
        setShareUrl(fullShareUrl);
        setError(null);
        setSuccess(`Secure share link created! Link expires in ${shareExpiryHours} hour${shareExpiryHours > 1 ? 's' : ''} and can only be viewed once.`);

        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err: any) {
      console.error('Failed to create share link:', err);
      setError(err.response?.data?.error || 'Failed to create secure share link');
      setSuccess(null);
    }
  };

  const handleCopyShareLink = async () => {
    if (shareUrl) {
      const success = await secureCopy(shareUrl);
      if (success) {
        setCopiedShare(true);
        setSuccess('Link copied to clipboard!');
        // Quick visual feedback for the button
        setTimeout(() => {
          setCopiedShare(false);
        }, 1200);
        // Close modal and clear share state after success message
        setTimeout(() => {
          setSuccess(null);
          setShowShareModal(false);
          setShareUrl(null);
          setShareProfileId(null);
          setShareExpiryHours(24);
        }, 2000);
      }
    }
  };

  const handlePasswordReentryCancel = () => {
    setShowPasswordReentry(false);
    onBack();
  };

  return (
    <div className="min-h-screen bg-[var(--as-bg-base)]">
      {/* Password Re-entry Modal */}
      <PasswordReentryModal
        isOpen={showPasswordReentry}
        onSuccess={handlePasswordReentrySuccess}
        onCancel={handlePasswordReentryCancel}
      />

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[var(--as-bg-card)] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Share Credential</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Create a one-time secure link</p>
              </div>
            </div>

            {!shareUrl ? (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Link Expiry
                    </label>
                    <select
                      value={shareExpiryHours}
                      onChange={(e) => setShareExpiryHours(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-white dark:bg-[var(--as-bg-base)] border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1 hour</option>
                      <option value={6}>6 hours</option>
                      <option value={12}>12 hours</option>
                      <option value={24}>24 hours (1 day)</option>
                      <option value={48}>48 hours (2 days)</option>
                      <option value={72}>72 hours (3 days)</option>
                      <option value={168}>1 week</option>
                    </select>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg p-4">
                    <div className="flex gap-3">
                      <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-yellow-900 dark:text-yellow-200">
                        <p className="font-medium mb-1">Security Notice</p>
                        <p className="text-yellow-800 dark:text-yellow-300/80">Link can only be viewed once and will be permanently destroyed after viewing.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowShareModal(false);
                      setShareProfileId(null);
                      setShareExpiryHours(24);
                    }}
                    className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateShareLink}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium shadow-lg"
                  >
                    Create Link
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {/* QR Code Section */}
                  <div className="flex flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-6">
                    <div className="mb-4 text-center">
                      <h4 className="text-zinc-900 dark:text-white font-semibold text-lg mb-1">Scan QR Code</h4>
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm">Quick access for mobile devices</p>
                    </div>

                    <div className="relative bg-white p-4 rounded-2xl shadow-2xl mb-4">
                      <canvas
                        ref={(canvas) => {
                          if (canvas && shareUrl) {
                            QRCode.toCanvas(canvas, shareUrl, {
                              width: 220,
                              margin: 2,
                              color: {
                                dark: '#1e293b',
                                light: '#ffffff'
                              },
                              errorCorrectionLevel: 'H'
                            }).then(() => {
                              // Add logo overlay using actual logo.png
                              const ctx = canvas.getContext('2d');
                              if (ctx) {
                                const logo = new Image();
                                logo.crossOrigin = 'anonymous';
                                logo.onload = () => {
                                  const logoSize = 50;
                                  const x = (canvas.width - logoSize) / 2;
                                  const y = (canvas.height - logoSize) / 2;

                                  // Emerald rounded background with border (matching the style)
                                  const padding = 8;
                                  const bgSize = logoSize + (padding * 2);
                                  const bgX = x - padding;
                                  const bgY = y - padding;
                                  const radius = 8;

                                  // Draw emerald-50 rounded background
                                  ctx.fillStyle = '#ecfdf5'; // emerald-50
                                  ctx.beginPath();
                                  ctx.moveTo(bgX + radius, bgY);
                                  ctx.lineTo(bgX + bgSize - radius, bgY);
                                  ctx.quadraticCurveTo(bgX + bgSize, bgY, bgX + bgSize, bgY + radius);
                                  ctx.lineTo(bgX + bgSize, bgY + bgSize - radius);
                                  ctx.quadraticCurveTo(bgX + bgSize, bgY + bgSize, bgX + bgSize - radius, bgY + bgSize);
                                  ctx.lineTo(bgX + radius, bgY + bgSize);
                                  ctx.quadraticCurveTo(bgX, bgY + bgSize, bgX, bgY + bgSize - radius);
                                  ctx.lineTo(bgX, bgY + radius);
                                  ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
                                  ctx.closePath();
                                  ctx.fill();

                                  // Draw emerald-200 border
                                  ctx.strokeStyle = '#d1fae5'; // emerald-200
                                  ctx.lineWidth = 2;
                                  ctx.stroke();

                                  // Draw logo image
                                  ctx.drawImage(logo, x, y, logoSize, logoSize);
                                };
                                logo.src = '/logo.png';
                              }
                            }).catch((err) => console.error('QR Code error:', err));
                          }
                        }}
                        className="rounded-lg"
                      />
                    </div>

                    <button
                      onClick={() => {
                        const canvas = document.querySelector('canvas');
                        if (canvas) {
                          canvas.toBlob((blob) => {
                            if (blob) {
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'accountsafe-share-qr.png';
                              a.click();
                              URL.revokeObjectURL(url);
                            }
                          });
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-white/10 hover:bg-blue-200 dark:hover:bg-white/20 border border-blue-300 dark:border-white/20 text-blue-900 dark:text-white rounded-lg transition-all font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download QR Code
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Share Link (Expires in {shareExpiryHours} hour{shareExpiryHours > 1 ? 's' : ''})
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-[var(--as-bg-base)] border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white font-mono text-sm"
                      />
                      <button
                        onClick={handleCopyShareLink}
                        className={`px-4 py-3 rounded-lg transition-colors transform ${copiedShare ? 'bg-green-600 hover:bg-green-700 scale-95' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                        title="Copy link"
                        aria-pressed={copiedShare}
                      >
                        {copiedShare ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg p-4">
                    <div className="flex gap-3">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-green-900 dark:text-green-200">
                        <p className="font-medium">Link Created Successfully!</p>
                        <p className="text-green-800 dark:text-green-300/80 mt-1">Share this link or QR code with the recipient.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCopyShareLink}
                  className={`w-full px-4 py-3 rounded-lg transition-all font-medium shadow-lg ${copiedShare ? 'bg-green-600 hover:bg-green-700 scale-95 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'}`}
                >
                  {copiedShare ? 'Copied!' : 'Copy Link & Close'}
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && qrCodeUrl && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[var(--as-bg-card)] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
                  <QRCodeIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{qrProfileTitle}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Secure credential sharing</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setQRCodeUrl(null);
                  setQRProfileTitle('');
                }}
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* QR Code Display */}
              <div className="flex flex-col items-center bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-500/10 dark:to-indigo-500/10 border border-purple-200 dark:border-purple-500/30 rounded-xl p-6">
                <div className="mb-4 text-center">
                  <h4 className="text-zinc-900 dark:text-white font-semibold text-lg mb-1">Scan to Access</h4>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm">One-time secure link</p>
                </div>

                <div className="relative bg-white p-4 rounded-2xl shadow-2xl mb-4">
                  <canvas
                    ref={(canvas) => {
                      if (canvas && qrCodeUrl) {
                        QRCode.toCanvas(canvas, qrCodeUrl, {
                          width: 280,
                          margin: 2,
                          color: {
                            dark: '#1e293b',
                            light: '#ffffff'
                          },
                          errorCorrectionLevel: 'H'
                        }).then(() => {
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            const logo = new Image();
                            logo.crossOrigin = 'anonymous';
                            logo.onload = () => {
                              const logoSize = 60;
                              const x = (canvas.width - logoSize) / 2;
                              const y = (canvas.height - logoSize) / 2;

                              // Emerald rounded background with border (matching the style)
                              const padding = 8;
                              const bgSize = logoSize + (padding * 2);
                              const bgX = x - padding;
                              const bgY = y - padding;
                              const radius = 12;

                              // Draw emerald-50 rounded background
                              ctx.fillStyle = '#ecfdf5'; // emerald-50
                              ctx.beginPath();
                              ctx.moveTo(bgX + radius, bgY);
                              ctx.lineTo(bgX + bgSize - radius, bgY);
                              ctx.quadraticCurveTo(bgX + bgSize, bgY, bgX + bgSize, bgY + radius);
                              ctx.lineTo(bgX + bgSize, bgY + bgSize - radius);
                              ctx.quadraticCurveTo(bgX + bgSize, bgY + bgSize, bgX + bgSize - radius, bgY + bgSize);
                              ctx.lineTo(bgX + radius, bgY + bgSize);
                              ctx.quadraticCurveTo(bgX, bgY + bgSize, bgX, bgY + bgSize - radius);
                              ctx.lineTo(bgX, bgY + radius);
                              ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
                              ctx.closePath();
                              ctx.fill();

                              // Emerald border
                              ctx.strokeStyle = '#d1fae5'; // emerald-200
                              ctx.lineWidth = 2;
                              ctx.stroke();

                              // Draw logo
                              ctx.drawImage(logo, x, y, logoSize, logoSize);
                            };
                            logo.src = '/logo.png';
                          }
                        }).catch((err) => console.error('QR Code error:', err));
                      }
                    }}
                    className="rounded-lg"
                  />
                </div>

                <button
                  onClick={() => {
                    const canvas = document.querySelector('canvas');
                    if (canvas) {
                      canvas.toBlob((blob) => {
                        if (blob) {
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `accountsafe-${qrProfileTitle.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }
                      });
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-white/10 hover:bg-purple-200 dark:hover:bg-white/20 border border-purple-300 dark:border-white/20 text-purple-900 dark:text-white rounded-lg transition-all font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download QR Code
                </button>
              </div>

              <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-purple-900 dark:text-purple-200">
                    <p className="font-medium">One-Time Access</p>
                    <p className="text-purple-800 dark:text-purple-300/80 mt-1">This QR code can only be scanned once and expires in 24 hours.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-6">

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* Back Button & Header */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        <button
          onClick={onBack}
          aria-label="Back to Vault"
          className="mb-2 sm:mb-4 flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md group"
        >
          <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium text-sm sm:text-base">Back to Vault</span>
        </button>

        {/* Organization Header - Logo and Title with Button */}
        <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Organization Logo */}
            {orgData.logo_url ? (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                <img
                  src={orgData.logo_url}
                  alt={orgData.name}
                  className="w-full h-full object-contain p-2 bg-white dark:bg-transparent"
                />
              </div>
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold text-lg sm:text-xl">
                  {orgData.name ? orgData.name.charAt(0).toUpperCase() : 'O'}
                </span>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white truncate">
                {orgData.name || 'Loading...'}
              </h1>
              <span className="text-zinc-400 text-xs sm:text-sm">
                {profiles.length} {profiles.length === 1 ? 'credential' : 'credentials'}
              </span>
            </div>
          </div>

          {/* Add Profile Button */}
          <button
            onClick={() => { setShowModal(true); setError(null); }}
            className="as-btn-primary px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl flex items-center gap-2 group flex-shrink-0 shadow-lg"
            title="Add Credential"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-90" />
            <span className="hidden sm:inline text-sm font-semibold">Add New Credentials</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* Error Alert */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
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

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* Success Alert */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {success && (
          <div className="as-alert-success mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckIcon className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="hover:opacity-70 transition-opacity">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* Loading State */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-zinc-700 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-zinc-400">Loading credentials...</p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* Empty State */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {!loading && profiles.length === 0 && (
          <div className="as-card p-12 text-center">
            <div className="w-20 h-20 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <KeyIcon className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No credentials yet</h3>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Add your first credential to start storing passwords, emails, and recovery codes securely.
            </p>
            <button
              onClick={() => { setShowModal(true); setError(null); }}
              className="as-btn-primary inline-flex items-center gap-2"
            >
              <span className="sm:hidden">
                <PlusIcon className="w-5 h-5" />
              </span>
              <span className="hidden sm:inline">+ Add New Credentials</span>
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* Profiles Grid */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {!loading && profiles.length > 0 && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 items-start">
            {sortByFrequency(profiles, 'profile').map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                recoveryCodes={recoveryCodes[profile.id] || []}
                showPassword={showPassword[profile.id] || false}
                showUsername={showUsername[profile.id] || false}
                showEmail={showEmail[profile.id] || false}
                expandedNotes={expandedNotes[profile.id] || false}
                isExpanded={expandedCard[profile.id] || false}
                copiedField={copiedField}
                isPinned={profile.is_pinned || false}
                onEdit={() => handleEditProfile(profile)}
                onDelete={() => handleDeleteProfile(profile.id)}
                onShare={() => handleShareProfile(profile.id)}
                onTogglePin={() => togglePinProfile(profile.id)}
                onCopy={copyToClipboard}
                onTogglePassword={() => togglePasswordVisibility(profile.id)}
                onToggleUsername={() => toggleUsernameVisibility(profile.id)}
                onToggleEmail={() => toggleEmailVisibility(profile.id)}
                onToggleNotes={() => toggleNotesExpansion(profile.id)}
                onToggleExpand={() => setExpandedCard(prev => ({ ...prev, [profile.id]: !prev[profile.id] }))}
                onCopyRecoveryCode={(code, index) => handleCopyRecoveryCode(profile.id, code, index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════ */}
      {/* Create/Edit Profile Modal */}
      {/* ═══════════════════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setShowModal(false)}
        >
          <div
            className="as-modal w-full max-w-lg max-h-[90vh] overflow-y-auto animate-[modalIn_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <KeyIcon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  {editingProfile ? 'Edit Credential' : 'Add Credential'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateProfile} className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <span className="flex items-center gap-2">
                    <NotesIcon className="w-4 h-4 text-zinc-500" />
                    Title
                  </span>
                </label>
                <input
                  type="text"
                  value={newProfile.title}
                  onChange={(e) => setNewProfile({ ...newProfile, title: e.target.value })}
                  placeholder="e.g., Admin Account, Personal Login"
                  className="as-input w-full"
                  autoFocus
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <span className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-zinc-500" />
                    Username
                  </span>
                </label>
                <input
                  type="text"
                  value={newProfile.username}
                  onChange={(e) => setNewProfile({ ...newProfile, username: e.target.value })}
                  placeholder="e.g., john_doe or admin@example.com"
                  className="as-input w-full"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <span className="flex items-center gap-2">
                    <KeyIcon className="w-4 h-4 text-zinc-500" />
                    Password
                  </span>
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProfile.password}
                      onChange={(e) => setNewProfile({ ...newProfile, password: e.target.value })}
                      placeholder="Enter password or generate one"
                      className="as-input flex-1 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const pwd = generatePassword({
                          length: 16,
                          uppercase: true,
                          lowercase: true,
                          numbers: true,
                          symbols: true
                        });
                        setNewProfile({ ...newProfile, password: pwd });
                      }}
                      className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:text-blue-300 transition-all flex items-center gap-2"
                      title="Generate strong password"
                    >
                      <SparklesIcon className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm">Generate</span>
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newProfile.password && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${getPasswordStrength(newProfile.password).color === 'green' ? 'bg-emerald-500' :
                                getPasswordStrength(newProfile.password).color === 'blue' ? 'bg-blue-500' :
                                  getPasswordStrength(newProfile.password).color === 'yellow' ? 'bg-yellow-500' :
                                    'bg-red-500'
                              }`}
                            style={{ width: `${getPasswordStrength(newProfile.password).score}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${getPasswordStrength(newProfile.password).color === 'green' ? 'text-emerald-400' :
                            getPasswordStrength(newProfile.password).color === 'blue' ? 'text-blue-400' :
                              getPasswordStrength(newProfile.password).color === 'yellow' ? 'text-yellow-400' :
                                'text-red-400'
                          }`}>
                          {getPasswordStrength(newProfile.password).label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {newProfile.password.length >= 12 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">12+ chars</span>
                        )}
                        {/[A-Z]/.test(newProfile.password) && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">Uppercase</span>
                        )}
                        {/[a-z]/.test(newProfile.password) && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">Lowercase</span>
                        )}
                        {/[0-9]/.test(newProfile.password) && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">Numbers</span>
                        )}
                        {/[^a-zA-Z0-9]/.test(newProfile.password) && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">Symbols</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Password Suggestions when field is empty */}
                  {!newProfile.password && (
                    <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                      <p className="text-xs text-zinc-400 mb-2 flex items-center gap-1.5">
                        <SparklesIcon className="w-3.5 h-3.5" />
                        Quick suggestions (click to use):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          generatePassword({ length: 12, uppercase: true, lowercase: true, numbers: true, symbols: false }),
                          generatePassword({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true }),
                          generatePassword({ length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true })
                        ].map((pwd, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setNewProfile({ ...newProfile, password: pwd })}
                            className="text-xs font-mono px-2 py-1.5 bg-zinc-700/50 hover:bg-zinc-700 border border-zinc-600 rounded text-zinc-300 hover:text-white transition-colors truncate max-w-[150px]"
                            title={pwd}
                          >
                            {pwd.substring(0, 12)}...
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Real-Time Breach Warning */}
                  {newProfile.password && (
                    <BreachWarning
                      breachCount={breachCount}
                      isChecking={isChecking}
                      error={breachError}
                    />
                  )}
                  
                  {/* Real-Time Duplicate Password Warning */}
                  {newProfile.password && (
                    <DuplicatePasswordWarning
                      duplicateCount={duplicateCount}
                      duplicates={duplicates}
                      isChecking={isDuplicateChecking}
                      error={duplicateError}
                    />
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <span className="flex items-center gap-2">
                    <MailIcon className="w-4 h-4 text-zinc-500" />
                    Email
                  </span>
                </label>
                <input
                  type="email"
                  value={newProfile.email}
                  onChange={(e) => setNewProfile({ ...newProfile, email: e.target.value })}
                  placeholder="e.g., user@example.com"
                  className="as-input w-full"
                />
              </div>

              {/* Recovery Codes */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <span className="flex items-center gap-2">
                    <ShieldIcon className="w-4 h-4 text-zinc-500" />
                    Recovery Codes
                  </span>
                </label>
                <textarea
                  value={newProfile.recovery_codes}
                  onChange={(e) => setNewProfile({ ...newProfile, recovery_codes: e.target.value })}
                  placeholder="Paste recovery codes (space-separated)"
                  rows={3}
                  className="as-input w-full resize-none font-mono text-sm"
                />
                <p className="text-xs text-zinc-500 mt-1.5">
                  Codes will appear as clickable buttons. Clicking copies and removes them.
                </p>
              </div>

              {/* Document */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <span className="flex items-center gap-2">
                    <DocumentIcon className="w-4 h-4 text-zinc-500" />
                    Document
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="as-input w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 file:cursor-pointer cursor-pointer"
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-1.5">
                  Upload PDFs, images, or other documents
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <span className="flex items-center gap-2">
                    <NotesIcon className="w-4 h-4 text-zinc-500" />
                    Notes
                  </span>
                </label>
                <textarea
                  value={newProfile.notes}
                  onChange={(e) => setNewProfile({ ...newProfile, notes: e.target.value })}
                  placeholder="Additional information..."
                  rows={4}
                  className="as-input w-full resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProfile(null);
                    setNewProfile({ title: '', username: '', password: '', email: '', recovery_codes: '', notes: '' });
                    setSelectedFile(null);
                  }}
                  className="as-btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="as-btn-primary flex-1">
                  {editingProfile ? 'Save Changes' : 'Add Credential'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileManager;
