/**
 * Subscription Utility Functions
 *
 * This file contains utility functions for subscription-related operations.
 */

/**
 * Calculate the percentage savings between monthly and longer-term plans
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
 * Format a price with currency symbol
 */
export function formatPrice(price: number, currency = "USD"): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  })

  return formatter.format(price)
}

/**
 * Calculate discounted price based on a percentage discount
 */
export function calculateDiscountedPrice(originalPrice: number, discountPercentage: number): number {
  if (discountPercentage <= 0 || discountPercentage >= 100) {
    return originalPrice
  }

  const discountAmount = (originalPrice * discountPercentage) / 100
  return Math.round((originalPrice - discountAmount) * 100) / 100 // Round to 2 decimal places
}

/**
 * Determine if a plan change is allowed based on current plan and target plan
 */
export function canChangePlan(
  currentPlan: string | null,
  targetPlan: string,
  subscriptionStatus: string | null,
): { canChange: boolean; reason?: string } {
  // If no current plan, any plan can be selected
  if (!currentPlan) {
    return { canChange: true }
  }

  // Normalize status for comparison
  const normalizedStatus = subscriptionStatus?.toUpperCase() || null

  // If subscription is not active, any plan can be selected
  if (normalizedStatus !== "ACTIVE" && normalizedStatus !== "TRIAL") {
    return { canChange: true }
  }

  // Cannot change to the same plan
  if (currentPlan === targetPlan) {
    return {
      canChange: false,
      reason: "You are already subscribed to this plan",
    }
  }

  // Free plan cannot be selected if user has a paid plan
  if (targetPlan === "FREE" && currentPlan !== "FREE") {
    return {
      canChange: false,
      reason: "You must cancel your current subscription before switching to the free plan",
    }
  }

  // Allow upgrades (assuming plan hierarchy: FREE < BASIC < PRO < ULTIMATE)
  const planHierarchy = { FREE: 0, BASIC: 1, PRO: 2, ULTIMATE: 3 }
  const currentPlanRank = planHierarchy[currentPlan as keyof typeof planHierarchy] || 0
  const targetPlanRank = planHierarchy[targetPlan as keyof typeof planHierarchy] || 0

  if (targetPlanRank <= currentPlanRank) {
    return {
      canChange: false,
      reason: "You can only upgrade to a higher tier plan",
    }
  }

  return { canChange: true }
}

/**
 * Format a date string in a user-friendly format
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return "N/A"

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid Date"
  }
}

/**
 * Calculate days remaining until a date
 */
export function calculateDaysRemaining(dateString: string | undefined): number {
  if (!dateString) return 0

  try {
    const targetDate = new Date(dateString)
    const currentDate = new Date()

    // Reset time portion for accurate day calculation
    targetDate.setHours(0, 0, 0, 0)
    currentDate.setHours(0, 0, 0, 0)

    const differenceInTime = targetDate.getTime() - currentDate.getTime()
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24))

    return Math.max(0, differenceInDays)
  } catch (error) {
    console.error("Error calculating days remaining:", error)
    return 0
  }
}
