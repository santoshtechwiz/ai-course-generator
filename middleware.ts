import { NextResponse, URLPattern } from "next/server"
import type { NextRequest } from "next/server"

import { fetchSlug } from "@/lib/db"
import { routeConfig } from "@/config/routes"

import { getToken } from "next-auth/jwt"

// Define matcher to exclude API, static files, and favicon requests
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|unauthorized).*)"],
}

// Handle site-wide redirect to courseai.io
function handleSiteWideRedirect(req: NextRequest) {
  // Check if we're already on courseai.io to prevent redirect loops
  if (!req.nextUrl.host.includes("courseai.io")) {
    const url = new URL(req.url)
    const redirectUrl = new URL(`https://courseai.io${url.pathname}${url.search}`)
    return NextResponse.redirect(redirectUrl, {
      status: 301, // Permanent redirect for better SEO
    })
  }
  return null
}

// Handle WebSocket connections
function handleWebSocketConnections(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/socketio")) {
    const response = NextResponse.next()
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE")
    response.headers.set("Access-Control-Allow-Credentials", "true")
    return response
  }
  return null
}

// Protect admin routes
async function protectAdminRoutes(req: NextRequest) {
  // Only check admin routes
  if (!req.nextUrl.pathname.startsWith("/admin")) {
    return null
  }

  try {
    const token = await getToken({ req })

    if (!token || !token.isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
  } catch (error) {
    console.error("Error getting token:", error)
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  return null
}

// Function to determine GitHub OAuth credentials dynamically
function setupGitHubCredentials(req: NextRequest) {
  const host = req.nextUrl.host || ""

  const credentials = host.includes("courseai.dev")
    ? {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      }
    : {
        clientId: process.env.GITHUB_CLIENT_ID_IO!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET_IO!,
      }

  process.env.GITHUB_CLIENT_ID = credentials.clientId
  process.env.GITHUB_CLIENT_SECRET = credentials.clientSecret
}

// Handle redirects based on route configuration
async function handleRedirects(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  const redirect = routeConfig.redirects.find((r) => {
    const regex = new RegExp(`^${r.from.replace(/:\w+/g, "(\\d+)")}$`)
    return regex.test(pathname)
  })

  if (redirect) {    const match = pathname.match(new RegExp(`^${redirect.from.replace(/:\w+/g, "(\\d+)")}$`))
    if (match) {
      const id = match[1];
      const type = redirect.from.startsWith("/course")
        ? "course"
        : redirect.from.startsWith("/mcq")
          ? "mcq"
          : redirect.from.startsWith("/openended")
            ? "openended"
            : redirect.from.startsWith("/code")
              ? "code"
              : "course" // Default to course instead of "default" string

      const slug = await fetchSlug(type, id)
      if (slug) {
        const newUrl = req.nextUrl.clone()
        newUrl.pathname = redirect.to.replace(":slug", slug)
        return NextResponse.redirect(newUrl)
      }
    }
  }
  return null
}

// Handle course view count increment
function incrementCourseViewCount(req: NextRequest) {
  const coursePattern = new URLPattern({ pathname: "/dashboard/course/:slug" })
  const match = coursePattern.exec(req.nextUrl)

  if (match) {
    const slug = match.pathname.groups.slug
    if (slug) {
      fetch(`${process.env.NEXT_PUBLIC_URL}/api/increment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug }),
      }).catch((error) => console.error("Error incrementing view count:", error))
    }
  }
}

// Set caching headers for response
function setCacheHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0")
  return response
}
// Enhanced middleware with proper auth protection and caching prevention
async function protectAuthenticatedRoutes(req: NextRequest) {
  // Define protected paths - routes that require authentication
  const protectedPaths = [
    "/course", 
    "/dashboard/course", 
    "/dashboard/profile", 
    "/dashboard/subscription"
  ]
  
  // Fast path: Check if any protected path is matched
  const isProtectedRoute = protectedPaths.some((path) => 
    req.nextUrl.pathname.startsWith(path)
  )
  
  // If not a protected path, don't need to check auth
  if (!isProtectedRoute) return null

  try {
    // Check for clean logout flag in URL (helps prevent automatic re-login)
    const isCleanLogout = req.nextUrl.searchParams.has("cleanLogout")
    
    // Check for logout flag in cookies (from previous clean logout)
    const logoutCookie = req.cookies.get("next-auth.logout-clean")
    
    // If we're experiencing a clean logout situation, don't automatically redirect
    // to login page, as this creates the endless cycle of re-login
    if (isCleanLogout || logoutCookie?.value === "true") {
      // Clear the flag cookie to prevent future issues
      const response = NextResponse.redirect(new URL("/", req.url))
      response.cookies.delete("next-auth.logout-clean")
      response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate")
      return response
    }

    // Get token with security options
    const token = await getToken({ 
      req,
      secureCookie: process.env.NODE_ENV === "production",
      // For improved performance, we can optionally skip decoding
      // if we just want to check token existence
    })
    
    if (!token) {
      // Add strong cache control headers to prevent caching the redirect
      const response = NextResponse.redirect(new URL("/unauthorized", req.url))
      response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate")
      response.headers.set("Pragma", "no-cache")
      response.headers.set("Expires", "0")
      return response
    }
      // Additional token validation
    // Optionally check token expiration to force re-auth for expired tokens
    if (token.exp) {
      const tokenExpiry = new Date(Number(token.exp) * 1000)
      const now = new Date()
      
      if (now > tokenExpiry) {
        // Token has expired, redirect to login
        const response = NextResponse.redirect(new URL("/unauthorized?reason=expired", req.url))
        response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate")
        return response
      }
    }
  } catch (error) {
    console.error("Auth check error in middleware:", error)
    // Add cache control headers to prevent caching the redirect
    const response = NextResponse.redirect(new URL("/unauthorized", req.url))
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate")
    return response
  }

  // User is authenticated, allow access
  const response = NextResponse.next()
  // Set cache headers to prevent caching authenticated content
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate")
  return response
}
// Import our auth helpers
import {
  isProtectedRoute,
  isAdminRoute,
  isPublicRoute,
  getAuthToken,
  isCleanLogout,
  createUnauthorizedResponse,
  createAuthResponse
} from './middleware-auth-helpers'

// Middleware function
export async function middleware(req: NextRequest) {
  // Handle WebSocket connections first (performance critical)
  const wsResponse = handleWebSocketConnections(req)
  if (wsResponse) return wsResponse

  const pathname = req.nextUrl.pathname

  // Always allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  if (process.env.REDIRECT === "true") {
    // Handle site-wide redirect to courseai.io
    const siteWideRedirect = handleSiteWideRedirect(req)
    if (siteWideRedirect) return siteWideRedirect
  }

  // Setup GitHub credentials
  setupGitHubCredentials(req)

  // Check for clean logout to prevent auth loops
  if (isCleanLogout(req)) {
    const response = NextResponse.redirect(new URL("/", req.url))
    response.cookies.delete("next-auth.logout-clean")
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate")
    return response
  }

  // Get the token once for all auth checks
  const token = await getAuthToken(req)
  
  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    if (!token) {
      return createUnauthorizedResponse(req)
    }
  }

  // Handle admin routes
  if (isAdminRoute(pathname)) {
    if (!token || !token.isAdmin) {
      return createUnauthorizedResponse(req, "admin")
    }
  }

  // Handle redirects
  const redirectResponse = await handleRedirects(req)
  if (redirectResponse) return redirectResponse

  // Increment course view count for analytics
  incrementCourseViewCount(req)

  // Set proper cache headers for authenticated routes
  if (token) {
    return createAuthResponse()
  }

  // Default: allow access with basic cache headers
  const response = NextResponse.next()
  return setCacheHeaders(response)
}

// CSRF protection middleware
export async function csrfMiddleware(req: NextRequest) {
  // Only apply to API routes that modify data
  if (req.method !== "GET" && req.nextUrl.pathname.startsWith("/api/")) {
    // Check for auth token
    const sessionToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    // Skip CSRF check for non-authenticated routes
    if (!sessionToken) {
      return NextResponse.next()
    }

    // Get CSRF token from header
    const csrfToken = req.headers.get("x-csrf-token")

    // If logged in but no CSRF token, reject with 403
    if (!csrfToken) {
      return new NextResponse(
        JSON.stringify({ error: "CSRF token required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      )
    }

    // Create expected token value based on session data
    const expectedToken = `${sessionToken.sub?.substring(0, 8)}-${sessionToken.iat}`

    // Compare tokens
    if (csrfToken !== expectedToken) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid CSRF token" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      )
    }
  }

  // For all other requests, continue
  return NextResponse.next()
}

