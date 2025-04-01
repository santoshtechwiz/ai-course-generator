import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    // Authenticate admin user
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.isAdmin !== true) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    // Get userId from query parameters
    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get subscription history for the user
    const events = await prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to 50 most recent events
    })

    // Get subscription history details
    const subscriptionHistory = await prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10, // Limit to 10 most recent subscriptions
    })

    return NextResponse.json({
      events,
      subscriptionHistory,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.userType,
      },
    })
  } catch (error) {
    console.error("Error fetching subscription history:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch subscription history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

