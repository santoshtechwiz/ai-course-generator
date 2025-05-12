/**
 * API Route: POST /api/subscriptions/activate-free
 *
 * Activates the free plan for the authenticated user.
 */

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SubscriptionService } from "@/app/dashboard/subscription/services/subscription-service"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

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
      console.error("Error parsing request body:", e)
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
    const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(userId)

    // If user is already on the free plan, return success without adding tokens again
    if (subscriptionStatus.isSubscribed && subscriptionStatus.subscriptionPlan === "FREE") {
      return NextResponse.json({
        success: true,
        message: "You are already on the free plan",
        alreadySubscribed: true,
      })
    }

    if (subscriptionStatus.isSubscribed && subscriptionStatus.subscriptionPlan !== "FREE") {
      return NextResponse.json(
        { error: "Subscription exists", details: "You already have an active paid subscription" },
        { status: 400 },
      )
    }

    // Activate the free plan
    try {
      const result = await SubscriptionService.activateFreePlan(userId)
      return NextResponse.json(result)
    } catch (activationError: any) {
      console.error("Error in SubscriptionService.activateFreePlan:", activationError)
      return NextResponse.json(
        {
          error: "Activation failed",
          details: activationError.message || "Failed to activate the free plan in the subscription service",
        },
        { status: 500 },
      )
    }
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
