// src/features/vault/hooks/useSmartImport.ts
/**
 * Smart Import Hook - Zero-Knowledge CSV Import with Brand Enrichment
 * 
 * ZERO-KNOWLEDGE ARCHITECTURE:
 * 1. CSV is parsed entirely in the browser
 * 2. Passwords are encrypted client-side BEFORE any network call
 * 3. Server NEVER sees plaintext credentials
 * 
 * STATE MACHINE:
 * IDLE -> PARSING -> GROUPING -> ENRICHING -> ENCRYPTING -> UPLOADING -> DONE
 *                                                                     \-> ERROR
 */

import { useState, useCallback, useRef } from 'react';
import { parsePasswordCSV, type ParsedCredential } from '../../../utils/csvParser';
import { searchBrands, getFallbackLogoUrl, type BrandSearchResult } from '../../../services/brandService';
import { encryptCredentialFields } from '../../../utils/encryption';
import { useCrypto } from '../../../services/CryptoContext';
import apiClient from '../../../api/apiClient';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** Import state machine phases */
export type ImportPhase = 
  | 'IDLE'
  | 'PARSING'
  | 'GROUPING'
  | 'ENRICHING'
  | 'ENCRYPTING'
  | 'UPLOADING'
  | 'DONE'
  | 'ERROR';

/** A profile to be imported (before encryption) */
export interface ImportProfile {
  title: string;
  username: string;
  password: string;
  email: string;
  notes: string;
  url: string;
}

/** Encrypted profile ready for upload */
export interface EncryptedImportProfile {
  title: string;
  username_encrypted?: string;
  username_iv?: string;
  password_encrypted?: string;
  password_iv?: string;
  email_encrypted?: string;
  email_iv?: string;
  notes_encrypted?: string;
  notes_iv?: string;
}

/** An organization with its profiles for import */
export interface ImportOrganization {
  name: string;
  domain: string;
  logo_url: string;
  website_link: string;
  profiles: ImportProfile[];
  /** Encrypted profiles (populated during encryption phase) */
  encryptedProfiles?: EncryptedImportProfile[];
}

/** Payload structure for the smart import API */
export interface SmartImportPayload {
  category_name: string;
  organizations: {
    name: string;
    logo_url: string;
    website_link: string;
    profiles: EncryptedImportProfile[];
  }[];
}

/** Import result summary */
export interface ImportResult {
  organizationsCreated: number;
  organizationsReused: number;
  profilesImported: number;
  duplicatesSkipped: number;
  errors: string[];
}

/** Hook return type */
export interface UseSmartImportReturn {
  phase: ImportPhase;
  progress: number;
  progressMessage: string;
  error: string | null;
  organizations: ImportOrganization[];
  result: ImportResult | null;
  
  /** Start the import process with a CSV file */
  startImport: (file: File) => Promise<void>;
  /** Reset to idle state */
  reset: () => void;
  /** Cancel ongoing import */
  cancel: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  /** Max concurrent brand API calls to avoid rate limiting */
  BRAND_CONCURRENCY: 3,
  /** Delay between brand API calls (ms) */
  BRAND_DELAY_MS: 100,
  /** Max organizations to process */
  MAX_ORGANIZATIONS: 500,
  /** Max profiles per organization */
  MAX_PROFILES_PER_ORG: 100,
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a unique fingerprint for a credential to detect duplicates
 * Uses username + password + url as the key
 */
function getCredentialFingerprint(cred: { username: string; password: string; url?: string }): string {
  return `${cred.username.toLowerCase().trim()}|${cred.password}|${(cred.url || '').toLowerCase().trim()}`;
}

/**
 * Group credentials by domain/name and deduplicate within each group
 */
function groupCredentialsByDomain(credentials: ParsedCredential[]): Map<string, ImportProfile[]> {
  const groups = new Map<string, ImportProfile[]>();
  
  // Track seen credentials globally to avoid duplicates across all groups
  const seenCredentials = new Set<string>();
  
  for (const cred of credentials) {
    // Create a fingerprint for duplicate detection
    const fingerprint = getCredentialFingerprint({
      username: cred.username,
      password: cred.password,
      url: cred.url,
    });
    
    // Skip if we've already seen this exact credential
    if (seenCredentials.has(fingerprint)) {
      continue;
    }
    seenCredentials.add(fingerprint);
    
    // Use domain as the grouping key (case insensitive)
    const key = cred.domain.toLowerCase();
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    
    groups.get(key)!.push({
      title: cred.name || cred.domain,
      username: cred.username,
      password: cred.password,
      email: '', // CSV typically doesn't distinguish username from email
      notes: cred.note,
      url: cred.url,
    });
  }
  
  return groups;
}

/**
 * Rate-limited parallel execution
 * Processes items with concurrency limit and delay
 */
async function rateLimitedMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number,
  delayMs: number,
  onProgress?: (completed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let completed = 0;
  let currentIndex = 0;
  
  const processNext = async (): Promise<void> => {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      const item = items[index];
      
      try {
        results[index] = await fn(item, index);
      } catch (error) {
        // Store null for failed items
        results[index] = null as R;
      }
      
      completed++;
      onProgress?.(completed, items.length);
      
      // Small delay between requests
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  };
  
  // Start concurrent workers
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, processNext);
  await Promise.all(workers);
  
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useSmartImport(): UseSmartImportReturn {
  const { getMasterKey } = useCrypto();
  
  // State
  const [phase, setPhase] = useState<ImportPhase>('IDLE');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<ImportOrganization[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  
  // Cancellation ref
  const cancelledRef = useRef(false);
  
  /**
   * Reset hook to initial state
   */
  const reset = useCallback(() => {
    setPhase('IDLE');
    setProgress(0);
    setProgressMessage('');
    setError(null);
    setOrganizations([]);
    setResult(null);
    cancelledRef.current = false;
  }, []);
  
  /**
   * Cancel ongoing import
   */
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setPhase('IDLE');
    setProgressMessage('Import cancelled');
  }, []);
  
  /**
   * Main import function
   */
  const startImport = useCallback(async (file: File) => {
    cancelledRef.current = false;
    setError(null);
    setResult(null);
    
    try {
      // ═══════════════════════════════════════════════════════════════════════
      // PHASE 1: PARSING
      // ═══════════════════════════════════════════════════════════════════════
      setPhase('PARSING');
      setProgress(0);
      setProgressMessage('Reading CSV file...');
      
      const parseResult = await parsePasswordCSV(file);
      
      if (cancelledRef.current) return;
      
      if (!parseResult.success || parseResult.credentials.length === 0) {
        setError(parseResult.errors.join('. ') || 'No valid credentials found in CSV');
        setPhase('ERROR');
        return;
      }
      
      setProgress(10);
      setProgressMessage(`Found ${parseResult.validRows} credentials`);
      
      // ═══════════════════════════════════════════════════════════════════════
      // PHASE 2: GROUPING
      // ═══════════════════════════════════════════════════════════════════════
      setPhase('GROUPING');
      setProgress(15);
      setProgressMessage('Grouping credentials by organization...');
      
      const grouped = groupCredentialsByDomain(parseResult.credentials);
      
      if (cancelledRef.current) return;
      
      // Convert to organization structure
      // Use domain-based name initially, will be replaced with actual brand name from API
      let orgs: ImportOrganization[] = Array.from(grouped.entries()).map(([domain, profiles]) => ({
        // Initial name from domain (e.g., "x.ai" -> "X"), will be enriched with actual brand name
        name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
        domain,
        logo_url: '',
        website_link: profiles[0]?.url || `https://${domain}`,
        profiles: profiles.slice(0, CONFIG.MAX_PROFILES_PER_ORG),
      }));
      
      // Limit total organizations
      orgs = orgs.slice(0, CONFIG.MAX_ORGANIZATIONS);
      
      setProgress(20);
      setProgressMessage(`Grouped into ${orgs.length} organizations`);
      setOrganizations(orgs);
      
      // ═══════════════════════════════════════════════════════════════════════
      // PHASE 3: ENRICHING (Brand API)
      // ═══════════════════════════════════════════════════════════════════════
      setPhase('ENRICHING');
      setProgressMessage('Fetching brand information...');
      
      const enrichedOrgs = await rateLimitedMap(
        orgs,
        async (org, _index) => {
          if (cancelledRef.current) throw new Error('Cancelled');
          
          try {
            // Search for brand using the full domain for better accuracy
            // e.g., "x.ai" instead of just "x", "copyleaks.com" instead of "copyleaks"
            const searchQuery = org.domain;
            const brandResults: BrandSearchResult[] = await searchBrands(searchQuery);
            
            if (brandResults && brandResults.length > 0) {
              const brand = brandResults[0];
              // Use the actual brand name from API for organization name
              return {
                ...org,
                name: brand.name || org.name,
                logo_url: brand.logo || brand.icon || getFallbackLogoUrl(org.domain),
                website_link: brand.website_link || org.website_link,
              };
            }
            
            // Fallback: keep original name and use favicon for logo
            return {
              ...org,
              logo_url: getFallbackLogoUrl(org.domain),
            };
          } catch {
            // On error, use fallback
            return {
              ...org,
              logo_url: getFallbackLogoUrl(org.domain),
            };
          }
        },
        CONFIG.BRAND_CONCURRENCY,
        CONFIG.BRAND_DELAY_MS,
        (completed, total) => {
          const enrichProgress = 20 + (completed / total) * 30;
          setProgress(Math.round(enrichProgress));
          setProgressMessage(`Identifying brands (${completed}/${total})...`);
        }
      );
      
      if (cancelledRef.current) return;
      
      const validEnrichedOrgs = enrichedOrgs.filter(Boolean) as ImportOrganization[];
      setOrganizations(validEnrichedOrgs);
      setProgress(50);
      
      // ═══════════════════════════════════════════════════════════════════════
      // PHASE 4: ENCRYPTING
      // ═══════════════════════════════════════════════════════════════════════
      setPhase('ENCRYPTING');
      setProgressMessage('Encrypting credentials (Zero-Knowledge)...');
      
      const masterKey = getMasterKey();
      if (!masterKey) {
        setError('Vault is locked. Please unlock your vault first.');
        setPhase('ERROR');
        return;
      }
      
      let encryptedCount = 0;
      const totalProfiles = validEnrichedOrgs.reduce((sum, org) => sum + org.profiles.length, 0);
      
      const encryptedOrgs: ImportOrganization[] = [];
      
      for (const org of validEnrichedOrgs) {
        if (cancelledRef.current) return;
        
        const encryptedProfiles: EncryptedImportProfile[] = [];
        
        for (const profile of org.profiles) {
          if (cancelledRef.current) return;
          
          // Encrypt each profile's sensitive fields
          const encrypted = await encryptCredentialFields(
            {
              username: profile.username,
              password: profile.password,
              email: profile.email,
              notes: profile.notes,
            },
            masterKey
          );
          
          encryptedProfiles.push({
            title: profile.title,
            ...encrypted,
          });
          
          encryptedCount++;
          const encryptProgress = 50 + (encryptedCount / totalProfiles) * 30;
          setProgress(Math.round(encryptProgress));
          setProgressMessage(`Encrypting credentials (${encryptedCount}/${totalProfiles})...`);
        }
        
        encryptedOrgs.push({
          ...org,
          encryptedProfiles,
        });
      }
      
      setOrganizations(encryptedOrgs);
      setProgress(80);
      
      // ═══════════════════════════════════════════════════════════════════════
      // PHASE 5: UPLOADING
      // ═══════════════════════════════════════════════════════════════════════
      setPhase('UPLOADING');
      setProgressMessage('Saving to your vault...');
      
      // Extract category name from file name (e.g., "Microsoft Edge Passwords.csv" -> "Microsoft Edge Passwords")
      const categoryName = file.name.replace(/\.csv$/i, '').trim() || 'Imported Passwords';
      
      // Build the API payload
      const payload: SmartImportPayload = {
        category_name: categoryName,
        organizations: encryptedOrgs.map(org => ({
          name: org.name,
          logo_url: org.logo_url,
          website_link: org.website_link,
          profiles: org.encryptedProfiles || [],
        })),
      };
      
      // Make the API call
      const response = await apiClient.post('/vault/smart-import/', payload);
      
      if (cancelledRef.current) return;
      
      // ═══════════════════════════════════════════════════════════════════════
      // PHASE 6: DONE
      // ═══════════════════════════════════════════════════════════════════════
      setPhase('DONE');
      setProgress(100);
      setProgressMessage('Import complete!');
      
      setResult({
        organizationsCreated: response.data.organizations_created || 0,
        organizationsReused: response.data.organizations_reused || 0,
        profilesImported: response.data.profiles_imported || 0,
        duplicatesSkipped: response.data.duplicates_skipped || 0,
        errors: response.data.errors || [],
      });
      
    } catch (err) {
      if (cancelledRef.current) return;
      
      console.error('Smart import error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Import failed. Please try again.';
      setError(errorMessage);
      setPhase('ERROR');
    }
  }, [getMasterKey]);
  
  return {
    phase,
    progress,
    progressMessage,
    error,
    organizations,
    result,
    startImport,
    reset,
    cancel,
  };
}

export default useSmartImport;
