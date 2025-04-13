/**
 * API Route: /api/subscriptions/cancel
 *
 * This route cancels a user's subscription.
 */

import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"


import { authOptions } from "@/lib/authOptions"
import { SubscriptionService } from "@/app/dashboard/subscription/services/subscription-service"

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 })
    }

    // Cancel the subscription
    const success = await SubscriptionService.cancelSubscription(session.user.id)

    if (!success) {
      return NextResponse.json({ message: "Failed to cancel subscription" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully",
    })
  } catch (error) {
    console.error("Error cancelling subscription:", error)

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to cancel subscription" },
      { status: 500 },
    )
  }
}

