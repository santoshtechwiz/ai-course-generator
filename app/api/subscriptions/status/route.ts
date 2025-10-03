import { type NextRequest, NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/server-auth"
import { logger } from "@/lib/logger"
import { SubscriptionService } from "@/modules/subscriptions"
import { prisma } from "@/lib/db"
import { DEFAULT_FREE_SUBSCRIPTION } from "@/types/subscription"
import { SecurityService } from '@/services/security-service'

/**
 * Subscription Status Route - Simplified and Production Ready
 * Returns the current subscription status for authenticated users
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    
    // Get subscription data
    const subscriptionData = await SubscriptionService.getSubscriptionStatus(userId)

    // Get user flags for business logic
    const userFlags = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        hadPreviousPaidPlan: true, 
        hasUsedFreePlan: true,
        credits: true,
        creditsUsed: true
      }
    })

    if (!subscriptionData) {
      logger.warn(`No subscription data found for user ${userId}`)
      return NextResponse.json({
        ...DEFAULT_FREE_SUBSCRIPTION,
        credits: userFlags?.credits || 0,
        tokensUsed: userFlags?.creditsUsed || 0,
        metadata: {
          source: "default_plan",
          timestamp: new Date().toISOString()
        }
      })
    }

    // Update flags if needed
    const plan = subscriptionData.subscriptionPlan
    const tokensUsed = subscriptionData.tokensUsed || 0
    let hadPreviousPaidPlan = userFlags?.hadPreviousPaidPlan || false
    let hasUsedFreePlan = userFlags?.hasUsedFreePlan || false

    // Update flags asynchronously if needed
    if (plan && plan !== 'FREE' && !hadPreviousPaidPlan) {
      hadPreviousPaidPlan = true
      prisma.user.update({
        where: { id: userId },
        data: { hadPreviousPaidPlan: true }
      }).catch(err => logger.warn('Failed to update hadPreviousPaidPlan flag:', err))
    }

    if (plan === 'FREE' && tokensUsed > 0 && !hasUsedFreePlan) {
      hasUsedFreePlan = true
      prisma.user.update({
        where: { id: userId },
        data: { hasUsedFreePlan: true }
      }).catch(err => logger.warn('Failed to update hasUsedFreePlan flag:', err))
    }

    // Return formatted response - BUG FIX: Ensure isSubscribed is preserved
    const response = {
      ...subscriptionData,
      hasUsedFreePlan,
      hadPreviousPaidPlan,
      tokensUsed: Math.min(subscriptionData.tokensUsed || 0, subscriptionData.credits || 0),
      // Explicitly include isSubscribed to ensure it's not lost
      isSubscribed: subscriptionData.isSubscribed,
      metadata: {
        source: "subscription_service",
        timestamp: new Date().toISOString()
      }
    }
    
    logger.info(`[API] Returning subscription for user ${SecurityService.maskSensitiveString(userId)}: isSubscribed=${response.isSubscribed}, plan=${response.subscriptionPlan}`)
    
    return NextResponse.json(response)
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error'
    logger.error(`Error fetching subscription status: ${errorMessage}`, {
      errorType: error?.name,
      stack: error?.stack?.split('\n').slice(0, 3).join('\n')
    })
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}
