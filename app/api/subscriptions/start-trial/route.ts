import { NextRequest, NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/server-auth'
import { SubscriptionService } from '@/modules/subscriptions'
import { logger } from '@/lib/logger'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Apply rate limiting
    const rateLimitResult = await rateLimit(userId, {
      limit: 3, // 3 trial activations per hour
      windowInSeconds: 3600,
      identifier: 'trial-activation'
    })

    if (!rateLimitResult.success) {
      return NextResponse.json({ 
        error: 'Too many trial activation attempts. Please wait before trying again.',
        retryAfter: rateLimitResult.reset
      }, { status: 429 })
    }

    // Parse request body
    const body = await req.json().catch(() => ({}))
    const planId = body.planId || 'BASIC'

    // Validate plan ID
    const validPlans = ['BASIC', 'PREMIUM', 'ULTIMATE']
    if (!validPlans.includes(planId)) {
      return NextResponse.json({ 
        error: 'Invalid plan ID',
        message: 'Plan must be one of: BASIC, PREMIUM, ULTIMATE' 
      }, { status: 400 })
    }

    logger.info(`Trial activation request for user ${userId} with plan ${planId}`)

    // Activate trial
    const result = await SubscriptionService.activateTrial(userId, planId)

    if (result.success) {
      logger.info(`Successfully activated trial for user ${userId}`)
      return NextResponse.json({
        success: true,
        message: 'Trial activated successfully',
        planId,
        trialDays: 30,
        credits: result.data?.credits || 0
      })
    } else {
      logger.warn(`Failed to activate trial for user ${userId}`)
      return NextResponse.json({
        success: false,
        error: 'Failed to activate trial'
      }, { status: 400 })
    }

  } catch (error: any) {
    logger.error('Trial activation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while activating trial'
    }, { status: 500 })
  }
}
