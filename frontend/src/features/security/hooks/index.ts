// src/features/security/hooks/index.ts
/**
 * Security Hooks Barrel Export
 */

// Re-export existing hooks from src/hooks
export { usePwnedCheck } from '../../../hooks/usePwnedCheck';
export { useDuplicatePasswordCheck } from '../../../hooks/useDuplicatePasswordCheck';
export { useSessionMonitor } from '../../../hooks/useSessionMonitor';
