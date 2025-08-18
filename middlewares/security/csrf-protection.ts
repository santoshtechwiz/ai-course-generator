import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import crypto from "crypto"

/**
 * Enhanced CSRF protection middleware with improved security
 */

// CSRF configuration
const CSRF_CONFIG = {
  tokenLength: 32,
  headerName: 'x-csrf-token',
  cookieName: 'csrf-token',
  exemptPaths: [
    '/api/auth', // NextAuth endpoints
    '/api/webhooks', // Webhook endpoints
    '/api/health', // Health check endpoints
  ]
} as const

/**
 * Generate a secure CSRF token
 */
function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_CONFIG.tokenLength).toString('hex')
}

/**
 * Create CSRF token based on session
 */
function createSessionCSRFToken(sessionToken: any): string {
  const tokenData = `${sessionToken.sub?.substring(0, 8)}-${sessionToken.iat}-${Date.now()}`
  return crypto.createHash('sha256').update(tokenData).digest('hex').substring(0, 32)
}

/**
 * Check if path is exempt from CSRF protection
 */
function isExemptPath(pathname: string): boolean {
  return CSRF_CONFIG.exemptPaths.some(path => pathname.startsWith(path))
}

/**
 * Enhanced CSRF middleware with better token validation
 */
export async function csrfMiddleware(req: NextRequest) {
  // Only apply to state-changing requests on API routes
  if (req.method === "GET" || !req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Skip exempt paths
  if (isExemptPath(req.nextUrl.pathname)) {
    return NextResponse.next()
  }

  try {
    // Check for auth token
    const sessionToken = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    // Skip CSRF check for non-authenticated routes
    if (!sessionToken) {
      return NextResponse.next()
    }

    // Get CSRF token from multiple possible sources
    const csrfToken = req.headers.get(CSRF_CONFIG.headerName) ||
                     req.headers.get('x-xsrf-token') ||
                     req.cookies.get(CSRF_CONFIG.cookieName)?.value

    // If logged in but no CSRF token, reject
    if (!csrfToken) {
      return new NextResponse(
        JSON.stringify({ 
          error: "CSRF token required",
          code: "CSRF_TOKEN_MISSING"
        }),
        { 
          status: 403, 
          headers: { 
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff"
          } 
        }
      )
    }

    // Create expected token value based on session data
    const expectedToken = createSessionCSRFToken(sessionToken)

    // Compare tokens using time-safe comparison
    if (!crypto.timingSafeEqual(
      Buffer.from(csrfToken, 'hex'),
      Buffer.from(expectedToken, 'hex')
    )) {
      return new NextResponse(
        JSON.stringify({ 
          error: "Invalid CSRF token",
          code: "CSRF_TOKEN_INVALID"
        }),
        { 
          status: 403, 
          headers: { 
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff"
          } 
        }
      )
    }

  } catch (error) {
    console.error("CSRF middleware error:", error)
    return new NextResponse(
      JSON.stringify({ 
        error: "CSRF validation failed",
        code: "CSRF_VALIDATION_ERROR"
      }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff"
        } 
      }
    )
  }

  // Continue with request
  return NextResponse.next()
}

/**
 * Generate CSRF token for client use
 */
export function generateClientCSRFToken(sessionToken: any): string {
  return createSessionCSRFToken(sessionToken)
}
