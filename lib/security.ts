/**
 * Security Middleware
 * Comprehensive security hardening for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { observabilityIntegration } from '@/lib/observability'

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>()
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests

    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), windowMs)
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now()
    const entry = this.limits.get(identifier)

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return false
    }

    if (entry.count >= this.maxRequests) {
      return true
    }

    entry.count++
    return false
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.limits.get(identifier)
    if (!entry) return this.maxRequests

    return Math.max(0, this.maxRequests - entry.count)
  }

  getResetTime(identifier: string): number {
    const entry = this.limits.get(identifier)
    return entry?.resetTime || 0
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key)
      }
    }
  }
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================

const SECURITY_HEADERS = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'"
  ].join('; '),
  // Permissions policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()'
  ].join(', '),
  // HSTS (HTTP Strict Transport Security)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

interface ValidationRule {
  field: string
  type: 'string' | 'number' | 'boolean' | 'email' | 'url'
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean
}

class InputValidator {
  validate(data: Record<string, any>, rules: ValidationRule[]): ValidationError[] {
    const errors: ValidationError[] = []

    for (const rule of rules) {
      const value = data[rule.field]
      const isEmpty = value === undefined || value === null || value === ''

      // Check required fields
      if (rule.required && isEmpty) {
        errors.push({
          field: rule.field,
          message: `${rule.field} is required`
        })
        continue
      }

      // Skip validation for optional empty fields
      if (!rule.required && isEmpty) {
        continue
      }

      // Type validation
      if (!this.validateType(value, rule.type)) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be of type ${rule.type}`
        })
        continue
      }

      // String-specific validations
      if (rule.type === 'string' && typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must be at least ${rule.minLength} characters`
          })
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must be at most ${rule.maxLength} characters`
          })
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push({
            field: rule.field,
            message: `${rule.field} format is invalid`
          })
        }
      }

      // Email validation
      if (rule.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must be a valid email address`
          })
        }
      }

      // URL validation
      if (rule.type === 'url') {
        try {
          new URL(value)
        } catch {
          errors.push({
            field: rule.field,
            message: `${rule.field} must be a valid URL`
          })
        }
      }

      // Custom validation
      if (rule.custom && !rule.custom(value)) {
        errors.push({
          field: rule.field,
          message: `${rule.field} failed custom validation`
        })
      }
    }

    return errors
  }

  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number' && !isNaN(value)
      case 'boolean':
        return typeof value === 'boolean'
      case 'email':
      case 'url':
        return typeof value === 'string'
      default:
        return false
    }
  }
}

interface ValidationError {
  field: string
  message: string
}

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

interface SecurityConfig {
  rateLimit?: {
    windowMs?: number
    maxRequests?: number
  }
  requireAuth?: boolean
  allowedMethods?: string[]
  inputValidation?: ValidationRule[]
  cors?: {
    origins?: string[]
    methods?: string[]
    headers?: string[]
  }
}

export class SecurityMiddleware {
  private rateLimiter: RateLimiter
  private validator: InputValidator

  constructor() {
    this.rateLimiter = new RateLimiter(
      env.RATE_LIMIT_WINDOW_MS || 60000,
      env.RATE_LIMIT_MAX_REQUESTS || 100
    )
    this.validator = new InputValidator()
  }

  /**
   * Apply security middleware to a request
   */
  async applySecurity(
    request: NextRequest,
    config: SecurityConfig = {}
  ): Promise<{ success: boolean; response?: NextResponse; data?: any }> {
    try {
      // Rate limiting
      if (this.isRateLimited(request)) {
        observabilityIntegration.recordUserAction('rate_limit_exceeded', undefined, {
          ip: this.getClientIP(request),
          path: request.nextUrl.pathname
        })

        return {
          success: false,
          response: new NextResponse('Rate limit exceeded', {
            status: 429,
            headers: {
              'Retry-After': Math.ceil(this.rateLimiter.getResetTime(this.getClientIdentifier(request)) / 1000).toString(),
              'X-RateLimit-Remaining': '0'
            }
          })
        }
      }

      // Method validation
      if (config.allowedMethods && !config.allowedMethods.includes(request.method)) {
        return {
          success: false,
          response: new NextResponse('Method not allowed', { status: 405 })
        }
      }

      // CORS validation
      if (config.cors) {
        const corsCheck = this.validateCORS(request, config.cors)
        if (!corsCheck.valid) {
          return {
            success: false,
            response: new NextResponse('CORS policy violation', { status: 403 })
          }
        }
      }

      // Authentication check
      if (config.requireAuth) {
        const authCheck = await this.validateAuth(request)
        if (!authCheck.valid) {
          return {
            success: false,
            response: new NextResponse('Unauthorized', { status: 401 })
          }
        }
      }

      // Input validation for POST/PUT/PATCH requests
      if (config.inputValidation && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await request.json()
          const validationErrors = this.validator.validate(body, config.inputValidation)

          if (validationErrors.length > 0) {
            return {
              success: false,
              response: NextResponse.json({
                error: 'Validation failed',
                details: validationErrors
              }, { status: 400 })
            }
          }

          return { success: true, data: body }
        } catch (error) {
          return {
            success: false,
            response: NextResponse.json({
              error: 'Invalid JSON payload'
            }, { status: 400 })
          }
        }
      }

      return { success: true }

    } catch (error) {
      observabilityIntegration.recordError(error as Error, {
        component: 'security_middleware',
        operation: 'apply_security'
      })

      return {
        success: false,
        response: new NextResponse('Internal server error', { status: 500 })
      }
    }
  }

  /**
   * Apply security headers to response
   */
  applySecurityHeaders(response: NextResponse): NextResponse {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Add rate limit headers
    const clientId = this.getClientIdentifier({} as NextRequest) // Simplified for headers
    response.headers.set('X-RateLimit-Remaining', this.rateLimiter.getRemainingRequests(clientId).toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(this.rateLimiter.getResetTime(clientId) / 1000).toString())

    return response
  }

  private isRateLimited(request: NextRequest): boolean {
    const identifier = this.getClientIdentifier(request)
    return this.rateLimiter.isRateLimited(identifier)
  }

  private getClientIdentifier(request: NextRequest): string {
    // Use IP address as primary identifier
    const ip = this.getClientIP(request)
    return ip || 'unknown'
  }

  private getClientIP(request: NextRequest): string | null {
    // Check various headers for IP address
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const clientIP = request.headers.get('x-client-ip')

    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    if (realIP) return realIP
    if (clientIP) return clientIP

    return null
  }

  private validateCORS(request: NextRequest, cors: SecurityConfig['cors']): { valid: boolean } {
    if (!cors?.origins) return { valid: true }

    const origin = request.headers.get('origin')
    if (!origin) return { valid: true } // Allow requests without origin (server-to-server)

    return { valid: cors.origins.includes(origin) }
  }

  private async validateAuth(request: NextRequest): Promise<{ valid: boolean; user?: any }> {
    // This would integrate with your authentication system
    // For now, check for a simple API key or JWT token
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return { valid: false }
    }

    // Check API key
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      // Validate JWT token or API key here
      // This is a placeholder - integrate with your auth system
      return { valid: token.length > 10 } // Basic validation
    }

    return { valid: false }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const securityMiddleware = new SecurityMiddleware()
export { InputValidator, RateLimiter }
export type { SecurityConfig, ValidationRule, ValidationError }