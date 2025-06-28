import type {
  SubscriptionState,
  SubscriptionData,
  SubscriptionPlanType,
  SubscriptionStatusType,
  SubscriptionResult,
} from "@/app/types/subscription"

/**
 * Safely parses subscription data from storage
 * @param data The data to parse
 * @returns Parsed subscription data or null if invalid
 */
export function parseSubscriptionData(data: string | null): Partial<SubscriptionState> | null {
  if (!data) return null

  try {
    const parsed = JSON.parse(data)

    // Validate the parsed data has the minimum required fields
    if (typeof parsed !== "object" || parsed === null) {
      return null
    }

    // Ensure type property exists
    if (!parsed.type) {
      parsed.type = "subscription"
    }

    return parsed
  } catch (error) {
    console.error("Error parsing subscription data:", error)
    return null
  }
}

/**
 * Calculate savings percentage between two prices
 * @param monthlyPrice Monthly price
 * @param discountedPrice Discounted price
 * @param months Number of months
 * @returns Savings percentage
 */
export function calculateSavings(monthlyPrice: number, discountedPrice: number, months: number): number {
  if (monthlyPrice <= 0 || discountedPrice <= 0 || months <= 0) return 0

  const totalMonthlyPrice = monthlyPrice * months
  const savings = totalMonthlyPrice - discountedPrice
  const savingsPercentage = (savings / totalMonthlyPrice) * 100

  return Math.round(savingsPercentage)
}

/**
 * Checks if a subscription is active
 * @param subscription The subscription to check
 * @returns True if the subscription is active
 */
export function isSubscriptionActive(subscription: SubscriptionData | null): boolean {
  if (!subscription) return false

  // Check if subscription is active and not cancelled
  return subscription.status === "ACTIVE" && !subscription.cancelAtPeriodEnd
}

/**
 * Gets the number of credits available based on subscription data
 * @param subscription The subscription to check
 * @returns The number of credits available
 */
export function getAvailableCredits(subscription: SubscriptionData | null): number {
  if (!subscription) return 0

  return Math.max(0, subscription.credits - subscription.tokensUsed)
}

/**
 * Checks if a feature is available for a subscription plan
 * @param subscriptionPlan The subscription plan to check
 * @param feature The feature to check
 * @returns True if the feature is available
 */
export function isFeatureAvailable(
  subscriptionPlan: SubscriptionPlanType,
  feature: "advanced_quizzes" | "unlimited_generation" | "api_access" | "priority_support",
): boolean {
  // Feature availability by plan
  switch (subscriptionPlan) {
    case "ULTIMATE":
      return true // All features available
    case "PRO":
      return feature !== "api_access" // All except API access
    case "BASIC":
      return feature === "advanced_quizzes" || feature === "unlimited_generation"
    case "FREE":
    default:
      return false
  }
}

/**
 * Validates subscription plan type
 * @param plan Plan to validate
 * @returns Valid subscription plan type
 */
export function validateSubscriptionPlan(plan: any): SubscriptionPlanType {
  const validPlans: SubscriptionPlanType[] = ["FREE", "BASIC", "PRO", "ULTIMATE"]

  if (typeof plan === "string" && validPlans.includes(plan.toUpperCase() as SubscriptionPlanType)) {
    return plan.toUpperCase() as SubscriptionPlanType
  }

  return "FREE"
}

/**
 * Validates subscription status type
 * @param status Status to validate
 * @returns Valid subscription status type
 */
export function validateSubscriptionStatus(status: any): SubscriptionStatusType {
  const validStatuses: SubscriptionStatusType[] = [
    "ACTIVE",
    "CANCELED",
    "PAST_DUE",
    "UNPAID",
    "TRIAL",
    "NONE",
    "INACTIVE",
    "EXPIRED",
    "PENDING",
  ]

  if (typeof status === "string" && validStatuses.includes(status.toUpperCase() as SubscriptionStatusType)) {
    return status.toUpperCase() as SubscriptionStatusType
  }

  return "INACTIVE"
}

/**
 * Formats subscription expiration date
 * @param expirationDate Expiration date string or Date
 * @returns Formatted date string
 */
export function formatExpirationDate(expirationDate: string | Date | null | undefined): string | null {
  if (!expirationDate) return null

  try {
    const date = new Date(expirationDate)
    if (isNaN(date.getTime())) return null

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return null
  }
}

/**
 * Calculates days until expiration
 * @param expirationDate Expiration date
 * @returns Number of days until expiration
 */
export function getDaysUntilExpiration(expirationDate: string | Date | null | undefined): number | null {
  if (!expirationDate) return null

  try {
    const date = new Date(expirationDate)
    if (isNaN(date.getTime())) return null

    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  } catch {
    return null
  }
}

/**
 * Checks if subscription is expiring soon (within 7 days)
 * @param expirationDate Expiration date
 * @returns True if expiring soon
 */
export function isExpiringSoon(expirationDate: string | Date | null | undefined): boolean {
  const days = getDaysUntilExpiration(expirationDate)
  return days !== null && days <= 7 && days > 0
}

/**
 * Creates a default subscription result for error cases
 * @param message Error message
 * @param error Error type
 * @returns Subscription result
 */
export function createErrorResult(message: string, error?: string): SubscriptionResult {
  return {
    success: false,
    message,
    error,
  }
}

/**
 * Creates a success subscription result
 * @param message Success message
 * @param data Additional data
 * @returns Subscription result
 */
export function createSuccessResult(message: string, data?: Partial<SubscriptionResult>): SubscriptionResult {
  return {
    success: true,
    message,
    ...data,
  }
}

/**
 * Determines if a user can change from one plan to another
 * @param currentPlan Current subscription plan
 * @param targetPlan Target subscription plan
 * @param currentStatus Current subscription status
 * @param allowDowngrades Whether downgrades are allowed
 * @returns Object with canChange boolean and reason
 */
export function canChangePlan(
  currentPlan: SubscriptionPlanType,
  targetPlan: SubscriptionPlanType,
  currentStatus: SubscriptionStatusType,
  allowDowngrades = false,
): { canChange: boolean; reason?: string } {
  // Can't change to the same plan
  if (currentPlan === targetPlan) {
    return { canChange: false, reason: "You are already on this plan" }
  }

  // Can't change if current subscription is not active
  if (currentStatus !== "ACTIVE") {
    return { canChange: false, reason: "Current subscription is not active" }
  }

  // Check if it's a downgrade
  const planHierarchy: Record<SubscriptionPlanType, number> = {
    FREE: 0,
    BASIC: 1,
    PRO: 2,
    ULTIMATE: 3,
  }

  const currentLevel = planHierarchy[currentPlan]
  const targetLevel = planHierarchy[targetPlan]

  if (targetLevel < currentLevel && !allowDowngrades) {
    return { canChange: false, reason: "Downgrades are not allowed" }
  }

  return { canChange: true }
}
