/**
 * MAANG-grade utility functions for data formatting
 * Handles dates, null values, and data display elegantly
 */

import { formatDistanceToNow, parseISO, format, isValid } from 'date-fns';

/**
 * Format a timestamp to a relative time string (e.g., "2 minutes ago")
 * Falls back to formatted date for older timestamps
 */
export const formatRelativeTime = (timestamp: string | null | undefined): string => {
  if (!timestamp) return 'Never';
  
  try {
    const date = parseISO(timestamp);
    if (!isValid(date)) return 'Invalid date';
    
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    // Use relative time for recent timestamps (within 7 days)
    if (diffInHours < 168) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    
    // Use formatted date for older timestamps
    return format(date, 'MMM d, yyyy');
  } catch {
    return timestamp;
  }
};

/**
 * Format date and time separately for login records
 * Now uses the time string from backend which includes timezone
 */
export const formatLoginDateTime = (date: string, time: string): { 
  relative: string; 
  formatted: string;
  timeOnly: string;
  fullDate: string;
} => {
  try {
    // Parse the full timestamp
    const parsedDate = new Date(date);
    
    if (!isValid(parsedDate)) {
      return { 
        relative: 'Unknown', 
        formatted: time,
        timeOnly: time,
        fullDate: `${date} ${time}` 
      };
    }
    
    // Get relative time (e.g., "less than a minute ago")
    const relativeTime = formatDistanceToNow(parsedDate, { addSuffix: true });
    
    // Format time in 12-hour format (e.g., "9:09 PM")
    const timeOnly = format(parsedDate, 'h:mm a');
    
    // Format full date
    const formattedDate = format(parsedDate, 'MMM d, yyyy');
    
    return {
      relative: relativeTime,
      formatted: time, // Backend timezone format
      timeOnly: timeOnly,
      fullDate: `${formattedDate} at ${timeOnly}`
    };
  } catch {
    return { 
      relative: 'Unknown', 
      formatted: time,
      timeOnly: time,
      fullDate: `${date} ${time}` 
    };
  }
};

/**
 * Elegantly handle null/unknown values
 * MAANG standard: Never show raw "Unknown" or "N/A"
 */
export const formatNullableValue = (
  value: string | null | undefined,
  options: {
    type?: 'location' | 'isp' | 'ip' | 'generic';
    fallback?: string;
  } = {}
): { display: string; isUnknown: boolean } => {
  const { type = 'generic', fallback } = options;
  
  if (!value || value === 'Unknown' || value === 'N/A' || value === 'null') {
    const fallbacks: Record<string, string> = {
      location: 'Location undisclosed',
      isp: 'Provider unlisted',
      ip: 'IP masked',
      generic: fallback || 'Not available',
    };
    
    return { display: fallbacks[type], isUnknown: true };
  }
  
  return { display: value, isUnknown: false };
};

/**
 * Format credential count with proper grammar and empty state messaging
 */
export const formatCredentialCount = (count: number): {
  text: string;
  isEmpty: boolean;
  action: string;
} => {
  if (count === 0) {
    return {
      text: 'No credentials yet',
      isEmpty: true,
      action: 'Add your first credential'
    };
  }
  
  if (count === 1) {
    return {
      text: '1 credential',
      isEmpty: false,
      action: 'View credential'
    };
  }
  
  return {
    text: `${count} credentials`,
    isEmpty: false,
    action: 'View credentials'
  };
};

/**
 * Mask sensitive data for display
 */
export const maskSensitiveData = (
  value: string,
  options: { 
    type: 'email' | 'username' | 'phone' | 'full';
    showChars?: number;
  } = { type: 'full' }
): string => {
  if (!value) return '';
  
  const { type, showChars = 3 } = options;
  
  switch (type) {
    case 'email': {
      const [local, domain] = value.split('@');
      if (!domain) return maskSensitiveData(value, { type: 'full' });
      const maskedLocal = local.slice(0, showChars) + '•'.repeat(Math.max(0, local.length - showChars));
      return `${maskedLocal}@${domain}`;
    }
    case 'username': {
      if (value.length <= showChars) return '•'.repeat(value.length);
      return value.slice(0, showChars) + '•'.repeat(value.length - showChars);
    }
    case 'phone': {
      if (value.length <= 4) return '•'.repeat(value.length);
      return '•'.repeat(value.length - 4) + value.slice(-4);
    }
    case 'full':
    default:
      return '•'.repeat(value.length);
  }
};

/**
 * Format security score with label
 */
export const getSecurityScoreLabel = (score: number): {
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
} => {
  if (score >= 90) return { 
    label: 'Excellent', 
    color: '#22c55e', 
    bgClass: 'bg-green-500/10',
    textClass: 'text-green-500'
  };
  if (score >= 70) return { 
    label: 'Good', 
    color: '#3b82f6', 
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-500'
  };
  if (score >= 50) return { 
    label: 'Fair', 
    color: '#f59e0b', 
    bgClass: 'bg-yellow-500/10',
    textClass: 'text-yellow-500'
  };
  return { 
    label: 'Needs Attention', 
    color: '#ef4444', 
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-500'
  };
};
