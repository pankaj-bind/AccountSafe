import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';
import { getPinStatus } from '../services/pinService';
import PinVerificationModal from './PinVerificationModal';
import { VaultGridSkeleton, EmptyState } from './Skeleton';
import { formatCredentialCount } from '../utils/formatters';
import BrandSearchInput from './BrandSearchInput';
import { BrandSearchResult, getBrandLogoUrl, getFallbackLogoUrl } from '../services/brandService';
import { trackAccess, sortByFrequency } from '../utils/frequencyTracker';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface Organization {
  id: number;
  name: string;
  logo_url: string | null;
  logo_image: string | null;
  website_link?: string | null;
  profile_count: number;
}

interface Category {
  id: number;
  name: string;
  description: string;
  organizations: Organization[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════════════════════════════════

const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const PlusIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const FolderIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

const ShieldLockIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
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

const KeyIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const LockIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const GlobeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

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

const ExternalLinkIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Organization Card Component
// ═══════════════════════════════════════════════════════════════════════════════

interface OrgCardProps {
  org: Organization;
  onDelete: () => void;
  onEdit: () => void;
  onClick: () => void;
}

const OrganizationCard: React.FC<OrgCardProps> = ({ org, onDelete, onEdit, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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
        {org.logo_url && !imageError ? (
          <img
            src={org.logo_url}
            alt={org.name}
            className="max-w-full max-h-full object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
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

      {/* Profile count with better empty state handling */}
      {(() => {
        const credInfo = formatCredentialCount(org.profile_count);
        return (
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
        );
      })()}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Category Section Component
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

  const filteredOrgs = category.organizations.filter(org =>
    !searchQuery || org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort organizations by frequency (pinned items stay on top if implemented)
  const sortedOrgs = sortByFrequency(filteredOrgs, 'org');

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

// ═══════════════════════════════════════════════════════════════════════════════
// Main CategoryManager Component
// ═══════════════════════════════════════════════════════════════════════════════

const CategoryManager: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newOrg, setNewOrg] = useState({ name: '', logo_url: '', website_link: '' });
  const [editingOrgId, setEditingOrgId] = useState<number | null>(null);
  
  // PIN verification state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingOrgId, setPendingOrgId] = useState<number | null>(null);
  const [pendingOrgName, setPendingOrgName] = useState<string>('');
  const [pinVerified, setPinVerified] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    if (token) {
      fetchCategories();
      checkPinStatus();
    }
  }, [token]);

  const checkPinStatus = async () => {
    try {
      const status = await getPinStatus();
      setHasPin(status.has_pin);
    } catch (err) {
      console.error('Failed to check PIN status');
    }
  };

  const handleOrganizationClick = (org: Organization) => {
    // Track organization access
    trackAccess(org.id, 'org');
    
    if (hasPin && !pinVerified) {
      setPendingOrgId(org.id);
      setPendingOrgName(org.name);
      setShowPinModal(true);
    } else {
      navigate(`/organization/${org.id}`);
    }
  };

  const handlePinVerified = () => {
    setShowPinModal(false);
    setPinVerified(true);
    if (pendingOrgId) {
      navigate(`/organization/${pendingOrgId}`);
    }
    setPendingOrgId(null);
    setPendingOrgName('');
  };

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('categories/');
      setCategories(response.data);
    } catch (err: any) {
      console.error('Error:', err.response || err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    
    setError(null);
    try {
      const response = await apiClient.post('categories/', newCategory);
      setCategories([response.data, ...categories]);
      setNewCategory({ name: '', description: '' });
      setShowCategoryModal(false);
    } catch (err: any) {
      console.error('Error:', err.response || err);
      setError(err.response?.data?.name?.[0] || 'Failed to create category');
    }
  };

  const handleAddOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrg.name.trim() || !selectedCategoryId) return;

    setError(null);
    try {
      if (editingOrgId) {
        // Update existing organization
        const response = await apiClient.put(
          `organizations/${editingOrgId}/`,
          { 
            name: newOrg.name, 
            logo_url: newOrg.logo_url || null,
            website_link: newOrg.website_link || null
          }
        );
        
        setCategories(categories.map(cat => 
          cat.id === selectedCategoryId 
            ? { 
                ...cat, 
                organizations: cat.organizations.map(org => 
                  org.id === editingOrgId ? response.data : org
                ) 
              }
            : cat
        ));
      } else {
        // Create new organization
        const response = await apiClient.post(
          `categories/${selectedCategoryId}/organizations/`,
          { 
            name: newOrg.name, 
            logo_url: newOrg.logo_url || null,
            website_link: newOrg.website_link || null
          }
        );
        
        setCategories(categories.map(cat => 
          cat.id === selectedCategoryId 
            ? { ...cat, organizations: [...cat.organizations, response.data] }
            : cat
        ));
      }
      
      setNewOrg({ name: '', logo_url: '', website_link: '' });
      setShowOrgModal(false);
      setSelectedCategoryId(null);
      setEditingOrgId(null);
    } catch (err: any) {
      console.error('Error:', err.response || err);
      setError(editingOrgId ? 'Failed to update organization' : 'Failed to create organization');
    }
  };

  const handleEditOrganization = (org: Organization, categoryId: number) => {
    setEditingOrgId(org.id);
    setSelectedCategoryId(categoryId);
    setNewOrg({ name: org.name, logo_url: org.logo_url || '', website_link: org.website_link || '' });
    setShowOrgModal(true);
    setError(null);
  };

  const handleBrandSelect = (brand: BrandSearchResult) => {
    // Auto-fill organization name, logo URL, and website link from selected brand
    // Use the logo from API response if available, otherwise generate one
    const logoUrl = brand.logo || (brand.isFallback 
      ? getFallbackLogoUrl(brand.domain)
      : getBrandLogoUrl(brand.domain, 512));
    
    setNewOrg({ 
      name: brand.name, 
      logo_url: logoUrl,
      website_link: brand.website_link || `https://${brand.domain}`
    });
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Delete this category and all its organizations?')) return;
    
    try {
      await apiClient.delete(`categories/${id}/`);
      setCategories(categories.filter(cat => cat.id !== id));
    } catch (err: any) {
      setError('Failed to delete category');
    }
  };

  const handleDeleteOrganization = async (orgId: number, catId: number) => {
    if (!window.confirm('Delete this organization and all its credentials?')) return;
    
    try {
      await apiClient.delete(`organizations/${orgId}/`);
      setCategories(categories.map(cat => 
        cat.id === catId
          ? { ...cat, organizations: cat.organizations.filter(org => org.id !== orgId) }
          : cat
      ));
    } catch (err: any) {
      setError('Failed to delete organization');
    }
  };

  const filteredCategories = categories.filter(cat => {
    if (!searchQuery) return true;
    const nameMatch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const orgMatch = cat.organizations.some(org => 
      org.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return nameMatch || orgMatch;
  });

  // Calculate stats
  const totalOrgs = categories.reduce((sum, cat) => sum + cat.organizations.length, 0);
  const totalProfiles = categories.reduce((sum, cat) => 
    sum + cat.organizations.reduce((orgSum, org) => orgSum + org.profile_count, 0), 0
  );

  if (!token) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="as-card p-8 text-center">
          <LockIcon className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
          <p className="text-zinc-400">Please log in to access your vault</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* Header Section */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                <div className="p-2 sm:p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg sm:rounded-xl border border-emerald-200 dark:border-emerald-500/20 overflow-hidden">
                  <img src="/logo.png" alt="AccountSafe" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">Secure Vault</h1>
                {hasPin && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-xs font-medium text-green-700 dark:text-green-400">
                    <LockIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">PIN Protected</span>
                  </span>
                )}
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm">
                Organize and manage your credentials securely
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* Stats Bar */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          <div className="rounded-xl p-2 sm:p-3 md:p-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 shadow-sm">
            <div className="p-2 sm:p-2.5 md:p-3 bg-purple-100 dark:bg-purple-500/10 rounded-lg sm:rounded-xl">
              <FolderIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">{categories.length}</p>
              <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wide">Categories</p>
            </div>
          </div>
          <div className="rounded-xl p-2 sm:p-3 md:p-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 shadow-sm">
            <div className="p-2 sm:p-2.5 md:p-3 bg-blue-100 dark:bg-blue-500/10 rounded-lg sm:rounded-xl">
              <GlobeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">{totalOrgs}</p>
              <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wide">Organizations</p>
            </div>
          </div>
          <div className="rounded-xl p-2 sm:p-3 md:p-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 shadow-sm">
            <div className="p-2 sm:p-2.5 md:p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg sm:rounded-xl">
              <KeyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">{totalProfiles}</p>
              <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wide">Credentials</p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* Search Bar & Actions */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search categories and organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-10 py-3 text-sm sm:text-base bg-white dark:bg-zinc-900/80 border-2 border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* New Category Button */}
            <button
              onClick={() => { setShowCategoryModal(true); setError(null); }}
              className={`w-full sm:w-auto as-btn-primary flex items-center justify-center gap-2 group text-sm sm:text-base py-2.5 sm:py-3 whitespace-nowrap ${
                categories.length === 0 ? 'animate-pulse' : ''
              }`}
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-90" />
              <span>New Category</span>
            </button>
          </div>
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
        {/* Loading State - MAANG-grade skeleton loader */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {loading && <VaultGridSkeleton count={8} />}

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* Empty State - MAANG-grade with animation */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {!loading && categories.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="as-card p-6 sm:p-8 md:p-12"
          >
            <EmptyState
              icon={<FolderIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />}
              title="Your vault is empty"
              description="Start organizing your credentials securely. Create categories for different types of accounts like Social Media, Finance, or Work."
              action={{
                label: "Create First Category",
                onClick: () => { setShowCategoryModal(true); setError(null); }
              }}
            />
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* Categories Grid */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {!loading && filteredCategories.length > 0 && (
          <div className="space-y-10">
            {filteredCategories.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                searchQuery={searchQuery}
                onAddOrg={() => { setSelectedCategoryId(category.id); setShowOrgModal(true); setError(null); setEditingOrgId(null); setNewOrg({ name: '', logo_url: '', website_link: '' }); }}
                onEditOrg={(org) => handleEditOrganization(org, category.id)}
                onDeleteCategory={() => handleDeleteCategory(category.id)}
                onOrgClick={handleOrganizationClick}
                onDeleteOrg={(orgId) => handleDeleteOrganization(orgId, category.id)}
              />
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && categories.length > 0 && filteredCategories.length === 0 && (
          <div className="as-card p-6 sm:p-8 md:p-12 text-center">
            <SearchIcon className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-zinc-900 dark:text-white mb-2">No results found</h3>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              No categories or organizations match "{searchQuery}"
            </p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════ */}
      {/* Category Modal */}
      {/* ═══════════════════════════════════════════════════════════════════════════════ */}
      {showCategoryModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-[fadeIn_0.2s_ease-out]" 
          onClick={() => setShowCategoryModal(false)}
        >
          <div 
            className="as-modal w-full max-w-md animate-[modalIn_0.3s_ease-out]" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b border-zinc-300 dark:border-zinc-800">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
                  <FolderIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white">Create Category</h3>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1.5 sm:p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddCategory} className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Category Name <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g., Social Media, Finance, Work"
                  className="as-input w-full text-sm sm:text-base"
                  autoFocus
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Description <span className="text-zinc-500">(optional)</span>
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Brief description of this category..."
                  className="as-input w-full resize-none text-sm sm:text-base"
                  rows={3}
                />
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCategoryModal(false); setNewCategory({ name: '', description: '' }); }}
                  className="as-btn-secondary w-full sm:flex-1 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button type="submit" className="as-btn-primary w-full sm:flex-1 text-sm sm:text-base">
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════════ */}
      {/* Organization Modal */}
      {/* ═══════════════════════════════════════════════════════════════════════════════ */}
      {showOrgModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-[fadeIn_0.2s_ease-out]" 
          onClick={() => setShowOrgModal(false)}
        >
          <div 
            className="as-modal w-full max-w-md animate-[modalIn_0.3s_ease-out]" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b border-zinc-300 dark:border-zinc-800">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-emerald-500/10 rounded-lg">
                  <GlobeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white">
                  {editingOrgId ? 'Edit Organization' : 'Add Organization'}
                </h3>
              </div>
              <button
                onClick={() => setShowOrgModal(false)}
                className="p-1.5 sm:p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddOrganization} className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Organization Name <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <BrandSearchInput
                  value={newOrg.name}
                  onChange={(value) => setNewOrg({ ...newOrg, name: value })}
                  onBrandSelect={handleBrandSelect}
                  placeholder="e.g., Google, GitHub, Netflix"
                  className="as-input w-full text-sm sm:text-base"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  Start typing to see brand suggestions with logos
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Logo URL <span className="text-zinc-500">(optional)</span>
                </label>
                <input
                  type="url"
                  value={newOrg.logo_url}
                  onChange={(e) => setNewOrg({ ...newOrg, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="as-input w-full text-sm sm:text-base"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  Auto-filled from brand selection or add manually
                </p>
              </div>

              {/* Logo Preview */}
              {(newOrg.name || newOrg.logo_url) && (
                <div className={`
                  p-4 rounded-xl border-2 flex items-center gap-4 transition-all
                  ${newOrg.logo_url 
                    ? 'border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/5' 
                    : 'border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 opacity-60'
                  }
                `}>
                  <div className="w-16 h-16 flex-shrink-0 bg-white dark:bg-zinc-900 rounded-xl p-2 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden">
                    {newOrg.logo_url ? (
                      <img
                        src={newOrg.logo_url}
                        alt={newOrg.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 rounded-lg flex items-center justify-center">
                        <span className="text-zinc-500 dark:text-zinc-400 font-bold text-2xl">
                          {newOrg.name ? newOrg.name.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-zinc-900 dark:text-white truncate">
                      {newOrg.name || 'Organization Name'}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                      {newOrg.logo_url ? 'Logo loaded' : 'No logo - will use initial'}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowOrgModal(false); setNewOrg({ name: '', logo_url: '', website_link: '' }); setSelectedCategoryId(null); setEditingOrgId(null); }}
                  className="as-btn-secondary w-full sm:flex-1 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button type="submit" className="as-btn-primary w-full sm:flex-1 !bg-emerald-600 hover:!bg-emerald-500 text-sm sm:text-base">
                  {editingOrgId ? 'Update Organization' : 'Add Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPendingOrgId(null);
          setPendingOrgName('');
        }}
        onSuccess={handlePinVerified}
        organizationName={pendingOrgName}
      />
    </div>
  );
};

export default CategoryManager;
