/**
 * Security Audit Utility
 *
 * This file contains functions to help with security auditing and monitoring.
 * It can be used to detect potential security issues and log security events.
 */

import type { NextRequest } from "next/server"

// Security event types
export enum SecurityEventType {
  AUTHENTICATION_FAILURE = "authentication_failure",
  AUTHORIZATION_FAILURE = "authorization_failure",
  RESOURCE_ACCESS_DENIED = "resource_access_denied",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  CSRF_FAILURE = "csrf_failure",
}

// Security event severity
export enum SecurityEventSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Security event interface
interface SecurityEvent {
  type: SecurityEventType
  severity: SecurityEventSeverity
  message: string
  userId?: string
  ip?: string
  userAgent?: string
  path?: string
  timestamp: Date
  metadata?: Record<string, any>
}

// Rate limiting configuration
const rateLimits: Record<
  string,
  { limit: number; window: number; ips: Record<string, { count: number; resetAt: number }> }
> = {
  authentication: { limit: 5, window: 60 * 1000, ips: {} }, // 5 attempts per minute
  api: { limit: 100, window: 60 * 1000, ips: {} }, // 100 requests per minute
}

/**
 * Log a security event
 */
export function logSecurityEvent(event: Omit<SecurityEvent, "timestamp">) {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: new Date(),
  }

  // Log the event based on severity
  if (
    securityEvent.severity === SecurityEventSeverity.HIGH ||
    securityEvent.severity === SecurityEventSeverity.CRITICAL
  ) {
    console.error(`[SECURITY] ${securityEvent.type}: ${securityEvent.message}`, {
      userId: securityEvent.userId,
      ip: securityEvent.ip,
      path: securityEvent.path,
    })
  } else if (securityEvent.severity === SecurityEventSeverity.MEDIUM) {
    console.warn(`[SECURITY] ${securityEvent.type}: ${securityEvent.message}`)
  } else {
    console.info(`[SECURITY] ${securityEvent.type}: ${securityEvent.message}`)
  }

  // In a production environment, you would store this event in a database
  // or send it to a security monitoring service
}

/**
 * Check if a request is rate limited
 */
export function isRateLimited(req: NextRequest, category: string): boolean {
  const ip = req.ip || "unknown"
  const now = Date.now()

  // Get rate limit configuration for the category
  const rateLimit = rateLimits[category]
  if (!rateLimit) {
    return false
  }

  // Clean up expired entries
  Object.keys(rateLimit.ips).forEach((ipAddress) => {
    if (rateLimit.ips[ipAddress].resetAt < now) {
      delete rateLimit.ips[ipAddress]
    }
  })

  // Check if IP exists in the rate limit tracker
  if (!rateLimit.ips[ip]) {
    rateLimit.ips[ip] = {
      count: 0,
      resetAt: now + rateLimit.window,
    }
  }

  // Check if the window has expired
  if (rateLimit.ips[ip].resetAt < now) {
    rateLimit.ips[ip] = {
      count: 0,
      resetAt: now + rateLimit.window,
    }
  }

  // Increment the count
  rateLimit.ips[ip].count++

  // Check if the limit has been exceeded
  if (rateLimit.ips[ip].count > rateLimit.limit) {
    // Log the rate limit event
    logSecurityEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: SecurityEventSeverity.MEDIUM,
      message: `Rate limit exceeded for ${category}`,
      ip,
      path: req.nextUrl.pathname,
    })

    return true
  }

  return false
}

/**
 * Extract client information from a request
 */
export function extractClientInfo(req: NextRequest) {
  return {
    ip: req.ip || "unknown",
    userAgent: req.headers.get("user-agent") || "unknown",
    path: req.nextUrl.pathname,
    method: req.method,
  }
}

/**
 * Check for suspicious request patterns
 */
export function detectSuspiciousActivity(req: NextRequest): boolean {
  const { ip, userAgent, path, method } = extractClientInfo(req)

  // Check for missing user agent
  if (!userAgent || userAgent === "unknown") {
    logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity: SecurityEventSeverity.LOW,
      message: "Request with missing user agent",
      ip,
      path,
    })
    return true
  }

  // Check for suspicious user agents
  const suspiciousUserAgents = ["sqlmap", "nikto", "nmap", "masscan", "zgrab", "gobuster", "dirbuster"]

  if (suspiciousUserAgents.some((agent) => userAgent.toLowerCase().includes(agent))) {
    logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity: SecurityEventSeverity.HIGH,
      message: "Request with suspicious user agent",
      ip,
      userAgent,
      path,
    })
    return true
  }

  // Check for suspicious paths
  const suspiciousPaths = [
    "/wp-admin",
    "/wp-login",
    "/admin",
    "/administrator",
    "/phpmyadmin",
    "/.env",
    "/config",
    "/.git",
  ]

  if (suspiciousPaths.some((suspiciousPath) => path.includes(suspiciousPath))) {
    logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity: SecurityEventSeverity.MEDIUM,
      message: "Request to suspicious path",
      ip,
      path,
    })
    return true
  }

  return false
}

/**
 * Security middleware for API routes
 */
export function withSecurityAudit(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    // Extract client information
    const { ip, path, method } = extractClientInfo(req)

    // Check for rate limiting
    if (isRateLimited(req, "api")) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Check for suspicious activity
    if (detectSuspiciousActivity(req)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Log the request
    if (process.env.NODE_ENV === "production") {
      console.info(`[API] ${method} ${path} from ${ip}`)
    }

    // Call the handler
    try {
      return await handler(req)
    } catch (error) {
      // Log unexpected errors
      logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecurityEventSeverity.HIGH,
        message: "Unexpected error in API handler",
        ip,
        path,
        metadata: { error: error.message },
      })

      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  }
}
