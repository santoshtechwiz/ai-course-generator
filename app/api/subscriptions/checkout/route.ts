import { NextRequest, NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/server-auth'
import { SubscriptionService } from '@/services/subscription-services'
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
      limit: 5, // 5 checkout attempts per hour
      windowInSeconds: 3600,
      identifier: 'checkout'
    })

    if (!rateLimitResult.success) {
      return NextResponse.json({ 
        error: 'Too many checkout attempts. Please wait before trying again.',
        retryAfter: rateLimitResult.reset
      }, { status: 429 })
    }

    // Parse request body
    const body = await req.json().catch(() => ({}))
    const { planId, duration = 1, options = {} } = body

    // Validate inputs
    if (!planId) {
      return NextResponse.json({ 
        error: 'Plan ID is required' 
      }, { status: 400 })
    }

    if (![1, 6, 12].includes(duration)) {
      return NextResponse.json({ 
        error: 'Duration must be 1, 6, or 12 months' 
      }, { status: 400 })
    }

    logger.info(`Checkout request for user ${userId}, plan ${planId}, duration ${duration}`)

    // Create checkout session
    const result = await SubscriptionService.createCheckoutSession(
      userId,
      planId,
      duration,
      options
    )

    if (result.success) {
      if (result.url) {
        // Stripe checkout URL
        return NextResponse.json({
          success: true,
          url: result.url,
          message: 'Redirecting to checkout...'
        })
      } else {
        // Direct activation (FREE plan)
        return NextResponse.json({
          success: true,
          redirect: '/dashboard/subscription?activated=true',
          message: result.message || 'Plan activated successfully!'
        })
      }
    } else {
      logger.warn(`Checkout failed for user ${userId}: ${result.message}`)
      return NextResponse.json({
        success: false,
        error: result.message || 'Failed to create checkout session'
      }, { status: 400 })
    }

  } catch (error: any) {
    logger.error('Checkout error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred during checkout'
    }, { status: 500 })
  }
}
