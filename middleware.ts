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
async function protectAuthenticatedRoutes(req: NextRequest) {
  // Allow access to quiz routes - remove them from the protected paths
  const protectedPaths = ["/course"]  // Removed "/code", "/blanks", "/mcq"
  const isProtected = protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path))

  if (!isProtected) return null

  try {
    const token = await getToken({ req })
    if (!token) {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
  } catch (error) {
    console.error("Error checking auth for protected route:", error)
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  return null
}
// Middleware function
export async function middleware(req: NextRequest) {
  // Handle WebSocket connections
  const wsResponse = handleWebSocketConnections(req)
  if (wsResponse) return wsResponse

  if (process.env.REDIRECT === "true") {
    // Handle site-wide redirect to courseai.io (added this line)
    const siteWideRedirect = handleSiteWideRedirect(req)
    if (siteWideRedirect) return siteWideRedirect
  }

  // Protect admin routes - only check admin routes
  const adminResponse = await protectAdminRoutes(req)
  if (adminResponse) return adminResponse

  const authResponse = await protectAuthenticatedRoutes(req)
  if (authResponse) return authResponse
  // Setup GitHub credentials
  setupGitHubCredentials(req)

  // Handle redirects
  const redirectResponse = await handleRedirects(req)
  if (redirectResponse) return redirectResponse

  // Increment course view count
  incrementCourseViewCount(req)

  // Set cache headers and return response
  const response = NextResponse.next()
  return setCacheHeaders(response)
}
