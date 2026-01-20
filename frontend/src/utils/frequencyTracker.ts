// src/utils/frequencyTracker.ts

interface AccessRecord {
  count: number;
  lastAccessed: number; // timestamp
}

interface FrequencyData {
  [key: string]: AccessRecord;
}

const STORAGE_KEY_PROFILES = 'accountsafe_profile_frequency';
const STORAGE_KEY_ORGS = 'accountsafe_org_frequency';

/**
 * Get frequency data from localStorage
 */
const getFrequencyData = (storageKey: string): FrequencyData => {
  try {
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

/**
 * Save frequency data to localStorage
 */
const saveFrequencyData = (storageKey: string, data: FrequencyData): void => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save frequency data:', error);
  }
};

/**
 * Track an access to a profile or organization
 */
export const trackAccess = (id: number | string, type: 'profile' | 'org'): void => {
  const storageKey = type === 'profile' ? STORAGE_KEY_PROFILES : STORAGE_KEY_ORGS;
  const data = getFrequencyData(storageKey);
  const key = String(id);
  
  data[key] = {
    count: (data[key]?.count || 0) + 1,
    lastAccessed: Date.now()
  };
  
  saveFrequencyData(storageKey, data);
};

/**
 * Get access record for an item
 */
export const getAccessRecord = (id: number | string, type: 'profile' | 'org'): AccessRecord => {
  const storageKey = type === 'profile' ? STORAGE_KEY_PROFILES : STORAGE_KEY_ORGS;
  const data = getFrequencyData(storageKey);
  const key = String(id);
  
  return data[key] || { count: 0, lastAccessed: 0 };
};

/**
 * Calculate frequency score (combines access count and recency)
 * Higher score = more frequently/recently accessed
 */
export const calculateFrequencyScore = (record: AccessRecord): number => {
  const now = Date.now();
  const daysSinceAccess = (now - record.lastAccessed) / (1000 * 60 * 60 * 24);
  
  // Decay factor: reduce score for older accesses
  // Recent access (within 1 day) = full weight, gradually reduces over 30 days
  const recencyMultiplier = Math.max(0.1, 1 - (daysSinceAccess / 30));
  
  // Score formula: count * recency
  return record.count * recencyMultiplier;
};

/**
 * Sort items by frequency (adaptive sorting)
 * Pinned items always stay on top
 */
export const sortByFrequency = <T extends { id: number; is_pinned?: boolean }>(
  items: T[],
  type: 'profile' | 'org'
): T[] => {
  return [...items].sort((a, b) => {
    // Pinned items always come first
    const aPinned = a.is_pinned || false;
    const bPinned = b.is_pinned || false;
    
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    
    // For unpinned items, sort by frequency
    if (!aPinned && !bPinned) {
      const aRecord = getAccessRecord(a.id, type);
      const bRecord = getAccessRecord(b.id, type);
      
      const aScore = calculateFrequencyScore(aRecord);
      const bScore = calculateFrequencyScore(bRecord);
      
      // Higher score first
      if (aScore !== bScore) {
        return bScore - aScore;
      }
      
      // If scores are equal, use most recent access
      if (aRecord.lastAccessed !== bRecord.lastAccessed) {
        return bRecord.lastAccessed - aRecord.lastAccessed;
      }
      
      // If still equal, maintain original order (by ID)
      return a.id - b.id;
    }
    
    // Both pinned - maintain original order
    return 0;
  });
};

/**
 * Clean up old frequency data (optional - call periodically)
 * Removes data for items not accessed in the last 90 days
 */
export const cleanupOldFrequencyData = (type: 'profile' | 'org'): void => {
  const storageKey = type === 'profile' ? STORAGE_KEY_PROFILES : STORAGE_KEY_ORGS;
  const data = getFrequencyData(storageKey);
  const now = Date.now();
  const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
  
  const cleaned: FrequencyData = {};
  Object.entries(data).forEach(([key, record]) => {
    if (record.lastAccessed > ninetyDaysAgo) {
      cleaned[key] = record;
    }
  });
  
  saveFrequencyData(storageKey, cleaned);
};
