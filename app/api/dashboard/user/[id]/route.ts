import { getUserData } from "@/app/actions/userDashboard"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const url = new URL(request.url)
    const forceRefresh = url.searchParams.get("forceRefresh") === "true"

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is requesting their own data or is an admin
    if (session.user.id !== params.id && session.user.isAdmin !== true) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userData = await getUserData(params.id)

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Add cache headers to reduce frequent calls
    const headers = new Headers()
    if (!forceRefresh) {
      headers.set("Cache-Control", "max-age=60, s-maxage=60, stale-while-revalidate=120")
    } else {
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    }

    return NextResponse.json(userData, {
      headers: {
        "Cache-Control": headers.get("Cache-Control") || "no-cache",
      },
    })
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
  }
}
