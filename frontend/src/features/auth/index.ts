// src/features/auth/index.ts
/**
 * Auth Feature Module
 * 
 * Exports all auth-related functionality:
 * - Components: Login, Register forms
 * - Services: Authentication API calls
 * - Hooks: useAuth, useSession
 * - Types: Auth-related TypeScript types
 */

// Re-export from subdirectories
export * from './services';
export * from './hooks';
export * from './types';

// Note: Components should be imported directly from their files
// to enable tree-shaking and lazy loading
