// src/features/vault/types/profile.types.ts
/**
 * Profile Types for Zero-Knowledge Vault
 * 
 * These types support client-side encryption where server never sees plaintext.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Core Profile Types
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Organization that holds profiles
 */
export interface Organization {
  id: number;
  category: number;
  name: string;
  logo_url: string | null;
  logo_image: string | null;
  website_link?: string | null;
}

/**
 * Encrypted profile from server (raw API response)
 */
export interface EncryptedProfile {
  id: number;
  title: string;
  organization: number;
  // Encrypted field pairs
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
  // Non-encrypted fields
  document?: string | null;
  document_url?: string | null;
  created_at: string;
  // Security tracking
  is_breached?: boolean;
  last_breach_check_date?: string | null;
  password_strength?: number | null;
  password_hash?: string | null;
  last_password_update?: string | null;
  // User preferences
  is_pinned?: boolean;
}

/**
 * Decrypted profile for UI consumption
 */
export interface Profile {
  id: number;
  title: string;
  organization: number;
  // Decrypted fields
  username: string | null;
  password: string | null;
  email: string | null;
  notes: string | null;
  recovery_codes: string | null;
  // Non-encrypted fields
  document: string | null;
  document_url: string | null;
  created_at: string;
  // Security tracking
  is_breached?: boolean;
  last_breach_check_date?: string | null;
  password_strength?: number | null;
  password_hash?: string | null;
  last_password_update?: string | null;
  // User preferences
  is_pinned?: boolean;
  // Keep encrypted fields for sharing/re-encryption
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
}

// ═══════════════════════════════════════════════════════════════════════════════
// Form Data Types
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Form data for creating/editing a profile
 */
export interface ProfileFormData {
  title: string;
  username: string;
  password: string;
  email: string;
  recovery_codes: string;
  notes: string;
}

/**
 * Credit card specific form data
 */
export interface CreditCardFormData {
  bankName: string;
  cardNetwork: string;
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
  design: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API Request/Response Types
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Encrypted fields ready for API transmission
 */
export interface EncryptedFields {
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
}

/**
 * Profile creation/update request payload
 */
export interface ProfilePayload extends EncryptedFields {
  title?: string;
  document?: File;
  is_pinned?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Share Types
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Data to be encrypted for one-time sharing
 */
export interface ShareData {
  title: string;
  organization: string;
  username?: string;
  password?: string;
  email?: string;
  notes?: string;
  recovery_codes?: string;
}

/**
 * Share link creation response
 */
export interface ShareLinkResponse {
  success: boolean;
  share_url: string;
  expires_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Hook State Types
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Visibility toggles for sensitive fields
 */
export interface FieldVisibility {
  [profileId: number]: boolean;
}

/**
 * Recovery codes parsed per profile
 */
export interface RecoveryCodesMap {
  [profileId: number]: string[];
}

/**
 * Expanded card state
 */
export interface ExpandedState {
  [profileId: number]: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Digital Wallet Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface DocumentType {
  id: string;
  label: string;
  category: string;
  icon: string;
}

export const DIGITAL_WALLET_DOCUMENTS: DocumentType[] = [
  { id: "passport", label: "Passport", category: "Identity", icon: "/logo/passport.png" },
  { id: "driving_license", label: "Driving License", category: "Identity", icon: "/logo/driving license.png" },
  { id: "pan_card", label: "PAN Card", category: "Identity", icon: "/logo/pan card.png" },
  { id: "bank_card", label: "Credit / Debit Card", category: "Finance", icon: "/logo/credit card.png" },
  { id: "travel_card", label: "Travel / Forex Card", category: "Finance", icon: "/logo/travel-card.png" },
  { id: "employee_id", label: "Work ID / Corporate", category: "Professional", icon: "/logo/work id.png" },
  { id: "student_id", label: "Student ID (ISIC)", category: "Education", icon: "/logo/student id.png" },
  { id: "health_insurance", label: "Health Insurance", category: "Health", icon: "/logo/health insurance.png" },
  { id: "vaccine_cert", label: "Vaccination Cert", category: "Health", icon: "/logo/vaccination certificate.png" },
  { id: "membership", label: "Membership / Loyalty", category: "Lifestyle", icon: "/logo/membership card.png" }
];
