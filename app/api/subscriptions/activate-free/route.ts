import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscriptionService"

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", details: "You must be logged in to activate a free plan" },
        { status: 401 },
      )
    }

    // Parse the request body to check for explicit confirmation
    let body
    try {
      body = await request.json()
    } catch (e) {
      body = {}
    }

    // Require explicit confirmation
    if (!body.confirmed) {
      return NextResponse.json(
        { error: "Confirmation required", details: "Explicit confirmation is required to activate the free plan" },
        { status: 400 },
      )
    }

    const userId = session.user.id

    // Check if user already has a subscription
    const { plan, status } = await SubscriptionService.getSubscriptionStatus(userId)

    if (plan && plan !== "FREE" && status === "ACTIVE") {
      return NextResponse.json(
        { error: "Subscription exists", details: "You already have an active paid subscription" },
        { status: 400 },
      )
    }

    // Activate the free plan
    const result = await SubscriptionService.activateFreePlan(userId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error activating free plan:", error)

    return NextResponse.json(
      {
        error: "Failed to activate free plan",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}

