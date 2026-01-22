// src/features/index.ts
/**
 * Features Index
 * 
 * Main entry point for feature-sliced architecture.
 * Import features from their individual modules for better tree-shaking:
 * 
 * @example
 * // Preferred: Import from specific feature
 * import { login, register } from '@/features/auth';
 * import { getVault, saveVault } from '@/features/vault';
 * import { getHealthScore } from '@/features/security';
 * 
 * // Types
 * import type { User } from '@/features/auth/types';
 * import type { Category, Profile } from '@/features/vault/types';
 * import type { HealthScore } from '@/features/security/types';
 */

// Re-export all feature modules
export * as auth from './auth';
export * as vault from './vault';
export * as security from './security';
export * as shared from './shared';
