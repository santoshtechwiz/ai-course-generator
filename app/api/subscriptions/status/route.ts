import { type NextRequest, NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/server-auth"
import { SubscriptionService } from "@/app/dashboard/subscription/services/subscription-service"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  let session: any = null
  
  try {
    session = await getServerAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get subscription status using the service
    const subscriptionData = await SubscriptionService.getSubscriptionStatus(session.user.id)

    if (!subscriptionData) {
      logger.warn(`Subscription data not found for user ${session.user.id}`)
      
      // Return default FREE subscription data
      return NextResponse.json({
        credits: 0,
        tokensUsed: 0,
        isSubscribed: false,
        subscriptionPlan: "FREE",
        expirationDate: null,
        status: "INACTIVE",
        cancelAtPeriodEnd: false,
        subscriptionId: "",
      })
    }

    const response = {
      credits: subscriptionData.credits || 0,
      tokensUsed: subscriptionData.tokensUsed || 0,
      isSubscribed: subscriptionData.isSubscribed || false,
      subscriptionPlan: subscriptionData.subscriptionPlan || "FREE",
      expirationDate: subscriptionData.expirationDate || null,
      trialEndsAt: subscriptionData.trialEndsAt || null,
      status: subscriptionData.status || "INACTIVE",
    }

    return NextResponse.json(response)
  } catch (error: any) {
    logger.error(`Error getting subscription status for user ${session?.user?.id}:`, {
      message: error.message,
      userId: session?.user?.id
    })
    
    return NextResponse.json(
      { 
        error: "Failed to get subscription status",
        message: "An error occurred while retrieving subscription data"
      },
      { status: 500 }
    )
  }
}
