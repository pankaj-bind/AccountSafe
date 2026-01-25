// src/utils/csvParser.ts
/**
 * CSV Parser Utility for Browser Password Imports
 * 
 * ZERO-KNOWLEDGE: This runs entirely client-side.
 * The CSV is parsed in-browser and NEVER sent to the server unencrypted.
 * 
 * Supports Chrome, Edge, Firefox, and other browser password exports.
 */

import Papa from 'papaparse';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Raw row from a browser password CSV
 */
export interface RawCSVRow {
  name?: string;
  url?: string;
  username?: string;
  password?: string;
  note?: string;
  notes?: string;
  // Alternative column names from different browsers
  website?: string;
  login_uri?: string;
  login_username?: string;
  login_password?: string;
  // Edge specific
  title?: string;
}

/**
 * Normalized credential from CSV
 */
export interface ParsedCredential {
  /** Display name (extracted from URL or CSV name column) */
  name: string;
  /** Original URL from the CSV */
  url: string;
  /** Username/email for login */
  username: string;
  /** Password (plaintext from CSV, will be encrypted before upload) */
  password: string;
  /** Notes (optional) */
  note: string;
  /** Domain extracted from URL for grouping */
  domain: string;
}

/**
 * Result of CSV parsing
 */
export interface CSVParseResult {
  success: boolean;
  credentials: ParsedCredential[];
  errors: string[];
  totalRows: number;
  validRows: number;
  skippedRows: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract domain from URL
 * e.g., "https://accounts.google.com/login" -> "google.com"
 */
export function extractDomain(url: string): string {
  if (!url) return '';
  
  try {
    // Handle URLs without protocol
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    const urlObj = new URL(normalizedUrl);
    let hostname = urlObj.hostname.toLowerCase();
    
    // Remove www. prefix
    hostname = hostname.replace(/^www\./, '');
    
    // For subdomains like accounts.google.com, try to get main domain
    const parts = hostname.split('.');
    if (parts.length > 2) {
      // Keep last two parts for most TLDs
      // Special handling for country TLDs like .co.uk, .com.au
      const knownSecondLevelTLDs = ['co', 'com', 'org', 'net', 'edu', 'gov', 'ac'];
      if (parts.length > 2 && knownSecondLevelTLDs.includes(parts[parts.length - 2])) {
        hostname = parts.slice(-3).join('.');
      } else {
        hostname = parts.slice(-2).join('.');
      }
    }
    
    return hostname;
  } catch {
    // If URL parsing fails, try to extract domain manually
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^/\s]+)/i);
    return match ? match[1].toLowerCase() : url.toLowerCase();
  }
}

/**
 * Extract a display name from domain or URL
 * e.g., "google.com" -> "Google"
 */
export function extractDisplayName(domain: string, csvName?: string): string {
  // If CSV has a name, prefer it
  if (csvName && csvName.trim() && csvName.trim() !== domain) {
    return csvName.trim();
  }
  
  if (!domain) return 'Unknown';
  
  // Remove TLD and capitalize
  const baseName = domain.split('.')[0];
  return baseName.charAt(0).toUpperCase() + baseName.slice(1);
}

/**
 * Normalize column names to handle different browser exports
 */
function normalizeRow(row: RawCSVRow): ParsedCredential {
  // Handle different column name conventions from various browsers
  const url = row.url || row.website || row.login_uri || '';
  const domain = extractDomain(url);
  
  return {
    name: row.name || row.title || extractDisplayName(domain),
    url: url,
    username: row.username || row.login_username || '',
    password: row.password || row.login_password || '',
    note: row.note || row.notes || '',
    domain: domain,
  };
}

/**
 * Validate a credential row has minimum required data
 */
function isValidCredential(cred: ParsedCredential): boolean {
  // Must have at least a URL/domain and password
  return !!(cred.domain && cred.password);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PARSER FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Parse a CSV file containing browser password exports
 * 
 * @param file - File object from file input or drag-drop
 * @returns Promise resolving to parse result with credentials
 * 
 * SECURITY: This function runs entirely in the browser.
 * The file contents are NEVER transmitted anywhere.
 */
export function parsePasswordCSV(file: File): Promise<CSVParseResult> {
  return new Promise((resolve) => {
    const errors: string[] = [];
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      resolve({
        success: false,
        credentials: [],
        errors: ['Invalid file type. Please upload a CSV file.'],
        totalRows: 0,
        validRows: 0,
        skippedRows: 0,
      });
      return;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      resolve({
        success: false,
        credentials: [],
        errors: ['File too large. Maximum size is 10MB.'],
        totalRows: 0,
        validRows: 0,
        skippedRows: 0,
      });
      return;
    }
    
    Papa.parse<RawCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, '_'),
      complete: (results) => {
        const credentials: ParsedCredential[] = [];
        let skippedRows = 0;
        
        // Check for parsing errors
        if (results.errors.length > 0) {
          results.errors.forEach((err) => {
            errors.push(`Row ${err.row}: ${err.message}`);
          });
        }
        
        // Process each row
        results.data.forEach((row, index) => {
          try {
            const normalized = normalizeRow(row);
            
            if (isValidCredential(normalized)) {
              credentials.push(normalized);
            } else {
              skippedRows++;
              if (Object.values(row).some(v => v && String(v).trim())) {
                // Only log if row had some data (not completely empty)
                errors.push(`Row ${index + 2}: Missing required fields (URL or password)`);
              }
            }
          } catch (err) {
            skippedRows++;
            errors.push(`Row ${index + 2}: Failed to parse row`);
          }
        });
        
        resolve({
          success: credentials.length > 0,
          credentials,
          errors: errors.slice(0, 10), // Limit to first 10 errors
          totalRows: results.data.length,
          validRows: credentials.length,
          skippedRows,
        });
      },
      error: (error) => {
        resolve({
          success: false,
          credentials: [],
          errors: [`Failed to parse CSV: ${error.message}`],
          totalRows: 0,
          validRows: 0,
          skippedRows: 0,
        });
      },
    });
  });
}

/**
 * Parse CSV from string content (for testing or pasting)
 */
export function parsePasswordCSVFromString(content: string): Promise<CSVParseResult> {
  const blob = new Blob([content], { type: 'text/csv' });
  const file = new File([blob], 'passwords.csv', { type: 'text/csv' });
  return parsePasswordCSV(file);
}
