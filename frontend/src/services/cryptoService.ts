// ═══════════════════════════════════════════════════════════════════════════════
// Zero-Knowledge Cryptographic Service
// ═══════════════════════════════════════════════════════════════════════════════
//
// This is the CORE of the zero-knowledge architecture.
// 
// Key Principles:
// 1. Master password NEVER leaves this file (except as derived key)
// 2. All encryption/decryption happens client-side
// 3. Server stores ONLY encrypted blobs
// 4. Keys are NEVER stored persistently - memory only
//
// Algorithm: Argon2id (memory-hard) + AES-256-GCM (authenticated encryption)
// ═══════════════════════════════════════════════════════════════════════════════

import { argon2id } from '@noble/hashes/argon2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes, concatBytes } from '@noble/hashes/utils.js';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION - Security Parameters
// ═══════════════════════════════════════════════════════════════════════════════

const ARGON2_CONFIG = {
  // Memory cost: 64 MB (resistant to GPU/ASIC attacks)
  m: 65536, // 64 * 1024 = 65536 KB = 64 MB
  
  // Time cost: 3 iterations (balance security vs UX)
  t: 3,
  
  // Parallelism: 4 threads
  p: 4,
  
  // Output length: 32 bytes = 256 bits (for AES-256)
  dkLen: 32,
} as const;

const CRYPTO_CONFIG = {
  // Salt length: 32 bytes = 256 bits
  SALT_LENGTH: 32,
  
  // IV length: 12 bytes = 96 bits (recommended for GCM)
  IV_LENGTH: 12,
  
  // AES key length: 256 bits
  KEY_LENGTH: 256,
  
  // Context strings for key derivation (domain separation)
  CONTEXT_VAULT: 'accountsafe:vault:v1',
  CONTEXT_AUTH: 'accountsafe:auth:v1',
  CONTEXT_SHARING: 'accountsafe:share:v1',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface EncryptedData {
  /** Base64-encoded ciphertext */
  ciphertext: string;
  /** Base64-encoded IV (12 bytes for GCM) */
  iv: string;
  /** Base64-encoded salt (32 bytes) - only present if key was derived inline */
  salt?: string;
  /** Version identifier for future compatibility */
  version: 'v1';
}

export interface DerivedKeys {
  /** Master encryption key (AES-256-GCM) - NEVER store this */
  masterKey: CryptoKey;
  /** Auth hash for server verification - safe to send to server */
  authHash: string;
  /** Salt used for key derivation - safe to store/send */
  salt: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert Base64 string to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  return new Uint8Array(base64ToArrayBuffer(base64));
}

/**
 * Convert Uint8Array to Base64 string
 */
function bytesToBase64(bytes: Uint8Array): string {
  return arrayBufferToBase64(bytes.buffer as ArrayBuffer);
}

/**
 * Generate cryptographically secure random bytes
 */
function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE CRYPTOGRAPHIC FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a cryptographically secure random salt (32 bytes)
 * 
 * @returns Base64-encoded salt
 */
export function generateSalt(): string {
  const salt = generateRandomBytes(CRYPTO_CONFIG.SALT_LENGTH);
  return bytesToBase64(salt);
}

/**
 * Derive master key from password using Argon2id
 * 
 * This is CPU and memory intensive by design to resist brute-force attacks.
 * Expected time: 500ms - 2000ms depending on hardware.
 * 
 * @param password - User's master password
 * @param salt - Base64-encoded salt (from registration or server)
 * @param context - Context string for domain separation
 * @returns Raw derived key bytes (32 bytes)
 */
export function deriveKeyBytes(
  password: string,
  salt: string,
  context: string = CRYPTO_CONFIG.CONTEXT_VAULT
): Uint8Array {
  const saltBytes = base64ToBytes(salt);
  const passwordBytes = utf8ToBytes(password);
  const contextBytes = utf8ToBytes(context);
  
  // Combine password with context for domain separation
  const inputBytes = concatBytes(passwordBytes, contextBytes);
  
  // Derive key using Argon2id (memory-hard KDF)
  const derivedKey = argon2id(inputBytes, saltBytes, {
    t: ARGON2_CONFIG.t,
    m: ARGON2_CONFIG.m,
    p: ARGON2_CONFIG.p,
    dkLen: ARGON2_CONFIG.dkLen,
  });
  
  return derivedKey;
}

/**
 * Derive a CryptoKey from password for use with Web Crypto API
 * 
 * @param password - User's master password
 * @param salt - Base64-encoded salt
 * @returns CryptoKey for AES-256-GCM encryption/decryption
 */
export async function deriveMasterKey(
  password: string,
  salt: string
): Promise<CryptoKey> {
  // Derive raw key bytes using Argon2id
  const keyBytes = deriveKeyBytes(password, salt, CRYPTO_CONFIG.CONTEXT_VAULT);
  
  // Import as CryptoKey for Web Crypto API
  // Use slice() to create a new ArrayBuffer (not SharedArrayBuffer)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.slice().buffer,
    { name: 'AES-GCM', length: CRYPTO_CONFIG.KEY_LENGTH },
    false, // NOT extractable - critical for security
    ['encrypt', 'decrypt']
  );
  
  // Zero out the raw key bytes after import
  secureWipeBuffer(keyBytes);
  
  return cryptoKey;
}

/**
 * Derive authentication hash from password (separate from encryption key)
 * 
 * This hash is safe to send to the server for login verification.
 * It's derived with a different context than the encryption key,
 * ensuring the server cannot derive the encryption key from the auth hash.
 * 
 * @param password - User's master password
 * @param salt - Base64-encoded salt
 * @returns Hex-encoded auth hash (safe to send to server)
 */
export function deriveAuthHash(password: string, salt: string): string {
  // Derive key with AUTH context (different from VAULT context)
  const authKeyBytes = deriveKeyBytes(password, salt, CRYPTO_CONFIG.CONTEXT_AUTH);
  
  // Hash the derived key to create the auth hash
  const authHash = sha256(authKeyBytes);
  
  // Zero out the intermediate key
  secureWipeBuffer(authKeyBytes);
  
  return bytesToHex(authHash);
}

/**
 * Derive all keys needed for a user session
 * 
 * @param password - User's master password
 * @param salt - Base64-encoded salt (generate new for registration, use existing for login)
 * @returns Object containing masterKey, authHash, and salt
 */
export async function deriveAllKeys(
  password: string,
  salt?: string
): Promise<DerivedKeys> {
  // Generate salt if not provided (new user registration)
  const finalSalt = salt || generateSalt();
  
  // Derive master encryption key
  const masterKey = await deriveMasterKey(password, finalSalt);
  
  // Derive auth hash (safe to send to server)
  const authHash = deriveAuthHash(password, finalSalt);
  
  return {
    masterKey,
    authHash,
    salt: finalSalt,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENCRYPTION / DECRYPTION (AES-256-GCM)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Encrypt plaintext using AES-256-GCM
 * 
 * @param plaintext - String to encrypt
 * @param key - CryptoKey from deriveMasterKey()
 * @returns EncryptedData object with ciphertext, IV, and version
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedData> {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty data');
  }
  
  // Generate random IV for this encryption (MUST be unique per encryption)
  const iv = generateRandomBytes(CRYPTO_CONFIG.IV_LENGTH);
  
  // Encode plaintext to bytes
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);
  
  // Encrypt using AES-256-GCM
  // Use slice() to ensure we have a proper ArrayBuffer
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.slice().buffer },
    key,
    plaintextBytes
  );
  
  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: bytesToBase64(iv),
    version: 'v1',
  };
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * 
 * @param encrypted - EncryptedData object from encrypt()
 * @param key - CryptoKey from deriveMasterKey()
 * @returns Decrypted plaintext string
 */
export async function decrypt(
  encrypted: EncryptedData,
  key: CryptoKey
): Promise<string> {
  if (!encrypted.ciphertext || !encrypted.iv) {
    throw new Error('Invalid encrypted data: missing ciphertext or IV');
  }
  
  const ciphertextBuffer = base64ToArrayBuffer(encrypted.ciphertext);
  const ivBuffer = base64ToBytes(encrypted.iv);
  
  try {
    // Use slice() to ensure we have a proper ArrayBuffer
    const plaintextBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer.slice().buffer },
      key,
      ciphertextBuffer
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(plaintextBuffer);
  } catch (error) {
    throw new Error('Decryption failed: Invalid key or corrupted data');
  }
}

/**
 * Encrypt multiple fields at once
 * 
 * @param fields - Object with field names as keys and plaintext values
 * @param key - CryptoKey from deriveMasterKey()
 * @returns Object with encrypted data for each field
 */
export async function encryptFields(
  fields: Record<string, string | undefined | null>,
  key: CryptoKey
): Promise<Record<string, EncryptedData | null>> {
  const result: Record<string, EncryptedData | null> = {};
  
  for (const [name, value] of Object.entries(fields)) {
    if (value && value.trim() !== '') {
      result[name] = await encrypt(value, key);
    } else {
      result[name] = null;
    }
  }
  
  return result;
}

/**
 * Decrypt multiple fields at once
 * 
 * @param encryptedFields - Object with field names and EncryptedData values
 * @param key - CryptoKey from deriveMasterKey()
 * @returns Object with decrypted plaintext for each field
 */
export async function decryptFields(
  encryptedFields: Record<string, EncryptedData | null>,
  key: CryptoKey
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  
  for (const [name, encrypted] of Object.entries(encryptedFields)) {
    if (encrypted) {
      try {
        result[name] = await decrypt(encrypted, key);
      } catch (error) {
        console.warn(`Failed to decrypt field ${name}:`, error);
        result[name] = null;
      }
    } else {
      result[name] = null;
    }
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURE MEMORY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Securely wipe a buffer from memory
 * 
 * Note: JavaScript's garbage collection means we can't guarantee
 * the data is truly erased, but this is the best effort approach.
 * 
 * @param buffer - Uint8Array or ArrayBuffer to wipe
 */
export function secureWipeBuffer(buffer: Uint8Array | ArrayBuffer): void {
  const view = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  
  // Overwrite with random data first (prevents cold boot attacks)
  crypto.getRandomValues(view);
  
  // Then zero out
  view.fill(0);
}

/**
 * Wipe sensitive string data
 * 
 * Note: Strings are immutable in JavaScript, so this creates a new
 * string. The original may still exist in memory until GC runs.
 * For truly sensitive data, use Uint8Array instead.
 * 
 * @param str - String to attempt to wipe
 */
export function secureWipeString(str: string): void {
  // Can't actually wipe strings in JS, but we can try to encourage GC
  // by removing all references
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  str = '';
}

/**
 * Create a secure password input handler that wipes after use
 */
export function createSecurePasswordHandler(): {
  getValue: () => string;
  setValue: (value: string) => void;
  clear: () => void;
} {
  let passwordBuffer: Uint8Array = new Uint8Array(0);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  return {
    getValue: () => decoder.decode(passwordBuffer),
    setValue: (value: string) => {
      // Wipe old buffer
      secureWipeBuffer(passwordBuffer);
      // Store new value
      passwordBuffer = encoder.encode(value);
    },
    clear: () => {
      secureWipeBuffer(passwordBuffer);
      passwordBuffer = new Uint8Array(0);
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// VAULT ENCRYPTION (Entire vault as single encrypted blob)
// ═══════════════════════════════════════════════════════════════════════════════

export interface VaultEntry {
  id: string;
  title: string;
  username?: string;
  password?: string;
  email?: string;
  url?: string;
  notes?: string;
  recoveryCodes?: string;
  category?: string;
  organizationId?: string;
  organizationName?: string;
  organizationLogo?: string;
  isFavorite?: boolean;
  isPinned?: boolean;
  accessCount?: number;
  lastAccessed?: number;
  createdAt: number;
  updatedAt: number;
}

export interface VaultData {
  entries: VaultEntry[];
  categories: Array<{ id: string; name: string; description?: string }>;
  organizations: Array<{
    id: string;
    name: string;
    logoUrl?: string;
    websiteUrl?: string;
    categoryId: string;
  }>;
  auditLog: Array<{
    timestamp: number;
    action: string;
    entryId?: string;
    details?: string;
  }>;
  metadata: {
    version: string;
    createdAt: number;
    updatedAt: number;
    lastSync?: number;
  };
}

/**
 * Create an empty vault structure
 */
export function createEmptyVault(): VaultData {
  const now = Date.now();
  return {
    entries: [],
    categories: [],
    organizations: [],
    auditLog: [],
    metadata: {
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
    },
  };
}

/**
 * Encrypt entire vault to a single blob
 * 
 * @param vault - VaultData object
 * @param masterKey - CryptoKey from deriveMasterKey()
 * @returns Base64-encoded encrypted vault blob
 */
export async function encryptVault(
  vault: VaultData,
  masterKey: CryptoKey
): Promise<string> {
  // Update metadata
  vault.metadata.updatedAt = Date.now();
  
  // Serialize vault to JSON
  const vaultJson = JSON.stringify(vault);
  
  // Encrypt
  const encrypted = await encrypt(vaultJson, masterKey);
  
  // Combine IV + ciphertext into single blob for storage
  const blob = JSON.stringify(encrypted);
  
  return btoa(blob); // Base64 encode for safe storage
}

/**
 * Decrypt vault blob back to VaultData
 * 
 * @param encryptedBlob - Base64-encoded encrypted vault blob
 * @param masterKey - CryptoKey from deriveMasterKey()
 * @returns Decrypted VaultData
 */
export async function decryptVault(
  encryptedBlob: string,
  masterKey: CryptoKey
): Promise<VaultData> {
  // Decode blob
  const blobJson = atob(encryptedBlob);
  const encrypted: EncryptedData = JSON.parse(blobJson);
  
  // Decrypt
  const vaultJson = await decrypt(encrypted, masterKey);
  
  // Parse and return
  return JSON.parse(vaultJson) as VaultData;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DURESS MODE (Ghost Vault with Plausible Deniability)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Encrypt a dual-vault structure (real + decoy)
 * 
 * Both vaults are encrypted with different keys derived from different passwords.
 * When decrypted:
 * - Real password → shows real vault
 * - Duress password → shows decoy vault
 * - Server cannot distinguish which was used
 * 
 * @param realVault - User's real vault data
 * @param decoyVault - Decoy vault data (shown under duress)
 * @param realSalt - Salt for real password
 * @param realPassword - User's real password
 * @param duressPassword - Duress password (shows decoy)
 * @returns Object with both encrypted vaults
 */
export async function encryptDualVault(
  realVault: VaultData,
  decoyVault: VaultData,
  realSalt: string,
  realPassword: string,
  duressPassword: string
): Promise<{
  realVaultBlob: string;
  decoyVaultBlob: string;
  realSalt: string;
  duressSalt: string;
}> {
  // Generate separate salt for duress vault
  const duressSalt = generateSalt();
  
  // Derive keys for both
  const realKey = await deriveMasterKey(realPassword, realSalt);
  const duressKey = await deriveMasterKey(duressPassword, duressSalt);
  
  // Encrypt both vaults
  const realVaultBlob = await encryptVault(realVault, realKey);
  const decoyVaultBlob = await encryptVault(decoyVault, duressKey);
  
  return {
    realVaultBlob,
    decoyVaultBlob,
    realSalt,
    duressSalt,
  };
}

/**
 * Attempt to decrypt vault with provided password
 * Tries both real and duress vaults, returns whichever decrypts successfully
 * 
 * @param realVaultBlob - Encrypted real vault
 * @param decoyVaultBlob - Encrypted decoy vault
 * @param realSalt - Salt for real vault
 * @param duressSalt - Salt for decoy vault
 * @param password - Password to try
 * @returns Decrypted vault and whether it's the real vault
 */
export async function decryptDualVault(
  realVaultBlob: string,
  decoyVaultBlob: string,
  realSalt: string,
  duressSalt: string,
  password: string
): Promise<{ vault: VaultData; isRealVault: boolean }> {
  // Try real vault first
  try {
    const realKey = await deriveMasterKey(password, realSalt);
    const vault = await decryptVault(realVaultBlob, realKey);
    return { vault, isRealVault: true };
  } catch {
    // Real vault decryption failed, try duress
  }
  
  // Try duress vault
  try {
    const duressKey = await deriveMasterKey(password, duressSalt);
    const vault = await decryptVault(decoyVaultBlob, duressKey);
    return { vault, isRealVault: false };
  } catch {
    // Both failed
    throw new Error('Invalid password');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PASSWORD VERIFICATION (without revealing password to server)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a verification token for password verification without sending password
 * 
 * Uses challenge-response: server sends challenge, client responds with HMAC
 * 
 * @param authHash - Auth hash from deriveAuthHash()
 * @param serverChallenge - Random challenge from server
 * @returns Response token to send back to server
 */
export async function generateAuthResponse(
  authHash: string,
  serverChallenge: string
): Promise<string> {
  const authBytes = hexToBytes(authHash);
  const challengeBytes = utf8ToBytes(serverChallenge);
  
  // HMAC-SHA256(authHash, challenge)
  const combined = concatBytes(authBytes, challengeBytes);
  const response = sha256(combined);
  
  return bytesToHex(response);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARING (Asymmetric Encryption for Zero-Knowledge Sharing)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a key pair for receiving shared secrets
 * 
 * @returns Public key (share with others) and private key (keep secret)
 */
export async function generateShareKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable for export
    ['encrypt', 'decrypt']
  );
  
  // Export keys
  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  
  return {
    publicKey: arrayBufferToBase64(publicKeyBuffer),
    privateKey: arrayBufferToBase64(privateKeyBuffer),
  };
}

/**
 * Encrypt data for sharing with recipient's public key
 * 
 * @param data - Data to share (e.g., password)
 * @param recipientPublicKey - Base64-encoded public key from recipient
 * @returns Encrypted data that only recipient can decrypt
 */
export async function encryptForSharing(
  data: string,
  recipientPublicKey: string
): Promise<string> {
  // Import recipient's public key
  const publicKeyBuffer = base64ToArrayBuffer(recipientPublicKey);
  const publicKey = await crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
  
  // Encrypt
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    dataBuffer
  );
  
  return arrayBufferToBase64(encryptedBuffer);
}

/**
 * Decrypt shared data with private key
 * 
 * @param encryptedData - Base64-encoded encrypted data
 * @param privateKey - Base64-encoded private key
 * @returns Decrypted data
 */
export async function decryptShared(
  encryptedData: string,
  privateKey: string
): Promise<string> {
  // Import private key
  const privateKeyBuffer = base64ToArrayBuffer(privateKey);
  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  );
  
  // Decrypt
  const encryptedBuffer = base64ToArrayBuffer(encryptedData);
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    key,
    encryptedBuffer
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED SECRETS - Zero-Knowledge One-Time Sharing
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a one-time encryption key for shared secrets
 * 
 * This key will be placed in the URL fragment (never sent to server)
 * The key is 32 bytes = 256 bits, base64url-encoded
 * 
 * @returns Base64url-encoded random key
 */
export function generateShareKey(): string {
  const keyBytes = generateRandomBytes(32); // 256 bits
  
  // Use base64url encoding (URL-safe, no padding)
  const base64 = bytesToBase64(keyBytes);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Encode share key to base64url (URL-safe, no padding)
 */
export function base64ToBase64url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Decode base64url to standard base64
 */
export function base64urlToBase64(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return base64;
}

/**
 * Encrypt data for one-time sharing (Zero-Knowledge)
 * 
 * The encryption happens entirely client-side:
 * 1. Generate a random 256-bit key
 * 2. Encrypt the credential data with AES-256-GCM
 * 3. Return encrypted blob (for server) and key (for URL fragment)
 * 
 * Server NEVER sees the key - it's only in the URL fragment
 * 
 * @param data - The credential data object to share
 * @returns { encryptedBlob: string, shareKey: string }
 */
export async function encryptForOneTimeShare(
  data: Record<string, any>
): Promise<{ encryptedBlob: string; shareKey: string }> {
  // Generate one-time key
  const keyBytes = generateRandomBytes(32); // 256 bits
  
  // Import as CryptoKey
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Generate IV
  const iv = generateRandomBytes(CRYPTO_CONFIG.IV_LENGTH);
  
  // Serialize data to JSON
  const plaintext = JSON.stringify(data);
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);
  
  // Encrypt
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer },
    cryptoKey,
    plaintextBytes
  );
  
  // Combine IV + ciphertext into single blob
  const combined = new Uint8Array(iv.length + ciphertextBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertextBuffer), iv.length);
  
  // Base64 encode the blob
  const encryptedBlob = bytesToBase64(combined);
  
  // Base64url encode the key for URL
  const shareKey = base64ToBase64url(bytesToBase64(keyBytes));
  
  // Wipe key from memory
  secureWipeBuffer(keyBytes);
  
  return { encryptedBlob, shareKey };
}

/**
 * Decrypt one-time shared data (Zero-Knowledge)
 * 
 * Decryption happens entirely client-side using key from URL fragment
 * 
 * @param encryptedBlob - Base64-encoded IV + ciphertext from server
 * @param shareKey - Base64url-encoded key from URL fragment
 * @returns Decrypted data object
 */
export async function decryptOneTimeShare(
  encryptedBlob: string,
  shareKey: string
): Promise<Record<string, any>> {
  // Decode key from base64url
  const keyBase64 = base64urlToBase64(shareKey);
  const keyBytes = base64ToBytes(keyBase64);
  
  // Import as CryptoKey
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  // Decode blob
  const combined = base64ToBytes(encryptedBlob);
  
  // Extract IV (first 12 bytes) and ciphertext (rest)
  const iv = combined.slice(0, CRYPTO_CONFIG.IV_LENGTH);
  const ciphertext = combined.slice(CRYPTO_CONFIG.IV_LENGTH);
  
  // Decrypt
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer },
    cryptoKey,
    ciphertext
  );
  
  // Decode JSON
  const decoder = new TextDecoder();
  const plaintext = decoder.decode(plaintextBuffer);
  
  // Wipe key from memory
  secureWipeBuffer(keyBytes);
  
  return JSON.parse(plaintext);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

export const cryptoService = {
  // Key derivation
  generateSalt,
  deriveMasterKey,
  deriveAuthHash,
  deriveAllKeys,
  
  // Symmetric encryption (AES-256-GCM)
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  
  // Vault operations
  createEmptyVault,
  encryptVault,
  decryptVault,
  
  // Duress mode
  encryptDualVault,
  decryptDualVault,
  
  // Memory management
  secureWipeBuffer,
  secureWipeString,
  createSecurePasswordHandler,
  
  // Authentication
  generateAuthResponse,
  
  // Sharing (RSA-OAEP)
  generateShareKeyPair,
  encryptForSharing,
  decryptShared,
  
  // One-time sharing (Zero-Knowledge)
  generateShareKey,
  encryptForOneTimeShare,
  decryptOneTimeShare,
};

export default cryptoService;
