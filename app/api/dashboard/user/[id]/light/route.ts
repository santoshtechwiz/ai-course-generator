
import { getUserData, getUserStats } from "@/app/actions/userDashboard"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is requesting their own data or is an admin
    if (session.user.id !== id && session.user.isAdmin !== true) {
      return NextResponse.json({
        error: "Forbidden: You can only access your own dashboard data"
      }, { status: 403 })
    }

    // Get light user data and quick stats in parallel
    const [userData, userStats] = await Promise.all([
      getUserData(id),
      getUserStats(id)
    ])

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Add cache headers for better performance
    const headers = new Headers()
    headers.set("Cache-Control", "max-age=30, s-maxage=30, stale-while-revalidate=60")

    return NextResponse.json({ 
      userData, 
      userStats 
    }, {
      headers: {
        "Cache-Control": headers.get("Cache-Control") || "no-cache",
      },
    })
  } catch (error) {
    console.error("Error fetching light user data:", error)
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
  }
}
