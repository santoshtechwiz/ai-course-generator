import type { 
  SubscriptionData, 
  SubscriptionPlanType,
  SubscriptionStatusType 
} from './subscription-types'

/**
 * Validates and normalizes a subscription status value
 */
export function validateSubscriptionStatus(status: any): SubscriptionStatusType {
  if (typeof status !== 'string') {
    return 'INACTIVE'
  }

  const normalizedStatus = status.toUpperCase() as SubscriptionStatusType
  const validStatuses: SubscriptionStatusType[] = ['ACTIVE', 'INACTIVE', 'CANCELLED', 'TRIAL']
  
  return validStatuses.includes(normalizedStatus) ? normalizedStatus : 'INACTIVE'
}

/**
 * Validates and normalizes a subscription plan value
 */
export function validateSubscriptionPlan(plan: any): SubscriptionPlanType {
  if (!plan) return "FREE"

  const normalizedPlan = String(plan).toUpperCase()

  // Check if the plan is one of the valid plan types
  const validPlans: SubscriptionPlanType[] = ["FREE", "BASIC", "PREMIUM", "ULTIMATE"]

  if (validPlans.includes(normalizedPlan as SubscriptionPlanType)) {
    return normalizedPlan as SubscriptionPlanType
  }

  // Map common alternative plan values
  if (normalizedPlan === "PRO") return "PREMIUM"
  if (normalizedPlan === "ENTERPRISE") return "ULTIMATE"

  // Default to FREE for unrecognized plan values
  return "FREE"
}

/**
 * Calculate savings percentage between two prices
 */
export function calculateSavings(monthlyPrice: number, discountedPrice: number, months: number): number {
  if (monthlyPrice <= 0 || discountedPrice <= 0 || months <= 0) {
    return 0
  }
  
  const totalMonthly = monthlyPrice * months
  const savings = totalMonthly - discountedPrice
  return Math.round((savings / totalMonthly) * 100)
}

/**
 * Checks if a subscription is active
 */
export function isSubscriptionActive(subscription: SubscriptionData | null): boolean {
  if (!subscription) {
    return false
  }
  
  return subscription.status === 'ACTIVE' || subscription.status === 'TRIAL'
}

/**
 * Gets the number of available credits
 */
export function getAvailableCredits(subscription: SubscriptionData | null): number {
  if (!subscription || !isSubscriptionActive(subscription)) {
    return 0
  }
  
  return Math.max(0, subscription.credits - subscription.tokensUsed)
}