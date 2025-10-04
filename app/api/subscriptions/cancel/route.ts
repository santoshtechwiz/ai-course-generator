/**
 * API Route: /api/subscriptions/cancel
 *
 * This route cancels a user's subscription with improved error handling and feedback.
 */

import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"


import { SubscriptionService } from '@/services/subscription-services'
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
          code: "AUTHENTICATION_REQUIRED",
        },
        { status: 401 },
      )
    }

    // Cancel the subscription
    try {
      const success = await SubscriptionService.cancelSubscription(session.user.id)

      if (!success) {
        return NextResponse.json(
          {
            success: false,
            message: "Failed to cancel subscription",
            code: "CANCELLATION_FAILED",
          },
          { status: 400 },
        )
      }

      return NextResponse.json({
        success: true,
        message: "Subscription cancelled successfully",
        code: "CANCELLATION_SUCCESS",
      })
    } catch (serviceError) {
      console.error("Error in subscription service:", serviceError)

      // Provide more specific error messages based on the error type
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Failed to cancel subscription"

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          code: "SERVICE_ERROR",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error cancelling subscription:", error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to cancel subscription",
        code: "SERVER_ERROR",
      },
      { status: 500 },
    )
  }
}
