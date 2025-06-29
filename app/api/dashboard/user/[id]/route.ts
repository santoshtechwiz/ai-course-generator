import { getUserData } from "@/app/actions/userDashboard"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const url = new URL(request.url)
    const forceRefresh = url.searchParams.get("forceRefresh") === "true"

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    // Fix: Allow users to access their own data OR admins to access any user data
    if (session.user.id !== id && session.user.isAdmin !== true) {
      return NextResponse.json({
        error: "Forbidden: You can only access your own dashboard data"
      }, { status: 403 })
    }

    const userData = await getUserData(id)

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
