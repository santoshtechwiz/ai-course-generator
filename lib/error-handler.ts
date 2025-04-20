import { NextResponse } from "next/server"

// Error severity levels
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Standard error codes
export enum ErrorCode {
  UNAUTHORIZED = "unauthorized",
  FORBIDDEN = "forbidden",
  NOT_FOUND = "not_found",
  BAD_REQUEST = "bad_request",
  INTERNAL_ERROR = "internal_error",
  VALIDATION_ERROR = "validation_error",
  RATE_LIMITED = "rate_limited",
}

// Error response interface
interface ErrorResponseOptions {
  message: string
  code: ErrorCode
  status: number
  severity?: ErrorSeverity
  details?: any
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(options: ErrorResponseOptions): NextResponse {
  // Log the error based on severity
  const { message, code, status, severity = ErrorSeverity.MEDIUM, details } = options

  // Only include details in non-production environments
  const responseBody = {
    error: {
      message,
      code,
      ...(process.env.NODE_ENV !== "production" && details ? { details } : {}),
    },
  }

  // Log errors based on severity
  if (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL) {
    console.error(`[${severity.toUpperCase()}] ${code}: ${message}`, details || "")
  } else if (severity === ErrorSeverity.MEDIUM) {
    console.warn(`[${severity.toUpperCase()}] ${code}: ${message}`)
  } else {
    console.info(`[${severity.toUpperCase()}] ${code}: ${message}`)
  }

  return NextResponse.json(responseBody, { status })
}

/**
 * Handle errors in API routes
 */
export function handleApiError(error: any): NextResponse {
  // Handle known error types
  if (error.name === "ValidationError") {
    return createErrorResponse({
      message: "Validation failed",
      code: ErrorCode.VALIDATION_ERROR,
      status: 400,
      details: error.errors,
    })
  }

  if (error.name === "UnauthorizedError") {
    return createErrorResponse({
      message: "Authentication required",
      code: ErrorCode.UNAUTHORIZED,
      status: 401,
    })
  }

  // Default error handling
  console.error("Unhandled API error:", error)

  return createErrorResponse({
    message: "An unexpected error occurred",
    code: ErrorCode.INTERNAL_ERROR,
    status: 500,
    severity: ErrorSeverity.HIGH,
  })
}
