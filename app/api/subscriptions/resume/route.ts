/**
 * API Route: POST /api/subscriptions/resume
 *
 * Resumes a canceled subscription for the authenticated user with improved error handling.
 */

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SubscriptionService } from "@/services/subscription/subscription-service"

export async function POST(req: Request) {
  try {
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

    const userId = session.user.id

    try {
      const result = await SubscriptionService.resumeSubscription(userId)

      return NextResponse.json({
        success: result,
        message: result ? "Subscription resumed successfully" : "Failed to resume subscription",
        code: result ? "RESUME_SUCCESS" : "RESUME_FAILED",
      })
    } catch (serviceError: any) {
      console.error("Error in subscription service:", serviceError)

      return NextResponse.json(
        {
          success: false,
          message: serviceError.message || "Failed to resume subscription",
          code: "SERVICE_ERROR",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error resuming subscription:", error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to resume subscription",
        code: "SERVER_ERROR",
      },
      { status: 500 },
    )
  }
}
