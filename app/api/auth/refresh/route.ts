import { type NextRequest, NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/server-auth"
import { SubscriptionService } from "@/app/dashboard/subscription/services/subscription-service"

/**
 * Refresh API endpoint that returns updated user and subscription data
 * This is used by the frontend to sync the session with the latest backend state
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the latest user and subscription data from the backend
    const subscriptionData = await SubscriptionService.getUserSubscriptionData(session.user.id)

    if (!subscriptionData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return the updated user data that matches the session structure
    const updatedUserData = {
      id: subscriptionData.userId,
      userType: subscriptionData.userType,
      credits: subscriptionData.credits,
      creditsUsed: subscriptionData.creditsUsed,
      subscription: subscriptionData.subscription ? {
        id: subscriptionData.subscription.id,
        planId: subscriptionData.subscription.planId,
        status: subscriptionData.subscription.status,
        currentPeriodEnd: subscriptionData.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptionData.subscription.cancelAtPeriodEnd,
      } : null,
    }

    return NextResponse.json({
      success: true,
      userData: updatedUserData,
      isConsistent: subscriptionData.isConsistent,
    })
  } catch (error) {
    console.error("Auth refresh API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
