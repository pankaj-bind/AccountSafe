// ═══════════════════════════════════════════════════════════════════════════════
// VaultGuard Component
// ═══════════════════════════════════════════════════════════════════════════════
//
// ZERO-KNOWLEDGE ARCHITECTURE:
// This component ensures the vault is unlocked before rendering children.
// - NO auto-unlock from session storage (password is never stored)
// - Master key lives only in CryptoContext memory
// - If vault is locked (panic mode), shows loading while GlobalPanicHandler handles it
//
// Usage:
//   <VaultGuard>
//     <ProtectedContent />
//   </VaultGuard>
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useCrypto } from '../services/CryptoContext';

interface VaultGuardProps {
  children: React.ReactNode;
}

const VaultGuard: React.FC<VaultGuardProps> = ({ children }) => {
  const { isUnlocked, isLoading, lockReason } = useCrypto();

  // Show loading state while checking vault status
  if (isLoading) {
    console.log('VaultGuard: Loading vault...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#09090b]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading vault...</p>
        </div>
      </div>
    );
  }

  // If vault is locked, show loading state
  // GlobalPanicHandler will show the Session Verification window for panic mode
  if (!isUnlocked) {
    console.log('VaultGuard: Vault is locked. Reason:', lockReason);
    console.log('VaultGuard: This might indicate the vault was never unlocked after login.');
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#09090b]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">
            {lockReason === 'panic' ? 'Session locked...' : 'Preparing vault...'}
          </p>
        </div>
      </div>
    );
  }
  
  console.log('VaultGuard: Vault is unlocked, rendering children');

  // Vault is unlocked - render children
  return <>{children}</>;
};

export default VaultGuard;
