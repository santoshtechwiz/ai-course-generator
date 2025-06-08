import type { SubscriptionState, SubscriptionData } from "@/store/slices/subscription-slice"
import type { SubscriptionPlanType as ImportedPlanType, SubscriptionStatusType } from "../types/subscription"

// Fix enum declaration to match the string type from the types file
export const enum SubscriptionPlanType {
  FREE = "FREE",
  BASIC = "BASIC",
  PRO = "PRO",
  PREMIUM = "PRO", // This should be "PRO" to match usage
}

// Make status values uppercase to match the SubscriptionStatusType
export const enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE", 
  CANCELED = "CANCELED",
  PAST_DUE = "PAST_DUE",
  PENDING = "PENDING",
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
  if (!subscription || !subscription.data) return 0

  // Calculate savings based on subscription plan
  switch (subscription.data.subscriptionPlan) {
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
  if (!subscription || !subscription.data) return false

  // Check if subscription is active
  if (subscription.data.status === SubscriptionStatus.ACTIVE) return true

  // Check if subscription is on a paid plan
  if (subscription.data.subscriptionPlan !== SubscriptionPlanType.FREE && subscription.data.isSubscribed) return true

  return false
}

/**
 * Gets the number of credits available based on subscription plan
 * @param subscription The subscription to check
 * @returns The number of credits available
 */
export function getAvailableCredits(subscription: SubscriptionState | null): number {
  if (!subscription || !subscription.data) return 0

  // Return credits from subscription or calculate based on plan
  if (typeof subscription.data.credits === "number") {
    return Math.max(0, subscription.data.credits - (subscription.data.tokensUsed || 0))
  }

  // Default credits by plan if not explicitly set
  switch (subscription.data.subscriptionPlan) {
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
  if (!subscription || !subscription.data) return false

  // Check if subscription is active
  if (!isSubscriptionActive(subscription)) {
    // Free users can only use basic features
    return false
  }

  // Feature availability by plan
  switch (subscription.data.subscriptionPlan) {
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
