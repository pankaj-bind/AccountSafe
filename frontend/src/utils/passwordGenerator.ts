// ═══════════════════════════════════════════════════════════════════════════════
// Password Generator Utility
// ═══════════════════════════════════════════════════════════════════════════════
//
// SECURITY: Uses crypto.getRandomValues() for cryptographically secure randomness.
// NEVER use Math.random() for password generation - it's predictable!
// ═══════════════════════════════════════════════════════════════════════════════

export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Generate a cryptographically secure random index
 * Uses rejection sampling to avoid modulo bias
 * 
 * @param max - Maximum value (exclusive)
 * @returns Cryptographically secure random integer in range [0, max)
 */
function secureRandomIndex(max: number): number {
  if (max <= 0) return 0;
  
  const array = new Uint32Array(1);
  const maxUint32 = 0xFFFFFFFF;
  const limit = maxUint32 - (maxUint32 % max);
  
  // Rejection sampling to avoid modulo bias
  let randomValue: number;
  do {
    crypto.getRandomValues(array);
    randomValue = array[0];
  } while (randomValue >= limit);
  
  return randomValue % max;
}

/**
 * Cryptographically secure Fisher-Yates shuffle
 * 
 * @param array - Array to shuffle (mutates in place)
 * @returns Shuffled array
 */
function secureShuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = secureRandomIndex(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export const generatePassword = (options: PasswordOptions): string => {
  let charset = '';
  let passwordChars: string[] = [];
  
  if (options.uppercase) charset += UPPERCASE;
  if (options.lowercase) charset += LOWERCASE;
  if (options.numbers) charset += NUMBERS;
  if (options.symbols) charset += SYMBOLS;
  
  if (!charset) charset = LOWERCASE + NUMBERS; // Default if none selected
  
  // Ensure at least one character from each selected type (using secure random)
  if (options.uppercase && UPPERCASE.length > 0) {
    passwordChars.push(UPPERCASE[secureRandomIndex(UPPERCASE.length)]);
  }
  if (options.lowercase && LOWERCASE.length > 0) {
    passwordChars.push(LOWERCASE[secureRandomIndex(LOWERCASE.length)]);
  }
  if (options.numbers && NUMBERS.length > 0) {
    passwordChars.push(NUMBERS[secureRandomIndex(NUMBERS.length)]);
  }
  if (options.symbols && SYMBOLS.length > 0) {
    passwordChars.push(SYMBOLS[secureRandomIndex(SYMBOLS.length)]);
  }
  
  // Fill remaining length with random characters from charset (using secure random)
  while (passwordChars.length < options.length) {
    passwordChars.push(charset[secureRandomIndex(charset.length)]);
  }
  
  // Shuffle the password using cryptographically secure shuffle
  return secureShuffleArray(passwordChars).join('');
};

export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;
  
  if (password.length >= 12) score += 25;
  else if (password.length >= 8) score += 15;
  else if (password.length >= 6) score += 10;
  
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;
  
  // Bonus for variety
  const uniqueChars = new Set(password.split('')).size;
  if (uniqueChars >= password.length * 0.7) score += 10;
  
  score = Math.min(100, score);
  
  if (score >= 80) return { score, label: 'Excellent', color: 'green' };
  if (score >= 60) return { score, label: 'Good', color: 'blue' };
  if (score >= 40) return { score, label: 'Fair', color: 'yellow' };
  return { score, label: 'Weak', color: 'red' };
};

export const generateSuggestedPasswords = (count: number = 3): string[] => {
  const suggestions: string[] = [];
  const configs: PasswordOptions[] = [
    { length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true },
    { length: 14, uppercase: true, lowercase: true, numbers: true, symbols: false },
    { length: 12, uppercase: true, lowercase: true, numbers: true, symbols: true },
  ];
  
  for (let i = 0; i < count; i++) {
    suggestions.push(generatePassword(configs[i % configs.length]));
  }
  
  return suggestions;
};
