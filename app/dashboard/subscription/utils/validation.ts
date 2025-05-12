/**
 * Subscription Data Validation Utilities
 *
 * This file contains utilities for validating and transforming subscription data
 * to ensure it matches the expected types and formats.
 */

import type {
  SubscriptionData,
  SubscriptionPlanType,
  SubscriptionStatusType,
  TokenUsageResponse,
} from "../types/subscription"

/**
 * Validates and transforms a raw subscription response into a properly typed SubscriptionData object
 */
export function validateSubscriptionResponse(data: any): SubscriptionData {
  if (!data) {
    console.warn("Received empty subscription data")
    return createDefaultSubscriptionData()
  }

  try {
    // Extract and validate subscription plan
    const subscriptionPlan = validateSubscriptionPlan(data.subscriptionPlan || data.plan)

    // Extract and validate subscription status
    const status = validateSubscriptionStatus(data.status)

    // Determine if user is subscribed based on status and plan
    const isActive = status === "ACTIVE" || data.isActive === true || data.active === true
    const isSubscribed = isActive && subscriptionPlan !== "FREE"

    // Extract expiration date from various possible fields
    const expirationDate = data.expirationDate || data.expiresAt || undefined

    // Extract token usage data
    const credits = typeof data.credits === "number" ? data.credits : 0
    const tokensUsed = typeof data.tokensUsed === "number" ? data.tokensUsed : 0

    // Extract cancel at period end flag
    const cancelAtPeriodEnd = !!data.cancelAtPeriodEnd

    // Extract features if available
    const features = Array.isArray(data.features) ? data.features : undefined

    return {
      credits,
      tokensUsed,
      isSubscribed,
      subscriptionPlan,
      status,
      expirationDate,
      cancelAtPeriodEnd,
      features,
    }
  } catch (error) {
    console.error("Error validating subscription response:", error)
    return createDefaultSubscriptionData()
  }
}

/**
 * Validates and normalizes a subscription status value
 */
export function validateSubscriptionStatus(status: any): SubscriptionStatusType {
  if (!status) return "NONE"

  const normalizedStatus = String(status).toUpperCase()

  // Check if the status is one of the valid status types
  const validStatuses: SubscriptionStatusType[] = ["ACTIVE", "CANCELED", "PAST_DUE", "UNPAID", "TRIAL", "NONE"]

  if (validStatuses.includes(normalizedStatus as SubscriptionStatusType)) {
    return normalizedStatus as SubscriptionStatusType
  }

  // Map common alternative status values
  if (normalizedStatus === "ACTIVE" || normalizedStatus === "CURRENT") return "ACTIVE"
  if (normalizedStatus === "CANCELLED" || normalizedStatus === "CANCELED") return "CANCELED"
  if (normalizedStatus === "TRIAL_ACTIVE") return "TRIAL"

  // Default to NONE for unrecognized status values
  return "NONE"
}

/**
 * Validates and normalizes a subscription plan value
 */
export function validateSubscriptionPlan(plan: any): SubscriptionPlanType {
  if (!plan) return "FREE"

  const normalizedPlan = String(plan).toUpperCase()

  // Check if the plan is one of the valid plan types
  const validPlans: SubscriptionPlanType[] = ["FREE", "BASIC", "PRO", "ULTIMATE"]

  if (validPlans.includes(normalizedPlan as SubscriptionPlanType)) {
    return normalizedPlan as SubscriptionPlanType
  }

  // Map common alternative plan values
  if (normalizedPlan === "PREMIUM") return "PRO"
  if (normalizedPlan === "ENTERPRISE") return "ULTIMATE"

  // Default to FREE for unrecognized plan values
  return "FREE"
}

/**
 * Creates a default subscription data object for fallback
 */
export function createDefaultSubscriptionData(): SubscriptionData {
  return {
    credits: 0,
    tokensUsed: 0,
    isSubscribed: false,
    subscriptionPlan: "FREE",
    status: "NONE",
  }
}

/**
 * Validates token usage data
 */
export function validateTokenUsage(data: any): TokenUsageResponse {
  if (!data) {
    return { used: 0, total: 0 }
  }

  const used = typeof data.used === "number" ? data.used : 0
  const total = typeof data.total === "number" ? data.total : 0

  return { used, total }
}
