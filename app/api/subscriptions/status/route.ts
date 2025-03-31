import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscriptionService"

export async function GET() {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", details: "You must be logged in to view subscription status" },
        { status: 401 },
      )
    }

    const userId = session.user.id

    // Get subscription status
    const { plan, status, endDate } = await SubscriptionService.getSubscriptionStatus(userId)

    // Get token usage
    const tokenData = await SubscriptionService.getTokensUsed(userId)

    // Add caching headers for better performance
    const headers = new Headers({
      "Cache-Control": "max-age=300, s-maxage=300, stale-while-revalidate=600",
    })

    return NextResponse.json(
      {
        plan,
        status,
        endDate,
        tokensUsed: tokenData.used,
        totalTokens: tokenData.total,
      },
      { headers },
    )
  } catch (error: any) {
    console.error("Error getting subscription status:", error)

    return NextResponse.json(
      {
        error: "Failed to get subscription status",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}

