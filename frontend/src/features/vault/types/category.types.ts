// src/features/vault/types/category.types.ts
/**
 * Type definitions for Category and Organization domain objects.
 * 
 * These types match the Django REST API response structures.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Core Domain Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface Organization {
  id: number;
  name: string;
  logo_url: string | null;
  logo_image: string | null;
  website_link?: string | null;
  profile_count: number;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  organizations: Organization[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Digital Wallet Document Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface DocumentType {
  id: string;
  label: string;
  category: string;
  icon: string;
}

/**
 * Predefined Digital Wallet document types with their associated icons.
 * These match files in /public/logo/
 */
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

// ═══════════════════════════════════════════════════════════════════════════════
// Form Data Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface CategoryFormData {
  name: string;
  description: string;
}

export interface OrganizationFormData {
  name: string;
  logo_url: string;
  website_link: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI State Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface CategoryStats {
  totalCategories: number;
  totalOrganizations: number;
  totalCredentials: number;
}

/**
 * Helper function to find a Digital Wallet document by label.
 * Used for displaying the correct icon.
 */
export const findDigitalWalletDocument = (label: string): DocumentType | undefined => {
  return DIGITAL_WALLET_DOCUMENTS.find(d => d.label === label);
};

/**
 * Check if a category is the Digital Wallet category.
 */
export const isDigitalWalletCategory = (categoryName: string): boolean => {
  return categoryName.toLowerCase() === 'digital wallet';
};
