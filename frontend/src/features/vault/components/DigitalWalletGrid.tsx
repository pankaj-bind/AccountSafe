// src/features/vault/components/DigitalWalletGrid.tsx
/**
 * DigitalWalletGrid - Document Type Selection Grid
 * 
 * RESPONSIBILITY: Pure presentation component for selecting document types
 * in the Digital Wallet category (Passport, Driving License, Credit Card, etc.)
 * 
 * Displays the predefined document types with their icons from /public/logo/
 */

import React from 'react';
import type { DocumentType } from '../types/category.types';

// ═══════════════════════════════════════════════════════════════════════════════
// Props Interface
// ═══════════════════════════════════════════════════════════════════════════════

interface DigitalWalletGridProps {
  /** List of document types to display */
  documents: DocumentType[];
  /** Currently selected document label */
  selectedLabel: string;
  /** Callback when a document is selected */
  onSelect: (doc: DocumentType) => void;
  /** Optional CSS class */
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

const DigitalWalletGrid: React.FC<DigitalWalletGridProps> = ({
  documents,
  selectedLabel,
  onSelect,
  className = '',
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
        Select Document Type
      </label>
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-1.5 sm:gap-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
        {documents.map((doc) => {
          const isSelected = selectedLabel === doc.label;
          
          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => onSelect(doc)}
              className={`
                flex items-center gap-2 p-2.5 sm:p-3 rounded-xl border-2 transition-all text-left touch-target
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' 
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }
              `}
            >
              {/* Document Icon */}
              <img
                src={doc.icon}
                alt={doc.label}
                className="w-8 h-8 flex-shrink-0 rounded-lg object-contain"
              />
              
              {/* Document Info */}
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-medium truncate ${
                  isSelected 
                    ? 'text-blue-700 dark:text-blue-300' 
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}>
                  {doc.label}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate">
                  {doc.category}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
        Choose a document type or enter custom name below
      </p>
    </div>
  );
};

export default DigitalWalletGrid;
