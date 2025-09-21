import { NextResponse } from "next/server"
import { SecurityService } from "./security-service"

type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    timestamp: string
    requestId?: string
  }
}

/**
 * API Response Handler
 * Creates standardized API responses with consistent format and error handling
 */
export class ApiResponseHandler {
  /**
   * Create a success response
   */
  static success<T>(data: T, metadata: Record<string, any> = {}): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    }

    return NextResponse.json(response)
  }

  /**
   * Create an error response
   */
  static error(error: any, status = 500): NextResponse {
    const sanitizedError = SecurityService.sanitizeError(error)
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: sanitizedError.code,
        message: sanitizedError.message,
        details: sanitizedError.details
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(response, { status })
  }

  /**
   * Create a validation error response
   */
  static validationError(message: string, details?: any): NextResponse {
    return this.error({
      code: "VALIDATION_ERROR",
      message,
      details: details ? SecurityService.redactSensitiveData(details) : undefined
    }, 400)
  }

  /**
   * Create a not found error response
   */
  static notFound(message = "Resource not found"): NextResponse {
    return this.error({
      code: "NOT_FOUND",
      message
    }, 404)
  }

  /**
   * Create an unauthorized error response
   */
  static unauthorized(message = "Unauthorized"): NextResponse {
    return this.error({
      code: "AUTHENTICATION_REQUIRED",
      message
    }, 401)
  }

  /**
   * Create a forbidden error response
   */
  static forbidden(message = "Permission denied"): NextResponse {
    return this.error({
      code: "PERMISSION_DENIED",
      message
    }, 403)
  }

  /**
   * Create a rate limit exceeded response
   */
  static rateLimit(message = "Rate limit exceeded"): NextResponse {
    return this.error({
      code: "RATE_LIMIT_EXCEEDED",
      message
    }, 429)
  }
}