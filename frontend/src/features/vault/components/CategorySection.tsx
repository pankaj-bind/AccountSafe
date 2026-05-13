import React, { useState } from 'react';
import { sortByFrequency } from '../../../utils/frequencyTracker';
import OrganizationCard from './OrganizationCard';
import VaultListItem from './VaultListItem';
import type { Category, Organization } from '../types/category.types';
import { Folder, Plus, Trash2, ChevronRight, ShieldCheck } from 'lucide-react';

// View Mode Type
export type ViewMode = 'grid' | 'list';

// ═══════════════════════════════════════════════════════════════════════════════
// Props Interface
// ═══════════════════════════════════════════════════════════════════════════════

interface CategorySectionProps {
  category: Category;
  searchQuery: string;
  viewMode: ViewMode;
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
  viewMode,
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
            <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
          </div>
          <div className="text-left min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
              <span className="truncate max-w-[150px] sm:max-w-none">{category.name}</span>
              <ChevronRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate">
              {category.organizations.length} organization{category.organizations.length === 1 ? '' : 's'}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => onAddOrg(category.id)}
            className="as-btn-secondary as-btn-sm flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Add Organization</span>
            <span className="sm:hidden">Add</span>
          </button>
          <button
            onClick={() => onDeleteCategory(category.id)}
            className="as-btn-icon as-btn-ghost text-zinc-500 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
            title="Delete category"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Organizations Grid/List */}
      {isExpanded && (
        <>
          {filteredOrgs.length === 0 ? (
            <div className="text-center py-8 sm:py-10 md:py-12 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg sm:rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-lg sm:rounded-xl bg-zinc-200 dark:bg-zinc-800/50 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400 dark:text-zinc-600" />
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-500 mb-2 sm:mb-3">No organizations in this category</p>
              <button
                onClick={() => onAddOrg(category.id)}
                className="as-btn-primary as-btn-sm text-xs sm:text-sm"
              >
                Add First Organization
              </button>
            </div>
          ) : viewMode === 'list' ? (
            /* List View - Compact rows for mobile */
            <div className="flex flex-col rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
              {sortedOrgs.map((org) => (
                <VaultListItem
                  key={org.id}
                  org={org}
                  onClick={() => onOrgClick(org)}
                  onEdit={() => onEditOrg(org, category.id)}
                  onDelete={() => onDeleteOrg(org.id, category.id)}
                />
              ))}
            </div>
          ) : (
            /* Grid View - Cards layout */
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
