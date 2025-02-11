import { NextResponse, URLPattern } from "next/server"
import type { NextRequest } from "next/server"

import { fetchSlug } from "@/lib/db"
import { routeConfig } from "@/config/routes"
import { trackServerSideInteraction } from "@/lib/tracking"
import { viewCountStore } from "./lib/viewCountStore"

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

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

  // Handle redirects
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

  // Track user interaction
  const userId = req.cookies.get("userId")?.value
  if (userId) {
    const interactionType = "page_view"
    trackServerSideInteraction(userId, interactionType, pathname)
  }

  const coursePattern = new URLPattern({ pathname: "/dashboard/course/:slug" })
  const match = coursePattern.exec(req.nextUrl)

  if (match) {
    const slug = match.pathname.groups.slug
    if (slug) {
      // Send a request to increment view count
      fetch(`${process.env.NEXT_PUBLIC_URL}/api/increment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug }),
      }).catch((error) => console.error("Error incrementing view count:", error))
    }
  }

  const response = NextResponse.next()
  response.headers.set("Cache-Control", "no-store, max-age=0")
  return response
}

