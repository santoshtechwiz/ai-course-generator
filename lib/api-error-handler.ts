/**
 * Server-side API Error Handler Utility
 * Provides consistent error handling for API routes
 */

import { NextResponse } from "next/server"

/**
 * Common error messages and their corresponding HTTP status codes
 */
const ERROR_STATUS_MAP: Record<string, number> = {
  // Authentication errors
  "Unauthorized": 401,
  "Session expired": 401,
  "Invalid token": 401,

  // Authorization errors
  "Forbidden": 403,
  "Access denied": 403,
  "Insufficient permissions": 403,

  // Not found errors
  "Course not found": 404,
  "Quiz not found": 404,
  "User not found": 404,
  "Resource not found": 404,

  // Validation errors
  "Bad request": 400,
  "Invalid input": 400,
  "Validation failed": 400,
  "Rating must be between 1 and 5": 400,
  "Missing required fields": 400,

  // Payment/Billing errors
  "Insufficient credits": 402,
  "Payment required": 402,
  "Subscription required": 402,

  // Rate limiting
  "Too many requests": 429,
  "Rate limit exceeded": 429,

  // Server errors
  "Internal server error": 500,
  "Database error": 500,
  "Service unavailable": 503,
}

/**
 * Handle API errors with consistent formatting and status codes
 */
export function handleApiError(error: unknown, customStatusMap?: Record<string, number>): NextResponse {
  const errorMessage = error instanceof Error ? error.message : "Internal Server Error"

  // Merge custom status map with default map
  const statusMap = { ...ERROR_STATUS_MAP, ...(customStatusMap || {}) }

  // Get status code from error message mapping
  const status = statusMap[errorMessage] || 500

  // Log error for debugging
  console.error(`API Error [${status}]:`, error)

  return NextResponse.json(
    {
      error: errorMessage,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: error instanceof Error ? error.stack : undefined })
    },
    { status }
  )
}

/**
 * Create a standardized success response
 */
export function createApiResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString()
    },
    { status }
  )
}

/**
 * Create a standardized error response with custom message
 */
export function createApiError(message: string, status: number = 500, details?: any): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString()
    },
    { status }
  )
}