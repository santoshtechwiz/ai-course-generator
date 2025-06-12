/**
 * Simple logging utility for the application
 * 
 * This logger works on both client and server environments
 */

// Define log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  // Control whether logging is enabled
  enabled?: boolean;
  // Minimum level to log
  minLevel?: LogLevel;
}

// Define log level hierarchy
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default options
const defaultOptions: LoggerOptions = {
  enabled: process.env.NODE_ENV !== 'production',
  minLevel: 'info',
};

// Create a logger that works in both browser and Node.js environments
const createClientSafeLogger = (options: LoggerOptions = {}) => {
  const mergedOptions = { ...defaultOptions, ...options };
  const { enabled, minLevel } = mergedOptions;

  return {
    debug: (message: string, ...args: any[]) => {
      if (enabled && LOG_LEVELS[minLevel as LogLevel] <= LOG_LEVELS.debug) {
        console.debug(`[DEBUG] ${message}`, ...args);
      }
    },
    info: (message: string, ...args: any[]) => {
      if (enabled && LOG_LEVELS[minLevel as LogLevel] <= LOG_LEVELS.info) {
        console.info(`[INFO] ${message}`, ...args);
      }
    },
    warn: (message: string, ...args: any[]) => {
      if (enabled && LOG_LEVELS[minLevel as LogLevel] <= LOG_LEVELS.warn) {
        console.warn(`[WARN] ${message}`, ...args);
      }
    },
    error: (message: string, ...args: any[]) => {
      if (enabled && LOG_LEVELS[minLevel as LogLevel] <= LOG_LEVELS.error) {
        console.error(`[ERROR] ${message}`, ...args);
      }
    }
  };
};

// Export a pre-configured logger instance
export const logger = createClientSafeLogger();

// Also export the factory function for creating custom loggers
export default createClientSafeLogger;