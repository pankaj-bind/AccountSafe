// src/features/vault/types/index.ts
/**
 * Vault Types
 * 
 * Note: VaultData for encryption is defined in cryptoService.ts
 * These types are for the Django REST API responses.
 */

export interface Category {
  id: number;
  name: string;
  icon?: string;
  organizations?: Organization[];
  created_at?: string;
  updated_at?: string;
}

export interface Organization {
  id: number;
  category: number;
  name: string;
  logo_url?: string;
  website_link?: string;
  profiles?: Profile[];
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: number;
  organization: number;
  title: string;
  _username?: string;  // Encrypted
  _email?: string;     // Encrypted
  _password?: string;  // Encrypted
  _notes?: string;     // Encrypted
  password_strength?: number;
  password_hash?: string;
  is_breached?: boolean;
  last_breach_check_date?: string;
  last_password_update?: string;
  documents?: ProfileDocument[];
  created_at?: string;
  updated_at?: string;
}

export interface ProfileDocument {
  id: number;
  name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

// Re-export VaultData from cryptoService for consistency
export type { VaultData, VaultEntry } from '../../../services/cryptoService';

export interface VaultState {
  isUnlocked: boolean;
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}
