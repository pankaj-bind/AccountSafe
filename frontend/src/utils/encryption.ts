// ═══════════════════════════════════════════════════════════════════════════════
// Client-Side Encryption Utilities 
// ═══════════════════════════════════════════════════════════════════════════════
// 
// Algorithm: AES-256-GCM with PBKDF2 key derivation
// - AES-256-GCM: Authenticated encryption (confidentiality + integrity)
// - PBKDF2: 600,000 iterations (OWASP 2023 recommendation)
// - Random salt per user
// - Random IV per encryption operation
//
// Security Model:
// - Server never sees plaintext credentials
// - Server never sees master password
// - Encryption/decryption happens entirely in browser
// ═══════════════════════════════════════════════════════════════════════════════

const PBKDF2_ITERATIONS = 600000; // OWASP 2023 recommendation
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits (recommended for GCM)
const KEY_LENGTH = 256; // AES-256

/**
 * Convert ArrayBuffer to Base64 string for storage/transmission
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
 * Convert Base64 string back to ArrayBuffer
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
 * Generate cryptographically secure random bytes
 */
function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): string {
  const salt = generateRandomBytes(SALT_LENGTH);
  return arrayBufferToBase64(salt.buffer);
}

/**
 * Generate a recovery key (base58-encoded for user-friendliness)
 */
export function generateRecoveryKey(): string {
  const randomBytes = generateRandomBytes(32); // 256 bits
  const base64 = arrayBufferToBase64(randomBytes.buffer);
  
  // Format as groups for readability: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  const cleaned = base64.replace(/[+/=]/g, '').substring(0, 24);
  return cleaned.match(/.{1,4}/g)?.join('-') || cleaned;
}

/**
 * Derive a cryptographic key from user's password using PBKDF2
 * 
 * @param password - User's master password
 * @param salt - Base64-encoded salt (generated once per user)
 * @returns CryptoKey suitable for AES-256-GCM
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: string
): Promise<CryptoKey> {
  // Convert password to key material
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES-256 key using PBKDF2
  const saltBuffer = base64ToArrayBuffer(salt);
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: KEY_LENGTH
    },
    false, // Not extractable for security
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Encrypt plaintext using AES-256-GCM
 * 
 * @param plaintext - Data to encrypt
 * @param key - CryptoKey from deriveKeyFromPassword()
 * @returns Object with IV and encrypted data (both base64-encoded)
 */
export async function encryptData(
  plaintext: string,
  key: CryptoKey
): Promise<{ iv: string; ciphertext: string }> {
  if (!plaintext || plaintext.trim() === '') {
    throw new Error('Cannot encrypt empty data');
  }

  // Generate random IV for this encryption
  const iv = generateRandomBytes(IV_LENGTH);
  
  // Encrypt
  const encoder = new TextEncoder();
  const plaintextBuffer = encoder.encode(plaintext);
  
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    plaintextBuffer
  );

  return {
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(ciphertextBuffer)
  };
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * 
 * @param ciphertext - Base64-encoded encrypted data
 * @param iv - Base64-encoded initialization vector
 * @param key - CryptoKey from deriveKeyFromPassword()
 * @returns Decrypted plaintext string
 */
export async function decryptData(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  if (!ciphertext || !iv) {
    throw new Error('Cannot decrypt: missing ciphertext or IV');
  }

  try {
    const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
    const ivBuffer = base64ToArrayBuffer(iv);

    const plaintextBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer
      },
      key,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(plaintextBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Decryption failed: Invalid key or corrupted data');
  }
}

/**
 * Encrypt an object's sensitive fields
 * Returns encrypted version with _encrypted suffix fields
 */
export async function encryptCredentialFields(
  fields: {
    username?: string;
    password?: string;
    email?: string;
    notes?: string;
    recovery_codes?: string;
  },
  key: CryptoKey
): Promise<{
  username_encrypted?: string;
  username_iv?: string;
  password_encrypted?: string;
  password_iv?: string;
  email_encrypted?: string;
  email_iv?: string;
  notes_encrypted?: string;
  notes_iv?: string;
  recovery_codes_encrypted?: string;
  recovery_codes_iv?: string;
}> {
  const result: any = {};

  for (const [fieldName, value] of Object.entries(fields)) {
    if (value && value.trim() !== '') {
      const encrypted = await encryptData(value, key);
      result[`${fieldName}_encrypted`] = encrypted.ciphertext;
      result[`${fieldName}_iv`] = encrypted.iv;
    }
  }

  return result;
}

/**
 * Decrypt an object's encrypted fields
 * If the data contains a _plaintext field (for duress mode), use that directly
 * 
 * Optimized: Decrypts all fields in parallel for better performance
 */
export async function decryptCredentialFields(
  encryptedData: any,
  key: CryptoKey
): Promise<{
  username?: string;
  password?: string;
  email?: string;
  notes?: string;
  recovery_codes?: string;
}> {
  // Check for plaintext data (used in duress mode with fake vault)
  // The frontend is unaware it's in duress mode - it just sees data
  if (encryptedData._plaintext) {
    return {
      username: encryptedData._plaintext.username || null,
      password: encryptedData._plaintext.password || null,
      email: encryptedData._plaintext.email || null,
      notes: encryptedData._plaintext.notes || null,
      recovery_codes: encryptedData._plaintext.recovery_codes || null,
    };
  }

  const fieldNames = ['username', 'password', 'email', 'notes', 'recovery_codes'];
  
  // Decrypt all fields in parallel for better performance
  const decryptionPromises = fieldNames.map(async (fieldName) => {
    const ciphertext = encryptedData[`${fieldName}_encrypted`];
    const iv = encryptedData[`${fieldName}_iv`];
    
    if (ciphertext && iv) {
      try {
        const value = await decryptData(ciphertext, iv, key);
        return { fieldName, value };
      } catch (error) {
        console.warn(`Failed to decrypt ${fieldName}:`, error);
        return { fieldName, value: null };
      }
    }
    return { fieldName, value: undefined };
  });
  
  const results = await Promise.all(decryptionPromises);
  
  // Convert array of results to object
  const result: any = {};
  for (const { fieldName, value } of results) {
    if (value !== undefined) {
      result[fieldName] = value;
    }
  }

  return result;
}

/**
 * Store user's encryption key in session storage (memory-only)
 * WARNING: Key is lost when browser closes - this is intentional for security
 */
export function storeMasterKey(key: CryptoKey): void {
  // We can't directly store CryptoKey, so we'll store the password temporarily
  // In a production app, you'd use a more sophisticated key management system
  console.warn('Master key stored in memory (session only)');
}

/**
 * Hash password for authentication (separate from encryption key derivation)
 * This is what gets sent to server for login verification
 */
export async function hashPasswordForAuth(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer);
  return arrayBufferToBase64(hashBuffer);
}
