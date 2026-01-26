// src/features/security/services/securityService.ts
/**
 * Security Service
 * 
 * Handles security features: health score, sessions, PIN management, duress mode.
 */

import apiClient from '../../../api/apiClient';
import type { 
  HealthScore, 
  LoginRecord, 
  UserSession, 
  SecuritySettings 
} from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// Health Score
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get security health score for user's vault.
 */
export async function getHealthScore(): Promise<HealthScore> {
  const response = await apiClient.get('/security/health-score/');
  return response.data;
}

/**
 * Update password strength for a profile.
 */
export async function updatePasswordStrength(profileId: number, strengthScore: number): Promise<void> {
  await apiClient.post(`/security/profiles/${profileId}/strength/`, {
    strength_score: strengthScore
  });
}

/**
 * Update breach status for a profile.
 */
export async function updateBreachStatus(profileId: number, isBreached: boolean): Promise<void> {
  await apiClient.post(`/security/profiles/${profileId}/breach/`, {
    is_breached: isBreached
  });
}

/**
 * Update password hash for uniqueness checking.
 */
export async function updatePasswordHash(profileId: number, passwordHash: string): Promise<void> {
  await apiClient.post(`/security/profiles/${profileId}/hash/`, {
    password_hash: passwordHash
  });
}

/**
 * Batch update security metrics for multiple profiles.
 */
export async function batchUpdateSecurityMetrics(
  updates: Array<{
    profile_id: number;
    strength_score?: number;
    is_breached?: boolean;
  }>
): Promise<void> {
  await apiClient.post('/security/batch-update/', { updates });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Login Records
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get login records for the authenticated user.
 */
export async function getLoginRecords(limit: number = 50): Promise<LoginRecord[]> {
  const response = await apiClient.get(`/login-records/?limit=${limit}`);
  return response.data.records;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Session Management
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all active sessions for the current user.
 */
export async function getActiveSessions(): Promise<UserSession[]> {
  const response = await apiClient.get('/sessions/');
  return response.data;
}

/**
 * Validate current session is still active.
 */
export async function validateSession(): Promise<boolean> {
  try {
    await apiClient.get('/sessions/validate/');
    return true;
  } catch {
    return false;
  }
}

/**
 * Revoke a specific session.
 */
export async function revokeSession(sessionId: number): Promise<void> {
  await apiClient.post(`/sessions/${sessionId}/revoke/`);
}

/**
 * Revoke all sessions except the current one.
 */
export async function revokeAllSessions(): Promise<number> {
  const response = await apiClient.post('/sessions/revoke-all/');
  return response.data.revoked_count;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Security Settings (Panic, Duress)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get current security settings.
 */
export async function getSecuritySettings(): Promise<SecuritySettings> {
  const response = await apiClient.get('/security/settings/');
  return response.data;
}

/**
 * Set panic button shortcut.
 */
export async function setPanicShortcut(shortcut: string[]): Promise<void> {
  await apiClient.post('/security/settings/', {
    action: 'set_panic_shortcut',
    shortcut
  });
}

/**
 * Clear panic button shortcut.
 */
export async function clearPanicShortcut(): Promise<void> {
  await apiClient.post('/security/settings/', {
    action: 'clear_panic_shortcut'
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PIN Management
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if user has PIN setup.
 */
export async function getPinStatus(): Promise<{ has_pin: boolean }> {
  const response = await apiClient.get('/pin/status/');
  return response.data;
}

/**
 * Setup security PIN.
 */
export async function setupPin(pin: string): Promise<void> {
  await apiClient.post('/pin/setup/', { pin });
}

/**
 * Verify security PIN.
 */
export async function verifyPin(pin: string): Promise<boolean> {
  try {
    await apiClient.post('/pin/verify/', { pin });
    return true;
  } catch {
    return false;
  }
}

/**
 * Reset security PIN.
 */
export async function resetPin(currentPassword: string, newPin: string): Promise<void> {
  await apiClient.post('/pin/reset/', { password: currentPassword, new_pin: newPin });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Canary Traps (Honeytokens)
// ═══════════════════════════════════════════════════════════════════════════════

import type { 
  CanaryTrap, 
  CanaryTrapsResponse, 
  CanaryTrapDetailResponse,
  CanaryTrapCreateRequest 
} from '../types';

/**
 * Get all canary traps for the authenticated user.
 */
export async function getCanaryTraps(): Promise<CanaryTrapsResponse> {
  const response = await apiClient.get('/security/traps/');
  return response.data;
}

/**
 * Create a new canary trap.
 */
export async function createCanaryTrap(data: CanaryTrapCreateRequest): Promise<CanaryTrap> {
  const response = await apiClient.post('/security/traps/', data);
  return response.data;
}

/**
 * Get a specific canary trap with its trigger history.
 */
export async function getCanaryTrapDetail(trapId: number): Promise<CanaryTrapDetailResponse> {
  const response = await apiClient.get(`/security/traps/${trapId}/`);
  return response.data;
}

/**
 * Update a canary trap.
 */
export async function updateCanaryTrap(
  trapId: number, 
  data: Partial<Pick<CanaryTrap, 'label' | 'description' | 'is_active'>>
): Promise<CanaryTrap> {
  const response = await apiClient.patch(`/security/traps/${trapId}/`, data);
  return response.data;
}

/**
 * Delete a canary trap.
 */
export async function deleteCanaryTrap(trapId: number): Promise<void> {
  await apiClient.delete(`/security/traps/${trapId}/`);
}
