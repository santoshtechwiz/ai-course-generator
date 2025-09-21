import { NextResponse } from "next/server";

/**
 * Security Service
 * Handles sensitive data, token management, and security-related utilities
 */
export class SecurityService {
  // Static pattern for sensitive data detection
  private static readonly sensitiveTest = new RegExp(
    /(password|token|secret|key|auth|bearer|credit|card|cvv|ccv|cvc|exp|pan|ssn|email|phone|address|dob|birthdate|api[_-]?key|client[_-]?secret|access[_-]?token|private|confidential|internal)/i
  );

  /**
   * Mask sensitive string for logging
   * Shows only first and last characters
   */
  static maskSensitiveString(str: string): string {
    if (!str || str.length < 3) return '[MASKED]';
    
    const first = str.charAt(0);
    const last = str.charAt(str.length - 1);
    const middle = '*'.repeat(Math.max(str.length - 2, 3));
    
    return `${first}${middle}${last}`;
  }

  /**
   * Redact sensitive data from objects
   * @param data Object potentially containing sensitive data
   * @returns Redacted copy of the object
   */
  static redactSensitiveData(data: any): any {
    if (!data) return data;

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.redactSensitiveData(item));
    }

    // Handle objects
    if (typeof data === 'object') {
      const redacted = { ...data };
      
      for (const key of Object.keys(redacted)) {
        if (this.sensitiveTest.test(key)) {
          redacted[key] = '[REDACTED]';
        } else if (typeof redacted[key] === 'object') {
          redacted[key] = this.redactSensitiveData(redacted[key]);
        }
      }
      
      return redacted;
    }

    return data;
  }

  /**
   * Sanitize error object for safe logging and client responses
   * Removes sensitive data and standardizes error format
   */
  static sanitizeError(error: any): {
    message: string;
    code: string;
    details?: any;
    timestamp?: string;
    requestId?: string;
  } {
    // Remove sensitive information
    const sanitized: {
      message: string;
      code: string;
      details?: any;
      timestamp: string;
      requestId: string;
    } = {
      message: this.sanitizeErrorMessage(error?.message) || "An error occurred",
      code: error?.code || "UNKNOWN_ERROR",
      timestamp: new Date().toISOString(),
      requestId: error?.requestId || crypto.randomUUID()
    };

    // Enhanced logging in development
    if (process.env.NODE_ENV === "development") {
      console.debug("Original error:", error);
      if (error?.details) {
        sanitized.details = this.redactSensitiveData(error.details);
      }
    }

    return sanitized;
  }

  /**
   * Sanitize error message to remove sensitive data
   */
  static sanitizeErrorMessage(message: string): string {
    if (!message || typeof message !== 'string') return "";
    
    // Remove common sensitive patterns from error messages
    return message
      .replace(/password=\w+/gi, 'password=[REDACTED]')
      .replace(/token=\w+/gi, 'token=[REDACTED]')
      .replace(/key=\w+/gi, 'key=[REDACTED]')
      .replace(/secret=\w+/gi, 'secret=[REDACTED]');
  }

  /**
   * Create a secure error response
   * Ensures no sensitive data is leaked
   */
  static createSecureErrorResponse(error: any): NextResponse {
    const sanitized = this.sanitizeError(error);
    
    const headers = new Headers();
    headers.set('Content-Security-Policy', "default-src 'self'");
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    if (sanitized.requestId) {
      headers.set('X-Request-ID', sanitized.requestId);
    }

    return NextResponse.json(
      {
        error: sanitized.message,
        code: sanitized.code,
        timestamp: sanitized.timestamp
      },
      { 
        status: this.getErrorStatusCode(error),
        headers
      }
    );
  }

  /**
   * Get appropriate HTTP status code for error
   */
  private static getErrorStatusCode(error: any): number {
    if (error?.status && typeof error.status === 'number') {
      return error.status;
    }
    
    if (error?.code) {
      switch (error.code) {
        case 'AUTHENTICATION_REQUIRED':
        case 'UNAUTHORIZED':
          return 401;
        case 'PERMISSION_DENIED':
        case 'FORBIDDEN':
          return 403;
        case 'NOT_FOUND':
          return 404;
        case 'VALIDATION_ERROR':
        case 'BAD_REQUEST':
          return 400;
        case 'RATE_LIMIT_EXCEEDED':
          return 429;
        default:
          return 500;
      }
    }
    
    return 500;
  }
}