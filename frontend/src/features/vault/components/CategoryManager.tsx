// src/features/vault/components/CategoryManager.tsx
/**
 * CategoryManager - Container Component
 * 
 * RESPONSIBILITY: Orchestrate the vault category feature
 * - Uses useCategories() hook for data management
 * - Passes data down to presentational components
 * - Manages UI state (modals, search, PIN verification)
 * 
 * ZERO business logic in JSX - All data operations live in the hook layer.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Contexts
import { useAuth } from '../../../contexts/AuthContext';

// Hooks
import { useCategories } from '../hooks/useCategories';

// Services
import { getPinStatus } from '../../../services/pinService';
import { BrandSearchResult, getBrandLogoUrl, getFallbackLogoUrl } from '../../../services/brandService';
import { trackAccess } from '../../../utils/frequencyTracker';

// Components
import CategorySection from './CategorySection';
import DigitalWalletGrid from './DigitalWalletGrid';
import PinVerificationModal from '../../../components/PinVerificationModal';
import { VaultGridSkeleton, EmptyState } from '../../../components/Skeleton';
import BrandSearchInput from '../../../components/BrandSearchInput';

// Types
import type { 
  Category,
  Organization, 
  CategoryFormData, 
  OrganizationFormData,
  DocumentType,
} from '../types/category.types';
import { isDigitalWalletCategory, findDigitalWalletDocument } from '../types/category.types';

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

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

const CategoryManager: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  // ─────────────────────────────────────────────────────────────────────────────
  // Data Hook
  // ─────────────────────────────────────────────────────────────────────────────
  const {
    categories,
    isLoading,
    error,
    stats,
    fetchCategories,
    addCategory,
    removeCategory,
    addOrganization,
    updateOrganization,
    removeOrganization,
    createDigitalWallet,
    digitalWalletDocuments,
    clearError,
    filterCategories,
  } = useCategories();

  // ─────────────────────────────────────────────────────────────────────────────
  // Local UI State
  // ─────────────────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [editingOrgId, setEditingOrgId] = useState<number | null>(null);

  // Form state
  const [newCategory, setNewCategory] = useState<CategoryFormData>({ name: '', description: '' });
  const [newOrg, setNewOrg] = useState<OrganizationFormData>({ name: '', logo_url: '', website_link: '' });

  // PIN verification state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingOrgId, setPendingOrgId] = useState<number | null>(null);
  const [pendingOrgName, setPendingOrgName] = useState<string>('');
  const [pinVerified, setPinVerified] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  // Derived state
  const isDigitalWallet = isDigitalWalletCategory(selectedCategoryName);
  const filteredCategories = filterCategories(searchQuery);

  // ─────────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      fetchCategories();
      checkPinStatus();
    }
  }, [token, fetchCategories]);

  const checkPinStatus = async () => {
    try {
      const status = await getPinStatus();
      setHasPin(status.has_pin);
    } catch (err) {
      console.error('Failed to check PIN status');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────────
  const handleOrganizationClick = useCallback((org: Organization) => {
    trackAccess(org.id, 'org');
    
    if (hasPin && !pinVerified) {
      setPendingOrgId(org.id);
      setPendingOrgName(org.name);
      setShowPinModal(true);
    } else {
      navigate(`/organization/${org.id}`);
    }
  }, [hasPin, pinVerified, navigate]);

  const handlePinVerified = useCallback(() => {
    setShowPinModal(false);
    setPinVerified(true);
    if (pendingOrgId) {
      navigate(`/organization/${pendingOrgId}`);
    }
    setPendingOrgId(null);
    setPendingOrgName('');
  }, [pendingOrgId, navigate]);

  const handleAddCategory = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addCategory(newCategory);
    if (result) {
      setNewCategory({ name: '', description: '' });
      setShowCategoryModal(false);
    }
  }, [addCategory, newCategory]);

  const handleCreateDigitalWallet = useCallback(async () => {
    const result = await createDigitalWallet();
    if (result) {
      setNewCategory({ name: '', description: '' });
      setShowCategoryModal(false);
    }
  }, [createDigitalWallet]);

  const handleDeleteCategory = useCallback(async (id: number) => {
    if (!window.confirm('Delete this category and all its organizations?')) return;
    await removeCategory(id);
  }, [removeCategory]);

  const handleDocumentSelect = useCallback((doc: DocumentType) => {
    setNewOrg({ 
      name: doc.label, 
      logo_url: '', 
      website_link: '' 
    });
  }, []);

  const handleBrandSelect = useCallback((brand: BrandSearchResult) => {
    const logoUrl = brand.logo || (brand.isFallback 
      ? getFallbackLogoUrl(brand.domain)
      : getBrandLogoUrl(brand.domain, 512));
    
    setNewOrg({ 
      name: brand.name, 
      logo_url: logoUrl,
      website_link: brand.website_link || `https://${brand.domain}`
    });
  }, []);

  const openOrgModal = useCallback((categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(category?.name || '');
    setShowOrgModal(true);
    clearError();
    setEditingOrgId(null);
    setNewOrg({ name: '', logo_url: '', website_link: '', category_id: undefined });
  }, [categories, clearError]);

  const closeOrgModal = useCallback(() => {
    setShowOrgModal(false);
    setNewOrg({ name: '', logo_url: '', website_link: '', category_id: undefined });
    setSelectedCategoryId(null);
    setSelectedCategoryName('');
    setEditingOrgId(null);
  }, []);

  const handleAddOrganization = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId) return;

    if (editingOrgId) {
      const result = await updateOrganization(editingOrgId, selectedCategoryId, newOrg);
      if (result) {
        closeOrgModal();
      }
    } else {
      const result = await addOrganization(selectedCategoryId, newOrg);
      if (result) {
        closeOrgModal();
      }
    }
  }, [editingOrgId, selectedCategoryId, newOrg, addOrganization, updateOrganization, closeOrgModal]);

  const handleEditOrganization = useCallback((org: Organization, categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    setEditingOrgId(org.id);
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(category?.name || '');
    // Initialize form with current values including category_id for potential move
    setNewOrg({ 
      name: org.name, 
      logo_url: org.logo_url || '', 
      website_link: org.website_link || '',
      category_id: categoryId  // Set current category as default
    });
    setShowOrgModal(true);
    clearError();
  }, [categories, clearError]);

  const handleDeleteOrganization = useCallback(async (orgId: number, catId: number) => {
    if (!window.confirm('Delete this organization and all its credentials?')) return;
    await removeOrganization(orgId, catId);
  }, [removeOrganization]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render - Not Authenticated
  // ─────────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        
        {/* Header Section */}
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

        {/* Stats Bar */}
        <StatsBar stats={stats} />

        {/* Search Bar & Actions */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewCategory={() => { setShowCategoryModal(true); clearError(); }}
          showPulse={categories.length === 0}
        />

        {/* Error Alert */}
        {error && (
          <Alert message={error} onClose={clearError} />
        )}

        {/* Loading State */}
        {isLoading && <VaultGridSkeleton count={8} />}

        {/* Empty State */}
        {!isLoading && categories.length === 0 && (
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
                onClick: () => { setShowCategoryModal(true); clearError(); }
              }}
            />
          </motion.div>
        )}

        {/* Categories Grid */}
        {!isLoading && filteredCategories.length > 0 && (
          <div className="space-y-10">
            {filteredCategories.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                searchQuery={searchQuery}
                onAddOrg={() => openOrgModal(category.id)}
                onEditOrg={(org) => handleEditOrganization(org, category.id)}
                onDeleteCategory={() => handleDeleteCategory(category.id)}
                onOrgClick={handleOrganizationClick}
                onDeleteOrg={(orgId) => handleDeleteOrganization(orgId, category.id)}
              />
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && categories.length > 0 && filteredCategories.length === 0 && (
          <NoResults searchQuery={searchQuery} />
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          newCategory={newCategory}
          onCategoryChange={setNewCategory}
          onSubmit={handleAddCategory}
          onCreateDigitalWallet={handleCreateDigitalWallet}
          onClose={() => { setShowCategoryModal(false); setNewCategory({ name: '', description: '' }); }}
        />
      )}

      {/* Organization Modal */}
      {showOrgModal && (
        <OrganizationModal
          isDigitalWallet={isDigitalWallet}
          isEditing={!!editingOrgId}
          newOrg={newOrg}
          digitalWalletDocuments={digitalWalletDocuments}
          categories={categories}
          currentCategoryId={selectedCategoryId}
          onOrgChange={setNewOrg}
          onDocumentSelect={handleDocumentSelect}
          onBrandSelect={handleBrandSelect}
          onSubmit={handleAddOrganization}
          onClose={closeOrgModal}
        />
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

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════════

interface StatsBarProps {
  stats: { totalCategories: number; totalOrganizations: number; totalCredentials: number };
}

const StatsBar: React.FC<StatsBarProps> = ({ stats }) => (
  <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
    <StatCard icon={<FolderIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />} value={stats.totalCategories} label="Categories" color="purple" />
    <StatCard icon={<GlobeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />} value={stats.totalOrganizations} label="Organizations" color="blue" />
    <StatCard icon={<KeyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />} value={stats.totalCredentials} label="Credentials" color="emerald" />
  </div>
);

const StatCard: React.FC<{ icon: React.ReactNode; value: number; label: string; color: string }> = ({ icon, value, label, color }) => (
  <div className="rounded-xl p-2 sm:p-3 md:p-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 shadow-sm">
    <div className={`p-2 sm:p-2.5 md:p-3 bg-${color}-100 dark:bg-${color}-500/10 rounded-lg sm:rounded-xl`}>
      {icon}
    </div>
    <div className="text-center sm:text-left">
      <p className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
      <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wide">{label}</p>
    </div>
  </div>
);

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onNewCategory: () => void;
  showPulse: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, onSearchChange, onNewCategory, showPulse }) => (
  <div className="mb-4 sm:mb-6 md:mb-8">
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
      <div className="relative flex-1">
        <SearchIcon className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 dark:text-zinc-500" />
        <input
          type="text"
          placeholder="Search categories and organizations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-10 py-3 text-sm sm:text-base bg-white dark:bg-zinc-900/80 border-2 border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <button
        onClick={onNewCategory}
        className={`w-full sm:w-auto as-btn-primary flex items-center justify-center gap-2 group text-sm sm:text-base py-2.5 sm:py-3 whitespace-nowrap ${showPulse ? 'animate-pulse' : ''}`}
      >
        <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-90" />
        <span>New Category</span>
      </button>
    </div>
  </div>
);

const Alert: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
  <div className="as-alert-danger mb-6 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <span>{message}</span>
    </div>
    <button onClick={onClose} className="hover:opacity-70 transition-opacity">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

const NoResults: React.FC<{ searchQuery: string }> = ({ searchQuery }) => (
  <div className="as-card p-6 sm:p-8 md:p-12 text-center">
    <SearchIcon className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-3 sm:mb-4" />
    <h3 className="text-base sm:text-lg font-medium text-zinc-900 dark:text-white mb-2">No results found</h3>
    <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
      No categories or organizations match "{searchQuery}"
    </p>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Modal Components
// ═══════════════════════════════════════════════════════════════════════════════

interface CategoryModalProps {
  newCategory: CategoryFormData;
  onCategoryChange: (data: CategoryFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCreateDigitalWallet: () => void;
  onClose: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  newCategory,
  onCategoryChange,
  onSubmit,
  onCreateDigitalWallet,
  onClose,
}) => (
  <div 
    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-[fadeIn_0.2s_ease-out]" 
    onClick={onClose}
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
          onClick={onClose}
          className="p-1.5 sm:p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Modal Body */}
      <form onSubmit={onSubmit} className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Category Name <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <input
            type="text"
            value={newCategory.name}
            onChange={(e) => onCategoryChange({ ...newCategory, name: e.target.value })}
            placeholder="e.g., Social Media, Finance, Work"
            className="as-input w-full text-sm sm:text-base"
            autoFocus
            required
          />
          
          {/* Digital Wallet Quick Create Link */}
          <button
            type="button"
            onClick={onCreateDigitalWallet}
            className="mt-3 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <path d="M2 9h20"/>
            </svg>
            <span className="group-hover:underline">Digital Wallet for Gov ID and Credit Cards</span>
            <svg className="w-3 h-3 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Description <span className="text-zinc-500">(optional)</span>
          </label>
          <textarea
            value={newCategory.description}
            onChange={(e) => onCategoryChange({ ...newCategory, description: e.target.value })}
            placeholder="Brief description of this category..."
            className="as-input w-full resize-none text-sm sm:text-base"
            rows={3}
          />
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
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
);

interface OrganizationModalProps {
  isDigitalWallet: boolean;
  isEditing: boolean;
  newOrg: OrganizationFormData;
  digitalWalletDocuments: DocumentType[];
  categories: Category[]; // All categories for the dropdown
  currentCategoryId: number | null; // Current category of the organization
  onOrgChange: (data: OrganizationFormData) => void;
  onDocumentSelect: (doc: DocumentType) => void;
  onBrandSelect: (brand: BrandSearchResult) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const OrganizationModal: React.FC<OrganizationModalProps> = ({
  isDigitalWallet,
  isEditing,
  newOrg,
  digitalWalletDocuments,
  categories,
  currentCategoryId,
  onOrgChange,
  onDocumentSelect,
  onBrandSelect,
  onSubmit,
  onClose,
}) => {
  const docMatch = isDigitalWallet && findDigitalWalletDocument(newOrg.name);
  
  // Filter out Digital Wallet from category options (can't move regular orgs to Digital Wallet)
  const availableCategories = categories.filter(cat => cat.name !== 'Digital Wallet');

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-[fadeIn_0.2s_ease-out]" 
      onClick={onClose}
    >
      <div 
        className="as-modal w-full max-w-md animate-[modalIn_0.3s_ease-out]" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b border-zinc-300 dark:border-zinc-800">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`p-1.5 sm:p-2 rounded-lg ${isDigitalWallet ? 'bg-blue-500/10' : 'bg-emerald-500/10'}`}>
              {isDigitalWallet ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <path d="M2 9h20"/>
                </svg>
              ) : (
                <GlobeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white">
              {isEditing 
                ? (isDigitalWallet ? 'Edit Document' : 'Edit Organization')
                : (isDigitalWallet ? 'Add Document' : 'Add Organization')
              }
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={onSubmit} className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
          {/* Document Type Selection for Digital Wallet */}
          {isDigitalWallet && !isEditing && (
            <DigitalWalletGrid
              documents={digitalWalletDocuments}
              selectedLabel={newOrg.name}
              onSelect={onDocumentSelect}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              {isDigitalWallet ? 'Document Name' : 'Organization Name'} <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            {isDigitalWallet ? (
              <input
                type="text"
                value={newOrg.name}
                onChange={(e) => onOrgChange({ ...newOrg, name: e.target.value })}
                placeholder="e.g., My Aadhaar Card, HDFC Credit Card"
                className="as-input w-full text-sm sm:text-base"
              />
            ) : (
              <BrandSearchInput
                value={newOrg.name}
                onChange={(value) => onOrgChange({ ...newOrg, name: value })}
                onBrandSelect={onBrandSelect}
                placeholder="e.g., Google, GitHub, or paste URL"
                className="as-input w-full text-sm sm:text-base"
              />
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              {isDigitalWallet 
                ? 'Selected from above or enter a custom name' 
                : 'Type a brand name or paste a URL (e.g., accounts.x.ai) to auto-detect'
              }
            </p>
          </div>
          
          {!isDigitalWallet && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Logo URL <span className="text-zinc-500">(optional)</span>
              </label>
              <input
                type="url"
                value={newOrg.logo_url}
                onChange={(e) => onOrgChange({ ...newOrg, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="as-input w-full text-sm sm:text-base"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Auto-filled from brand selection or add manually
              </p>
            </div>
          )}

          {/* Category Selector (only when editing and not Digital Wallet) */}
          {isEditing && !isDigitalWallet && availableCategories.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Category <span className="text-zinc-500">(move to different category)</span>
              </label>
              <select
                value={newOrg.category_id ?? currentCategoryId ?? ''}
                onChange={(e) => onOrgChange({ ...newOrg, category_id: parseInt(e.target.value, 10) })}
                className="as-input w-full text-sm sm:text-base cursor-pointer"
              >
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Move this organization and all its credentials to another category
              </p>
            </div>
          )}

          {/* Logo Preview */}
          {(newOrg.name || newOrg.logo_url) && (
            <div className={`
              p-4 rounded-xl border-2 flex items-center gap-4 transition-all
              ${(newOrg.logo_url || docMatch)
                ? 'border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/5' 
                : 'border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 opacity-60'
              }
            `}>
              <div className="w-16 h-16 flex-shrink-0 bg-white dark:bg-zinc-900 rounded-xl p-2 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden">
                {docMatch ? (
                  <img src={docMatch.icon} alt={newOrg.name} className="w-full h-full object-contain" />
                ) : newOrg.logo_url ? (
                  <img
                    src={newOrg.logo_url}
                    alt={newOrg.name}
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
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
                  {newOrg.name || (isDigitalWallet ? 'Document Name' : 'Organization Name')}
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                  {docMatch ? docMatch.category : newOrg.logo_url ? 'Logo loaded' : 'No logo - will use initial'}
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="as-btn-secondary w-full sm:flex-1 text-sm sm:text-base"
            >
              Cancel
            </button>
            <button type="submit" className="as-btn-primary w-full sm:flex-1 !bg-emerald-600 hover:!bg-emerald-500 text-sm sm:text-base">
              {isEditing 
                ? (isDigitalWallet ? 'Update Document' : 'Update Organization')
                : (isDigitalWallet ? 'Add Document' : 'Add Organization')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryManager;
