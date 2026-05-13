// src/features/vault/components/OrganizationCard.tsx
/**
 * OrganizationCard - Single Organization Display Card
 * 
 * RESPONSIBILITY: Pure presentation component for displaying an organization
 * with its logo, name, credential count, and action menu.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MoreVertical, 
  Pencil, 
  Trash2, 
  ExternalLink, 
  Key,
  Plus
} from 'lucide-react';
import { formatCredentialCount } from '../../../utils/formatters';
import { findDigitalWalletDocument } from '../types/category.types';
import type { Organization } from '../types/category.types';
import { clsx } from 'clsx';

// ═══════════════════════════════════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════════════════════════════════

// Icons are now imported from lucide-react

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
  const [isCardHovered, setIsCardHovered] = useState(false);

  // Check if this org matches a Digital Wallet document type
  const docMatch = findDigitalWalletDocument(org.name);
  const credInfo = formatCredentialCount(org.profile_count);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => {
        setIsCardHovered(false);
        setShowMenu(false);
      }}
      className="group relative bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg sm:rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-300 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-lg hover:shadow-zinc-300/50 dark:hover:shadow-zinc-950/50 hover:scale-[1.02]"
    >
      {/* Kebab Menu */}
      <div 
        className={`absolute top-2 right-2 transition-opacity duration-200 ${isCardHovered || showMenu ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="relative">
          <button
            className={clsx(
              "w-6 h-6 sm:w-7 sm:h-7 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors",
              showMenu && "bg-zinc-100 dark:bg-zinc-700"
            )}
          >
            <MoreVertical className="w-4 h-4" />
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
                    <ExternalLink className="w-5 h-5 text-emerald-500" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); setShowMenu(false); }}
                  className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-5 h-5 text-blue-500" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                  className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
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
                    <ExternalLink className="w-4 h-4 text-emerald-500" />
                    Visit Link
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Pencil className="w-4 h-4 text-blue-500" />
                  Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
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
            <Plus className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Add credentials</span>
          </motion.div>
        ) : (
          <>
            <Key className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
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
