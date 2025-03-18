import { NextResponse, URLPattern } from "next/server"
import type { NextRequest } from "next/server"

import { fetchSlug } from "@/lib/db"
import { routeConfig } from "@/config/routes"
import { trackServerSideInteraction } from "@/lib/tracking"

// Define matcher to exclude API, static files, and favicon requests
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

// Function to determine GitHub OAuth credentials dynamically
const getGitHubCredentials = (req: NextRequest) => {
  const host = req.nextUrl.host || ""

  if (host.includes("courseai.dev")) {
    return {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }
  }

  return {
    clientId: process.env.GITHUB_CLIENT_ID_IO!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET_IO!,
  }
}

// Middleware function
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Handle WebSocket connections
  if (pathname.startsWith("/api/socketio")) {
    const response = NextResponse.next()
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE")
    response.headers.set("Access-Control-Allow-Credentials", "true")
    return response
  }

  // Handle dynamic GitHub credentials setup for authentication
  const githubCreds = getGitHubCredentials(req)
  process.env.GITHUB_CLIENT_ID = githubCreds.clientId
  process.env.GITHUB_CLIENT_SECRET = githubCreds.clientSecret

  // Handle redirects based on route configuration
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

  // Track user interaction if userId is available in cookies
  const userId = req.cookies.get("userId")?.value
  if (userId) {
    const interactionType = "page_view"
    trackServerSideInteraction(userId, interactionType, pathname)
  }

  // Handle course view count increment
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

  // Set caching headers for response
  const response = NextResponse.next()
  response.headers.set("Cache-Control", "no-store, max-age=0")
  return response
}
