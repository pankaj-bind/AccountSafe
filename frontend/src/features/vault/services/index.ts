// src/features/vault/services/index.ts
/**
 * Vault Services Barrel Export
 */

export * from './vaultService';

// Re-export profileService with aliases to avoid conflicts
export {
  fetchOrganization,
  fetchProfiles,
  createProfile as createProfileWithFormData,
  updateProfile as updateProfileWithFormData,
  patchProfile,
  deleteProfile as removeProfile,
  createShareLink,
  buildProfileFormData,
} from './profileService';

// Re-export categoryService with namespaced names to avoid conflicts with vaultService
export {
  fetchCategories,
  createCategory as createCategoryDirect,
  deleteCategory as deleteCategoryDirect,
  createOrganization as createOrganizationDirect,
  updateOrganization as updateOrganizationDirect,
  deleteOrganization as deleteOrganizationDirect,
  searchCuratedOrganizations,
  createDigitalWalletCategory,
} from './categoryService';
