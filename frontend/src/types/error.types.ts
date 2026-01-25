// src/types/error.types.ts
/**
 * Type-safe error handling utilities
 * 
 * This module provides types and utilities for handling errors
 * without using `any` type, maintaining strict type safety.
 */

import { AxiosError, AxiosResponse } from 'axios';

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Standard API error response from the backend
 */
export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  error?: string;
  non_field_errors?: string[];
  [key: string]: unknown;
}

/**
 * Type guard to check if an error is an AxiosError
 */
export function isAxiosError<T = ApiErrorResponse>(
  error: unknown
): error is AxiosError<T> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

/**
 * Type guard to check if value is an Error object
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard to check if error has a response property (Axios-like)
 */
export function hasResponse(
  error: unknown
): error is { response: AxiosResponse<ApiErrorResponse> } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as Record<string, unknown>).response === 'object'
  );
}

/**
 * Type guard to check if error has a message property
 */
export function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR EXTRACTION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract a human-readable error message from any error type
 * 
 * @param error - The caught error (unknown type)
 * @param fallback - Fallback message if extraction fails
 * @returns A user-friendly error message string
 */
export function getErrorMessage(
  error: unknown,
  fallback: string = 'An unexpected error occurred'
): string {
  // Handle Axios errors
  if (isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;
    
    if (data) {
      // Check various error response formats
      if (typeof data.detail === 'string') return data.detail;
      if (typeof data.message === 'string') return data.message;
      if (typeof data.error === 'string') return data.error;
      if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
        return data.non_field_errors[0];
      }
    }
    
    // Fallback to error message
    if (error.message) return error.message;
  }
  
  // Handle standard Error objects
  if (isError(error)) {
    return error.message;
  }
  
  // Handle objects with message property
  if (hasMessage(error)) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  return fallback;
}

/**
 * Get HTTP status code from error
 * 
 * @param error - The caught error
 * @returns HTTP status code or undefined
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (isAxiosError(error)) {
    return error.response?.status;
  }
  
  if (hasResponse(error)) {
    return error.response.status;
  }
  
  return undefined;
}

/**
 * Check if error is a network/connectivity error
 */
export function isNetworkError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return !error.response && error.code === 'ERR_NETWORK';
  }
  return false;
}

/**
 * Check if error is an authentication error (401)
 */
export function isAuthError(error: unknown): boolean {
  return getErrorStatus(error) === 401;
}

/**
 * Check if error is a forbidden error (403)
 */
export function isForbiddenError(error: unknown): boolean {
  return getErrorStatus(error) === 403;
}

/**
 * Check if error is a not found error (404)
 */
export function isNotFoundError(error: unknown): boolean {
  return getErrorStatus(error) === 404;
}

/**
 * Check if error is a validation error (400)
 */
export function isValidationError(error: unknown): boolean {
  return getErrorStatus(error) === 400;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPED CATCH HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Type-safe error handler for try-catch blocks
 * 
 * Usage:
 * ```typescript
 * try {
 *   await someAsyncOperation();
 * } catch (error) {
 *   const message = handleCatchError(error, 'Operation failed');
 *   setError(message);
 * }
 * ```
 */
export function handleCatchError(
  error: unknown,
  context?: string
): string {
  const message = getErrorMessage(error);
  
  if (context) {
    console.error(`[${context}]`, error);
  }
  
  return message;
}
