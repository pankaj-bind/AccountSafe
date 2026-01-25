// src/utils/__tests__/encryption.test.ts
/**
 * Client-Side Encryption Unit Tests
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * CRITICAL TEST FILE - A failure here means USER DATA COULD BE LOST.
 * 
 * These tests mathematically prove that:
 * 1. Key derivation is deterministic (same password + salt = same key)
 * 2. Encryption round-trip works (encrypt → decrypt = original)
 * 3. Wrong key causes decryption failure (security property)
 * 4. Edge cases are handled correctly
 * 
 * Algorithm: AES-256-GCM with PBKDF2 key derivation (600,000 iterations)
 */

import {
  generateSalt,
  deriveKeyFromPassword,
  encryptData,
  decryptData,
  encryptCredentialFields,
  decryptCredentialFields,
  hashPasswordForAuth,
} from '../encryption';


// ═══════════════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a random string for testing
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}


// ═══════════════════════════════════════════════════════════════════════════════
// SALT GENERATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Salt Generation', () => {
  test('generateSalt returns a non-empty string', () => {
    const salt = generateSalt();
    expect(salt).toBeTruthy();
    expect(typeof salt).toBe('string');
    expect(salt.length).toBeGreaterThan(0);
  });

  test('generateSalt returns unique values', () => {
    const salts = new Set<string>();
    for (let i = 0; i < 100; i++) {
      salts.add(generateSalt());
    }
    // All 100 salts should be unique
    expect(salts.size).toBe(100);
  });

  test('generateSalt returns valid base64', () => {
    const salt = generateSalt();
    // Should not throw when decoded
    expect(() => atob(salt)).not.toThrow();
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// KEY DERIVATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Key Derivation (PBKDF2)', () => {
  const testPassword = 'MySecurePassword123!';
  const testSalt = generateSalt();

  test('deriveKeyFromPassword returns a CryptoKey', async () => {
    const key = await deriveKeyFromPassword(testPassword, testSalt);
    
    expect(key).toBeDefined();
    expect(key.type).toBe('secret');
    expect(key.algorithm.name).toBe('AES-GCM');
  });

  test('same password + salt produces same key (deterministic)', async () => {
    const key1 = await deriveKeyFromPassword(testPassword, testSalt);
    const key2 = await deriveKeyFromPassword(testPassword, testSalt);

    // Keys themselves can't be compared directly, but we can verify
    // they produce the same encryption result with the same IV
    const plaintext = 'Test data';
    
    // Encrypt with key1
    const encrypted1 = await encryptData(plaintext, key1);
    
    // Decrypt with key2 (should work if keys are the same)
    const decrypted = await decryptData(encrypted1.ciphertext, encrypted1.iv, key2);
    
    expect(decrypted).toBe(plaintext);
  });

  test('different passwords produce different keys', async () => {
    const key1 = await deriveKeyFromPassword('Password1', testSalt);
    const key2 = await deriveKeyFromPassword('Password2', testSalt);

    const plaintext = 'Test data';
    const encrypted = await encryptData(plaintext, key1);

    // Decrypting with wrong key should fail
    await expect(
      decryptData(encrypted.ciphertext, encrypted.iv, key2)
    ).rejects.toThrow();
  });

  test('different salts produce different keys', async () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    
    const key1 = await deriveKeyFromPassword(testPassword, salt1);
    const key2 = await deriveKeyFromPassword(testPassword, salt2);

    const plaintext = 'Test data';
    const encrypted = await encryptData(plaintext, key1);

    // Decrypting with key from different salt should fail
    await expect(
      decryptData(encrypted.ciphertext, encrypted.iv, key2)
    ).rejects.toThrow();
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// ENCRYPTION ROUND-TRIP TESTS - THE MOST CRITICAL TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Encryption Round-Trip', () => {
  let testKey: CryptoKey;
  const testSalt = generateSalt();

  beforeAll(async () => {
    testKey = await deriveKeyFromPassword('TestPassword123!', testSalt);
  });

  test('simple string encrypts and decrypts correctly', async () => {
    const original = 'Hello, World!';
    
    const encrypted = await encryptData(original, testKey);
    const decrypted = await decryptData(encrypted.ciphertext, encrypted.iv, testKey);
    
    expect(decrypted).toBe(original);
  });

  test('random strings encrypt and decrypt correctly', async () => {
    // Test 10 random strings of various lengths
    for (let i = 0; i < 10; i++) {
      const length = Math.floor(Math.random() * 1000) + 1;
      const original = generateRandomString(length);
      
      const encrypted = await encryptData(original, testKey);
      const decrypted = await decryptData(encrypted.ciphertext, encrypted.iv, testKey);
      
      expect(decrypted).toBe(original);
    }
  });

  test('unicode strings encrypt and decrypt correctly', async () => {
    const testCases = [
      'Hello 世界 🌍',
      'Ñoño señor',
      'مرحبا بالعالم',
      '日本語テスト',
      '🔐🔑🔒🔓',
      'Ελληνικά',
      'Кириллица',
    ];

    for (const original of testCases) {
      const encrypted = await encryptData(original, testKey);
      const decrypted = await decryptData(encrypted.ciphertext, encrypted.iv, testKey);
      
      expect(decrypted).toBe(original);
    }
  });

  test('special characters encrypt and decrypt correctly', async () => {
    const original = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~\n\t\r\\';
    
    const encrypted = await encryptData(original, testKey);
    const decrypted = await decryptData(encrypted.ciphertext, encrypted.iv, testKey);
    
    expect(decrypted).toBe(original);
  });

  test('long strings (10KB) encrypt and decrypt correctly', async () => {
    const original = generateRandomString(10000);
    
    const encrypted = await encryptData(original, testKey);
    const decrypted = await decryptData(encrypted.ciphertext, encrypted.iv, testKey);
    
    expect(decrypted).toBe(original);
  });

  test('JSON objects serialize, encrypt, and decrypt correctly', async () => {
    const original = {
      username: 'john.doe',
      password: 'SecretP@ss123!',
      email: 'john@example.com',
      notes: 'Some notes with special chars: <>&"\'',
      nested: {
        value: 42,
        array: [1, 2, 3],
      },
    };

    const serialized = JSON.stringify(original);
    const encrypted = await encryptData(serialized, testKey);
    const decrypted = await decryptData(encrypted.ciphertext, encrypted.iv, testKey);
    const parsed = JSON.parse(decrypted);
    
    expect(parsed).toEqual(original);
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// NEGATIVE TESTS - SECURITY CRITICAL
// ═══════════════════════════════════════════════════════════════════════════════

describe('Decryption Security', () => {
  let correctKey: CryptoKey;
  let wrongKey: CryptoKey;
  const testSalt = generateSalt();

  beforeAll(async () => {
    correctKey = await deriveKeyFromPassword('CorrectPassword', testSalt);
    wrongKey = await deriveKeyFromPassword('WrongPassword', testSalt);
  });

  test('decrypting with wrong key throws error (not garbage)', async () => {
    const original = 'Sensitive data';
    const encrypted = await encryptData(original, correctKey);

    // CRITICAL: Must throw, not return corrupted data
    await expect(
      decryptData(encrypted.ciphertext, encrypted.iv, wrongKey)
    ).rejects.toThrow();
  });

  test('tampered ciphertext throws error', async () => {
    const original = 'Sensitive data';
    const encrypted = await encryptData(original, correctKey);

    // Tamper with ciphertext
    const tamperedCiphertext = encrypted.ciphertext.slice(0, -4) + 'XXXX';

    await expect(
      decryptData(tamperedCiphertext, encrypted.iv, correctKey)
    ).rejects.toThrow();
  });

  test('tampered IV throws error', async () => {
    const original = 'Sensitive data';
    const encrypted = await encryptData(original, correctKey);

    // Tamper with IV
    const tamperedIV = 'X' + encrypted.iv.slice(1);

    await expect(
      decryptData(encrypted.ciphertext, tamperedIV, correctKey)
    ).rejects.toThrow();
  });

  test('empty ciphertext throws error', async () => {
    await expect(
      decryptData('', 'some-iv', correctKey)
    ).rejects.toThrow();
  });

  test('empty IV throws error', async () => {
    await expect(
      decryptData('some-ciphertext', '', correctKey)
    ).rejects.toThrow();
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// CREDENTIAL FIELD ENCRYPTION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Credential Field Encryption', () => {
  let testKey: CryptoKey;

  beforeAll(async () => {
    testKey = await deriveKeyFromPassword('TestPassword', generateSalt());
  });

  test('encryptCredentialFields encrypts all provided fields', async () => {
    const fields = {
      username: 'johndoe',
      password: 'SecretPass123!',
      email: 'john@example.com',
      notes: 'Some notes',
    };

    const encrypted = await encryptCredentialFields(fields, testKey);

    // All fields should have encrypted versions
    expect(encrypted.username_encrypted).toBeTruthy();
    expect(encrypted.username_iv).toBeTruthy();
    expect(encrypted.password_encrypted).toBeTruthy();
    expect(encrypted.password_iv).toBeTruthy();
    expect(encrypted.email_encrypted).toBeTruthy();
    expect(encrypted.email_iv).toBeTruthy();
    expect(encrypted.notes_encrypted).toBeTruthy();
    expect(encrypted.notes_iv).toBeTruthy();
  });

  test('decryptCredentialFields decrypts all fields correctly', async () => {
    const original = {
      username: 'johndoe',
      password: 'SecretPass123!',
      email: 'john@example.com',
      notes: 'Some important notes',
    };

    const encrypted = await encryptCredentialFields(original, testKey);
    const decrypted = await decryptCredentialFields(encrypted, testKey);

    expect(decrypted.username).toBe(original.username);
    expect(decrypted.password).toBe(original.password);
    expect(decrypted.email).toBe(original.email);
    expect(decrypted.notes).toBe(original.notes);
  });

  test('empty/undefined fields are handled gracefully', async () => {
    const fields = {
      username: 'johndoe',
      password: '',  // Empty
      email: undefined as any,  // Undefined
    };

    const encrypted = await encryptCredentialFields(fields, testKey);
    
    // Username should be encrypted
    expect(encrypted.username_encrypted).toBeTruthy();
    
    // Empty/undefined fields should not be encrypted
    expect(encrypted.password_encrypted).toBeFalsy();
    expect(encrypted.email_encrypted).toBeFalsy();
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// AUTH HASH TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Auth Hash Generation', () => {
  test('hashPasswordForAuth returns consistent hash', async () => {
    const password = 'TestPassword123!';
    const salt = generateSalt();

    const hash1 = await hashPasswordForAuth(password, salt);
    const hash2 = await hashPasswordForAuth(password, salt);

    expect(hash1).toBe(hash2);
  });

  test('different passwords produce different hashes', async () => {
    const salt = generateSalt();

    const hash1 = await hashPasswordForAuth('Password1', salt);
    const hash2 = await hashPasswordForAuth('Password2', salt);

    expect(hash1).not.toBe(hash2);
  });

  test('different salts produce different hashes', async () => {
    const password = 'TestPassword123!';

    const hash1 = await hashPasswordForAuth(password, generateSalt());
    const hash2 = await hashPasswordForAuth(password, generateSalt());

    expect(hash1).not.toBe(hash2);
  });

  test('auth hash is valid base64', async () => {
    const hash = await hashPasswordForAuth('Password', generateSalt());
    
    // Should not throw when decoded
    expect(() => atob(hash)).not.toThrow();
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// EDGE CASE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Edge Cases', () => {
  let testKey: CryptoKey;

  beforeAll(async () => {
    testKey = await deriveKeyFromPassword('TestPassword', generateSalt());
  });

  test('encrypting empty string throws error', async () => {
    await expect(encryptData('', testKey)).rejects.toThrow();
  });

  test('encrypting whitespace-only string throws error', async () => {
    await expect(encryptData('   ', testKey)).rejects.toThrow();
  });

  test('very long password works for key derivation', async () => {
    const longPassword = 'A'.repeat(1000);
    const salt = generateSalt();
    
    const key = await deriveKeyFromPassword(longPassword, salt);
    const encrypted = await encryptData('Test', key);
    const decrypted = await decryptData(encrypted.ciphertext, encrypted.iv, key);
    
    expect(decrypted).toBe('Test');
  });

  test('single character encryption works', async () => {
    const original = 'A';
    const encrypted = await encryptData(original, testKey);
    const decrypted = await decryptData(encrypted.ciphertext, encrypted.iv, testKey);
    
    expect(decrypted).toBe(original);
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE SANITY TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Performance', () => {
  test('key derivation completes in reasonable time', async () => {
    const startTime = Date.now();
    await deriveKeyFromPassword('TestPassword', generateSalt());
    const endTime = Date.now();
    
    // PBKDF2 with 600k iterations should take <5 seconds even on slow machines
    // In tests it's usually <1 second
    expect(endTime - startTime).toBeLessThan(5000);
  }, 10000); // 10 second timeout

  test('encryption of 1MB data completes in reasonable time', async () => {
    const key = await deriveKeyFromPassword('TestPassword', generateSalt());
    const largeData = 'X'.repeat(1_000_000);
    
    const startTime = Date.now();
    const encrypted = await encryptData(largeData, key);
    await decryptData(encrypted.ciphertext, encrypted.iv, key);
    const endTime = Date.now();
    
    // Should complete in under 5 seconds
    expect(endTime - startTime).toBeLessThan(5000);
  }, 10000);
});
