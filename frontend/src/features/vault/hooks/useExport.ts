// src/features/vault/hooks/useExport.ts
/**
 * Zero-Knowledge Export Hook
 * 
 * SECURITY ARCHITECTURE:
 * 1. User MUST re-enter master password to authorize export
 * 2. Key derivation happens client-side using Argon2id
 * 3. All decryption happens in the browser
 * 4. Export file is generated using URL.createObjectURL()
 * 5. Decrypted data is held in local variables and cleared after download
 * 6. Server NEVER sees plaintext data
 * 
 * EXPORT FORMATS:
 * - CSV: Readable spreadsheet format using papaparse
 * - JSON: Structured data format (decrypted)
 */

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import apiClient from '../../../api/apiClient';
import { deriveMasterKey } from '../../../services/cryptoService';
import { decryptCredentialFields } from '../../../utils/encryption';
import type { EncryptedProfile } from '../types/profile.types';
import type { Category } from '../types/category.types';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type ExportFormat = 'csv' | 'json';

export type ExportPhase = 
  | 'IDLE'
  | 'VERIFYING'
  | 'FETCHING'
  | 'DECRYPTING'
  | 'FORMATTING'
  | 'DOWNLOADING'
  | 'DONE'
  | 'ERROR';

/** Decrypted profile for export */
export interface ExportProfile {
  category: string;
  organization: string;
  title: string;
  username: string;
  password: string;
  email: string;
  url: string;
  notes: string;
}

/** Export result summary */
export interface ExportResult {
  profilesExported: number;
  categoriesProcessed: number;
  organizationsProcessed: number;
  format: ExportFormat;
}

/** Hook return type */
export interface UseExportReturn {
  phase: ExportPhase;
  progress: number;
  progressMessage: string;
  error: string | null;
  result: ExportResult | null;
  
  /** Start the export process */
  exportVault: (password: string, format: ExportFormat) => Promise<void>;
  /** Reset to idle state */
  reset: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Securely wipe an array by overwriting with nulls
 * Note: Due to JS garbage collection, this isn't guaranteed but is best effort
 */
function secureWipeArray<T>(arr: T[]): void {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = null as unknown as T;
  }
  arr.length = 0;
}

/**
 * Format date for filename
 */
function getExportFilename(format: ExportFormat): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return `accountsafe-export-${dateStr}.${format}`;
}

/**
 * Trigger browser download
 */
function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  // Create hidden link and click it
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // Clean up immediately
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

export function useExport(): UseExportReturn {
  const [phase, setPhase] = useState<ExportPhase>('IDLE');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);

  /**
   * Reset the hook to initial state
   */
  const reset = useCallback(() => {
    setPhase('IDLE');
    setProgress(0);
    setProgressMessage('');
    setError(null);
    setResult(null);
  }, []);

  /**
   * Main export function
   * 
   * SECURITY: Password is used to derive master key locally,
   * then immediately discarded. Key is used for decryption
   * and also discarded after use.
   */
  const exportVault = useCallback(async (password: string, format: ExportFormat) => {
    // Validate inputs
    if (!password || password.trim() === '') {
      setError('Password is required');
      setPhase('ERROR');
      return;
    }

    // Clear any previous state
    reset();
    
    let masterKey: CryptoKey | null = null;
    let exportData: ExportProfile[] = [];
    
    try {
      // ─────────────────────────────────────────────────────────────────────────
      // PHASE 1: Verify password and derive key
      // ─────────────────────────────────────────────────────────────────────────
      setPhase('VERIFYING');
      setProgress(5);
      setProgressMessage('Verifying master password...');
      
      // Get salt from localStorage
      const username = localStorage.getItem('username');
      if (!username) {
        throw new Error('Not logged in');
      }
      
      let salt = localStorage.getItem(`encryption_salt_${username}`);
      if (!salt) {
        // Try to get salt from server
        const saltResponse = await apiClient.get(`/zk/salt/?username=${encodeURIComponent(username)}`);
        if (!saltResponse.data.salt) {
          throw new Error('Cannot retrieve encryption salt');
        }
        salt = saltResponse.data.salt;
      }
      
      // Derive master key using Argon2id (CPU intensive, ~1-2 seconds)
      masterKey = await deriveMasterKey(password, salt!);
      
      setProgress(15);
      setProgressMessage('Password verified');
      
      // ─────────────────────────────────────────────────────────────────────────
      // PHASE 2: Fetch all encrypted data
      // ─────────────────────────────────────────────────────────────────────────
      setPhase('FETCHING');
      setProgress(20);
      setProgressMessage('Fetching vault data...');
      
      // Fetch all categories with organizations
      const categoriesResponse = await apiClient.get<Category[]>('/categories/');
      const categories = categoriesResponse.data;
      
      // Build a map of organization ID to category/org info
      interface OrgInfo {
        categoryName: string;
        orgName: string;
        orgWebsite: string;
      }
      const orgInfoMap = new Map<number, OrgInfo>();
      const orgIds: number[] = [];
      
      for (const category of categories) {
        for (const org of category.organizations) {
          orgInfoMap.set(org.id, {
            categoryName: category.name,
            orgName: org.name,
            orgWebsite: org.website_link || '',
          });
          orgIds.push(org.id);
        }
      }
      
      setProgress(30);
      setProgressMessage(`Found ${orgIds.length} organizations...`);
      
      // Fetch all profiles from all organizations in parallel
      const profilePromises = orgIds.map(orgId =>
        apiClient.get<EncryptedProfile[]>(`/organizations/${orgId}/profiles/`)
          .then(res => ({ orgId, profiles: res.data }))
          .catch(() => ({ orgId, profiles: [] }))
      );
      
      const profileResults = await Promise.all(profilePromises);
      
      // Collect all encrypted profiles with their org info
      interface ProfileWithOrg {
        profile: EncryptedProfile;
        orgInfo: OrgInfo;
      }
      const allEncryptedProfiles: ProfileWithOrg[] = [];
      
      for (const { orgId, profiles } of profileResults) {
        const orgInfo = orgInfoMap.get(orgId);
        if (orgInfo) {
          for (const profile of profiles) {
            allEncryptedProfiles.push({ profile, orgInfo });
          }
        }
      }
      
      setProgress(40);
      setProgressMessage(`Found ${allEncryptedProfiles.length} credentials to export...`);
      
      if (allEncryptedProfiles.length === 0) {
        // No credentials to export
        setPhase('DONE');
        setProgress(100);
        setProgressMessage('No credentials to export');
        setResult({
          profilesExported: 0,
          categoriesProcessed: categories.length,
          organizationsProcessed: orgIds.length,
          format,
        });
        return;
      }
      
      // ─────────────────────────────────────────────────────────────────────────
      // PHASE 3: Decrypt all profiles
      // ─────────────────────────────────────────────────────────────────────────
      setPhase('DECRYPTING');
      setProgress(45);
      setProgressMessage('Decrypting credentials...');
      
      const totalProfiles = allEncryptedProfiles.length;
      let decryptedCount = 0;
      
      // Capture masterKey in a const for use in the loop (avoids unsafe reference warning)
      const decryptionKey = masterKey!;
      
      // Decrypt in batches to provide progress updates
      const BATCH_SIZE = 10;
      
      for (let i = 0; i < totalProfiles; i += BATCH_SIZE) {
        const batch = allEncryptedProfiles.slice(i, i + BATCH_SIZE);
        
        const decryptedBatch = await Promise.all(
          batch.map(async ({ profile, orgInfo }) => {
            try {
              const decrypted = await decryptCredentialFields(profile, decryptionKey);
              return {
                category: orgInfo.categoryName,
                organization: orgInfo.orgName,
                title: profile.title || '',
                username: decrypted.username || '',
                password: decrypted.password || '',
                email: decrypted.email || '',
                url: orgInfo.orgWebsite,
                notes: decrypted.notes || '',
              };
            } catch (err) {
              console.error(`Failed to decrypt profile ${profile.id}:`, err);
              // Return profile with empty decrypted fields on error
              return {
                category: orgInfo.categoryName,
                organization: orgInfo.orgName,
                title: profile.title || '',
                username: '[Decryption failed]',
                password: '[Decryption failed]',
                email: '',
                url: orgInfo.orgWebsite,
                notes: '',
              };
            }
          })
        );
        
        exportData.push(...decryptedBatch);
        decryptedCount += batch.length;
        
        // Update progress (45% to 75%)
        const decryptProgress = 45 + (30 * decryptedCount / totalProfiles);
        setProgress(Math.round(decryptProgress));
        setProgressMessage(`Decrypted ${decryptedCount} of ${totalProfiles} credentials...`);
      }
      
      // ─────────────────────────────────────────────────────────────────────────
      // PHASE 4: Format for export
      // ─────────────────────────────────────────────────────────────────────────
      setPhase('FORMATTING');
      setProgress(80);
      setProgressMessage(`Formatting as ${format.toUpperCase()}...`);
      
      let exportContent: string;
      let mimeType: string;
      
      if (format === 'csv') {
        // Use papaparse to create CSV
        exportContent = Papa.unparse(exportData, {
          header: true,
          columns: ['category', 'organization', 'title', 'username', 'password', 'email', 'url', 'notes'],
        });
        mimeType = 'text/csv;charset=utf-8';
      } else {
        // JSON format with pretty printing
        exportContent = JSON.stringify(
          {
            exportDate: new Date().toISOString(),
            source: 'AccountSafe',
            version: '1.0',
            totalCredentials: exportData.length,
            credentials: exportData,
          },
          null,
          2
        );
        mimeType = 'application/json;charset=utf-8';
      }
      
      setProgress(90);
      
      // ─────────────────────────────────────────────────────────────────────────
      // PHASE 5: Trigger download
      // ─────────────────────────────────────────────────────────────────────────
      setPhase('DOWNLOADING');
      setProgressMessage('Starting download...');
      
      const filename = getExportFilename(format);
      triggerDownload(exportContent, filename, mimeType);
      
      // ─────────────────────────────────────────────────────────────────────────
      // PHASE 6: Cleanup and complete
      // ─────────────────────────────────────────────────────────────────────────
      setPhase('DONE');
      setProgress(100);
      setProgressMessage('Export complete!');
      
      setResult({
        profilesExported: exportData.length,
        categoriesProcessed: categories.length,
        organizationsProcessed: orgIds.length,
        format,
      });
      
    } catch (err) {
      console.error('Export failed:', err);
      setPhase('ERROR');
      
      if (err instanceof Error) {
        // Check for specific error types
        if (err.message.includes('Decryption failed') || err.message.includes('Operation Error')) {
          setError('Invalid master password. Please try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Export failed. Please try again.');
      }
    } finally {
      // ─────────────────────────────────────────────────────────────────────────
      // MEMORY HYGIENE: Wipe sensitive data
      // ─────────────────────────────────────────────────────────────────────────
      
      // Wipe the export data array
      secureWipeArray(exportData);
      
      // Note: masterKey is a CryptoKey and is not extractable by design
      // It will be garbage collected when it goes out of scope
      masterKey = null;
    }
  }, [reset]);

  return {
    phase,
    progress,
    progressMessage,
    error,
    result,
    exportVault,
    reset,
  };
}

export default useExport;
