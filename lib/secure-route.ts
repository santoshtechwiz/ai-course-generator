/**
 * Security Wrapper for API Routes
 * Higher-order functions to easily secure API endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { securityMiddleware, SecurityConfig } from '@/lib/security'
import { observabilityIntegration } from '@/lib/observability'

/**
 * Wrap an API route handler with security middleware
 */
export function withSecurity(
  config: SecurityConfig = {}
) {
  return function <T extends any[], R>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse<R>> | NextResponse<R>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse<R>> => {
      // Apply security checks
      const securityResult = await securityMiddleware.applySecurity(request, config)

      if (!securityResult.success) {
        return securityResult.response as NextResponse<R>
      }

      try {
        // Execute the handler
        const response = await handler(request, ...args)

        // Apply security headers to the response
        return securityMiddleware.applySecurityHeaders(response) as NextResponse<R>

      } catch (error) {
        // Record the error
        observabilityIntegration.recordError(error as Error, {
          component: 'api_route',
          operation: 'handler_execution',
          route: request.nextUrl.pathname
        })

        // Return error response with security headers
        const errorResponse = NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )

        return securityMiddleware.applySecurityHeaders(errorResponse) as NextResponse<R>
      }
    }
  }
}

/**
 * Pre-configured security wrappers for common use cases
 */
export const secureRoute = {
  /**
   * Public API route with basic security (rate limiting, headers)
   */
  public: withSecurity({
    rateLimit: { windowMs: 60000, maxRequests: 100 }
  }),

  /**
   * Authenticated API route
   */
  authenticated: withSecurity({
    requireAuth: true,
    rateLimit: { windowMs: 60000, maxRequests: 100 }
  }),

  /**
   * Admin-only API route with stricter rate limiting
   */
  admin: withSecurity({
    requireAuth: true,
    rateLimit: { windowMs: 60000, maxRequests: 50 },
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
  }),

  /**
   * API route with input validation
   */
  withValidation: (validationRules: SecurityConfig['inputValidation']) =>
    withSecurity({
      requireAuth: true,
      inputValidation: validationRules,
      rateLimit: { windowMs: 60000, maxRequests: 100 }
    }),

  /**
   * CORS-enabled API route
   */
  withCORS: (origins: string[]) =>
    withSecurity({
      cors: { origins },
      rateLimit: { windowMs: 60000, maxRequests: 100 }
    }),

  /**
   * Custom security configuration
   */
  custom: withSecurity
}

/**
 * Example usage:
 *
 * // Basic authenticated route
 * export const GET = secureRoute.authenticated(async (request) => {
 *   // Your handler logic here
 *   return NextResponse.json({ data: 'success' })
 * })
 *
 * // Route with input validation
 * export const POST = secureRoute.withValidation([
 *   { field: 'email', type: 'email', required: true },
 *   { field: 'name', type: 'string', required: true, minLength: 2, maxLength: 100 }
 * ])(async (request) => {
 *   // Your handler logic here
 *   return NextResponse.json({ data: 'success' })
 * })
 */