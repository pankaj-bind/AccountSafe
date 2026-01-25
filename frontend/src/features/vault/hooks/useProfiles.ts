// src/features/vault/hooks/useProfiles.ts
/**
 * useProfiles - Custom Hook for Profile State Management
 * 
 * RESPONSIBILITY: Bridge between Service Layer and UI Layer
 * - Manages loading, error, and data states
 * - Handles encryption/decryption (zero-knowledge)
 * - Exposes handler functions for CRUD operations
 * - Security checks (breach detection, strength)
 * 
 * ZERO-KNOWLEDGE: All sensitive data is encrypted/decrypted client-side.
 * The server never sees plaintext credentials.
 */

import { useState, useEffect, useCallback } from 'react';
import zxcvbn from 'zxcvbn';
import { logger } from '../../../utils/logger';

// Services
import * as profileService from '../services/profileService';
import { encryptCredentialFields, decryptCredentialFields } from '../../../utils/encryption';
import { encryptForOneTimeShare } from '../../../services/cryptoService';
import { checkPasswordBreach, updatePasswordStrength, updateBreachStatus, updatePasswordHash } from '../../../services/securityService';

// Types
import type {
  Profile,
  EncryptedProfile,
  Organization,
  ProfileFormData,
  CreditCardFormData,
  RecoveryCodesMap,
  ShareData,
} from '../types/profile.types';

// ═══════════════════════════════════════════════════════════════════════════════
// Hook Return Type
// ═══════════════════════════════════════════════════════════════════════════════

export interface UseProfilesReturn {
  // State
  profiles: Profile[];
  organization: Organization | null;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  recoveryCodes: RecoveryCodesMap;
  needsPasswordReentry: boolean;

  // CRUD Operations
  fetchProfiles: () => Promise<void>;
  addProfile: (formData: ProfileFormData, document?: File | null) => Promise<Profile | null>;
  editProfile: (profileId: number, formData: ProfileFormData, document?: File | null) => Promise<Profile | null>;
  removeProfile: (profileId: number) => Promise<boolean>;
  togglePinProfile: (profileId: number) => Promise<void>;
  updateRecoveryCodes: (profileId: number, codes: string[]) => Promise<void>;

  // Credit Card Operations
  addCreditCard: (cardData: CreditCardFormData) => Promise<Profile | null>;
  editCreditCard: (profileId: number, cardData: CreditCardFormData) => Promise<Profile | null>;
  parseCreditCardData: (profile: Profile) => CreditCardFormData;

  // Sharing
  createShareLink: (profileId: number, expiryHours: number) => Promise<string | null>;

  // Utility
  clearError: () => void;
  clearSuccess: () => void;
  setNeedsPasswordReentry: (value: boolean) => void;
  refreshOrganization: () => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Hook Implementation
// ═══════════════════════════════════════════════════════════════════════════════

export function useProfiles(
  organizationId: number,
  initialOrganization: Organization,
  getMasterKey: () => CryptoKey | null
): UseProfilesReturn {
  // ─────────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────────
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [organization, setOrganization] = useState<Organization>(initialOrganization);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<RecoveryCodesMap>({});
  const [needsPasswordReentry, setNeedsPasswordReentry] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // Decrypt Profile Helper
  // ─────────────────────────────────────────────────────────────────────────────
  const decryptProfile = useCallback(async (
    encryptedProfile: EncryptedProfile,
    encryptionKey: CryptoKey
  ): Promise<Profile> => {
    try {
      const decryptedFields = await decryptCredentialFields(encryptedProfile, encryptionKey);
      return {
        ...encryptedProfile,
        username: decryptedFields.username || null,
        password: decryptedFields.password || null,
        email: decryptedFields.email || null,
        notes: decryptedFields.notes || null,
        recovery_codes: decryptedFields.recovery_codes || null,
        document: encryptedProfile.document || null,
        document_url: encryptedProfile.document_url || null,
      };
    } catch (decryptError) {
      console.error(`Failed to decrypt profile ${encryptedProfile.id}:`, decryptError);
      return {
        ...encryptedProfile,
        username: null,
        password: null,
        email: null,
        notes: null,
        recovery_codes: null,
        document: encryptedProfile.document || null,
        document_url: encryptedProfile.document_url || null,
      };
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Security Metrics Helper
  // ─────────────────────────────────────────────────────────────────────────────
  const checkPasswordSecurity = useCallback(async (
    profileId: number,
    password: string
  ): Promise<void> => {
    if (!password) return;

    try {
      // Calculate password strength using zxcvbn (0-4 scale)
      const strengthResult = zxcvbn(password);
      await updatePasswordStrength(profileId, strengthResult.score);

      // Check if password has been breached using HIBP
      const breachResult = await checkPasswordBreach(password);
      await updateBreachStatus(profileId, breachResult.isBreached, breachResult.breachCount);

      // Update password hash for uniqueness checking
      await updatePasswordHash(profileId, password);

      logger.log(`Security metrics updated for profile ${profileId}:`, {
        strength: strengthResult.score,
        breached: breachResult.isBreached,
        breachCount: breachResult.breachCount
      });
    } catch (securityError) {
      console.error('Failed to update security metrics:', securityError);
      // Don't fail the profile creation/update if security check fails
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch Organization
  // ─────────────────────────────────────────────────────────────────────────────
  const refreshOrganization = useCallback(async () => {
    try {
      const orgData = await profileService.fetchOrganization(organizationId);
      setOrganization(orgData);
    } catch (fetchError) {
      console.error('Error fetching organization:', fetchError);
    }
  }, [organizationId]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch Profiles (with decryption)
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const encryptionKey = getMasterKey();
      if (!encryptionKey) {
        setNeedsPasswordReentry(true);
        setIsLoading(false);
        return;
      }

      const encryptedProfiles = await profileService.fetchProfiles(organizationId);

      // Decrypt all profiles in parallel
      const decryptedProfiles = await Promise.all(
        encryptedProfiles.map(profile => decryptProfile(profile, encryptionKey))
      );

      setProfiles(decryptedProfiles);
    } catch (fetchError) {
      console.error('Error fetching profiles:', fetchError);
      setError('Failed to load profiles');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, getMasterKey, decryptProfile]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Add Profile
  // ─────────────────────────────────────────────────────────────────────────────
  const addProfile = useCallback(async (
    formData: ProfileFormData,
    document?: File | null
  ): Promise<Profile | null> => {
    setError(null);

    try {
      const encryptionKey = getMasterKey();
      if (!encryptionKey) {
        setNeedsPasswordReentry(true);
        return null;
      }

      // Encrypt sensitive fields client-side
      const encryptedFields = await encryptCredentialFields(
        {
          username: formData.username,
          password: formData.password,
          email: formData.email,
          notes: formData.notes,
          recovery_codes: formData.recovery_codes,
        },
        encryptionKey
      );

      // Build form data for API
      const apiFormData = profileService.buildProfileFormData({
        title: formData.title,
        encryptedFields,
        document,
      });

      // Create profile via API
      const encryptedProfile = await profileService.createProfile(organizationId, apiFormData);

      // Decrypt response and add to state
      const decryptedProfile = await decryptProfile(encryptedProfile, encryptionKey);
      setProfiles(prev => [...prev, decryptedProfile]);

      // Check password security in background
      if (formData.password) {
        checkPasswordSecurity(encryptedProfile.id, formData.password);
      }

      return decryptedProfile;
    } catch (createError) {
      console.error('Error creating profile:', createError);
      setError('Failed to create profile');
      return null;
    }
  }, [organizationId, getMasterKey, decryptProfile, checkPasswordSecurity]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Edit Profile
  // ─────────────────────────────────────────────────────────────────────────────
  const editProfile = useCallback(async (
    profileId: number,
    formData: ProfileFormData,
    document?: File | null
  ): Promise<Profile | null> => {
    setError(null);

    try {
      const encryptionKey = getMasterKey();
      if (!encryptionKey) {
        setNeedsPasswordReentry(true);
        return null;
      }

      // Encrypt sensitive fields
      const encryptedFields = await encryptCredentialFields(
        {
          username: formData.username,
          password: formData.password,
          email: formData.email,
          notes: formData.notes,
          recovery_codes: formData.recovery_codes,
        },
        encryptionKey
      );

      // Build form data for API
      const apiFormData = profileService.buildProfileFormData({
        title: formData.title,
        encryptedFields,
        document,
      });

      // Update profile via API
      const encryptedProfile = await profileService.updateProfile(profileId, apiFormData);

      // Decrypt response and update state
      const decryptedProfile = await decryptProfile(encryptedProfile, encryptionKey);
      setProfiles(prev => prev.map(p => p.id === profileId ? decryptedProfile : p));

      // Check password security in background
      if (formData.password) {
        checkPasswordSecurity(encryptedProfile.id, formData.password);
      }

      return decryptedProfile;
    } catch (updateError) {
      console.error('Error updating profile:', updateError);
      setError('Failed to update profile');
      return null;
    }
  }, [getMasterKey, decryptProfile, checkPasswordSecurity]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Remove Profile
  // ─────────────────────────────────────────────────────────────────────────────
  const removeProfile = useCallback(async (profileId: number): Promise<boolean> => {
    try {
      await profileService.deleteProfile(profileId);
      setProfiles(prev => prev.filter(p => p.id !== profileId));
      return true;
    } catch (deleteError) {
      console.error('Error deleting profile:', deleteError);
      setError('Failed to delete profile');
      return false;
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Toggle Pin Profile
  // ─────────────────────────────────────────────────────────────────────────────
  const togglePinProfile = useCallback(async (profileId: number): Promise<void> => {
    try {
      const profile = profiles.find(p => p.id === profileId);
      if (!profile) return;

      const formData = new FormData();
      formData.append('is_pinned', String(!profile.is_pinned));

      await profileService.patchProfile(profileId, formData);

      setProfiles(prev => prev.map(p =>
        p.id === profileId ? { ...p, is_pinned: !p.is_pinned } : p
      ));
    } catch (pinError) {
      console.error('Error toggling pin status:', pinError);
    }
  }, [profiles]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Update Recovery Codes
  // ─────────────────────────────────────────────────────────────────────────────
  const updateRecoveryCodes = useCallback(async (
    profileId: number,
    codes: string[]
  ): Promise<void> => {
    try {
      const encryptionKey = getMasterKey();
      if (!encryptionKey) {
        setNeedsPasswordReentry(true);
        return;
      }

      const newCodesString = codes.join(' ');

      // Encrypt the recovery codes
      const encryptedFields = await encryptCredentialFields(
        { recovery_codes: newCodesString },
        encryptionKey
      );

      const formData = profileService.buildProfileFormData({
        encryptedFields,
      });

      await profileService.updateProfile(profileId, formData);

      // Update local state
      setProfiles(prev => prev.map(p =>
        p.id === profileId ? { ...p, recovery_codes: newCodesString } : p
      ));

      setRecoveryCodes(prev => ({ ...prev, [profileId]: codes }));
    } catch (updateError) {
      console.error('Failed to update recovery codes:', updateError);
    }
  }, [getMasterKey]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Credit Card Operations
  // ─────────────────────────────────────────────────────────────────────────────
  const addCreditCard = useCallback(async (
    cardData: CreditCardFormData
  ): Promise<Profile | null> => {
    // Store card data in profile fields:
    // title: Bank Name
    // username: Card Number
    // password: CVV
    // email: Card Holder Name
    // notes: JSON with cardNetwork, expiry, and design
    const cardMetadata = JSON.stringify({
      cardNetwork: cardData.cardNetwork,
      expiry: cardData.expiry,
      design: cardData.design,
    });

    return addProfile({
      title: cardData.bankName,
      username: cardData.cardNumber,
      password: cardData.cvv,
      email: cardData.cardHolder,
      notes: cardMetadata,
      recovery_codes: '',
    });
  }, [addProfile]);

  const editCreditCard = useCallback(async (
    profileId: number,
    cardData: CreditCardFormData
  ): Promise<Profile | null> => {
    const cardMetadata = JSON.stringify({
      cardNetwork: cardData.cardNetwork,
      expiry: cardData.expiry,
      design: cardData.design,
    });

    return editProfile(profileId, {
      title: cardData.bankName,
      username: cardData.cardNumber,
      password: cardData.cvv,
      email: cardData.cardHolder,
      notes: cardMetadata,
      recovery_codes: '',
    });
  }, [editProfile]);

  const parseCreditCardData = useCallback((profile: Profile): CreditCardFormData => {
    try {
      const metadata = profile.notes ? JSON.parse(profile.notes) : {};
      return {
        bankName: profile.title || '',
        cardNetwork: metadata.cardNetwork || '',
        cardNumber: profile.username || '',
        cardHolder: profile.email || '',
        expiry: metadata.expiry || '',
        cvv: profile.password || '',
        design: metadata.design || 'sbi',
      };
    } catch {
      return {
        bankName: profile.title || '',
        cardNetwork: '',
        cardNumber: profile.username || '',
        cardHolder: profile.email || '',
        expiry: '',
        cvv: profile.password || '',
        design: 'sbi',
      };
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Create Share Link
  // ─────────────────────────────────────────────────────────────────────────────
  const createShareLink = useCallback(async (
    profileId: number,
    expiryHours: number
  ): Promise<string | null> => {
    try {
      const profile = profiles.find(p => p.id === profileId);
      if (!profile) {
        setError('Profile not found');
        return null;
      }

      const masterKey = getMasterKey();
      if (!masterKey) {
        setError('Session expired. Please re-enter your master password.');
        setNeedsPasswordReentry(true);
        return null;
      }

      // Decrypt all fields before encrypting for sharing
      const decryptedFields = await decryptCredentialFields(
        {
          username_encrypted: profile.username_encrypted,
          username_iv: profile.username_iv,
          password_encrypted: profile.password_encrypted,
          password_iv: profile.password_iv,
          email_encrypted: profile.email_encrypted,
          email_iv: profile.email_iv,
          notes_encrypted: profile.notes_encrypted,
          notes_iv: profile.notes_iv,
          recovery_codes_encrypted: profile.recovery_codes_encrypted,
          recovery_codes_iv: profile.recovery_codes_iv,
        },
        masterKey
      );

      // Build share data
      const shareData: ShareData = {
        title: profile.title,
        organization: organization?.name || '',
      };

      if (decryptedFields.username) shareData.username = decryptedFields.username;
      if (decryptedFields.password) shareData.password = decryptedFields.password;
      if (decryptedFields.email) shareData.email = decryptedFields.email;
      if (decryptedFields.notes) shareData.notes = decryptedFields.notes;
      if (decryptedFields.recovery_codes) shareData.recovery_codes = decryptedFields.recovery_codes;

      // ZERO-KNOWLEDGE: Encrypt client-side before sending to server
      const { encryptedBlob, shareKey } = await encryptForOneTimeShare(shareData);

      // Send ONLY the encrypted blob to server
      const response = await profileService.createShareLink(
        profileId,
        expiryHours,
        encryptedBlob
      );

      if (response.success) {
        // Append encryption key as URL fragment (# not sent to server)
        const fullShareUrl = `${response.share_url}#${shareKey}`;
        setSuccess(`Secure share link created! Link expires in ${expiryHours} hour${expiryHours > 1 ? 's' : ''}.`);
        setTimeout(() => setSuccess(null), 5000);
        return fullShareUrl;
      }

      return null;
    } catch (shareError) {
      console.error('Failed to create share link:', shareError);
      setError('Failed to create secure share link');
      return null;
    }
  }, [profiles, organization, getMasterKey]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Parse Recovery Codes Effect
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const codes: RecoveryCodesMap = {};
    profiles.forEach(profile => {
      if (profile.recovery_codes) {
        codes[profile.id] = profile.recovery_codes.split(/\s+/).filter(code => code.trim() !== '');
      }
    });
    setRecoveryCodes(codes);
  }, [profiles]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Initial Fetch Effect
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    refreshOrganization();
    fetchProfiles();
  }, [organizationId, refreshOrganization, fetchProfiles]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Mode Change Listener (Normal ↔ Duress)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleModeChange = () => {
      logger.log('🔄 Mode changed - refetching profiles...');
      refreshOrganization();
      fetchProfiles();
    };

    window.addEventListener('vault-mode-changed', handleModeChange);
    return () => window.removeEventListener('vault-mode-changed', handleModeChange);
  }, [refreshOrganization, fetchProfiles]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Return Interface
  // ─────────────────────────────────────────────────────────────────────────────
  return {
    // State
    profiles,
    organization,
    isLoading,
    error,
    success,
    recoveryCodes,
    needsPasswordReentry,

    // CRUD Operations
    fetchProfiles,
    addProfile,
    editProfile,
    removeProfile,
    togglePinProfile,
    updateRecoveryCodes,

    // Credit Card Operations
    addCreditCard,
    editCreditCard,
    parseCreditCardData,

    // Sharing
    createShareLink,

    // Utility
    clearError: () => setError(null),
    clearSuccess: () => setSuccess(null),
    setNeedsPasswordReentry,
    refreshOrganization,
  };
}

export default useProfiles;
