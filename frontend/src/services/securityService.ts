/**
 * Security Service
 * 
 * Handles security-related operations including:
 * - Health score calculation
 * - Password strength assessment (zxcvbn)
 * - HIBP breach checking using k-Anonymity
 * - Batch updates of security metrics
 */

import apiClient from '../api/apiClient';

export interface SecurityHealthScore {
  overall_score: number;
  total_passwords: number;
  strength_score: number;
  uniqueness_score: number;
  integrity_score: number;
  hygiene_score: number;
  breakdown: {
    weak_passwords: number;
    reused_passwords: number;
    breached_passwords: number;
    outdated_passwords: number;
  };
}

export interface PasswordSecurityMetrics {
  profile_id: number;
  strength_score?: number;  // 0-4 from zxcvbn
  is_breached?: boolean;
  breach_count?: number;
}

/**
 * Fetch the current security health score for the user's vault
 */
export const fetchHealthScore = async (): Promise<SecurityHealthScore> => {
  const response = await apiClient.get('/security/health-score/');
  return response.data;
};

/**
 * Update password strength score for a single profile
 */
export const updatePasswordStrength = async (
  profileId: number,
  strengthScore: number
): Promise<void> => {
  await apiClient.post(`/security/profiles/${profileId}/strength/`, {
    strength_score: strengthScore
  });
};

/**
 * Update breach status for a single profile
 */
export const updateBreachStatus = async (
  profileId: number,
  isBreached: boolean,
  breachCount: number = 0
): Promise<void> => {
  await apiClient.post(`/security/profiles/${profileId}/breach/`, {
    is_breached: isBreached,
    breach_count: breachCount
  });
};

/**
 * Update password hash for uniqueness checking
 */
export const updatePasswordHash = async (
  profileId: number,
  password: string
): Promise<void> => {
  // Calculate SHA-256 hash of password
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  await apiClient.post(`/security/profiles/${profileId}/hash/`, {
    password_hash: hashHex
  });
};

/**
 * Batch update security metrics for multiple profiles
 * More efficient than individual updates
 */
export const batchUpdateSecurityMetrics = async (
  updates: PasswordSecurityMetrics[]
): Promise<void> => {
  await apiClient.post('/security/batch-update/', {
    updates
  });
};

/**
 * Convert string to SHA-1 hash
 */
async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.toUpperCase();
}

/**
 * Check if a password has been breached using HIBP k-Anonymity API
 * 
 * This sends only the first 5 characters of the SHA-1 hash to the API,
 * protecting privacy while checking for breaches.
 * 
 * @param password - The plaintext password to check
 * @returns Promise with breach status and count
 */
export const checkPasswordBreach = async (
  password: string
): Promise<{ isBreached: boolean; breachCount: number }> => {
  if (!password) {
    return { isBreached: false, breachCount: 0 };
  }

  try {
    // Generate SHA-1 hash of the password
    const sha1Hash = await sha1(password);
    const prefix = sha1Hash.substring(0, 5);
    const suffix = sha1Hash.substring(5);

    // Query HIBP API with first 5 characters
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'User-Agent': 'AccountSafe-SecurityChecker'
      }
    });

    if (!response.ok) {
      // If API fails, assume not breached to be safe
      console.error('HIBP API error:', response.statusText);
      return { isBreached: false, breachCount: 0 };
    }

    const text = await response.text();
    const hashes = text.split('\n');

    // Check if our hash suffix is in the results
    for (const line of hashes) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return {
          isBreached: true,
          breachCount: parseInt(count.trim(), 10)
        };
      }
    }

    return { isBreached: false, breachCount: 0 };
  } catch (error) {
    console.error('Error checking password breach:', error);
    // On error, assume not breached
    return { isBreached: false, breachCount: 0 };
  }
};

/**
 * Calculate password strength using zxcvbn
 * Note: zxcvbn should be imported separately in components that use this
 * 
 * @param password - The password to evaluate
 * @returns Strength score from 0-4
 */
export const getPasswordStrengthScore = (password: string): number => {
  // This is a placeholder - actual implementation should use zxcvbn library
  // Import zxcvbn in the component: import zxcvbn from 'zxcvbn';
  // Then call: zxcvbn(password).score
  
  // For now, return a basic estimate
  if (!password) return 0;
  if (password.length < 8) return 0;
  if (password.length < 12) return 1;
  
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  
  const variety = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  
  if (variety <= 2) return 1;
  if (variety === 3) return 2;
  if (password.length >= 16 && variety === 4) return 4;
  return 3;
};
