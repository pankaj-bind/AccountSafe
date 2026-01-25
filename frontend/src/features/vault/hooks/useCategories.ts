// src/features/vault/hooks/useCategories.ts
/**
 * useCategories - Custom Hook for Category/Organization Management
 * 
 * RESPONSIBILITY: Data lifecycle management for the vault.
 * - Fetch categories and organizations
 * - CRUD operations with optimistic updates
 * - Handle Digital Wallet document type logic
 * - Compute stats (total orgs, total credentials)
 * 
 * NO JSX. Returns state and callbacks for the UI layer.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import * as categoryService from '../services/categoryService';
import { logger } from '../../../utils/logger';
import type {
  Category,
  Organization,
  CategoryFormData,
  OrganizationFormData,
  CategoryStats,
  DocumentType,
} from '../types/category.types';
import { DIGITAL_WALLET_DOCUMENTS, findDigitalWalletDocument, isDigitalWalletCategory } from '../types/category.types';

// ═══════════════════════════════════════════════════════════════════════════════
// Hook Return Type
// ═══════════════════════════════════════════════════════════════════════════════

interface UseCategoriesReturn {
  // State
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  stats: CategoryStats;
  
  // Actions
  fetchCategories: () => Promise<void>;
  addCategory: (data: CategoryFormData) => Promise<Category | null>;
  removeCategory: (categoryId: number) => Promise<boolean>;
  addOrganization: (categoryId: number, data: OrganizationFormData) => Promise<Organization | null>;
  updateOrganization: (orgId: number, categoryId: number, data: OrganizationFormData) => Promise<Organization | null>;
  removeOrganization: (orgId: number, categoryId: number) => Promise<boolean>;
  
  // Digital Wallet specific
  createDigitalWallet: () => Promise<Category | null>;
  getDocumentIcon: (orgName: string) => string | null;
  digitalWalletDocuments: DocumentType[];
  
  // Utilities
  clearError: () => void;
  filterCategories: (searchQuery: string) => Category[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Hook Implementation
// ═══════════════════════════════════════════════════════════════════════════════

export const useCategories = (): UseCategoriesReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // Computed Stats
  // ─────────────────────────────────────────────────────────────────────────────
  const stats = useMemo<CategoryStats>(() => {
    const totalOrganizations = categories.reduce(
      (sum, cat) => sum + cat.organizations.length,
      0
    );
    const totalCredentials = categories.reduce(
      (sum, cat) =>
        sum + cat.organizations.reduce((orgSum, org) => orgSum + org.profile_count, 0),
      0
    );
    return {
      totalCategories: categories.length,
      totalOrganizations,
      totalCredentials,
    };
  }, [categories]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch Categories
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await categoryService.fetchCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Category CRUD
  // ─────────────────────────────────────────────────────────────────────────────
  const addCategory = useCallback(async (data: CategoryFormData): Promise<Category | null> => {
    if (!data.name.trim()) return null;
    setError(null);
    
    try {
      const newCategory = await categoryService.createCategory(data);
      setCategories(prev => [newCategory, ...prev]);
      return newCategory;
    } catch (err: unknown) {
      console.error('Error creating category:', err);
      const axiosError = err as { response?: { data?: { name?: string[] } } };
      setError(axiosError.response?.data?.name?.[0] || 'Failed to create category');
      return null;
    }
  }, []);

  const removeCategory = useCallback(async (categoryId: number): Promise<boolean> => {
    try {
      await categoryService.deleteCategory(categoryId);
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      return true;
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category');
      return false;
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Organization CRUD
  // ─────────────────────────────────────────────────────────────────────────────
  const addOrganization = useCallback(async (
    categoryId: number,
    data: OrganizationFormData
  ): Promise<Organization | null> => {
    if (!data.name.trim()) return null;
    setError(null);
    
    try {
      const newOrg = await categoryService.createOrganization(categoryId, data);
      setCategories(prev =>
        prev.map(cat =>
          cat.id === categoryId
            ? { ...cat, organizations: [...cat.organizations, newOrg] }
            : cat
        )
      );
      return newOrg;
    } catch (err) {
      console.error('Error creating organization:', err);
      setError('Failed to create organization');
      return null;
    }
  }, []);

  const updateOrganization = useCallback(async (
    orgId: number,
    categoryId: number,
    data: OrganizationFormData
  ): Promise<Organization | null> => {
    setError(null);
    
    try {
      const updatedOrg = await categoryService.updateOrganization(orgId, data);
      
      // Check if organization is being moved to a different category
      const newCategoryId = data.category_id;
      const isMoving = newCategoryId !== undefined && newCategoryId !== categoryId;
      
      setCategories(prev => {
        if (isMoving) {
          // Remove from old category and add to new category
          return prev.map(cat => {
            if (cat.id === categoryId) {
              // Remove from old category
              return {
                ...cat,
                organizations: cat.organizations.filter(org => org.id !== orgId),
              };
            } else if (cat.id === newCategoryId) {
              // Add to new category
              return {
                ...cat,
                organizations: [...cat.organizations, updatedOrg],
              };
            }
            return cat;
          });
        } else {
          // Just update in place
          return prev.map(cat =>
            cat.id === categoryId
              ? {
                  ...cat,
                  organizations: cat.organizations.map(org =>
                    org.id === orgId ? updatedOrg : org
                  ),
                }
              : cat
          );
        }
      });
      
      return updatedOrg;
    } catch (err) {
      console.error('Error updating organization:', err);
      setError('Failed to update organization');
      return null;
    }
  }, []);

  const removeOrganization = useCallback(async (
    orgId: number,
    categoryId: number
  ): Promise<boolean> => {
    try {
      await categoryService.deleteOrganization(orgId);
      setCategories(prev =>
        prev.map(cat =>
          cat.id === categoryId
            ? { ...cat, organizations: cat.organizations.filter(org => org.id !== orgId) }
            : cat
        )
      );
      return true;
    } catch (err) {
      console.error('Error deleting organization:', err);
      setError('Failed to delete organization');
      return false;
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Digital Wallet Specific
  // ─────────────────────────────────────────────────────────────────────────────
  const createDigitalWallet = useCallback(async (): Promise<Category | null> => {
    setError(null);
    
    try {
      const newCategory = await categoryService.createDigitalWalletCategory();
      setCategories(prev => [newCategory, ...prev]);
      return newCategory;
    } catch (err: unknown) {
      console.error('Error creating Digital Wallet:', err);
      const axiosError = err as { response?: { data?: { name?: string[] } } };
      
      // If category already exists, find it
      if (axiosError.response?.data?.name?.[0]?.includes('already exists')) {
        const existing = categories.find(c => isDigitalWalletCategory(c.name));
        if (existing) return existing;
      }
      
      setError(axiosError.response?.data?.name?.[0] || 'Failed to create Digital Wallet category');
      return null;
    }
  }, [categories]);

  /**
   * Get the icon path for a Digital Wallet document by organization name.
   * Returns null if not a recognized document type.
   */
  const getDocumentIcon = useCallback((orgName: string): string | null => {
    const doc = findDigitalWalletDocument(orgName);
    return doc?.icon || null;
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Filtering
  // ─────────────────────────────────────────────────────────────────────────────
  const filterCategories = useCallback((searchQuery: string): Category[] => {
    if (!searchQuery) return categories;
    
    const query = searchQuery.toLowerCase();
    return categories.filter(cat => {
      const nameMatch = cat.name.toLowerCase().includes(query);
      const orgMatch = cat.organizations.some(org =>
        org.name.toLowerCase().includes(query)
      );
      return nameMatch || orgMatch;
    });
  }, [categories]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────────────────────────────────────
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Listen for vault mode changes (normal ↔ duress)
  useEffect(() => {
    const handleModeChange = () => {
      logger.log('🔄 Mode changed - refetching categories...');
      fetchCategories();
    };
    
    window.addEventListener('vault-mode-changed', handleModeChange);
    return () => {
      window.removeEventListener('vault-mode-changed', handleModeChange);
    };
  }, [fetchCategories]);

  return {
    // State
    categories,
    isLoading,
    error,
    stats,
    
    // Actions
    fetchCategories,
    addCategory,
    removeCategory,
    addOrganization,
    updateOrganization,
    removeOrganization,
    
    // Digital Wallet specific
    createDigitalWallet,
    getDocumentIcon,
    digitalWalletDocuments: DIGITAL_WALLET_DOCUMENTS,
    
    // Utilities
    clearError,
    filterCategories,
  };
};

export default useCategories;
