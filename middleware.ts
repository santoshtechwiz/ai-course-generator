import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { fetchSlug } from "@/lib/db"
import { routeConfig } from "@/config/routes"
import { trackServerSideInteraction } from "@/lib/tracking"

const secret = process.env.NEXTAUTH_SECRET

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

  // Check authentication for protected routes
  const isProtectedRoute = routeConfig.protected.some((route) => pathname.startsWith(route))
  if (isProtectedRoute) {
    const session = await getToken({ req, secret })
    if (!session) {
      const signInUrl = new URL(routeConfig.authRedirects.signIn, req.url)
      signInUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  // Track user interaction
  const userId = req.cookies.get("userId")?.value
  if (userId) {
    const interactionType = "page_view"
    trackServerSideInteraction(userId, interactionType, pathname)
  }

  const response = NextResponse.next()
  response.headers.set("Cache-Control", "no-store, max-age=0")
  return response
}

