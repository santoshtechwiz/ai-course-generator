import { type NextRequest, NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/server-auth"
import { logger } from "@/lib/logger"
import { SubscriptionService } from "@/modules/subscriptions"
import { prisma } from "@/lib/db"
import { DEFAULT_FREE_SUBSCRIPTION } from "@/types/subscription"

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
    
    import { type NextRequest, NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/server-auth'
import { SubscriptionService } from '@/modules/subscriptions'
import { logger } from '@/lib/logger'
import { SecurityService } from '@/services/security-service'

/**
 * Subscription Status API Route
 * 
 * Returns current subscription status for authenticated users.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required'
        }, 
        { status: 401 }
      )
    }

    const userId = session.user.id
    
    // Get subscription data
    const subscriptionData = await SubscriptionService.getSubscriptionStatus(userId)
    
    if (!subscriptionData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unable to retrieve subscription status'
        }, 
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subscription: subscriptionData
    })
    
  } catch (error: any) {
    logger.error('Subscription status API error:', SecurityService.sanitizeError(error))
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error'
      }, 
      { status: 500 }
    )
  }
}
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

    // Return formatted response
    return NextResponse.json({
      ...subscriptionData,
      hasUsedFreePlan,
      hadPreviousPaidPlan,
      tokensUsed: Math.min(subscriptionData.tokensUsed || 0, subscriptionData.credits || 0),
      metadata: {
        source: "subscription_service",
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error("Error fetching subscription status:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}
