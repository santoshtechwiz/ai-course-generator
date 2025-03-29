import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscriptionService"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "You must be logged in to access subscription details",
        },
        { status: 401 },
      )
    }

    const userId = session.user.id

    // Add caching headers for better performance
    // Cache for 5 minutes but allow revalidation
    const headers = new Headers({
      "Cache-Control": "max-age=300, s-maxage=300, stale-while-revalidate=600",
    })

    try {
      const subscriptionData = await SubscriptionService.getSubscriptionStatus(userId)
      const tokensUsed = await SubscriptionService.getTokensUsed(userId)

      return NextResponse.json(
        {
          ...subscriptionData,
          tokensUsed,
        },
        { headers },
      )
    } catch (serviceError: any) {
      console.error("Service error fetching subscription status:", serviceError)
      return NextResponse.json(
        {
          error: "Service Error",
          message: "Failed to fetch subscription data from service",
          details: serviceError.message,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error fetching subscription status:", error)
    return NextResponse.json(
      {
        error: "Server Error",
        message: "An unexpected error occurred while fetching subscription status",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

