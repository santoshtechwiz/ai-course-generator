import type { SubscriptionPlanType, SubscriptionStatusType } from "@/app/types/subscription"

/**
 * Calculate the savings percentage between monthly and longer-term pricing
 *
 * @param monthlyPrice - The price for a single month
 * @param longerTermPrice - The price for a longer term (e.g., 6 months)
 * @param months - The number of months in the longer term
 * @returns The savings percentage
 */
export function calculateSavings(monthlyPrice: number, longerTermPrice: number, months: number): number {
  const totalMonthlyPrice = monthlyPrice * months
  const savings = totalMonthlyPrice - longerTermPrice
  const savingsPercentage = (savings / totalMonthlyPrice) * 100
  return Math.round(savingsPercentage)
}

/**
 * Check if a plan is available for subscription based on current plan and status
 *
 * @param planName - The plan to check availability for
 * @param currentPlan - The user's current plan
 * @param subscriptionStatus - The current subscription status
 * @returns Whether the plan is available for subscription
 */
export function isPlanAvailable(
  planName: SubscriptionPlanType,
  currentPlan: SubscriptionPlanType | null,
  subscriptionStatus: SubscriptionStatusType,
): boolean {
  // If no current plan or inactive, they can subscribe to any plan
  if (!currentPlan || subscriptionStatus !== "ACTIVE") {
    return true
  }

  // If they're trying to subscribe to the same plan they already have
  if (currentPlan === planName) {
    return false
  }

  // If they're on the free plan, they can upgrade to any paid plan
  if (currentPlan === "FREE") {
    return true
  }

  // If they're trying to downgrade to the free plan
  if (planName === "FREE") {
    return false
  }

  // Plan hierarchy for determining upgrades/downgrades
  const planHierarchy: Record<SubscriptionPlanType, number> = {
    FREE: 0,
    BASIC: 1,
    PRO: 2,
    ULTIMATE: 3,
  }

  // If they have a paid plan, they can't change until it expires
  return false
}

/**
 * Get a human-readable reason why a plan is not available
 *
 * @param planName - The plan to check availability for
 * @param currentPlan - The user's current plan
 * @param subscriptionStatus - The current subscription status
 * @returns A human-readable reason or undefined if the plan is available
 */
export function getPlanUnavailableReason(
  planName: SubscriptionPlanType,
  currentPlan: SubscriptionPlanType | null,
  subscriptionStatus: SubscriptionStatusType,
): string | undefined {
  // If plan is available, no reason needed
  if (isPlanAvailable(planName, currentPlan, subscriptionStatus)) {
    return undefined
  }

  // If they're trying to subscribe to the same plan they already have
  if (currentPlan === planName) {
    return "You are already subscribed to this plan"
  }

  // If they're trying to downgrade to the free plan
  if (planName === "FREE") {
    return "You need to cancel your current subscription before switching to the free plan"
  }

  // If they have a paid plan, they can't change until it expires
  return "You cannot change your subscription until your current plan expires"
}

/**
 * Check if a plan is an upgrade from the current plan
 *
 * @param currentPlan - The user's current plan
 * @param targetPlan - The plan to check
 * @returns Whether the target plan is an upgrade
 */
export function isPlanUpgrade(currentPlan: SubscriptionPlanType | null, targetPlan: SubscriptionPlanType): boolean {
  if (!currentPlan) return true

  const planHierarchy: Record<SubscriptionPlanType, number> = {
    FREE: 0,
    BASIC: 1,
    PRO: 2,
    ULTIMATE: 3,
  }

  return planHierarchy[targetPlan] > planHierarchy[currentPlan]
}

/**
 * Check if a plan is a downgrade from the current plan
 *
 * @param currentPlan - The user's current plan
 * @param targetPlan - The plan to check
 * @returns Whether the target plan is a downgrade
 */
export function isPlanDowngrade(currentPlan: SubscriptionPlanType | null, targetPlan: SubscriptionPlanType): boolean {
  if (!currentPlan) return false

  const planHierarchy: Record<SubscriptionPlanType, number> = {
    FREE: 0,
    BASIC: 1,
    PRO: 2,
    ULTIMATE: 3,
  }

  return planHierarchy[targetPlan] < planHierarchy[currentPlan]
}

