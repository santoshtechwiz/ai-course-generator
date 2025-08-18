import { NextResponse, URLPattern } from "next/server"
import type { NextRequest } from "next/server"

import { fetchSlug } from "@/lib/db"
import { routeConfig } from "@/config/routes"

// Import enhanced middleware functions
import { protectAdminRoutes, protectAuthenticatedRoutes } from "@/middlewares/auth/route-protection"
import { csrfMiddleware } from "@/middlewares/security/csrf-protection"
import { securityHeadersMiddleware, corsMiddleware } from "@/middlewares/security/headers"

// Define matcher to exclude API, static files, and favicon requests
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|unauthorized).*)"],
}

/**
 * Enhanced middleware with better organization and performance
 */

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

  // Check authentication for protected routes
  const authResponse = await protectAuthenticatedRoutes(req)
  if (authResponse) return authResponse

  // Check admin routes
  const adminResponse = await protectAdminRoutes(req)
  if (adminResponse) return adminResponse

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

