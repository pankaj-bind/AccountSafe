// src/features/security/index.ts
/**
 * Security Feature Module
 * 
 * Exports all security-related functionality:
 * - Components: SecuritySettings, SessionList, CanaryTrapManager, etc.
 * - Services: Security API calls, PIN management
 * - Hooks: useSecurity, useSessions
 * - Types: Security-related TypeScript types
 */

// Re-export from subdirectories
export * from './services';
export * from './hooks';
export * from './types';
export * from './components';
