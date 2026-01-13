// Password Generator Utility

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

export const generatePassword = (options: PasswordOptions): string => {
  let charset = '';
  let password = '';
  
  if (options.uppercase) charset += UPPERCASE;
  if (options.lowercase) charset += LOWERCASE;
  if (options.numbers) charset += NUMBERS;
  if (options.symbols) charset += SYMBOLS;
  
  if (!charset) charset = LOWERCASE + NUMBERS; // Default if none selected
  
  // Ensure at least one character from each selected type
  if (options.uppercase && UPPERCASE.length > 0) {
    password += UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)];
  }
  if (options.lowercase && LOWERCASE.length > 0) {
    password += LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)];
  }
  if (options.numbers && NUMBERS.length > 0) {
    password += NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  }
  if (options.symbols && SYMBOLS.length > 0) {
    password += SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }
  
  // Fill remaining length with random characters from charset
  for (let i = password.length; i < options.length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
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
