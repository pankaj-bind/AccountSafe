// src/features/vault/components/ProfileCard.tsx
/**
 * ProfileCard - Credential Card Display Component
 *
 * Pure presentation component for displaying a single profile/credential.
 * Receives all data and callbacks via props.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import CredentialField from './CredentialField';
import type { Profile } from '../types/profile.types';

// ═══════════════════════════════════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════════════════════════════════

const KeyIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const UserIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MailIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ShieldIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const DocumentIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const NotesIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const ClockIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

const ShareIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
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

// ═══════════════════════════════════════════════════════════════════════════════
// Props Interface
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

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

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
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showMenu]);

  // Close expanded card when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node) && isExpanded) {
        onToggleExpand();
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
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
              className={`p-1.5 flex items-center justify-center rounded-lg transition-colors ${
                isPinned
                  ? 'text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-500'
                  : 'text-zinc-400 dark:text-zinc-600 hover:text-yellow-500 dark:hover:text-yellow-400'
              }`}
              title={isPinned ? 'Unpin' : 'Pin'}
            >
              <StarIcon filled={isPinned} />
            </button>

            {/* Kebab Menu */}
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
                      onClick={() => { onShare(); setShowMenu(false); }}
                      className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Share"
                    >
                      <ShareIcon className="w-5 h-5 text-green-500" />
                    </button>
                    <button
                      onClick={() => { onEdit(); setShowMenu(false); }}
                      className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="w-5 h-5 text-blue-500" />
                    </button>
                    <button
                      onClick={() => { onDelete(); setShowMenu(false); }}
                      className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="w-5 h-5 text-red-500" />
                    </button>
                  </div>

                  {/* Desktop: Text + Icon vertical layout */}
                  <div className="hidden sm:block">
                    <button
                      onClick={() => { onShare(); setShowMenu(false); }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <ShareIcon className="w-4 h-4 text-green-500" />
                      <span>Share</span>
                    </button>
                    <button
                      onClick={() => { onEdit(); setShowMenu(false); }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4 text-blue-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => { onDelete(); setShowMenu(false); }}
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

      {/* Card Body */}
      <div className="pt-3 pb-10 sm:pb-4 sm:px-4 sm:py-4 space-y-3">
        {/* Primary Credentials */}
        {hasCredentials && (
          <div className="space-y-3">
            {profile.username && (
              <CredentialField
                label="USERNAME"
                value={profile.username}
                icon={<UserIcon />}
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
                icon={<KeyIcon />}
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

        {/* Expanded Section */}
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
                icon={<MailIcon />}
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
                  <span className="text-zinc-400 dark:text-zinc-500"><ShieldIcon /></span>
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
                        className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                          copiedField === `recovery-${profile.id}-${index}`
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/30'
                        } filter blur-sm hover:blur-none`}
                        title="Click to copy & remove"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
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
                  <span className="text-zinc-400 dark:text-zinc-500"><DocumentIcon /></span>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Document</span>
                </div>
                <a
                  href={profile.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400 text-sm hover:bg-blue-500/20 transition-colors"
                >
                  <DocumentIcon />
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
                  <span className="text-zinc-400 dark:text-zinc-500"><NotesIcon /></span>
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

      {/* Footer - Expand/Collapse */}
      {hasSecondaryFields && (
        <button
          onClick={onToggleExpand}
          className={`w-full py-2.5 sm:py-2 flex items-center justify-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 border-t-0 sm:border-t border-zinc-200 dark:border-zinc-800 sm:relative absolute left-0 right-0 bottom-0 h-15 sm:h-12 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all cursor-pointer sm:mt-1 rounded-b-lg ${!isExpanded ? 'rounded-t-lg' : ''}`}
        >
          <span>{isExpanded ? 'Show Less' : 'View Details'}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ProfileCard;
