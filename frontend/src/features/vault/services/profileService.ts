// src/features/vault/services/profileService.ts
/**
 * Profile Service - Pure API Layer
 * 
 * RESPONSIBILITY: Handle all HTTP communication with the backend.
 * NO React code, NO state management, NO encryption logic.
 * 
 * ZERO-KNOWLEDGE: Server stores encrypted blobs - this service
 * sends/receives encrypted data. Decryption happens in the hook layer.
 */

import apiClient from '../../../api/apiClient';
import type {
  EncryptedProfile,
  Organization,
  ShareLinkResponse,
} from '../types/profile.types';

// ═══════════════════════════════════════════════════════════════════════════════
// Organization API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch organization details by ID
 */
export async function fetchOrganization(organizationId: number): Promise<Organization> {
  const response = await apiClient.get<Organization>(`organizations/${organizationId}/`);
  return response.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Profile CRUD API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch all profiles for an organization (encrypted)
 */
export async function fetchProfiles(organizationId: number): Promise<EncryptedProfile[]> {
  const response = await apiClient.get<EncryptedProfile[]>(
    `organizations/${organizationId}/profiles/`
  );
  return response.data;
}

/**
 * Create a new profile with encrypted fields
 */
export async function createProfile(
  organizationId: number,
  formData: FormData
): Promise<EncryptedProfile> {
  const response = await apiClient.post<EncryptedProfile>(
    `organizations/${organizationId}/profiles/`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
}

/**
 * Update an existing profile
 */
export async function updateProfile(
  profileId: number,
  formData: FormData
): Promise<EncryptedProfile> {
  const response = await apiClient.put<EncryptedProfile>(
    `profiles/${profileId}/`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
}

/**
 * Partially update a profile (e.g., toggle pin)
 */
export async function patchProfile(
  profileId: number,
  formData: FormData
): Promise<EncryptedProfile> {
  const response = await apiClient.patch<EncryptedProfile>(
    `profiles/${profileId}/`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
}

/**
 * Delete a profile
 */
export async function deleteProfile(profileId: number): Promise<void> {
  await apiClient.delete(`profiles/${profileId}/`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Secure Sharing API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a one-time share link
 * 
 * @param profileId - Profile being shared
 * @param expiryHours - Hours until link expires
 * @param encryptedBlob - Client-encrypted data (server cannot decrypt)
 */
export async function createShareLink(
  profileId: number,
  expiryHours: number,
  encryptedBlob: string
): Promise<ShareLinkResponse> {
  const response = await apiClient.post<ShareLinkResponse>('shared-secrets/create/', {
    profile_id: profileId,
    expiry_hours: expiryHours,
    encrypted_blob: encryptedBlob,
  });
  return response.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Security Metrics API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Update password strength score for a profile
 */
export async function updatePasswordStrengthApi(
  profileId: number,
  strength: number
): Promise<void> {
  await apiClient.post(`profiles/${profileId}/update-strength/`, {
    password_strength: strength,
  });
}

/**
 * Update breach status for a profile
 */
export async function updateBreachStatusApi(
  profileId: number,
  isBreached: boolean,
  breachCount: number
): Promise<void> {
  await apiClient.post(`profiles/${profileId}/update-breach-status/`, {
    is_breached: isBreached,
    breach_count: breachCount,
  });
}

/**
 * Update password hash for uniqueness tracking
 */
export async function updatePasswordHashApi(
  profileId: number,
  passwordHash: string
): Promise<void> {
  await apiClient.post(`profiles/${profileId}/update-password-hash/`, {
    password_hash: passwordHash,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build FormData from encrypted fields and metadata
 */
export function buildProfileFormData(params: {
  title?: string;
  encryptedFields: {
    username_encrypted?: string | null;
    username_iv?: string | null;
    password_encrypted?: string | null;
    password_iv?: string | null;
    email_encrypted?: string | null;
    email_iv?: string | null;
    notes_encrypted?: string | null;
    notes_iv?: string | null;
    recovery_codes_encrypted?: string | null;
    recovery_codes_iv?: string | null;
  };
  document?: File | null;
  isPinned?: boolean;
}): FormData {
  const formData = new FormData();

  if (params.title !== undefined) {
    formData.append('title', params.title);
  }

  const { encryptedFields } = params;

  if (encryptedFields.username_encrypted) {
    formData.append('username_encrypted', encryptedFields.username_encrypted);
    formData.append('username_iv', encryptedFields.username_iv!);
  }
  if (encryptedFields.password_encrypted) {
    formData.append('password_encrypted', encryptedFields.password_encrypted);
    formData.append('password_iv', encryptedFields.password_iv!);
  }
  if (encryptedFields.email_encrypted) {
    formData.append('email_encrypted', encryptedFields.email_encrypted);
    formData.append('email_iv', encryptedFields.email_iv!);
  }
  if (encryptedFields.notes_encrypted) {
    formData.append('notes_encrypted', encryptedFields.notes_encrypted);
    formData.append('notes_iv', encryptedFields.notes_iv!);
  }
  if (encryptedFields.recovery_codes_encrypted) {
    formData.append('recovery_codes_encrypted', encryptedFields.recovery_codes_encrypted);
    formData.append('recovery_codes_iv', encryptedFields.recovery_codes_iv!);
  }

  if (params.document) {
    formData.append('document', params.document);
  }

  if (params.isPinned !== undefined) {
    formData.append('is_pinned', String(params.isPinned));
  }

  return formData;
}
