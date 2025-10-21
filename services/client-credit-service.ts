/**
 * Client-side Credit Service
 * Provides credit information for browser components via API calls
 */

interface ClientCreditInfo {
  hasCredits: boolean
  remainingCredits: number
  totalCredits: number
  usedCredits: number
}

interface ClientCreditDetails {
  hasCredits: boolean
  currentBalance: number
  requiredCredits: number
  canProceed: boolean
  details: {
    userCredits: number
    subscriptionCredits: number
    totalCredits: number
    used: number
    remaining: number
  }
}

export class ClientCreditService {
  /**
   * Get credit details for the current user
   */
  static async getCreditDetails(): Promise<ClientCreditInfo> {
    try {
      const response = await fetch('/api/credits/details', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, return zero credits
          return {
            hasCredits: false,
            remainingCredits: 0,
            totalCredits: 0,
            usedCredits: 0
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch credit details')
      }

      return result.data
    } catch (error) {
      console.error('[ClientCreditService] Error:', error)
      // Return safe defaults on error
      return {
        hasCredits: false,
        remainingCredits: 0,
        totalCredits: 0,
        usedCredits: 0
      }
    }
  }

  /**
   * Check if user has enough credits for an operation
   */
  static async canPerformOperation(requiredCredits: number = 1): Promise<boolean> {
    try {
      const creditInfo = await this.getCreditDetails()
      return creditInfo.remainingCredits >= requiredCredits
    } catch (error) {
      console.error('[ClientCreditService] Error checking credits:', error)
      return false
    }
  }

  /**
   * Format credit display text
   */
  static formatCreditDisplay(creditInfo: ClientCreditInfo): string {
    return `${creditInfo.usedCredits} used of ${creditInfo.totalCredits} total credits. ${creditInfo.remainingCredits} remaining.`
  }
}

// Export singleton-like interface for consistency
const clientCreditService = ClientCreditService