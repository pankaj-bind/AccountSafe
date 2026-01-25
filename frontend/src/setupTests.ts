// src/setupTests.ts
/**
 * Jest Test Setup for AccountSafe Frontend
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This file runs before every test file and sets up:
 * 1. @testing-library/jest-dom matchers
 * 2. Web Crypto API polyfill for Node.js environment
 * 3. TextEncoder/TextDecoder polyfills
 */

import '@testing-library/jest-dom';

// ═══════════════════════════════════════════════════════════════════════════════
// Web Crypto API Polyfill
// ═══════════════════════════════════════════════════════════════════════════════
// Jest runs in Node.js which doesn't have window.crypto by default.
// We need to polyfill it for encryption tests.

// @ts-ignore - Node.js crypto module
import { webcrypto } from 'crypto';

// Polyfill globalThis.crypto for Node.js environment
if (typeof globalThis.crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: false,
    configurable: false
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TextEncoder/TextDecoder Polyfill
// ═══════════════════════════════════════════════════════════════════════════════

// @ts-ignore - Node.js util module
import { TextEncoder, TextDecoder } from 'util';

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}

if (typeof globalThis.TextDecoder === 'undefined') {
  // @ts-ignore
  globalThis.TextDecoder = TextDecoder;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mock ResizeObserver (needed for some components)
// ═══════════════════════════════════════════════════════════════════════════════

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ═══════════════════════════════════════════════════════════════════════════════
// Mock matchMedia (needed for responsive components)
// ═══════════════════════════════════════════════════════════════════════════════

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ═══════════════════════════════════════════════════════════════════════════════
// Suppress console.error for expected test errors
// ═══════════════════════════════════════════════════════════════════════════════

const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Suppress React act() warnings in tests
    if (typeof args[0] === 'string' && args[0].includes('act(')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
