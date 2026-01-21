import { useState, useEffect, useRef } from 'react';

interface PwnedCheckResult {
  breachCount: number;
  isChecking: boolean;
  error: string | null;
}

// Cache to store previous results
const breachCache = new Map<string, number>();

/**
 * Custom hook to check if a password has been exposed in data breaches
 * using the HaveIBeenPwned (HIBP) k-Anonymity API.
 * 
 * **How it works:**
 * 1. Hash the password using SHA-1
 * 2. Extract the first 5 characters (prefix)
 * 3. Send only the prefix to HIBP API
 * 4. HIBP returns all hash suffixes that match the prefix
 * 5. Check if our full hash suffix exists in the response
 * 
 * **Features:**
 * - Debouncing: Waits 500ms after user stops typing before checking
 * - Caching: Stores results to avoid redundant API calls
 * - Privacy: Only sends 5 chars of the hash, never the actual password
 * 
 * @param password - The password to check
 * @returns Object containing breachCount, isChecking state, and error
 */
export const usePwnedCheck = (password: string): PwnedCheckResult => {
  const [breachCount, setBreachCount] = useState<number>(0);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Reset state if password is empty
    if (!password || password.length === 0) {
      setBreachCount(0);
      setIsChecking(false);
      setError(null);
      return;
    }

    // Debounce: Wait 500ms after user stops typing
    debounceTimerRef.current = setTimeout(() => {
      checkPassword(password);
    }, 500);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [password]);

  /**
   * Hash the password using SHA-1 and return as uppercase hex string
   */
  const hashPassword = async (pwd: string): Promise<string> => {
    // Convert password to array buffer
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    
    // Hash using SHA-1
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex.toUpperCase();
  };

  /**
   * Check password against HIBP database using k-Anonymity
   */
  const checkPassword = async (pwd: string): Promise<void> => {
    try {
      setIsChecking(true);
      setError(null);

      // Check cache first
      if (breachCache.has(pwd)) {
        setBreachCount(breachCache.get(pwd)!);
        setIsChecking(false);
        return;
      }

      // Step 1: Hash the password using SHA-1
      const fullHash = await hashPassword(pwd);

      // Step 2: Extract first 5 characters (prefix)
      const prefix = fullHash.substring(0, 5);
      
      // Step 3: Get remaining characters (suffix)
      const suffix = fullHash.substring(5);

      // Step 4: Call HIBP API with only the prefix
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        method: 'GET',
        headers: {
          'Add-Padding': 'true', // Add random padding for extra privacy
        },
      });

      if (!response.ok) {
        throw new Error(`HIBP API error: ${response.status}`);
      }

      // Step 5: Parse response (format: "SUFFIX:COUNT\r\n")
      const text = await response.text();
      const lines = text.split('\r\n');

      let count = 0;
      for (const line of lines) {
        const [hashSuffix, breachCountStr] = line.split(':');
        
        // Check if our suffix matches
        if (hashSuffix === suffix) {
          count = parseInt(breachCountStr, 10);
          break;
        }
      }

      // Step 6: Cache the result
      breachCache.set(pwd, count);
      setBreachCount(count);
      setIsChecking(false);

    } catch (err) {
      console.error('Password breach check failed:', err);
      setError('Unable to check password breach status');
      setBreachCount(0);
      setIsChecking(false);
    }
  };

  return {
    breachCount,
    isChecking,
    error,
  };
};
