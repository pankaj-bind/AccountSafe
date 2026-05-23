// src/setupVitest.ts
/**
 * Vitest Test Setup for AccountSafe Frontend service tests
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This file prepares the browser-like test environment for the vault
 * serialization tests by wiring in the native Web Crypto API and text codecs.
 */

// @ts-ignore - Node.js crypto module
import { webcrypto } from 'crypto';

// @ts-ignore - Node.js util module
import { TextEncoder, TextDecoder } from 'util';

Object.defineProperty(globalThis, 'crypto', {
  value: webcrypto,
  writable: true,
  configurable: true,
});

if (typeof globalThis.TextEncoder === 'undefined') {
  (globalThis as { TextEncoder: typeof TextEncoder }).TextEncoder = TextEncoder;
}

if (typeof globalThis.TextDecoder === 'undefined') {
  (globalThis as { TextDecoder: typeof TextDecoder }).TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}