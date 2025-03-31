/**
 * Calculate the percentage savings between monthly and longer-term pricing
 * @param monthlyPrice The price for a single month
 * @param longerTermPrice The price for the longer term (e.g., 6 months, annual)
 * @param equivalentMonths How many months the longer term covers
 * @returns The percentage saved, rounded to the nearest integer
 */
export function calculateSavings(monthlyPrice: number, longerTermPrice: number, equivalentMonths: number): number {
  if (monthlyPrice <= 0 || longerTermPrice <= 0 || equivalentMonths <= 0) {
    return 0
  }

  const totalMonthlyPrice = monthlyPrice * equivalentMonths
  const savings = totalMonthlyPrice - longerTermPrice
  const savingsPercentage = (savings / totalMonthlyPrice) * 100

  // Round to the nearest integer
  return Math.round(savingsPercentage)
}

/**
 * Utility function to calculate the discounted price with proper formatting
 * @param originalPrice The original price before discount
 * @param discountPercentage The percentage discount to apply
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
 * Utility function to format a price as a string with 2 decimal places
 * @param price The price to format
 * @returns Formatted price string with 2 decimal places
 */
export function formatPrice(price: number): string {
  return price.toFixed(2)
}

/**
 * Utility function to get discounted price
 */
export function getDiscountedPriceUtil(originalPrice: number, discountPercentage: number): number {
  if (discountPercentage <= 0) return originalPrice
  const discountAmount = (originalPrice * discountPercentage) / 100
  return originalPrice - discountAmount
}

