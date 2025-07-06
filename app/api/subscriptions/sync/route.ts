import { NextRequest, NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/server-auth'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    logger.info(`Manual subscription sync requested for user: ${userId}`)

    // Get user's subscription from database
    const userSubscription = await prisma.userSubscription.findFirst({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            credits: true,
            creditsUsed: true,
          }
        }
      }
    })

    if (!userSubscription) {
      logger.warn(`No subscription found for user ${userId}`)
      return NextResponse.json({
        message: 'No subscription found',
        subscription: {
          isSubscribed: false,
          subscriptionPlan: 'FREE',
          status: 'INACTIVE',
          credits: 0,
          tokensUsed: 0,
        }
      })
    }

    // Fetch current subscription status from Stripe
    let stripeSubscription: Stripe.Subscription | null = null
    
    try {
      if (userSubscription.stripeSubscriptionId) {
        stripeSubscription = await stripe.subscriptions.retrieve(
          userSubscription.stripeSubscriptionId,
          { expand: ['customer'] }
        )
        logger.info(`Stripe subscription status: ${stripeSubscription.status}`, {
          subscriptionId: stripeSubscription.id,
          currentPeriodEnd: stripeSubscription.current_period_end,
          planId: stripeSubscription.items.data[0]?.price?.id,
        })
      }
    } catch (stripeError) {
      logger.error('Failed to fetch subscription from Stripe:', stripeError)
      // Continue with database data if Stripe is unavailable
    }

    // Determine the correct status
    let correctStatus = 'INACTIVE'
    let correctPlanId = 'FREE'
    let currentPeriodEnd: Date | null = null
    let isSubscribed = false

    if (stripeSubscription) {
      // Update based on Stripe data (source of truth)
      switch (stripeSubscription.status) {
        case 'active':
          correctStatus = 'ACTIVE'
          isSubscribed = true
          break
        case 'past_due':
          correctStatus = 'PAST_DUE'
          isSubscribed = false
          break
        case 'canceled':
          correctStatus = 'CANCELED'
          isSubscribed = false
          break
        case 'unpaid':
          correctStatus = 'PAST_DUE'
          isSubscribed = false
          break
        default:
          correctStatus = 'INACTIVE'
          isSubscribed = false
      }

      currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000)
        // Try to determine plan ID from Stripe price ID
      const stripePriceId = stripeSubscription.items.data[0]?.price?.id
      logger.info(`Stripe price ID found: ${stripePriceId}`)
      
      if (stripePriceId) {
        // Enhanced price ID mapping with fallback logic
        const priceIdToPlans: Record<string, string> = {
          // TODO: Replace with your actual Stripe price IDs
          'price_1234567890': 'PRO',
          'price_0987654321': 'PREMIUM',
          // Add your actual Stripe price IDs here
        }
        
        const mappedPlan = priceIdToPlans[stripePriceId]
        if (mappedPlan) {
          correctPlanId = mappedPlan
          logger.info(`Mapped price ID ${stripePriceId} to plan ${mappedPlan}`)
        } else {
          // Fallback: Try to infer from price amount or nickname
          const priceAmount = stripeSubscription.items.data[0]?.price?.unit_amount
          const priceNickname = stripeSubscription.items.data[0]?.price?.nickname
          
          logger.warn(`Unknown price ID: ${stripePriceId}, amount: ${priceAmount}, nickname: ${priceNickname}`)
          
          // Intelligent fallback based on amount or keep existing plan
          if (priceAmount && priceAmount > 0) {
            // If there's a price, it's likely not FREE
            correctPlanId = userSubscription.planId !== 'FREE' ? userSubscription.planId : 'PREMIUM'
          } else {
            correctPlanId = userSubscription.planId
          }
          
          logger.info(`Using fallback plan: ${correctPlanId}`)
        }
      } else {
        correctPlanId = userSubscription.planId
        logger.info(`No price ID found, keeping existing plan: ${correctPlanId}`)
      }
    } else {
      // Use database data if Stripe is unavailable
      correctStatus = userSubscription.status
      correctPlanId = userSubscription.planId
      currentPeriodEnd = userSubscription.currentPeriodEnd
      isSubscribed = correctStatus === 'ACTIVE'
    }

    // Check if database needs updating
    const needsUpdate = 
      userSubscription.status !== correctStatus ||
      userSubscription.planId !== correctPlanId ||
      (currentPeriodEnd && userSubscription.currentPeriodEnd?.getTime() !== currentPeriodEnd.getTime())

    if (needsUpdate) {
      logger.info(`Updating subscription data for user ${userId}`, {
        oldStatus: userSubscription.status,
        newStatus: correctStatus,
        oldPlan: userSubscription.planId,
        newPlan: correctPlanId,
      })

      await prisma.userSubscription.update({
        where: { id: userSubscription.id },
        data: {
          status: correctStatus,
          planId: correctPlanId,
          currentPeriodEnd,
          currentPeriodStart: stripeSubscription 
            ? new Date(stripeSubscription.current_period_start * 1000)
            : userSubscription.currentPeriodStart,
        }
      })
    }    // Return the corrected subscription data with debug info
    const result = {
      credits: userSubscription.user.credits || 0,
      tokensUsed: userSubscription.user.creditsUsed || 0,
      isSubscribed,
      subscriptionPlan: correctPlanId,
      status: correctStatus,
      currentPeriodEnd: currentPeriodEnd?.toISOString(),
      stripeStatus: stripeSubscription?.status,
      synced: needsUpdate,
      debug: {
        stripePriceId: stripeSubscription?.items.data[0]?.price?.id,
        stripePriceAmount: stripeSubscription?.items.data[0]?.price?.unit_amount,
        stripePriceNickname: stripeSubscription?.items.data[0]?.price?.nickname,
        originalPlan: userSubscription.planId,
        originalStatus: userSubscription.status,
      }
    }

    logger.info(`Subscription sync completed for user ${userId}`, result)

    return NextResponse.json({
      message: 'Subscription synced successfully',
      subscription: result,
    })

  } catch (error) {
    logger.error('Subscription sync failed:', error)
    return NextResponse.json(
      { error: 'Failed to sync subscription' },
      { status: 500 }
    )
  }
}
