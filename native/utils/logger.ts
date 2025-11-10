/**
 * Production-safe logging utility
 * Only logs in development, sends errors to monitoring in production
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Debug logging - only in development
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Warning logging - only in development
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Error logging - always logs, can be sent to monitoring service
   */
  error: (...args: any[]) => {
    console.error(...args);
    
    // In production, send to error monitoring service
    if (!isDevelopment) {
      // TODO: Send to Sentry/LogRocket/etc
      // Example: Sentry.captureException(args[0]);
    }
  },

  /**
   * Info logging - only in development
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};
