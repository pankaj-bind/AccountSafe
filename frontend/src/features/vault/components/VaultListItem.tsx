// src/features/vault/components/VaultListItem.tsx
/**
 * VaultListItem - Compact Row-Based Organization Display
 * 
 * RESPONSIBILITY: High-density list view for mobile devices.
 * Displays organization info in a compact row format with quick actions.
 * Long-press shows action menu (Visit Link, Edit, Delete).
 * 
 * Design: Flexbox row layout
 * - Left: Brand Logo (40x40 rounded)
 * - Middle: Title (truncated bold) + Credential count (small text-gray-500)
 * - Right: Action Buttons (Launch URL, Chevron)
 */

import React, { useState, useRef, useCallback } from 'react';
import { formatCredentialCount } from '../../../utils/formatters';
import { findDigitalWalletDocument } from '../types/category.types';
import type { Organization } from '../types/category.types';

// ═══════════════════════════════════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════════════════════════════════

const ExternalLinkIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

const ChevronRightIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const KeyIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const PencilIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const TrashIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Props Interface
// ═══════════════════════════════════════════════════════════════════════════════

interface VaultListItemProps {
  org: Organization;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Long press duration in milliseconds
const LONG_PRESS_DURATION = 500;

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

const VaultListItem: React.FC<VaultListItemProps> = ({ org, onClick, onEdit, onDelete }) => {
  const [imageError, setImageError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  // Check if this org matches a Digital Wallet document type
  const docMatch = findDigitalWalletDocument(org.name);
  const credInfo = formatCredentialCount(org.profile_count);

  // Handle external link click - prevent opening modal
  const handleLaunchUrl = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (org.website_link) {
      window.open(org.website_link, '_blank', 'noopener,noreferrer');
    }
    setShowMenu(false);
  }, [org.website_link]);

  // Long press handlers
  const handlePressStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowMenu(true);
    }, LONG_PRESS_DURATION);
  }, []);

  const handlePressEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // If it was a long press, don't trigger onClick
    if (isLongPress.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Don't navigate if menu is showing or was a long press
    if (showMenu || isLongPress.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick();
  }, [showMenu, onClick]);

  const handleEdit = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit();
  }, [onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete();
  }, [onDelete]);

  const closeMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  return (
    <div
      onClick={handleClick}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={() => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }}
      className="relative flex items-center gap-3 h-16 px-3 bg-white dark:bg-zinc-900/50 cursor-pointer transition-all duration-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 active:bg-zinc-100 dark:active:bg-zinc-800 border-b border-slate-100 dark:border-zinc-800/50 last:border-b-0 select-none"
    >
      {/* Left: Logo (smaller on mobile) */}
      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
        {docMatch ? (
          <img
            src={docMatch.icon}
            alt={org.name}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain"
          />
        ) : org.logo_url && !imageError ? (
          <img
            src={org.logo_url}
            alt={org.name}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
            <span className="text-sm sm:text-base font-bold text-blue-400">
              {org.name[0].toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Middle: Title + Credential Count */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate">
          {org.name}
        </h4>
        <div className="flex items-center gap-1.5 mt-0.5">
          <KeyIcon className="w-3 h-3 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
          <span className={`text-xs truncate ${credInfo.isEmpty ? 'text-zinc-400 dark:text-zinc-600 italic' : 'text-zinc-500 dark:text-zinc-400'}`}>
            {credInfo.text}
          </span>
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {org.website_link && (
          <button
            onClick={handleLaunchUrl}
            className="hidden sm:block p-2 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
            title="Open website"
            aria-label={`Open ${org.name} website`}
          >
            <ExternalLinkIcon className="w-5 h-5" />
          </button>
        )}
        <ChevronRightIcon className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
      </div>

      {/* Long Press Action Menu Overlay */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/30"
            onClick={closeMenu}
          />
          {/* Action Menu */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-50 flex items-center gap-1 p-1.5 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 animate-[fadeIn_0.15s_ease-out]">
            {org.website_link && (
              <button
                onClick={handleLaunchUrl}
                className="p-2.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                title="Visit Link"
              >
                <ExternalLinkIcon className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleEdit}
              className="p-2.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
              title="Edit"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              title="Delete"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default VaultListItem;
