// src/features/auth/types/index.ts
/**
 * Auth Types
 */

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
  turnstileToken?: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password1: string;
  password2: string;
  turnstileToken?: string;
}

export interface AuthTokenResponse {
  key: string;
  user?: User;
  salt?: string;
  is_duress?: boolean;
}
