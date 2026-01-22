// src/features/security/types/index.ts
/**
 * Security Types
 */

export interface HealthScore {
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

export interface LoginRecord {
  id: number;
  username_attempted: string;
  status: 'success' | 'failed' | 'duress';
  is_duress: boolean;
  ip_address: string;
  country: string;
  isp: string;
  latitude?: number;
  longitude?: number;
  date: string;
  time: string;
  location?: string;
  user_agent: string;
  timestamp: string;
  timezone?: string;
}

export interface UserSession {
  id: number;
  device_type: string;
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

export interface SecuritySettings {
  panic_shortcut: string[];
  has_duress_password: boolean;
  sos_email: string;
}

export interface PinStatus {
  has_pin: boolean;
}
