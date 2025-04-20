import { randomBytes, createHash } from "crypto"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

// CSRF token configuration
const CSRF_COOKIE_NAME = "csrf_token"
const CSRF_HEADER_NAME = "x-csrf-token"
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Generate a CSRF token and set it as a cookie
 */
export function generateCsrfToken(): string {
  // Generate a random token
  const token = randomBytes(32).toString("hex")

  // Hash the token for storage
  const hashedToken = createHash("sha256").update(token).digest("hex")

  // Set the token as a cookie
  cookies().set({
    name: CSRF_COOKIE_NAME,
    value: hashedToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CSRF_TOKEN_EXPIRY / 1000, // Convert to seconds
  })

  return token
}

/**
 * Validate a CSRF token from a request
 */
export function validateCsrfToken(req: NextRequest): boolean {
  // Get the token from the request header
  const requestToken = req.headers.get(CSRF_HEADER_NAME)

  if (!requestToken) {
    return false
  }

  // Get the stored token from cookies
  const storedToken = cookies().get(CSRF_COOKIE_NAME)?.value

  if (!storedToken) {
    return false
  }

  // Hash the request token and compare with the stored token
  const hashedRequestToken = createHash("sha256").update(requestToken).digest("hex")

  return hashedRequestToken === storedToken
}

/**
 * CSRF protection middleware for API routes
 */
export function withCsrfProtection(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    // Skip CSRF validation for GET requests
    if (req.method === "GET") {
      return handler(req)
    }

    // Validate the CSRF token
    if (!validateCsrfToken(req)) {
      return new NextResponse(JSON.stringify({ error: "Invalid CSRF token" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    return handler(req)
  }
}

/**
 * Get a CSRF token for client-side use
 */
export function getCsrfToken(): string {
  return generateCsrfToken()
}
