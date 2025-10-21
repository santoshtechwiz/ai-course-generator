/**
 * Subscription Utility Functions
 * 
 * Helper functions for subscription-related calculations and operations.
 */

/**
 * Calculate savings percentage between two pricing plans
 * @param monthlyPrice - Price for monthly plan
 * @param discountPrice - Discounted price for longer duration
 * @param comparisonMonths - Number of months to compare against
 * @returns Percentage savings rounded to nearest whole number
 */
export function calculateSavings(
  monthlyPrice: number, 
  discountPrice: number, 
  comparisonMonths: number = 12
): number {
  if (monthlyPrice <= 0 || discountPrice <= 0 || comparisonMonths <= 0) {
    return 0
  }
  
  const totalMonthlyPrice = monthlyPrice * comparisonMonths
  const savings = ((totalMonthlyPrice - discountPrice) / totalMonthlyPrice) * 100
  
  return Math.round(Math.max(0, savings))
}

/**
 * Format price for display
 * @param price - Price in dollars
 * @param currency - Currency symbol (default: '$')
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: string = '$'): string {
  return `${currency}${price.toFixed(2)}`
}

/**
 * Calculate monthly equivalent price
 * @param totalPrice - Total price for duration
 * @param months - Number of months
 * @returns Monthly equivalent price
 */
export function calculateMonthlyEquivalent(totalPrice: number, months: number): number {
  if (months <= 0) return totalPrice
  return totalPrice / months
}

/**
 * Determine if a plan is considered popular
 * @param planName - Name of the subscription plan
 * @returns Boolean indicating if plan should be marked as popular
 */
export function isPlanPopular(planName: string): boolean {
  // Typically PREMIUM or BASIC plans are marked as popular
  return planName.toUpperCase() === 'PREMIUM'
}

/**
 * Calculate annual savings amount in dollars
 * @param monthlyPrice - Monthly plan price
 * @param annualPrice - Annual plan price
 * @returns Dollar amount saved annually
 */
function calculateAnnualSavingsAmount(monthlyPrice: number, annualPrice: number): number {
  const annualMonthlyTotal = monthlyPrice * 12
  return Math.max(0, annualMonthlyTotal - annualPrice)
}

/**
 * Get plan recommendation based on usage pattern
 * @param monthlyUsage - Estimated monthly usage/credits needed
 * @returns Recommended plan type
 */
export function getRecommendedPlan(monthlyUsage: number): string {
  if (monthlyUsage <= 10) return 'FREE'
  if (monthlyUsage <= 100) return 'BASIC'
  if (monthlyUsage <= 500) return 'PREMIUM'
  return 'ENTERPRISE'
}

/**
 * Validate subscription plan pricing
 * @param plans - Array of subscription plans
 * @returns Boolean indicating if pricing is valid
 */
function validatePlanPricing(plans: any[]): boolean {
  return plans.every(plan => 
    plan.price >= 0 && 
    typeof plan.price === 'number' &&
    plan.features &&
    plan.features.credits > 0
  )
}