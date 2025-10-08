/**
 * API Route: /api/subscriptions/validate
 * 
 * Server-side subscription validation endpoint used by middleware.
 * Validates user's subscription status and access permissions.
 * 
 * ⚠️ SECURITY CRITICAL: This endpoint is used by middleware to prevent
 * unauthorized access to premium features. It must be reliable and secure.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { validateSubscriptionServer } from '@/lib/subscription-validation'
import { FEATURE_REQUIREMENTS } from '@/hooks/useFeatureAccess'
import type { FeatureType } from '@/hooks/useFeatureAccess'

/**
 * POST /api/subscriptions/validate
 * 
 * Validates subscription status for middleware protection.
 * Used internally by route protection middleware.
 */
export async function POST(req: NextRequest) {
  try {
    // Check if request is from middleware
    const requestedWith = req.headers.get('x-requested-with')
    if (requestedWith !== 'middleware') {
      return NextResponse.json(
        { 
          success: false, 
          reason: 'invalid_request',
          message: 'This endpoint is for internal use only' 
        },
        { status: 400 }
      )
    }

    // Get user session
    const token = await getToken({ 
      req,
      secureCookie: process.env.NODE_ENV === "production"
    })

    if (!token || !token.sub) {
      return NextResponse.json(
        { 
          success: false, 
          reason: 'auth_required',
          message: 'Authentication required' 
        },
        { status: 401 }
      )
    }

    const userId = token.sub

    // Parse request body to get route context
    let body: { path?: string; feature?: FeatureType } = {}
    try {
      body = await req.json()
    } catch {
      // If no body, use general validation
    }

    // Determine feature requirements based on path
    let feature: FeatureType = 'quiz-access' // default
    let requiresCredits = true
    let requiredPlan: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE' = 'BASIC'

    if (body.feature && FEATURE_REQUIREMENTS[body.feature]) {
      const requirements = FEATURE_REQUIREMENTS[body.feature]
      feature = body.feature
      requiresCredits = requirements.requiresCredits
      requiredPlan = requirements.minimumPlan
    } else if (body.path) {
      // Infer feature from path
      if (body.path.includes('/mcq')) {
        feature = 'quiz-mcq'
        requiresCredits = true
        requiredPlan = 'FREE'
      } else if (body.path.includes('/openended')) {
        feature = 'quiz-openended'
        requiresCredits = true
        requiredPlan = 'PREMIUM'
      } else if (body.path.includes('/code')) {
        feature = 'quiz-code'
        requiresCredits = true
        requiredPlan = 'PREMIUM'
      } else if (body.path.includes('/blanks')) {
        feature = 'quiz-blanks'
        requiresCredits = true
        requiredPlan = 'BASIC'
      } else if (body.path.includes('/flashcard')) {
        feature = 'quiz-flashcard'
        requiresCredits = true
        requiredPlan = 'FREE'
      } else if (body.path.includes('/course/create')) {
        feature = 'course-creation'
        requiresCredits = true
        requiredPlan = 'FREE'
      }
    }

    // Validate subscription using centralized logic
    const validation = await validateSubscriptionServer(userId, {
      requireSubscription: requiredPlan !== 'FREE',
      requiresCredits,
      requiredPlan
    })

    if (!validation.isValid) {
      let reason = 'access_denied'
      
      if (validation.error?.includes('not active')) {
        reason = 'subscription_inactive'
      } else if (validation.error?.includes('plan')) {
        reason = 'plan_insufficient' 
      } else if (validation.error?.includes('credits')) {
        reason = 'insufficient_credits'
      }

      return NextResponse.json(
        { 
          success: false, 
          reason,
          message: validation.error,
          requiredPlan,
          subscription: validation.subscription
        },
        { status: 403 }
      )
    }

    // Access granted
    return NextResponse.json(
      { 
        success: true, 
        message: 'Access granted',
        subscription: validation.subscription,
        feature
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('[SubscriptionValidation] API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        reason: 'server_error',
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/subscriptions/validate
 * 
 * Simple validation endpoint for client-side checks.
 * Returns current user's subscription status.
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ 
      req,
      secureCookie: process.env.NODE_ENV === "production"
    })

    if (!token || !token.sub) {
      return NextResponse.json(
        { 
          success: false, 
          reason: 'auth_required',
          message: 'Authentication required',
          isAuthenticated: false
        },
        { status: 401 }
      )
    }

    const userId = token.sub

    // Get basic subscription info
    const validation = await validateSubscriptionServer(userId, {
      requireSubscription: false,
      requiresCredits: false,
      requiredPlan: 'FREE'
    })

    return NextResponse.json(
      { 
        success: true,
        isAuthenticated: true,
        subscription: validation.subscription
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=30'
        }
      }
    )

  } catch (error) {
    console.error('[SubscriptionValidation] GET error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        reason: 'server_error',
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}