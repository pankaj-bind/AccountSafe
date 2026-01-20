// src/services/sessionService.ts

import apiClient from '../api/apiClient';

export interface UserSession {
  id: number;
  device_type: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  location: string;
  country_code: string;
  ip_address: string;
  created_at: string;
  last_active: string;
  last_active_display: string;
  is_current: boolean;
  is_active: boolean;
}

/**
 * Get all active sessions for the current user
 */
export const getActiveSessions = async (): Promise<UserSession[]> => {
  const response = await apiClient.get('/sessions/');
  return response.data;
};

/**
 * Revoke a specific session
 */
export const revokeSession = async (sessionId: number): Promise<{ message: string }> => {
  const response = await apiClient.post(`/sessions/${sessionId}/revoke/`);
  return response.data;
};

/**
 * Revoke all sessions except the current one
 */
export const revokeAllSessions = async (): Promise<{ message: string; revoked_count: number }> => {
  const response = await apiClient.post('/sessions/revoke-all/');
  return response.data;
};
