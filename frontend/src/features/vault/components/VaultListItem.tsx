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
import { 
  ExternalLink, 
  ChevronRight, 
  Key, 
  Pencil, 
  Trash2 
} from 'lucide-react';
import { formatCredentialCount } from '../../../utils/formatters';
import { findDigitalWalletDocument } from '../types/category.types';
import type { Organization } from '../types/category.types';

// ═══════════════════════════════════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════════════════════════════════

// Icons are now imported from lucide-react

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
              {org.name.charAt(0).toUpperCase()}
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
          <Key className="w-3 h-3 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
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
            <ExternalLink className="w-5 h-5" />
          </button>
        )}
        <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
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
                <ExternalLink className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleEdit}
              className="p-2.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
              title="Edit"
            >
              <Pencil className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default VaultListItem;
