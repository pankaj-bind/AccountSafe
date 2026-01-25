// src/features/vault/components/CategorySection.tsx
/**
 * CategorySection - Collapsible Category Display
 * 
 * RESPONSIBILITY: Pure presentation component for displaying a category
 * with its organizations grid, header, and action buttons.
 */

import React, { useState } from 'react';
import { sortByFrequency } from '../../../utils/frequencyTracker';
import OrganizationCard from './OrganizationCard';
import type { Category, Organization } from '../types/category.types';

// ═══════════════════════════════════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════════════════════════════════

const FolderIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

const PlusIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const ChevronRightIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const ShieldLockIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Props Interface
// ═══════════════════════════════════════════════════════════════════════════════

interface CategorySectionProps {
  category: Category;
  searchQuery: string;
  onAddOrg: (categoryId: number) => void;
  onEditOrg: (org: Organization, categoryId: number) => void;
  onDeleteCategory: (categoryId: number) => void;
  onDeleteOrg: (orgId: number, categoryId: number) => void;
  onOrgClick: (org: Organization) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  searchQuery,
  onAddOrg,
  onEditOrg,
  onDeleteCategory,
  onDeleteOrg,
  onOrgClick
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter organizations by search query
  const filteredOrgs = category.organizations.filter(org =>
    !searchQuery || org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort organizations by frequency (pinned items stay on top if implemented)
  const sortedOrgs = sortByFrequency(filteredOrgs, 'org');

  // Don't render if search returns no results
  if (searchQuery && sortedOrgs.length === 0) return null;

  return (
    <div className="mb-6 sm:mb-8 md:mb-10 animate-fadeIn">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 sm:gap-3 group"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
            <FolderIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
          </div>
          <div className="text-left">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
              {category.name}
              <ChevronRightIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              {category.organizations.length} organization{category.organizations.length === 1 ? '' : 's'}
              {category.description && ` • ${category.description}`}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => onAddOrg(category.id)}
            className="as-btn-secondary as-btn-sm flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <PlusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Add Organization</span>
            <span className="sm:hidden">Add</span>
          </button>
          <button
            onClick={() => onDeleteCategory(category.id)}
            className="as-btn-icon as-btn-ghost text-zinc-500 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
            title="Delete category"
          >
            <TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Organizations Grid */}
      {isExpanded && (
        <>
          {filteredOrgs.length === 0 ? (
            <div className="text-center py-8 sm:py-10 md:py-12 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg sm:rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-lg sm:rounded-xl bg-zinc-200 dark:bg-zinc-800/50 flex items-center justify-center">
                <ShieldLockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400 dark:text-zinc-600" />
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-500 mb-2 sm:mb-3">No organizations in this category</p>
              <button
                onClick={() => onAddOrg(category.id)}
                className="as-btn-primary as-btn-sm text-xs sm:text-sm"
              >
                Add First Organization
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
              {sortedOrgs.map((org) => (
                <OrganizationCard
                  key={org.id}
                  org={org}
                  onDelete={() => onDeleteOrg(org.id, category.id)}
                  onEdit={() => onEditOrg(org, category.id)}
                  onClick={() => onOrgClick(org)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CategorySection;
