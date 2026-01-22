// src/features/vault/index.ts
/**
 * Vault Feature Module
 * 
 * Exports all vault-related functionality:
 * - Components: CategoryManager, ProfileManager, etc.
 * - Services: Vault API calls, encryption
 * - Hooks: useVault, useProfiles
 * - Types: Vault-related TypeScript types
 */

// Re-export from subdirectories
export * from './services';
export * from './hooks';
export * from './types';
