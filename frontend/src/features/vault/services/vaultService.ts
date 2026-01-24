// src/features/vault/services/vaultService.ts
/**
 * Vault Service - Zero-Knowledge Password Vault
 * 
 * SECURITY: Server stores encrypted blobs - CANNOT decrypt them.
 * All encryption/decryption happens client-side.
 */

import apiClient from '../../../api/apiClient';
import { 
  encryptVault, 
  decryptVault, 
  createEmptyVault,
  type VaultData 
} from '../../../services/cryptoService';
import type { Category, Organization, Profile } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// Vault CRUD Operations
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get encrypted vault from server and decrypt locally.
 */
export async function getVault(masterKey: CryptoKey): Promise<VaultData> {
  const response = await apiClient.get('/vault/');
  const encryptedBlob = response.data.vault_blob;
  
  if (!encryptedBlob) {
    return createEmptyVault();
  }
  
  return await decryptVault(encryptedBlob, masterKey);
}

/**
 * Encrypt vault locally and save to server.
 */
export async function saveVault(vaultData: VaultData, masterKey: CryptoKey): Promise<void> {
  const encryptedBlob = await encryptVault(vaultData, masterKey);
  await apiClient.put('/vault/', { vault_blob: encryptedBlob });
}

/**
 * Export vault data (returns encrypted blob for download).
 */
export async function exportVault(): Promise<string> {
  const response = await apiClient.get('/vault/export/');
  return response.data.vault_blob;
}

/**
 * Import vault data.
 */
export async function importVault(encryptedBlob: string): Promise<void> {
  await apiClient.post('/vault/import/', { vault_blob: encryptedBlob });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Category Operations
// ═══════════════════════════════════════════════════════════════════════════════

export async function getCategories(): Promise<Category[]> {
  const response = await apiClient.get('/categories/');
  return response.data;
}

export async function createCategory(name: string, icon?: string): Promise<Category> {
  const response = await apiClient.post('/categories/', { name, icon });
  return response.data;
}

export async function updateCategory(id: number, data: Partial<Category>): Promise<Category> {
  const response = await apiClient.put(`/categories/${id}/`, data);
  return response.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/categories/${id}/`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Organization Operations
// ═══════════════════════════════════════════════════════════════════════════════

export async function getOrganizations(categoryId: number): Promise<Organization[]> {
  const response = await apiClient.get(`/categories/${categoryId}/organizations/`);
  return response.data;
}

export async function createOrganization(
  categoryId: number, 
  data: Partial<Organization>
): Promise<Organization> {
  const response = await apiClient.post(`/categories/${categoryId}/organizations/`, data);
  return response.data;
}

export async function updateOrganization(
  id: number, 
  data: Partial<Organization>
): Promise<Organization> {
  const response = await apiClient.put(`/organizations/${id}/`, data);
  return response.data;
}

export async function deleteOrganization(id: number): Promise<void> {
  await apiClient.delete(`/organizations/${id}/`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Profile Operations
// ═══════════════════════════════════════════════════════════════════════════════

export async function getProfiles(organizationId: number): Promise<Profile[]> {
  const response = await apiClient.get(`/organizations/${organizationId}/profiles/`);
  return response.data;
}

export async function createProfile(
  organizationId: number, 
  data: Partial<Profile>
): Promise<Profile> {
  const response = await apiClient.post(`/organizations/${organizationId}/profiles/`, data);
  return response.data;
}

export async function updateProfile(id: number, data: Partial<Profile>): Promise<Profile> {
  const response = await apiClient.put(`/profiles/${id}/`, data);
  return response.data;
}

export async function deleteProfile(id: number): Promise<void> {
  await apiClient.delete(`/profiles/${id}/`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Trash / Recycle Bin Operations
// ═══════════════════════════════════════════════════════════════════════════════

export interface TrashProfile extends Profile {
  deleted_at: string;
  days_remaining: number;
}

/**
 * Get all profiles in trash.
 */
export async function getTrashProfiles(): Promise<TrashProfile[]> {
  const response = await apiClient.get('/profiles/trash/');
  return response.data;
}

/**
 * Restore a profile from trash.
 */
export async function restoreProfile(id: number): Promise<void> {
  await apiClient.post(`/profiles/${id}/restore/`);
}

/**
 * Permanently delete a profile with crypto-shredding.
 * This action cannot be undone - all encrypted data is destroyed.
 */
export async function shredProfile(id: number): Promise<void> {
  await apiClient.delete(`/profiles/${id}/shred/`, {
    data: { confirm: 'PERMANENTLY_DELETE' }
  });
}
