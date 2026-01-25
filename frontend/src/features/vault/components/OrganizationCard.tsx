// src/features/vault/components/OrganizationCard.tsx
/**
 * OrganizationCard - Single Organization Display Card
 * 
 * RESPONSIBILITY: Pure presentation component for displaying an organization
 * with its logo, name, credential count, and action menu.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatCredentialCount } from '../../../utils/formatters';
import { findDigitalWalletDocument } from '../types/category.types';
import type { Organization } from '../types/category.types';

// ═══════════════════════════════════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════════════════════════════════

const DotsVerticalIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
  </svg>
);

const PencilIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const ExternalLinkIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

const KeyIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Props Interface
// ═══════════════════════════════════════════════════════════════════════════════

interface OrganizationCardProps {
  org: Organization;
  onDelete: () => void;
  onEdit: () => void;
  onClick: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

const OrganizationCard: React.FC<OrganizationCardProps> = ({ org, onDelete, onEdit, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Check if this org matches a Digital Wallet document type
  const docMatch = findDigitalWalletDocument(org.name);
  const credInfo = formatCredentialCount(org.profile_count);

  return (
    <div
      onClick={onClick}
      className="group relative bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg sm:rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-300 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-lg hover:shadow-zinc-300/50 dark:hover:shadow-zinc-950/50 hover:scale-[1.02]"
    >
      {/* Kebab Menu */}
      <div 
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        onMouseEnter={() => setShowMenu(true)}
        onMouseLeave={() => setShowMenu(false)}
      >
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="w-6 h-6 sm:w-7 sm:h-7 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <DotsVerticalIcon className="w-4 h-4" />
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden z-10 animate-fadeIn sm:w-36 w-auto">
              {/* Mobile: Icon-only horizontal layout */}
              <div className="flex sm:hidden items-center gap-1 p-1.5">
                {org.website_link && (
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (org.website_link) {
                        window.open(org.website_link, '_blank', 'noopener,noreferrer');
                      }
                      setShowMenu(false); 
                    }}
                    className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    title="Visit Link"
                  >
                    <ExternalLinkIcon className="w-5 h-5 text-emerald-500" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); setShowMenu(false); }}
                  className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  title="Edit"
                >
                  <PencilIcon className="w-5 h-5 text-blue-500" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                  className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                </button>
              </div>

              {/* Desktop: Text + Icon vertical layout */}
              <div className="hidden sm:block">
                {org.website_link && (
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (org.website_link) {
                        window.open(org.website_link, '_blank', 'noopener,noreferrer');
                      }
                      setShowMenu(false); 
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <ExternalLinkIcon className="w-4 h-4 text-emerald-500" />
                    Visit Link
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  <PencilIcon className="w-4 h-4 text-blue-500" />
                  Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logo */}
      <div className="flex items-center justify-center h-12 sm:h-14 mb-2 sm:mb-3">
        {docMatch ? (
          // Digital Wallet document icon
          <img
            src={docMatch.icon}
            alt={org.name}
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
          />
        ) : org.logo_url && !imageError ? (
          // Organization logo from URL
          <img
            src={org.logo_url}
            alt={org.name}
            className="max-w-full max-h-full object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          // Fallback: First letter
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
            <span className="text-lg sm:text-xl font-bold text-blue-400">
              {org.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Name */}
      <h4 className="font-medium text-zinc-900 dark:text-zinc-200 text-center text-xs sm:text-sm mb-1 line-clamp-2" title={org.name}>
        {org.name}
      </h4>

      {/* Profile count */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5">
        {credInfo.isEmpty ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/50"
          >
            <svg className="w-3 h-3 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">Add first credential</span>
          </motion.div>
        ) : (
          <>
            <KeyIcon className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
            <span className="text-xs text-zinc-500 dark:text-zinc-500">
              {credInfo.text}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default OrganizationCard;
