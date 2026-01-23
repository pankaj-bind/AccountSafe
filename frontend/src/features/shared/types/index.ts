// src/features/shared/types/index.ts
/**
 * Shared Types
 * 
 * Common types used across multiple features.
 */

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
}
