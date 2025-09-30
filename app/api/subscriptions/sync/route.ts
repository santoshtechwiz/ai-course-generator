import { NextRequest, NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/server-auth'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'
import { rateLimit } from '@/lib/rate-limit'

// Validate Stripe API key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required but not found")
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check for valid user ID format (basic security)
    if (!userId || userId.length < 10 || !/^[a-zA-Z0-9-_]+$/.test(userId)) {
      logger.warn(`Invalid user ID format in sync request: ${userId}`)
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Apply rate limiting per user
    const rateLimitResult = await rateLimit(userId, {
      limit: 5, // 5 sync requests per minute per user
      windowInSeconds: 60,
      identifier: 'subscription-sync'
    })

    if (!rateLimitResult.success) {
      return NextResponse.json({ 
        error: 'Too many sync requests. Please wait before trying again.',
        retryAfter: rateLimitResult.reset
      }, { status: 429 })
    }

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
      logger.info(`No subscription found for user ${userId}, checking if FREE plan needed`)
      
      // Check if user exists in database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, credits: true, creditsUsed: true }
      })
      
      if (!user) {
        logger.warn(`User ${userId} not found in database`)
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      // Create FREE subscription for existing user
      await prisma.userSubscription.create({
        data: {
          userId,
          planId: "FREE",
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      })

      // Update user to reflect active free subscription
      await prisma.user.update({
        where: { id: userId },
        data: {
          userType: "FREE",
          isActive: true
        }
      })

      return NextResponse.json({
        message: 'Free subscription created and synced',
        data: {
          credits: user.credits || 0,
          tokensUsed: user.creditsUsed || 0,
          isSubscribed: false,
          subscriptionPlan: "FREE",
          status: "ACTIVE",
          synced: true
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
        // Log only high-level, non-sensitive info
        logger.info(`Stripe subscription status fetched`, {
          status: stripeSubscription.status,
          currentPeriodEnd: stripeSubscription.current_period_end,
          hasPrice: !!stripeSubscription.items.data[0]?.price?.id,
          userId: userId, // Keep user context for debugging
        })
      }
    } catch (stripeError: any) {
      // Handle 'resource_missing' gracefully
      if (stripeError?.type === 'StripeInvalidRequestError' && stripeError?.code === 'resource_missing') {
        logger.info('Stripe reported subscription not found for user; proceeding with DB state', { userId })
      } else {
        // Log sanitized error message (no sensitive data)
        logger.error('Failed to fetch subscription from Stripe:', {
          message: stripeError?.message,
          code: stripeError?.code,
          type: stripeError?.type,
          statusCode: stripeError?.statusCode,
          userId: userId, // Safe to include for debugging
        })
      }
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
      
      // Enhanced price ID mapping with fallback logic - avoid logging sensitive price IDs
      const stripePriceId = stripeSubscription.items.data[0]?.price?.id
      logger.info('Processing Stripe price information', { 
        hasPriceId: !!stripePriceId,
        userId: userId 
      })
      
      if (stripePriceId) {
        // Secure price ID mapping - consider using environment variables for these mappings
        const priceIdToPlans: Record<string, string> = {
          [process.env.STRIPE_BASIC_PRICE_ID || '']: 'BASIC',
          [process.env.STRIPE_PREMIUM_PRICE_ID || '']: 'PREMIUM', 
          [process.env.STRIPE_ULTIMATE_PRICE_ID || '']: 'ULTIMATE',
        }
        
        const mappedPlan = priceIdToPlans[stripePriceId]
        if (mappedPlan) {
          correctPlanId = mappedPlan
          logger.info(`Successfully mapped Stripe price to plan`, { 
            plan: mappedPlan,
            userId: userId 
          })
        } else {
          // Fallback: Try to infer from price amount without logging raw price IDs
          const priceAmount = stripeSubscription.items.data[0]?.price?.unit_amount
          const priceNickname = stripeSubscription.items.data[0]?.price?.nickname

          logger.warn('Unknown Stripe price ID; using fallback plan inference', { 
            hasAmount: !!priceAmount, 
            hasNickname: !!priceNickname,
            userId: userId 
          })

          // Intelligent fallback based on amount or keep existing plan
          if (priceAmount && priceAmount > 0) {
            // If there's a price, it's likely not FREE
            correctPlanId = userSubscription.planId !== 'FREE' ? userSubscription.planId : 'PREMIUM'
          } else {
            correctPlanId = userSubscription.planId
          }

          logger.info('Applied fallback plan mapping', { 
            plan: correctPlanId,
            userId: userId 
          })
        }
      } else {
        correctPlanId = userSubscription.planId
        logger.info(`No price ID found, keeping existing plan`, { 
          plan: correctPlanId,
          userId: userId 
        })
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
        userId: userId,
      })

      // Update subscription in a transaction to prevent race conditions
      try {
        await prisma.$transaction(async (tx) => {
          await tx.userSubscription.update({
            where: { id: userSubscription.id },
            data: {
              // cast to any to avoid strict enum mismatch between runtime values and Prisma generated types
              status: correctStatus as any,
              planId: correctPlanId as any,
              currentPeriodEnd,
              currentPeriodStart: stripeSubscription 
                ? new Date(stripeSubscription.current_period_start * 1000)
                : userSubscription.currentPeriodStart,
            }
          })
          
          // Ensure user type matches subscription for consistency
          const effectiveUserType = correctStatus === "ACTIVE" ? correctPlanId : "FREE"
          const effectiveSubscriptionActive = correctStatus === "ACTIVE"
          
          await tx.user.update({
            where: { id: userId },
            data: { 
              userType: effectiveUserType,
              isActive: effectiveSubscriptionActive
            }
          })
        })
        
        logger.info(`Subscription successfully updated for user ${userId}`)
      } catch (txError: any) {
        logger.error(`Transaction failed for user ${userId}:`, txError)
        return NextResponse.json({ 
          error: 'Failed to update subscription data',
          message: 'Database transaction failed' 
        }, { status: 500 })
      }
    }
    
    // Return the corrected subscription data without sensitive debug info
    const result = {
      credits: userSubscription.user.credits || 0,
      tokensUsed: userSubscription.user.creditsUsed || 0,
      isSubscribed,
      subscriptionPlan: correctPlanId,
      status: correctStatus,
      currentPeriodEnd: currentPeriodEnd?.toISOString(),
      synced: needsUpdate,
      // Only include safe, non-sensitive debug info
      debug: process.env.NODE_ENV === 'development' ? {
        stripePricePresent: !!stripeSubscription?.items.data[0]?.price?.id,
        originalPlan: userSubscription.planId,
        originalStatus: userSubscription.status,
        hasStripeData: !!stripeSubscription,
      } : undefined
    }

    logger.info(`Subscription sync completed for user ${userId}`, {
      synced: needsUpdate,
      plan: correctPlanId,
      status: correctStatus,
      userId: userId,
    })

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
