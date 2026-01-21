import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import { getSessionEncryptionKey } from '../services/encryptionService';
import { decryptCredentialFields } from '../utils/encryption';

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
 * 2. Decrypt passwords client-side
 * 3. Compare with current password (case-sensitive)
 * 4. Return list of profiles with duplicate passwords
 * 
 * **Features:**
 * - Cross-organization checking
 * - Client-side comparison only (privacy-first)
 * - Excludes the current profile being edited
 * - Debouncing: Waits 600ms after user stops typing
 * 
 * @param password - The password to check
 * @param currentProfileId - ID of current profile (to exclude from duplicates)
 * @returns Object containing duplicateCount, duplicates list, isChecking, and error
 */
export const useDuplicatePasswordCheck = (
  password: string,
  currentProfileId?: number
): DuplicateCheckResult => {
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const [duplicates, setDuplicates] = useState<DuplicateProfile[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [profilesFetched, setProfilesFetched] = useState<boolean>(false);

  /**
   * Fetch all user's profiles across all organizations
   * This runs once when the hook is first used
   */
  const fetchAllProfiles = useCallback(async () => {
    try {
      // Step 1: Fetch all categories
      const categoriesResponse = await apiClient.get('/categories/');
      const categories = categoriesResponse.data;

      // Step 2: Fetch all profiles from all organizations
      const allProfilesData: any[] = [];

      for (const category of categories) {
        for (const org of category.organizations) {
          try {
            const profilesResponse = await apiClient.get(`/organizations/${org.id}/profiles/`);
            const profiles = profilesResponse.data;

            // Add organization info to each profile
            profiles.forEach((profile: any) => {
              allProfilesData.push({
                ...profile,
                organizationName: org.name,
                organizationId: org.id,
              });
            });
          } catch (err) {
            console.error(`Failed to fetch profiles for org ${org.id}:`, err);
          }
        }
      }

      setAllProfiles(allProfilesData);
      setProfilesFetched(true);
    } catch (err) {
      console.error('Failed to fetch all profiles:', err);
      setError('Failed to load profiles for duplicate check');
      setProfilesFetched(true); // Mark as fetched even on error to prevent infinite loops
    }
  }, []);

  // Fetch profiles once on mount
  useEffect(() => {
    if (!profilesFetched) {
      fetchAllProfiles();
    }
  }, [profilesFetched, fetchAllProfiles]);

  /**
   * Check for duplicate passwords
   */
  const checkDuplicates = useCallback(async (pwd: string) => {
    if (!pwd || pwd.length === 0 || !profilesFetched) {
      setDuplicateCount(0);
      setDuplicates([]);
      return;
    }

    try {
      setIsChecking(true);
      setError(null);

      // Get encryption key
      const encryptionKey = await getSessionEncryptionKey();
      if (!encryptionKey) {
        setError('Session expired. Please re-enter your master password.');
        setIsChecking(false);
        return;
      }

      const foundDuplicates: DuplicateProfile[] = [];

      // Check each profile
      for (const profile of allProfiles) {
        // Skip the current profile being edited
        if (currentProfileId && profile.id === currentProfileId) {
          continue;
        }

        // Skip if no password is set
        if (!profile.password_encrypted) {
          continue;
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
            foundDuplicates.push({
              id: profile.id,
              title: profile.title || 'Untitled Profile',
              organizationName: profile.organizationName,
              organizationId: profile.organizationId,
            });
          }
        } catch (err) {
          // Skip profiles that fail to decrypt
          console.error(`Failed to decrypt profile ${profile.id}:`, err);
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
  }, [allProfiles, currentProfileId, profilesFetched]);

  // Debounce password checking
  useEffect(() => {
    if (!profilesFetched) return;

    const timer = setTimeout(() => {
      checkDuplicates(password);
    }, 600);

    return () => clearTimeout(timer);
  }, [password, checkDuplicates, profilesFetched]);

  return {
    duplicateCount,
    duplicates,
    isChecking,
    error,
  };
};
