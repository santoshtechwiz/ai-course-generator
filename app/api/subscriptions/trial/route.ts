import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { SubscriptionService } from "@/modules/subscriptions"
import { logger } from "@/lib/logger"

/**
 * Free Trial Activation Endpoint
 * 
 * Activates free trial: 5 tokens lifetime, valid for 1 month only
 * Users who already used trial cannot subscribe again
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Authentication required",
          message: "Please log in to activate your free trial"
        }, 
        { status: 401 }
      )
    }

    const userId = session.user.id
    logger.info(`Processing free trial activation for user ${userId}`)

    // Activate free trial using the service
    const result = await SubscriptionService.activateFreeTrial(userId)

    if (result.success) {
      logger.info(`Free trial activated successfully for user ${userId}`)
      return NextResponse.json({
        success: true,
        message: result.metadata?.message || 'Free trial activated successfully',
        data: result.data
      })
    } else {
      logger.warn(`Free trial activation failed for user ${userId}: ${result.error?.message}`)
      return NextResponse.json({
        success: false,
        error: 'TRIAL_ACTIVATION_FAILED',
        message: result.error?.message || 'Failed to activate free trial'
      }, { status: 400 })
    }

  } catch (error: any) {
    logger.error('Error in trial activation endpoint:', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    })

    // Handle specific error types
    if (error.message.includes('already used')) {
      return NextResponse.json({
        success: false,
        error: 'TRIAL_ALREADY_USED',
        message: 'You have already used your free trial. Please choose a paid plan to continue.'
      }, { status: 400 })
    }

    if (error.message.includes('already has an active subscription')) {
      return NextResponse.json({
        success: false,
        error: 'ALREADY_SUBSCRIBED',
        message: 'You already have an active subscription.'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'TRIAL_ACTIVATION_ERROR',
      message: 'An error occurred while activating your free trial. Please try again.'
    }, { status: 500 })
  }
}

/**
 * Get trial eligibility for a user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Authentication required" 
        }, 
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { prisma } = await import("@/lib/db")

    // Check if user has used trial before
    const previousTrial = await prisma.userSubscription.findFirst({
      where: { 
        userId,
        planId: 'free_trial'
      }
    })

    // Check current subscription status
    const currentSubscription = await prisma.userSubscription.findUnique({
      where: { userId }
    })

    const isEligible = !previousTrial && 
      (!currentSubscription || currentSubscription.status !== 'ACTIVE')

    return NextResponse.json({
      success: true,
      eligible: isEligible,
      reason: previousTrial 
        ? 'Trial already used' 
        : currentSubscription?.status === 'ACTIVE' 
          ? 'Already has active subscription'
          : 'Eligible for trial'
    })

  } catch (error: any) {
    logger.error('Error checking trial eligibility:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check trial eligibility'
    }, { status: 500 })
  }
}