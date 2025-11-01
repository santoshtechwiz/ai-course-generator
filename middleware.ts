import { NextResponse, URLPattern } from "next/server"
import type { NextRequest } from "next/server"

import { routeConfig } from "@/config/routes"

// Import unified middleware system
import { unifiedMiddleware } from "@/middlewares/core/unified-middleware"
import { isFeatureEnabled } from "@/lib/featureFlags"
import { securityHeadersMiddleware, corsMiddleware } from "@/middlewares/security/headers"

// Define matcher to exclude API, static files, and favicon requests
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|unauthorized|terms|privacy|contactus|auth/.*).*)"],
}

/**
 * Enhanced middleware with better organization and performance
 */

// Handle site-wide redirect to courseai.io
function handleSiteWideRedirect(req: NextRequest) {
  // Only redirect in production environment
  if (process.env.NODE_ENV === 'production' && !req.nextUrl.host.includes("courseai.io")) {
    const url = new URL(req.url)
    const redirectUrl = new URL(`https://courseai.io${url.pathname}${url.search}`)
    return NextResponse.redirect(redirectUrl, {
      status: 301, // Permanent redirect for better SEO
    })
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

      // Lazy import to avoid loading db during build time
      const { fetchSlug } = await import("@/lib/db")
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
      // Fire-and-forget: don't await, just trigger the increment
      fetch(`${req.nextUrl.origin}/api/increment`, {
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

// Middleware function
export async function middleware(req: NextRequest) {
  // Handle WebSocket connections first (performance critical)
  const wsResponse = corsMiddleware(req)
  if (wsResponse) return wsResponse

  const pathname = req.nextUrl.pathname

  if (process.env.REDIRECT === "true") {
    // Handle site-wide redirect to courseai.io
    const siteWideRedirect = handleSiteWideRedirect(req)
    if (siteWideRedirect) return siteWideRedirect
  }

  // Setup GitHub credentials
  setupGitHubCredentials(req)

  // Use unified middleware system with feature flag support
  const middlewareResult = await unifiedMiddleware.execute(req)
  if (middlewareResult.response) {
    // Log middleware decision for debugging
    if (isFeatureEnabled('performance-monitoring')) {
      console.log(`[Middleware] Route ${pathname} - ${middlewareResult.reason}`)
    }
    return middlewareResult.response
  }

  // Handle redirects
  const redirectResponse = await handleRedirects(req)
  if (redirectResponse) return redirectResponse

  // Increment course view count for analytics
  incrementCourseViewCount(req)

  // Apply security headers and continue
  const response = NextResponse.next()
  return securityHeadersMiddleware(req) || setCacheHeaders(response)
}

// Note: CSRF middleware is now handled in the security module
// Use the csrfMiddleware from @/middlewares/security/csrf-protection for API routes

