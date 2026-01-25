// src/features/vault/services/categoryService.ts
/**
 * Category Service - Pure API Layer
 * 
 * RESPONSIBILITY: HTTP calls to category/organization endpoints.
 * NO React code. Returns typed Promises.
 * 
 * Endpoints:
 * - GET    /api/categories/
 * - POST   /api/categories/
 * - DELETE /api/categories/:id/
 * - POST   /api/categories/:id/organizations/
 * - PUT    /api/organizations/:id/
 * - DELETE /api/organizations/:id/
 */

import apiClient from '../../../api/apiClient';
import type { Category, Organization, CategoryFormData, OrganizationFormData } from '../types/category.types';

// ═══════════════════════════════════════════════════════════════════════════════
// Category API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch all categories with their organizations.
 */
export const fetchCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<Category[]>('categories/');
  return response.data;
};

/**
 * Create a new category.
 */
export const createCategory = async (data: CategoryFormData): Promise<Category> => {
  const response = await apiClient.post<Category>('categories/', data);
  return response.data;
};

/**
 * Delete a category by ID.
 */
export const deleteCategory = async (categoryId: number): Promise<void> => {
  await apiClient.delete(`categories/${categoryId}/`);
};

// ═══════════════════════════════════════════════════════════════════════════════
// Organization API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new organization within a category.
 */
export const createOrganization = async (
  categoryId: number,
  data: Partial<OrganizationFormData>
): Promise<Organization> => {
  const payload = {
    name: data.name,
    logo_url: data.logo_url || null,
    website_link: data.website_link || null,
  };
  const response = await apiClient.post<Organization>(
    `categories/${categoryId}/organizations/`,
    payload
  );
  return response.data;
};

/**
 * Update an existing organization.
 * Supports moving to a different category via category_id.
 */
export const updateOrganization = async (
  organizationId: number,
  data: Partial<OrganizationFormData>
): Promise<Organization> => {
  const payload: Record<string, unknown> = {
    name: data.name,
    logo_url: data.logo_url || null,
    website_link: data.website_link || null,
  };
  
  // Include category_id only if provided (for moving organization)
  if (data.category_id !== undefined) {
    payload.category_id = data.category_id;
  }
  
  const response = await apiClient.put<Organization>(
    `organizations/${organizationId}/`,
    payload
  );
  return response.data;
};

/**
 * Delete an organization by ID.
 */
export const deleteOrganization = async (organizationId: number): Promise<void> => {
  await apiClient.delete(`organizations/${organizationId}/`);
};

// ═══════════════════════════════════════════════════════════════════════════════
// Curated Organizations API (Brand Search)
// ═══════════════════════════════════════════════════════════════════════════════

export interface CuratedOrganization {
  id: number;
  name: string;
  domain: string;
  logo_url: string;
  website_link: string;
}

/**
 * Search curated organizations by name.
 */
export const searchCuratedOrganizations = async (query: string): Promise<CuratedOrganization[]> => {
  const response = await apiClient.get<CuratedOrganization[]>('curated-organizations/', {
    params: { search: query }
  });
  return response.data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create the "Digital Wallet" category with predefined settings.
 */
export const createDigitalWalletCategory = async (): Promise<Category> => {
  return createCategory({
    name: 'Digital Wallet',
    description: 'ID, Credit Card, etc'
  });
};
