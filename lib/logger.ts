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


// Central logging transport (HTTP POST)
async function sendCentralLog(level: LogLevel, message: string, meta?: any) {
  const endpoint = process.env.LOG_ENDPOINT || (typeof window !== 'undefined' ? (window as any).LOG_ENDPOINT : undefined);
  if (!endpoint) return false;
  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        meta,
        env: process.env.NODE_ENV
      })
    });
    return true;
  } catch (err) {
    // Fallback to console if central logging fails
    return false;
  }
}

const createClientSafeLogger = (options: LoggerOptions = {}) => {
  const envOptions = resolveEnvOptions();
  const mergedOptions = { ...envOptions, ...options };
  const { enabled, minLevel } = mergedOptions;

  async function log(level: LogLevel, message: string, ...args: any[]) {
    const meta = args.length === 1 ? args[0] : args;
    const centralLogged = await sendCentralLog(level, message, meta);
    if (!centralLogged) {
      // Fallback to console
      switch (level) {
        case 'debug':
          if (enabled && LOG_LEVELS[minLevel] <= LOG_LEVELS.debug) console.debug(`[DEBUG] ${message}`, ...args);
          break;
        case 'info':
          if (enabled && LOG_LEVELS[minLevel] <= LOG_LEVELS.info) console.info(`[INFO] ${message}`, ...args);
          break;
        case 'warn':
          if (enabled && LOG_LEVELS[minLevel] <= LOG_LEVELS.warn) console.warn(`[WARN] ${message}`, ...args);
          break;
        case 'error':
          if (LOG_LEVELS[minLevel] <= LOG_LEVELS.error) console.error(`[ERROR] ${message}`, ...args);
          break;
      }
    }
  }

  return {
    debug: (message: string, ...args: any[]) => { log('debug', message, ...args); },
    info: (message: string, ...args: any[]) => { log('info', message, ...args); },
    warn: (message: string, ...args: any[]) => { log('warn', message, ...args); },
    error: (message: string, ...args: any[]) => { log('error', message, ...args); }
  };
};

// Export a pre-configured logger instance
export const logger = createClientSafeLogger();

// Also export the factory function for creating custom loggers
