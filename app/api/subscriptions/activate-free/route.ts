/**
 * API Route: POST /api/subscriptions/activate-free
 *
 * Activates the free plan for the authenticated user.
 */

import { NextRequest } from "next/server"
import { ApiResponseHandler } from "@/services/api-response-handler"
import { withAuth } from "@/middlewares/auth-middleware"
import { SubscriptionService } from "@/services/subscription/subscription-service"

export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    // Parse the request body to check for explicit confirmation
    let body
    try {
      body = await req.json()
    } catch (e) {
      body = {}
    }

    // Require explicit confirmation
    if (!body.confirmed) {
      return ApiResponseHandler.validationError(
        "Explicit confirmation is required to activate the free plan"
      )
    }

    const userId = session.user.id

    // Check if user already has a subscription
    const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(userId)

    // If user is already on the free plan, return success without adding tokens again
    if (subscriptionStatus?.isSubscribed && subscriptionStatus?.subscriptionPlan === "FREE") {
      return ApiResponseHandler.success({
        message: "You are already on the free plan",
        alreadySubscribed: true,
      })
    }

    if (subscriptionStatus?.isSubscribed && subscriptionStatus?.subscriptionPlan !== "FREE") {
      return ApiResponseHandler.validationError(
        "You already have an active paid subscription"
      )
    }

    // TODO: Implement activateFreePlan method in SubscriptionService
    // const result = await SubscriptionService.activateFreePlan(userId)
    return ApiResponseHandler.success({ message: "Free plan activation placeholder" })
  } catch (error: any) {
    return ApiResponseHandler.error(error || "Failed to activate free plan")
  }
}

)
