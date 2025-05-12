import type { SubscriptionState } from "@/store/slices/subscription-slice"

// Define the missing SubscriptionPlanType enum
export enum SubscriptionPlanType {
  FREE = "free",
  BASIC = "basic",
  PRO = "pro",
  PREMIUM = "premium",
}

// Define the SubscriptionStatus enum if it's not properly imported
export enum SubscriptionStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  CANCELED = "canceled",
  PAST_DUE = "past_due",
  PENDING = "pending",
}

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
export function calculateSavings(subscription: SubscriptionState | null): number {
  if (!subscription) return 0

  // Calculate savings based on subscription plan
  switch (subscription.data.plan) {
    case SubscriptionPlanType.PREMIUM:
      return 100 // Example savings for premium plan
    case SubscriptionPlanType.PRO:
      return 50 // Example savings for pro plan
    case SubscriptionPlanType.BASIC:
      return 20 // Example savings for basic plan
    case SubscriptionPlanType.FREE:
    default:
      return 0 // No savings for free plan
  }
}
/**
 * Checks if a subscription is active
 * @param subscription The subscription to check
 * @returns True if the subscription is active
 */
export function isSubscriptionActive(subscription: SubscriptionState | null): boolean {
  if (!subscription) return false

  // Check if subscription is active
  if (subscription.status === SubscriptionStatus.ACTIVE) return true

  // Check if subscription is on a paid plan
  if (subscription.plan !== SubscriptionPlanType.FREE && subscription.isSubscribed) return true

  return false
}

/**
 * Gets the number of credits available based on subscription plan
 * @param subscription The subscription to check
 * @returns The number of credits available
 */
export function getAvailableCredits(subscription: SubscriptionState | null): number {
  if (!subscription) return 0

  // Return credits from subscription or calculate based on plan
  if (typeof subscription.credits === "number") {
    return Math.max(0, subscription.credits - (subscription.tokensUsed || 0))
  }

  // Default credits by plan if not explicitly set
  switch (subscription.plan) {
    case SubscriptionPlanType.PREMIUM:
      return 500
    case SubscriptionPlanType.PRO:
      return 250
    case SubscriptionPlanType.BASIC:
      return 100
    case SubscriptionPlanType.FREE:
    default:
      return 10
  }
}

/**
 * Checks if a feature is available for a subscription
 * @param subscription The subscription to check
 * @param feature The feature to check
 * @returns True if the feature is available
 */
export function isFeatureAvailable(
  subscription: SubscriptionState | null,
  feature: "advanced_quizzes" | "unlimited_generation" | "api_access" | "priority_support",
): boolean {
  if (!subscription) return false

  // Check if subscription is active
  if (!isSubscriptionActive(subscription)) {
    // Free users can only use basic features
    return false
  }

  // Feature availability by plan
  switch (subscription.data?.currentPlan) {
    case SubscriptionPlanType.PREMIUM:
      return true // All features available
    case SubscriptionPlanType.PRO:
      return feature !== "api_access" // All except API access
    case SubscriptionPlanType.BASIC:
      return feature === "advanced_quizzes" || feature === "unlimited_generation"
    case SubscriptionPlanType.FREE:
    default:
      return false
  }
}
