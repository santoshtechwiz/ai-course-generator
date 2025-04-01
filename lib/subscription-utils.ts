/**
 * Subscription Utility Functions
 *
 * This file contains utility functions for subscription-related calculations
 * and operations that don't require database access.
 */

/**
 * Calculate the savings percentage between monthly and longer-term billing
 *
 * @param monthlyPrice - The price for a single month
 * @param longerTermPrice - The price for the longer term (e.g., 6 months, annual)
 * @param months - The number of months in the longer term
 * @returns The percentage saved with the longer-term plan
 */
export function calculateSavings(monthlyPrice: number, longerTermPrice: number, months: number): number {
  if (monthlyPrice <= 0 || longerTermPrice <= 0 || months <= 0) {
    return 0
  }

  const totalMonthlyPrice = monthlyPrice * months
  const savings = totalMonthlyPrice - longerTermPrice
  const savingsPercentage = (savings / totalMonthlyPrice) * 100

  return Math.round(savingsPercentage)
}

/**
 * Calculate the discounted price with proper formatting
 *
 * @param originalPrice - The original price before discount
 * @param discountPercentage - The percentage discount to apply
 * @returns The discounted price, rounded to 2 decimal places
 */
export function calculateDiscountedPrice(originalPrice: number, discountPercentage: number): number {
  if (discountPercentage <= 0) return originalPrice

  // Calculate the discount amount
  const discountAmount = (originalPrice * discountPercentage) / 100

  // Apply the discount and round to 2 decimal places to avoid floating point issues
  return Math.round((originalPrice - discountAmount) * 100) / 100
}

/**
 * Format a price as a string with 2 decimal places
 *
 * @param price - The price to format
 * @returns Formatted price string with 2 decimal places
 */
export function formatPrice(price: number): string {
  return price.toFixed(2)
}

/**
 * Check if a plan is available for subscription based on current subscription status
 *
 * @param planName - The plan to check availability for
 * @param currentPlan - The user's current plan
 * @param subscriptionStatus - The user's current subscription status
 * @returns Boolean indicating if the plan is available for subscription
 */
export function isPlanAvailable(
  planName: string,
  currentPlan: string | null,
  subscriptionStatus: string | null,
): boolean {
  // Normalize status for case-insensitive comparison
  const normalizedStatus = subscriptionStatus?.toUpperCase() || null
  const isSubscribed = currentPlan && normalizedStatus === "ACTIVE"

  // If the plan is FREE, it's always available unless already subscribed
  if (planName === "FREE") {
    return !(currentPlan === "FREE" && normalizedStatus === "ACTIVE")
  }

  // If not subscribed or on FREE plan, all plans are available
  if (!isSubscribed || currentPlan === "FREE") {
    return true
  }

  // If already subscribed to a paid plan, only the current plan is available
  return planName === currentPlan
}

/**
 * Get the appropriate icon for a subscription plan
 *
 * @param planId - The ID of the subscription plan
 * @param icons - Object mapping plan IDs to their icons
 * @returns The icon component for the plan
 */
export function getPlanIcon(planId: string, icons: Record<string, any>): any {
  return icons[planId] || icons.DEFAULT
}

