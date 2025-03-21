import { NextResponse, URLPattern } from "next/server"
import type { NextRequest } from "next/server"

import { fetchSlug } from "@/lib/db"
import { routeConfig } from "@/config/routes"
import { trackServerSideInteraction } from "@/lib/tracking"
import { getToken } from "next-auth/jwt"

// Define matcher to exclude API, static files, and favicon requests
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
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
  const path = req.nextUrl.pathname
  
  // Check if the path is the admin page (fixed to use /dashboard/admin)
  if (path === "/dashboard/admin" || path.startsWith("/api/users")) {
    const token = await getToken({
      req: req,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // If user is not logged in or not an admin, redirect to unauthorized page
    if (!token || !token.isAdmin) {
      // For API routes, return a 403 Forbidden response
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
      }

      // For page routes, redirect to unauthorized page
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
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

  if (redirect) {
    const match = pathname.match(new RegExp(`^${redirect.from.replace(/:\w+/g, "(\\d+)")}$`))
    if (match) {
      const id = match[1]
      const type = redirect.from.startsWith("/course")
        ? "course"
        : redirect.from.startsWith("/mcq")
          ? "mcq"
          : redirect.from.startsWith("/openended")
            ? "openended"
            : "default"

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

// Track user interaction if userId is available in cookies
function trackUserInteraction(req: NextRequest) {
  const userId = req.cookies.get("userId")?.value
  if (userId) {
    const interactionType = "page_view"
    trackServerSideInteraction(userId, interactionType, req.nextUrl.pathname)
  }
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
  // Handle WebSocket connections
  const wsResponse = handleWebSocketConnections(req)
  if (wsResponse) return wsResponse

  // Protect admin routes
  const adminResponse = await protectAdminRoutes(req)
  if (adminResponse) return adminResponse

  // Setup GitHub credentials
  setupGitHubCredentials(req)

  // Handle redirects
  const redirectResponse = await handleRedirects(req)
  if (redirectResponse) return redirectResponse

  // Track user interaction
  trackUserInteraction(req)

  // Increment course view count
  incrementCourseViewCount(req)

  // Set cache headers and return response
  const response = NextResponse.next()
  return setCacheHeaders(response)
}