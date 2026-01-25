import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import { decryptCredentialFields } from '../utils/encryption';

interface ProfileWithOrg {
  id: number;
  title: string;
  organizationName: string;
  organizationId: number;
  password_encrypted?: string;
  password_iv?: string;
}

interface DuplicateProfile {
  id: number;
  title: string;
  organizationName: string;
  organizationId: number;
}

interface DuplicateCheckResult {
  duplicateCount: number;
  duplicates: DuplicateProfile[];
  isChecking: boolean;
  error: string | null;
}

/**
 * Custom hook to check if a password is duplicated across user's profiles
 * 
 * **How it works:**
 * 1. Fetch all user's profiles across all organizations
 * 2. Decrypt passwords client-side using master key from CryptoContext
 * 3. Compare with current password (case-sensitive)
 * 4. Return list of profiles with duplicate passwords
 * 
 * **Zero-Knowledge Architecture:**
 * - Master key is obtained from CryptoContext (memory only)
 * - Master key is NEVER stored in localStorage/sessionStorage
 * - All decryption happens client-side
 * 
 * **Features:**
 * - Cross-organization checking
 * - Client-side comparison only (privacy-first)
 * - Excludes the current profile being edited
 * - Debouncing: Waits 600ms after user stops typing
 * - LAZY LOADING: Only fetches profiles when password is entered
 * 
 * @param password - The password to check
 * @param currentProfileId - ID of current profile (to exclude from duplicates)
 * @param getMasterKey - Function to get master key from CryptoContext
 * @returns Object containing duplicateCount, duplicates list, isChecking, and error
 */
export const useDuplicatePasswordCheck = (
  password: string,
  currentProfileId?: number,
  getMasterKey?: () => CryptoKey | null
): DuplicateCheckResult => {
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const [duplicates, setDuplicates] = useState<DuplicateProfile[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [allProfiles, setAllProfiles] = useState<ProfileWithOrg[]>([]);
  const [profilesFetched, setProfilesFetched] = useState<boolean>(false);

  /**
   * Fetch all user's profiles across all organizations
   * LAZY: Only called when actually needed (when password is entered)
   */
  const fetchAllProfiles = useCallback(async () => {
    if (profilesFetched) return allProfiles;
    
    try {
      // Step 1: Fetch all categories
      const categoriesResponse = await apiClient.get('/categories/');
      const categories = categoriesResponse.data;

      // Step 2: Fetch all profiles from all organizations IN PARALLEL
      const allProfilesData: ProfileWithOrg[] = [];
      
      // Collect all organization IDs first
      const orgPromises: Promise<{ data: ProfileWithOrg[] }>[] = [];
      const orgInfos: { orgId: number; orgName: string }[] = [];
      
      for (const category of categories) {
        for (const org of category.organizations) {
          orgInfos.push({ orgId: org.id, orgName: org.name });
          orgPromises.push(
            apiClient.get(`/organizations/${org.id}/profiles/`).catch(err => {
              console.error(`Failed to fetch profiles for org ${org.id}:`, err);
              return { data: [] };
            })
          );
        }
      }
      
      // Fetch all in parallel
      const responses = await Promise.all(orgPromises);
      
      // Combine results
      responses.forEach((response, index) => {
        const profiles = response.data || [];
        profiles.forEach((profile) => {
          allProfilesData.push({
            ...profile,
            organizationName: orgInfos[index].orgName,
            organizationId: orgInfos[index].orgId,
          });
        });
      });

      setAllProfiles(allProfilesData);
      setProfilesFetched(true);
      return allProfilesData;
    } catch (err) {
      console.error('Failed to fetch all profiles:', err);
      setError('Failed to load profiles for duplicate check');
      setProfilesFetched(true); // Mark as fetched even on error to prevent infinite loops
      return [];
    }
  }, [profilesFetched, allProfiles]);

  // DO NOT fetch profiles on mount - wait until password is entered
  // This is lazy loading for better performance

  /**
   * Check for duplicate passwords
   * LAZY: Only fetches all profiles when actually checking
   */
  const checkDuplicates = useCallback(async (pwd: string) => {
    if (!pwd || pwd.length === 0) {
      setDuplicateCount(0);
      setDuplicates([]);
      return;
    }

    try {
      setIsChecking(true);
      setError(null);

      // Get encryption key from CryptoContext (zero-knowledge: key exists only in memory)
      const encryptionKey = getMasterKey?.();
      if (!encryptionKey) {
        setError('Session expired. Please re-enter your master password.');
        setIsChecking(false);
        return;
      }

      // LAZY: Fetch profiles only when needed
      const profiles = profilesFetched ? allProfiles : await fetchAllProfiles();

      const foundDuplicates: DuplicateProfile[] = [];

      // Decrypt all passwords in parallel for better performance
      const decryptPromises = profiles.map(async (profile) => {
        // Skip the current profile being edited
        if (currentProfileId && profile.id === currentProfileId) {
          return null;
        }

        // Skip if no password is set
        if (!profile.password_encrypted) {
          return null;
        }

        try {
          // Decrypt the profile's password
          const decryptedFields = await decryptCredentialFields(
            {
              password_encrypted: profile.password_encrypted,
              password_iv: profile.password_iv,
            },
            encryptionKey
          );

          // Compare passwords (case-sensitive)
          if (decryptedFields.password === pwd) {
            return {
              id: profile.id,
              title: profile.title || 'Untitled Profile',
              organizationName: profile.organizationName,
              organizationId: profile.organizationId,
            } as DuplicateProfile;
          }
        } catch (err) {
          // Skip profiles that fail to decrypt
          console.error(`Failed to decrypt profile ${profile.id}:`, err);
        }
        return null;
      });

      const results = await Promise.all(decryptPromises);
      
      // Filter out null results
      for (const result of results) {
        if (result !== null) {
          foundDuplicates.push(result);
        }
      }

      setDuplicates(foundDuplicates);
      setDuplicateCount(foundDuplicates.length);
      setIsChecking(false);
    } catch (err) {
      console.error('Duplicate password check failed:', err);
      setError('Unable to check for duplicate passwords');
      setDuplicateCount(0);
      setDuplicates([]);
      setIsChecking(false);
    }
  }, [allProfiles, currentProfileId, profilesFetched, getMasterKey, fetchAllProfiles]);

  // Debounce password checking - only triggers when password is entered
  useEffect(() => {
    // Skip if password is empty (don't trigger unnecessary fetches)
    if (!password || password.length === 0) {
      setDuplicateCount(0);
      setDuplicates([]);
      return;
    }

    const timer = setTimeout(() => {
      checkDuplicates(password);
    }, 600);

    return () => clearTimeout(timer);
  }, [password, checkDuplicates]);

  return {
    duplicateCount,
    duplicates,
    isChecking,
    error,
  };
};
