/**
 * Production-safe logger utility
 * 
 * Logs are only output in development mode (NODE_ENV !== 'production').
 * In production builds, all log calls become no-ops for performance and security.
 */

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Development-only logger
 * All methods are no-ops in production builds
 */
export const logger = {
  /**
   * Log general information (dev only)
   */
  log: (...args: unknown[]): void => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log debug information (dev only)
   */
  debug: (...args: unknown[]): void => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Log informational messages (dev only)
   */
  info: (...args: unknown[]): void => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Log warnings (always shown - these indicate potential issues)
   */
  warn: (...args: unknown[]): void => {
    console.warn(...args);
  },

  /**
   * Log errors (always shown - these indicate actual problems)
   */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },

  /**
   * Group logs together (dev only)
   */
  group: (label: string): void => {
    if (isDev) {
      console.group(label);
    }
  },

  /**
   * End log group (dev only)
   */
  groupEnd: (): void => {
    if (isDev) {
      console.groupEnd();
    }
  },

  /**
   * Log with timestamp prefix (dev only)
   */
  timestamp: (...args: unknown[]): void => {
    if (isDev) {
      const time = new Date().toISOString();
      console.log(`[${time}]`, ...args);
    }
  },
};

export default logger;
