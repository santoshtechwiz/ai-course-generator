/**
 * Logger Utility
 *
 * This file provides a centralized logging system for the application.
 * It supports different log levels and can be configured to output to
 * different destinations based on the environment.
 */

// Log levels in order of severity
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Current log level based on environment
const currentLogLevel =
  process.env.NODE_ENV === "production"
    ? LogLevel.INFO
    : process.env.LOG_LEVEL
      ? Number.parseInt(process.env.LOG_LEVEL)
      : LogLevel.DEBUG

/**
 * Creates a logger instance with the specified name
 *
 * @param name - The name of the logger (typically the module name)
 * @returns A logger object with methods for each log level
 */
export function createLogger(name: string) {
  return {
    debug: (message: string, ...args: any[]) => {
      if (currentLogLevel <= LogLevel.DEBUG) {
        console.debug(`[${name}] ${message}`, ...args)
      }
    },
    info: (message: string, ...args: any[]) => {
      if (currentLogLevel <= LogLevel.INFO) {
        console.info(`[${name}] ${message}`, ...args)
      }
    },
    warn: (message: string, ...args: any[]) => {
      if (currentLogLevel <= LogLevel.WARN) {
        console.warn(`[${name}] ${message}`, ...args)
      }
    },
    error: (message: string, ...args: any[]) => {
      if (currentLogLevel <= LogLevel.ERROR) {
        console.error(`[${name}] ${message}`, ...args)
      }
    },
  }
}

/**
 * Global application logger
 */
export const logger = createLogger("app")

/**
 * Formats an error for logging
 *
 * @param error - The error to format
 * @returns A formatted error object
 */
export function formatError(error: unknown): Record<string, any> {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
    }
  }
  return { message: String(error) }
}
