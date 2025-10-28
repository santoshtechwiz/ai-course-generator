import { type NextRequest, NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/server-auth"
import { SubscriptionService } from '@/services/subscription-services'
import { SUBSCRIPTION_PLAN_IDS } from '@/types/subscription-plans'

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
    let subscriptionData;
    try {
      subscriptionData = await SubscriptionService.getSubscriptionStatus(session.user.id)
    } catch (error) {
      console.error("[Refresh] Error fetching subscription data:", error)
    }

    // Don't fail if subscription data isn't found, preserve existing data
    if (!subscriptionData) {
      subscriptionData = {
        userId: session.user.id,
        subscriptionPlan: session.user.subscriptionPlan || SUBSCRIPTION_PLAN_IDS.FREE,
        credits: session.user.credits || 3,
        tokensUsed: session.user.creditsUsed || 0,
        subscriptionId: null,
        status: session.user.subscriptionStatus || null
      }
    }

    // Return the updated user data that matches the session structure
    const updatedUserData = {
      id: subscriptionData.userId,
      userType: subscriptionData.subscriptionPlan, // Map plan to userType
      credits: subscriptionData.credits,
      creditsUsed: subscriptionData.tokensUsed, // Map tokensUsed to creditsUsed
      subscription: {
        id: subscriptionData.subscriptionId,
        planId: subscriptionData.subscriptionPlan,
        status: subscriptionData.status,
        currentPeriodEnd: subscriptionData.expirationDate,
        cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
      }
    }

    return NextResponse.json({
      success: true,
      userData: updatedUserData,
      isConsistent: true, // Remove dependency on missing field
    })
  } catch (error) {
    console.error("Auth refresh API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
