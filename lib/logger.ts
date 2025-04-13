/**
 * Simple logger utility for consistent logging across the application
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogData {
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"

  /**
   * Log a debug message
   */
  debug(message: string, data?: LogData) {
    this.log("debug", message, data)
  }

  /**
   * Log an info message
   */
  info(message: string, data?: LogData) {
    this.log("info", message, data)
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: LogData) {
    this.log("warn", message, data)
  }

  /**
   * Log an error message
   */
  error(message: string, data?: LogData) {
    this.log("error", message, data)
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, data?: LogData) {
    const timestamp = new Date().toISOString()
    const logObject = {
      timestamp,
      level,
      message,
      ...(data || {}),
    }

    // In development, log with colors and formatting
    if (this.isDevelopment) {
      const colors = {
        debug: "\x1b[34m", // Blue
        info: "\x1b[32m", // Green
        warn: "\x1b[33m", // Yellow
        error: "\x1b[31m", // Red
        reset: "\x1b[0m", // Reset
      }

      console[level === "debug" ? "log" : level](
        `${colors[level]}[${level.toUpperCase()}]${colors.reset} ${message}`,
        data ? data : "",
      )
    } else {
      // In production, log structured JSON for easier parsing
      console[level === "debug" ? "log" : level](JSON.stringify(logObject))
    }
  }
}

export const logger = new Logger()
