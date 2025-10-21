/**
 * Server-side subscription validation utility
 * Used in API routes to validate subscription status before performing protected actions
 */

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { SubscriptionService } from "@/services/subscription-services"
import type { SubscriptionPlanType } from "@/types/subscription"
import { prisma } from "@/lib/db"

interface ValidationResult {
  isValid: boolean
  error?: string
  subscription?: {
    plan: SubscriptionPlanType
    isActive: boolean
    hasCredits: boolean
  }
}

/**
 * Server-side subscription validation utility
 * Used in API routes to validate subscription status before performing protected actions
 */
export async function validateSubscriptionServer(
  userId: string,
  options: {
    requireSubscription?: boolean
    requireCredits?: boolean
    requiredPlan?: SubscriptionPlanType
  } = {}
): Promise<ValidationResult> {
  const {
    requireSubscription = true,
    requireCredits = true,
    requiredPlan = "FREE"
  } = options

  try {
    // Get subscription data directly from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true
      }
    })
    
    if (!user) {
      return {
        isValid: false,
        error: "User not found"
      }
    }

    const subscription = user.subscription
    const credits = user.credits || 0
    const creditsUsed = user.creditsUsed || 0
    const hasCredits = credits > creditsUsed
    const isActive = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIAL'
    const plan = (subscription?.planId || 'FREE') as SubscriptionPlanType

    // Plan hierarchy for validation  
    const planHierarchy: Record<SubscriptionPlanType, number> = {
      "FREE": 0,
      "BASIC": 1,
      "PREMIUM": 2,
      "ENTERPRISE": 3
    }

    const currentPlanLevel = planHierarchy[plan] || 0
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0

    const subscriptionInfo = {
      plan,
      isActive: isActive || false,
      hasCredits
    }

    // Validate subscription requirements
    if (requireSubscription && !isActive) {
      return {
        isValid: false,
        error: "Subscription is not active",
        subscription: subscriptionInfo
      }
    }

    // Validate plan level
    if (currentPlanLevel < requiredPlanLevel) {
      return {
        isValid: false,
        error: `${requiredPlan} plan or higher required`,
        subscription: subscriptionInfo
      }
    }

    // Validate credits
    if (requireCredits && !hasCredits) {
      return {
        isValid: false,
        error: "Insufficient credits",
        subscription: subscriptionInfo
      }
    }

    return {
      isValid: true,
      subscription: subscriptionInfo
    }

  } catch (error) {
    console.error("Subscription validation error:", error)
    return {
      isValid: false,
      error: "Failed to validate subscription"
    }
  }
}

/**
 * Route handler wrapper for subscription validation
 */
function withSubscriptionValidation(
  handler: Function,
  options: {
    requireSubscription?: boolean
    requireCredits?: boolean
    requiredPlan?: SubscriptionPlanType
  } = {}
) {
  return async function(req: Request) {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 })
      }

      const validation = await validateSubscriptionServer(session.user.id, options)

      if (!validation.isValid) {
        return new Response(validation.error, { 
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
          statusText: validation.error
        })
      }

      // Call the original handler with validation result
      return handler(req, validation)
    } catch (error) {
      console.error("API route error:", error)
      return new Response("Internal Server Error", { status: 500 })
    }
  }
}