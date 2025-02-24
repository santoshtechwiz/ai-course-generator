import { NextResponse } from "next/server"
import { SubscriptionService } from "@/services/subscriptionService"
import { SUBSCRIPTION_PLANS } from "@/config/subscriptionPlans"

export async function POST(req: Request) {
  try {
    const { userId, planName, duration } = await req.json()

    if (!userId || !planName || !duration) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "userId, planName, and duration are required",
        },
        { status: 400 },
      )
    }

    const plan = SUBSCRIPTION_PLANS.find((p) => p.name === planName)
    if (!plan) {
      return NextResponse.json(
        {
          error: "Invalid plan",
          details: `Plan '${planName}' does not exist`,
        },
        { status: 400 },
      )
    }

    const option = plan.options.find((o) => o.duration === duration)
    if (!option) {
      return NextResponse.json(
        {
          error: "Invalid duration",
          details: `Duration '${duration}' is not available for the selected plan`,
        },
        { status: 400 },
      )
    }

    try {
      const { sessionId } = await SubscriptionService.createCheckoutSession(userId, planName, duration)
      return NextResponse.json({ success: true, sessionId })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "User already has an active subscription") {
          return NextResponse.json(
            {
              error: "Subscription conflict",
              details: "You already have an active subscription",
            },
            { status: 409 },
          )
        }
        // Log the error for debugging purposes
        console.error("Subscription service error:", error)
        return NextResponse.json(
          {
            error: "Subscription service error",
            details: "An error occurred while processing your subscription",
          },
          { status: 500 },
        )
      }
    }
  } catch (error) {
    console.error("Failed to process subscription request:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: "An unexpected error occurred while processing your request",
      },
      { status: 500 },
    )
  }
}

