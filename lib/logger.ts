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

// Determine env-driven defaults
function resolveEnvOptions(): Required<LoggerOptions> {
  // Prefer client-exposed env in browser
  const isProd = process.env.NODE_ENV === 'production'
  const enabledEnv = (typeof process !== 'undefined' && (process as any)?.env?.NEXT_PUBLIC_ENABLE_LOGS) || (process as any)?.env?.ENABLE_LOGS
  const levelEnv = ((process as any)?.env?.NEXT_PUBLIC_LOG_LEVEL || (process as any)?.env?.LOG_LEVEL || '').toLowerCase()

  const enabled = enabledEnv !== 'false' && !isProd ? true : enabledEnv === 'true'
  const minLevel: LogLevel = (['debug','info','warn','error'].includes(levelEnv) ? levelEnv : (isProd ? 'warn' : 'info')) as LogLevel

  return { enabled, minLevel }
}

// Default options
const defaultOptions: LoggerOptions = resolveEnvOptions()

// Create a logger that works in both browser and Node.js environments
const createClientSafeLogger = (options: LoggerOptions = {}) => {
  const envOptions = resolveEnvOptions()
  const mergedOptions = { ...envOptions, ...options };
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
      if (LOG_LEVELS[minLevel as LogLevel] <= LOG_LEVELS.error) {
        console.error(`[ERROR] ${message}`, ...args);
      }
    }
  };
};

// Export a pre-configured logger instance
export const logger = createClientSafeLogger();

// Also export the factory function for creating custom loggers
export default createClientSafeLogger;