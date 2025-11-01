/**
 * AI Context Utilities
 *
 * Helper functions for context creation, validation, and manipulation.
 */

import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { RequestSource } from '../types/context'

/**
 * Generate a unique request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${randomBytes(8).toString('hex')}`
}

/**
 * Extract IP address from request headers
 */
export function extractIPAddress(request: NextRequest): string | undefined {
  // Check various headers for IP address
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const clientIP = request.headers.get('x-client-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')

  // Use the first available IP, preferring more reliable headers
  const ip = cfConnectingIP || forwardedFor || realIP || clientIP

  if (!ip) return undefined

  // Handle forwarded-for which might contain multiple IPs
  return ip.split(',')[0].trim()
}

/**
 * Detect request source from headers and path
 */
export function detectRequestSource(request: NextRequest): RequestSource {
  const userAgent = request.headers.get('user-agent') || ''
  const path = request.nextUrl.pathname

  // Check for mobile user agents
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    return 'mobile'
  }

  // Check for API requests
  if (path.startsWith('/api/')) {
    return 'api'
  }

  // Default to web
  return 'web'
}

/**
 * Sanitize context data for logging
 */
export function sanitizeContextForLogging(context: any): any {
  if (!context) return context

  const sanitized = { ...context }

  // Remove sensitive information
  if (sanitized.metadata) {
    delete sanitized.metadata.sessionToken
    delete sanitized.metadata.apiKey
  }

  // Mask IP addresses partially
  if (sanitized.request?.ipAddress) {
    sanitized.request.ipAddress = maskIPAddress(sanitized.request.ipAddress)
  }

  return sanitized
}

/**
 * Mask IP address for logging (show first octet only)
 */
function maskIPAddress(ip: string): string {
  if (!ip) return ip

  const parts = ip.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.***.***.***`
  }

  const ipv6Parts = ip.split(':')
  if (ipv6Parts.length > 0) {
    return `${ipv6Parts[0]}:****:****:****:****:****:****:****`
  }

  return ip
}

/**
 * Validate context structure
 */
export function validateContextStructure(context: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!context) {
    errors.push('Context is null or undefined')
    return { isValid: false, errors }
  }

  // Required fields
  if (!context.userId) errors.push('Missing userId')
  if (!context.request?.id) errors.push('Missing request.id')
  if (typeof context.isAuthenticated !== 'boolean') errors.push('Missing or invalid isAuthenticated')

  // Subscription validation
  if (!context.subscription) {
    errors.push('Missing subscription')
  } else {
    if (!context.subscription.plan) errors.push('Missing subscription.plan')
    if (typeof context.subscription.isActive !== 'boolean') errors.push('Missing subscription.isActive')
    if (!context.subscription.credits) {
      errors.push('Missing subscription.credits')
    }
  }

  // Permissions validation
  if (!context.permissions) {
    errors.push('Missing permissions')
  } else {
    if (typeof context.permissions.canUseAI !== 'boolean') errors.push('Missing permissions.canUseAI')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Create a context summary for logging
 */
export function createContextSummary(context: any): string {
  if (!context) return 'null'

  return `user:${context.userId || 'unknown'}, plan:${context.subscription?.plan || 'unknown'}, credits:${context.subscription?.credits?.available || 0}, authenticated:${context.isAuthenticated}`
}