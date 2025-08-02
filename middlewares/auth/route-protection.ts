import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

/**
 * Enhanced route protection middleware with improved performance and security
 */

// Define protected routes configuration
const PROTECTED_ROUTES = {
  admin: ["/admin"],
  authenticated: [
    "/course", 
    "/dashboard/course", 
    "/dashboard/profile", 
    "/dashboard/subscription"
  ]
} as const

// Cache for token validation to improve performance
const tokenCache = new Map<string, { token: any; expires: number }>()
const CACHE_DURATION = 30 * 1000 // 30 seconds

/**
 * Check if a route requires authentication
 */
function isProtectedRoute(pathname: string): 'admin' | 'authenticated' | null {
  if (PROTECTED_ROUTES.admin.some(path => pathname.startsWith(path))) {
    return 'admin'
  }
  if (PROTECTED_ROUTES.authenticated.some(path => pathname.startsWith(path))) {
    return 'authenticated'
  }
  return null
}

/**
 * Get cached token or fetch new one
 */
async function getCachedToken(req: NextRequest) {
  const sessionId = req.cookies.get('next-auth.session-token')?.value || 
                   req.cookies.get('__Secure-next-auth.session-token')?.value
  
  if (!sessionId) return null

  // Check cache first
  const cached = tokenCache.get(sessionId)
  if (cached && Date.now() < cached.expires) {
    return cached.token
  }

  // Fetch new token
  try {
    const token = await getToken({ 
      req,
      secureCookie: process.env.NODE_ENV === "production"
    })
    
    if (token) {
      // Cache the token
      tokenCache.set(sessionId, {
        token,
        expires: Date.now() + CACHE_DURATION
      })
    }
    
    return token
  } catch (error) {
    console.error("Token fetch error:", error)
    return null
  }
}

/**
 * Create secure redirect response with cache headers
 */
function createSecureRedirect(url: string, req: NextRequest) {
  const response = NextResponse.redirect(new URL(url, req.url))
  
  // Prevent caching of authentication redirects
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate")
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")
  
  return response
}

/**
 * Protect admin routes
 */
export async function protectAdminRoutes(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/admin")) return null

  try {
    const token = await getCachedToken(req)

    if (!token || !token.isAdmin) {
      return createSecureRedirect("/unauthorized?reason=admin", req)
    }
  } catch (error) {
    console.error("Admin auth check error:", error)
    return createSecureRedirect("/unauthorized?reason=error", req)
  }

  return null
}

/**
 * Protect authenticated routes with improved logout handling
 */
export async function protectAuthenticatedRoutes(req: NextRequest) {
  const protectionLevel = isProtectedRoute(req.nextUrl.pathname)
  
  if (!protectionLevel) return null

  try {
    // Handle clean logout scenarios
    const isCleanLogout = req.nextUrl.searchParams.has("cleanLogout")
    const logoutCookie = req.cookies.get("next-auth.logout-clean")
    
    if (isCleanLogout || logoutCookie?.value === "true") {
      const response = NextResponse.redirect(new URL("/", req.url))
      response.cookies.delete("next-auth.logout-clean")
      response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate")
      return response
    }

    const token = await getCachedToken(req)
    
    if (!token) {
      return createSecureRedirect("/unauthorized", req)
    }

    // Check token expiration
    if (token.exp) {
      const tokenExpiry = new Date(Number(token.exp) * 1000)
      if (new Date() > tokenExpiry) {
        return createSecureRedirect("/unauthorized?reason=expired", req)
      }
    }

    // Additional admin check for admin routes
    if (protectionLevel === 'admin' && !token.isAdmin) {
      return createSecureRedirect("/unauthorized?reason=admin", req)
    }

  } catch (error) {
    console.error("Auth check error:", error)
    return createSecureRedirect("/unauthorized?reason=error", req)
  }

  // User is authenticated, allow access with secure headers
  const response = NextResponse.next()
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate")
  return response
}

/**
 * Cleanup token cache periodically
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of tokenCache.entries()) {
    if (now >= value.expires) {
      tokenCache.delete(key)
    }
  }
}, 60000) // Cleanup every minute
