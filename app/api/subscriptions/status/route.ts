/**
 * API Route: GET /api/subscriptions/status
 *
 * Returns the current subscription status for the authenticated user.
 */

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscription-service"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", details: "You must be logged in to view subscription status" },
        { status: 401 },
      )
    }

    const userId = session.user.id

    // Get subscription status
    const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(userId)

    // Get token usage
    const tokenData = await SubscriptionService.getTokensUsed(userId)

    // Add caching headers for better performance
    const headers = new Headers({
      "Cache-Control": "max-age=300, s-maxage=300, stale-while-revalidate=600",
    })

    return NextResponse.json(
      {
        ...subscriptionStatus,
        tokensUsed: tokenData.completionTokens,
        totalTokens: tokenData.totalTokens,
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

