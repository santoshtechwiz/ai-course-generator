/**
 * Credit calculation and validation utilities
 * Provides a consistent way to check credits across the application
 */

interface CreditInfo {
  totalCredits: number
  usedCredits: number
  remainingCredits: number
  hasCredits: boolean
  hasEnoughCredits: (required: number) => boolean
}

/**
 * Calculate credit information from user and subscription data
 */
export function calculateCreditInfo(
  userCredits?: number,
  userCreditsUsed?: number,
  subscriptionCredits?: number,
  subscriptionTokensUsed?: number
): CreditInfo {
  // Prefer user data from session, fallback to subscription data
  const totalCredits = userCredits || subscriptionCredits || 0
  const usedCredits = userCreditsUsed || subscriptionTokensUsed || 0
  const remainingCredits = Math.max(totalCredits - usedCredits, 0)
  
  return {
    totalCredits,
    usedCredits,
    remainingCredits,
    hasCredits: remainingCredits > 0,
    hasEnoughCredits: (required: number) => remainingCredits >= required
  }
}

/**
 * Check if a user has enough credits for an action
 */
function hasEnoughCredits(
  requiredCredits: number,
  userCredits?: number,
  userCreditsUsed?: number,
  subscriptionCredits?: number,
  subscriptionTokensUsed?: number
): boolean {
  const creditInfo = calculateCreditInfo(
    userCredits,
    userCreditsUsed,
    subscriptionCredits,
    subscriptionTokensUsed
  )
  
  return creditInfo.hasEnoughCredits(requiredCredits)
}

/**
 * Get a user-friendly message about credit status
 */
function getCreditMessage(
  requiredCredits: number,
  creditInfo: CreditInfo
): string {
  if (creditInfo.hasEnoughCredits(requiredCredits)) {
    return `Ready! You have ${creditInfo.remainingCredits} credits remaining.`
  }
  
  if (creditInfo.remainingCredits === 0) {
    return `You're out of credits! Purchase more to continue.`
  }
  
  return `You need ${requiredCredits} credit${requiredCredits > 1 ? 's' : ''} but only have ${creditInfo.remainingCredits} remaining.`
}
