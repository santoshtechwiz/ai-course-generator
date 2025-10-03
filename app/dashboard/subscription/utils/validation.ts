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
} from "@/types/subscription"
import { validateSubscriptionPlan } from "@/types/subscription/utils"

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

    return {
      // Fill minimal required fields for SubscriptionData defined in types
      id: data.id || "",
      userId: data.userId || data.user || "",
      subscriptionId: data.subscriptionId || data.id || "",
      credits,
      tokensUsed,
      isSubscribed,
      subscriptionPlan,
      plan: subscriptionPlan,
      expirationDate: expirationDate || null,
      trialEndsAt: data.trialEndsAt || null,
      status,
      cancelAtPeriodEnd,
      nextBillingDate: data.nextBillingDate || null,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      metadata: data.metadata || undefined,
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
  // Map incoming status values to the canonical SubscriptionStatusType union
  if (!status) return "INACTIVE"

  const normalizedStatus = String(status).toUpperCase()

  switch (normalizedStatus) {
    case "ACTIVE":
    case "CURRENT":
      return "ACTIVE"
    case "CANCELLED":
    case "CANCELED":
    case "CANCELED":
      return "CANCELLED"
    case "PAST_DUE":
    case "UNPAID":
      return "PAST_DUE"
    case "TRIAL":
    case "TRIAL_ACTIVE":
      return "TRIAL"
    case "EXPIRED":
      return "EXPIRED"
    default:
      return "INACTIVE"
  }
}

/**
 * Creates a default subscription data object for fallback
 */
export function createDefaultSubscriptionData(): SubscriptionData {
  return {
    id: "free",
    userId: "",
    subscriptionId: "free",
    credits: 0,
    tokensUsed: 0,
    isSubscribed: false,
    subscriptionPlan: "FREE",
    plan: "FREE",
    expirationDate: null,
    trialEndsAt: null,
    status: "INACTIVE",
    cancelAtPeriodEnd: false,
    nextBillingDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: undefined,
  }
}

/**
 * Validates token usage data
 */
export function validateTokenUsage(data: any): { used: number; total: number } {
  if (!data) {
    return { used: 0, total: 0 }
  }

  const used = typeof data.used === "number" ? data.used : 0
  const total = typeof data.total === "number" ? data.total : 0

  return { used, total }
}
