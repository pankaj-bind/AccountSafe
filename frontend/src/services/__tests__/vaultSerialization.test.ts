/** @vitest-environment jsdom */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createEmptyVault,
  decryptVault,
  deriveMasterKey,
  encryptVault,
  generateSalt,
  type EncryptedData,
  type VaultData,
  type VaultEntry,
} from '../cryptoService';

const BASE_TIME = Date.parse('2026-05-23T09:00:00.000Z');
const ENCRYPTION_TIME = Date.parse('2026-05-23T09:05:00.000Z');

let masterKeyA: CryptoKey;
let masterKeyB: CryptoKey;

type EntryOptions = Partial<Omit<VaultEntry, 'id' | 'title' | 'createdAt' | 'updatedAt'>>;

interface VaultFixtureConfig {
  entries?: VaultEntry[];
  categories?: VaultData['categories'];
  organizations?: VaultData['organizations'];
  auditLog?: VaultData['auditLog'];
  metadata?: Partial<VaultData['metadata']>;
}

function buildVaultEntry(index: number, options: EntryOptions = {}): VaultEntry {
  const createdAt = BASE_TIME + index * 60_000;
  const optionalFields: Partial<VaultEntry> = {};

  if (options.username !== undefined) optionalFields.username = options.username;
  if (options.password !== undefined) optionalFields.password = options.password;
  if (options.email !== undefined) optionalFields.email = options.email;
  if (options.url !== undefined) optionalFields.url = options.url;
  if (options.notes !== undefined) optionalFields.notes = options.notes;
  if (options.recoveryCodes !== undefined) optionalFields.recoveryCodes = options.recoveryCodes;
  if (options.category !== undefined) optionalFields.category = options.category;
  if (options.organizationId !== undefined) optionalFields.organizationId = options.organizationId;
  if (options.organizationName !== undefined) optionalFields.organizationName = options.organizationName;
  if (options.organizationLogo !== undefined) optionalFields.organizationLogo = options.organizationLogo;
  if (options.isFavorite !== undefined) optionalFields.isFavorite = options.isFavorite;
  if (options.isPinned !== undefined) optionalFields.isPinned = options.isPinned;
  if (options.accessCount !== undefined) optionalFields.accessCount = options.accessCount;
  if (options.lastAccessed !== undefined) optionalFields.lastAccessed = options.lastAccessed;

  return {
    id: `entry-${index}`,
    title: `Account ${index}`,
    createdAt,
    updatedAt: createdAt + 30_000,
    ...optionalFields,
  };
}

function buildCategories(): VaultData['categories'] {
  return [
    {
      id: 'cat-personal',
      name: 'Personal',
      description: 'Email, streaming, and everyday logins',
    },
    {
      id: 'cat-work',
      name: 'Work',
      description: 'Internal systems, SaaS, and collaboration tools',
    },
    {
      id: 'cat-finance',
      name: 'Finance',
      description: 'Banks, cards, and billing portals',
    },
  ];
}

function buildOrganizations(): VaultData['organizations'] {
  return [
    {
      id: 'org-home',
      name: 'Homebase',
      logoUrl: 'https://cdn.example.com/homebase.png',
      websiteUrl: 'https://homebase.example.com',
      categoryId: 'cat-personal',
    },
    {
      id: 'org-office',
      name: 'Northwind',
      websiteUrl: 'https://northwind.example.com',
      categoryId: 'cat-work',
    },
    {
      id: 'org-bank',
      name: 'Atlas Bank',
      logoUrl: 'https://cdn.example.com/atlas-bank.png',
      websiteUrl: 'https://atlas.example.com',
      categoryId: 'cat-finance',
    },
    {
      id: 'org-media',
      name: 'Streamly',
      websiteUrl: 'https://streamly.example.com',
      categoryId: 'cat-personal',
    },
    {
      id: 'org-travel',
      name: 'TrailPass',
      websiteUrl: 'https://trailpass.example.com',
      categoryId: 'cat-personal',
    },
  ];
}

function buildAuditLog(): VaultData['auditLog'] {
  return [
    {
      timestamp: BASE_TIME + 5 * 60_000,
      action: 'vault_opened',
      details: 'Opened for serialization validation',
    },
    {
      timestamp: BASE_TIME + 6 * 60_000,
      action: 'entry_created',
      entryId: 'entry-1',
      details: 'Seeded from a realistic import flow',
    },
    {
      timestamp: BASE_TIME + 7 * 60_000,
      action: 'entry_updated',
      entryId: 'entry-15',
    },
    {
      timestamp: BASE_TIME + 8 * 60_000,
      action: 'session_revoked',
      details: 'Suspicious device removed from active sessions',
    },
  ];
}

function buildVault(config: VaultFixtureConfig = {}): VaultData {
  const baseVault = createEmptyVault();

  return {
    entries: config.entries ?? baseVault.entries,
    categories: config.categories ?? baseVault.categories,
    organizations: config.organizations ?? baseVault.organizations,
    auditLog: config.auditLog ?? baseVault.auditLog,
    metadata: {
      ...baseVault.metadata,
      ...config.metadata,
    },
  };
}

function buildCommonCollections(): {
  categories: VaultData['categories'];
  organizations: VaultData['organizations'];
  auditLog: VaultData['auditLog'];
} {
  return {
    categories: buildCategories(),
    organizations: buildOrganizations(),
    auditLog: buildAuditLog(),
  };
}

function buildRealisticEntries(
  count: number,
  categories: VaultData['categories'],
  organizations: VaultData['organizations']
): VaultEntry[] {
  return Array.from({ length: count }, (_, index) => {
    const category = categories[index % categories.length];
    const organization = organizations[index % organizations.length];

    return buildVaultEntry(index, {
      username: `user.${index}`,
      password: `P@ssword-${index}-${(index + 17) * 13}!`,
      email: index % 3 === 0 ? `user${index}@example.com` : undefined,
      url: index % 2 === 0
        ? `https://service${index % 12}.example.com/login`
        : `https://service${index % 12}.example.com`,
      notes: index % 5 === 0
        ? `Billing account ${index}\nLast synced ${index % 7} days ago`
        : `Primary account ${index}`,
      recoveryCodes: index % 11 === 0
        ? `RC-${index}-A\nRC-${index}-B\nRC-${index}-C`
        : undefined,
      category: category.id,
      organizationId: organization.id,
      organizationName: organization.name,
      organizationLogo: organization.logoUrl,
      isFavorite: index % 2 === 0,
      isPinned: index % 3 === 0,
      accessCount: index * 2,
      lastAccessed: BASE_TIME + index * 120_000,
    });
  });
}

function buildMediumVault(): VaultData {
  const { categories, organizations, auditLog } = buildCommonCollections();

  return buildVault({
    entries: buildRealisticEntries(100, categories, organizations),
    categories,
    organizations,
    auditLog,
    metadata: {
      lastSync: BASE_TIME + 60 * 60_000,
    },
  });
}

function buildLargeVault(): VaultData {
  const { categories, organizations, auditLog } = buildCommonCollections();

  return buildVault({
    entries: buildRealisticEntries(1000, categories, organizations),
    categories,
    organizations,
    auditLog,
    metadata: {
      lastSync: BASE_TIME + 2 * 60 * 60_000,
    },
  });
}

function buildNestedFixtureVault(): VaultData {
  const { categories, organizations, auditLog } = buildCommonCollections();

  return buildVault({
    entries: [
      buildVaultEntry(12, {
        username: 'nested.user@example.com',
        password: 'NestedPass123!',
        email: 'nested.user@example.com',
        url: 'https://nested.example.com/login',
        notes: 'Nested object coverage fixture',
        category: 'cat-work',
        organizationId: 'org-office',
        organizationName: 'Northwind',
        organizationLogo: 'https://cdn.example.com/northwind.png',
        isFavorite: true,
        isPinned: false,
        accessCount: 12,
        lastAccessed: BASE_TIME + 12 * 60_000,
      }),
    ],
    categories,
    organizations,
    auditLog,
    metadata: {
      lastSync: BASE_TIME + 9 * 60_000,
    },
  });
}

function buildOrderedVault(): VaultData {
  return buildVault({
    entries: [
      buildVaultEntry(3),
      buildVaultEntry(1),
      buildVaultEntry(4),
      buildVaultEntry(2),
    ],
    categories: [],
    organizations: [],
    auditLog: [
      {
        timestamp: BASE_TIME + 9 * 60_000,
        action: 'ordered_fixture_created',
      },
    ],
    metadata: {
      lastSync: BASE_TIME + 10 * 60_000,
    },
  });
}

function buildFullyPopulatedVault(): VaultData {
  return buildVault({
    entries: [
      {
        id: 'entry-full',
        title: 'Complete account 🔒',
        username: 'full.user@example.com',
        password: 'P@ssw0rd🔑123',
        email: 'full.user@example.com',
        url: 'https://full.example.com/login',
        notes: 'Every optional field is populated for the round-trip check.',
        recoveryCodes: 'RC-1\nRC-2\nRC-3',
        category: 'cat-full',
        organizationId: 'org-full',
        organizationName: 'Full Organization',
        organizationLogo: 'https://cdn.example.com/full-org.png',
        isFavorite: true,
        isPinned: true,
        accessCount: 42,
        lastAccessed: BASE_TIME + 45_000,
        createdAt: BASE_TIME + 30_000,
        updatedAt: BASE_TIME + 40_000,
      },
    ],
    categories: [
      {
        id: 'cat-full',
        name: 'Full',
        description: 'All entry fields populated',
      },
    ],
    organizations: [
      {
        id: 'org-full',
        name: 'Full Organization',
        logoUrl: 'https://cdn.example.com/full-org.png',
        websiteUrl: 'https://full.example.com',
        categoryId: 'cat-full',
      },
    ],
    auditLog: [
      {
        timestamp: BASE_TIME + 50_000,
        action: 'entry_created',
        entryId: 'entry-full',
        details: 'Seeded to verify every VaultEntry field survives serialization',
      },
    ],
    metadata: {
      lastSync: BASE_TIME + 60_000,
    },
  });
}

function buildUnicodeVault(): VaultData {
  return buildVault({
    entries: [
      buildVaultEntry(7, {
        title: 'クレジットカード 🔐',
        username: '用户@example.cn',
        password: '🔑Paßwørd-秘密-123',
        email: 'مستخدم@example.com',
        url: 'https://пример.испытание/вход',
        notes: 'English, العربية, 中文, русский, עברית',
        recoveryCodes: '回復コード-1\nКод-2\nرمز-3',
        category: 'cat-unicode',
        organizationId: 'org-unicode',
        organizationName: '東京株式会社',
        organizationLogo: 'https://例子.测试/logo.svg',
        isFavorite: true,
        isPinned: false,
        accessCount: 7,
        lastAccessed: BASE_TIME + 7 * 60_000,
      }),
    ],
    categories: [
      {
        id: 'cat-unicode',
        name: '個人 / Personal / شخصي',
        description: 'CJK 😀 and RTL العربية',
      },
    ],
    organizations: [
      {
        id: 'org-unicode',
        name: '株式会社サンプル',
        logoUrl: 'https://例子.测试/logo.svg',
        websiteUrl: 'https://مثال.إختبار',
        categoryId: 'cat-unicode',
      },
    ],
    auditLog: [
      {
        timestamp: BASE_TIME + 8 * 60_000,
        action: 'unicode_saved',
        details: 'Emoji 🔐, CJK 漢字, Cyrillic Привет, Arabic مرحبا',
      },
    ],
    metadata: {
      lastSync: BASE_TIME + 9 * 60_000,
    },
  });
}

function buildSecurityVault(): VaultData {
  const { categories, organizations, auditLog } = buildCommonCollections();

  return buildVault({
    entries: [
      buildVaultEntry(1, {
        username: 'security.user@example.com',
        password: 'Security-Only-Password!123',
        email: 'security.user@example.com',
        url: 'https://security.example.com/login',
        notes: 'Fixture for wrong-key and tampering tests',
        category: 'cat-work',
        organizationId: 'org-office',
        organizationName: 'Northwind',
        organizationLogo: 'https://cdn.example.com/northwind.png',
        isFavorite: false,
        isPinned: true,
        accessCount: 1,
        lastAccessed: BASE_TIME + 70_000,
      }),
    ],
    categories,
    organizations,
    auditLog,
    metadata: {
      lastSync: BASE_TIME + 11 * 60_000,
    },
  });
}

function buildUndefinedFieldVault(): VaultData {
  return buildVault({
    entries: [
      {
        id: 'entry-undefined-fields',
        title: 'Undefined field fixture',
        username: undefined,
        password: 'kept-value',
        email: undefined,
        url: undefined,
        notes: undefined,
        recoveryCodes: undefined,
        category: undefined,
        organizationId: undefined,
        organizationName: undefined,
        organizationLogo: undefined,
        isFavorite: undefined,
        isPinned: undefined,
        accessCount: undefined,
        lastAccessed: undefined,
        createdAt: BASE_TIME,
        updatedAt: BASE_TIME,
      } as VaultEntry,
    ],
    categories: [
      {
        id: 'cat-undefined',
        name: 'Undefined category',
        description: undefined,
      },
    ],
    organizations: [
      {
        id: 'org-undefined',
        name: 'Undefined org',
        logoUrl: undefined,
        websiteUrl: undefined,
        categoryId: 'cat-undefined',
      },
    ],
    auditLog: [
      {
        timestamp: BASE_TIME + 60_000,
        action: 'undefined_optional_fields',
        entryId: 'entry-undefined-fields',
        details: undefined,
      },
    ],
    metadata: {
      lastSync: undefined,
    },
  });
}

function parseEncryptedBlob(blob: string): EncryptedData {
  return JSON.parse(atob(blob)) as EncryptedData;
}

function tamperEncryptedBlob(blob: string, mutate: (encrypted: EncryptedData) => void): string {
  const parsed = parseEncryptedBlob(blob);
  mutate(parsed);
  return btoa(JSON.stringify(parsed));
}

function flipSingleCharacter(value: string): string {
  if (value.length === 0) {
    return value;
  }

  const replacement = value[0] === 'A' ? 'B' : 'A';
  return `${replacement}${value.slice(1)}`;
}

function assertVaultTimestampsAreNumbers(vault: VaultData): void {
  expect(typeof vault.metadata.createdAt).toBe('number');
  expect(typeof vault.metadata.updatedAt).toBe('number');
  if (vault.metadata.lastSync !== undefined) {
    expect(typeof vault.metadata.lastSync).toBe('number');
  }

  for (const entry of vault.entries) {
    expect(typeof entry.createdAt).toBe('number');
    expect(typeof entry.updatedAt).toBe('number');
    if (entry.lastAccessed !== undefined) {
      expect(typeof entry.lastAccessed).toBe('number');
    }
  }

  for (const record of vault.auditLog) {
    expect(typeof record.timestamp).toBe('number');
  }
}

async function encryptAndDecryptVault(vault: VaultData, key: CryptoKey): Promise<{
  blob: string;
  decrypted: VaultData;
}> {
  vi.setSystemTime(new Date(ENCRYPTION_TIME));
  const blob = await encryptVault(vault, key);
  const decrypted = await decryptVault(blob, key);

  return { blob, decrypted };
}

beforeAll(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(BASE_TIME));

  const saltA = generateSalt();
  const saltB = generateSalt();
  masterKeyA = await deriveMasterKey('Correct Horse Battery Staple!', saltA);
  masterKeyB = await deriveMasterKey('Different Correct Horse Battery Staple!', saltB);
});

beforeEach(() => {
  vi.setSystemTime(new Date(BASE_TIME));
});

afterAll(() => {
  vi.useRealTimers();
});

describe('Vault serialization round-trip', () => {
  it('round-trips an empty vault without changing its structure', async () => {
    const vault = createEmptyVault();
    const expectedVault = structuredClone(vault);

    const { decrypted } = await encryptAndDecryptVault(vault, masterKeyA);
    expectedVault.metadata.updatedAt = ENCRYPTION_TIME;

    expect(decrypted).toStrictEqual(expectedVault);
  });

  it('round-trips a single fully populated VaultEntry with every field set', async () => {
    const vault = buildFullyPopulatedVault();
    const expectedVault = structuredClone(vault);

    const { decrypted } = await encryptAndDecryptVault(vault, masterKeyA);
    expectedVault.metadata.updatedAt = ENCRYPTION_TIME;

    expect(decrypted).toStrictEqual(expectedVault);
  });

  it('round-trips 100 realistic entries with varied data', async () => {
    const vault = buildMediumVault();
    const expectedVault = structuredClone(vault);

    const { decrypted } = await encryptAndDecryptVault(vault, masterKeyA);
    expectedVault.metadata.updatedAt = ENCRYPTION_TIME;

    expect(decrypted).toStrictEqual(expectedVault);
  });

  it('round-trips 1000 entries with a deep equality check', async () => {
    const vault = buildLargeVault();
    const expectedVault = structuredClone(vault);

    const { decrypted } = await encryptAndDecryptVault(vault, masterKeyA);
    expectedVault.metadata.updatedAt = ENCRYPTION_TIME;

    expect(decrypted).toStrictEqual(expectedVault);
  });

  it('preserves Unicode content across all vault fields', async () => {
    const vault = buildUnicodeVault();
    const expectedVault = structuredClone(vault);

    const { decrypted } = await encryptAndDecryptVault(vault, masterKeyA);
    expectedVault.metadata.updatedAt = ENCRYPTION_TIME;

    expect(decrypted).toStrictEqual(expectedVault);
  });

  it('preserves nested categories, organizations, and auditLog structures', async () => {
    const vault = buildNestedFixtureVault();
    const expectedVault = structuredClone(vault);

    const { decrypted } = await encryptAndDecryptVault(vault, masterKeyA);
    expectedVault.metadata.updatedAt = ENCRYPTION_TIME;

    expect(decrypted).toStrictEqual(expectedVault);
  });

  it('preserves the exact entries array order', async () => {
    const vault = buildOrderedVault();
    const expectedOrder = vault.entries.map((entry) => entry.id);

    const { decrypted } = await encryptAndDecryptVault(vault, masterKeyA);

    expect(decrypted.entries.map((entry) => entry.id)).toStrictEqual(expectedOrder);
  });
});

describe('Vault mutation contract', () => {
  it('mutates metadata.updatedAt during encryption and returns that value after decryption', async () => {
    // Known side effect: encryptVault mutates metadata.updatedAt in place.
    // If a future PR makes encryptVault pure, update this test intentionally rather than preserving the mutation assertion.
    const vault = buildNestedFixtureVault();
    const originalVault = structuredClone(vault);

    const { decrypted } = await encryptAndDecryptVault(vault, masterKeyA);

    expect(vault.metadata.updatedAt).toBe(ENCRYPTION_TIME);
    expect(vault.metadata.updatedAt).not.toBe(originalVault.metadata.updatedAt);
    expect(decrypted.metadata.updatedAt).toBe(ENCRYPTION_TIME);

    const expectedVault = structuredClone(originalVault);
    expectedVault.metadata.updatedAt = ENCRYPTION_TIME;

    expect(decrypted).toStrictEqual(expectedVault);
  });
});

describe('Vault version pinning', () => {
  it('pins the wire format to v1 and the vault metadata version to 1.0.0', async () => {
    const vault = createEmptyVault();
    const expectedVault = structuredClone(vault);

    const { blob, decrypted } = await encryptAndDecryptVault(vault, masterKeyA);
    const wireFormat = parseEncryptedBlob(blob);
    expectedVault.metadata.updatedAt = ENCRYPTION_TIME;

    expect(wireFormat.version).toBe('v1');
    expect(vault.metadata.version).toBe('1.0.0');
    expect(decrypted.metadata.version).toBe('1.0.0');
    expect(decrypted.metadata.version).toBe(vault.metadata.version);
    expect(decrypted).toStrictEqual(expectedVault);
  });
});

describe('Vault decryption security', () => {
  it('rejects decryption with the wrong master key', async () => {
    // This checks the fail-closed path: ciphertext encrypted with one key must not decrypt under another key.
    const vault = buildSecurityVault();
    const { blob } = await encryptAndDecryptVault(vault, masterKeyA);

    await expect(decryptVault(blob, masterKeyB)).rejects.toThrow(/^Decryption failed:/);
  });

  it('rejects ciphertext tampering after base64 decode', async () => {
    // This models an attacker changing the stored ciphertext bytes after the blob has been received or persisted.
    const vault = buildSecurityVault();
    const { blob } = await encryptAndDecryptVault(vault, masterKeyA);
    const tamperedBlob = tamperEncryptedBlob(blob, (encrypted) => {
      encrypted.ciphertext = flipSingleCharacter(encrypted.ciphertext);
    });

    await expect(decryptVault(tamperedBlob, masterKeyA)).rejects.toThrow(/^Decryption failed:/);
  });

  it('rejects IV tampering after base64 decode', async () => {
    // This guards against IV manipulation, which must invalidate AES-GCM authentication just like ciphertext tampering.
    const vault = buildSecurityVault();
    const { blob } = await encryptAndDecryptVault(vault, masterKeyA);
    const tamperedBlob = tamperEncryptedBlob(blob, (encrypted) => {
      encrypted.iv = flipSingleCharacter(encrypted.iv);
    });

    await expect(decryptVault(tamperedBlob, masterKeyA)).rejects.toThrow(/^Decryption failed:/);
  });

  it('rejects truncation attacks on the encrypted blob', async () => {
    // Truncation should fail closed even if the attacker only has a partial copy of the stored blob.
    const vault = buildSecurityVault();
    const { blob } = await encryptAndDecryptVault(vault, masterKeyA);
    const truncatedBlob = blob.slice(0, Math.floor(blob.length / 2));

    await expect(decryptVault(truncatedBlob, masterKeyA)).rejects.toThrow();
  });

  it('rejects completely invalid input strings', async () => {
    await expect(decryptVault('this-is-not-a-valid-encrypted-vault', masterKeyA)).rejects.toThrow();
  });
});

describe('Vault JSON serialization contract', () => {
  it('keeps every timestamp as a number after round-trip', async () => {
    const vault = buildMediumVault();
    const expectedVault = structuredClone(vault);

    const { decrypted } = await encryptAndDecryptVault(vault, masterKeyA);
    expectedVault.metadata.updatedAt = ENCRYPTION_TIME;

    assertVaultTimestampsAreNumbers(decrypted);
    expect(decrypted).toStrictEqual(expectedVault);
  });

  it('strips undefined optional fields through JSON.stringify before encryption', async () => {
    const vault = buildUndefinedFieldVault();
    const expectedVault = JSON.parse(JSON.stringify(vault)) as VaultData;

    const { decrypted } = await encryptAndDecryptVault(vault, masterKeyA);
    expectedVault.metadata.updatedAt = ENCRYPTION_TIME;

    expect(decrypted).toStrictEqual(expectedVault);
    expect('notes' in decrypted.entries[0]).toBe(false);
    expect('username' in decrypted.entries[0]).toBe(false);
    expect('email' in decrypted.entries[0]).toBe(false);
    expect('description' in decrypted.categories[0]).toBe(false);
    expect('logoUrl' in decrypted.organizations[0]).toBe(false);
    expect('details' in decrypted.auditLog[0]).toBe(false);
    expect('lastSync' in decrypted.metadata).toBe(false);
  });
});