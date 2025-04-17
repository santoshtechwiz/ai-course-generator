
import { getUserStats } from "@/app/actions/userDashboard";
import { authOptions } from "@/lib/authOptions"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"


export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const {id}= await params;
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is requesting their own data or is an admin
    if (session.user.id !== id && session.user.isAdmin !== false) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userStats = await getUserStats(id)

    return NextResponse.json(userStats)
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json({ error: "Failed to fetch user stats" }, { status: 500 })
  }
}
