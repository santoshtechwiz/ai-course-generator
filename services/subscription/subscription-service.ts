import { 
  type SubscriptionData,
  type SubscriptionResponse,
  type ApiResponse,
  type SubscriptionPlanType,
  isSubscriptionResponse,
  DEFAULT_FREE_SUBSCRIPTION
} from '@/types/subscription'
import { logger } from '@/lib/logger'
import { SecurityService } from '@/services/security-service'
import { validateSubscriptionPlan, validateSubscriptionStatus } from '@/types/subscription/utils'
import { getApiUrl } from '@/utils/api-url'

/**
 * Unified Subscription Service
 * Handles all subscription-related operations with proper error handling, validation, and caching
 */
export class SubscriptionService {
  private static readonly BASE_PATH = '/api/subscriptions'
  
  /**
   * Get the full URL for subscription endpoints
   */
  private static getUrl(endpoint: string): string {
    return getApiUrl(`${this.BASE_PATH}${endpoint}`)
  }
  
  /**
   * Get current subscription status
   */
  static async getSubscriptionStatus(userId: string): Promise<SubscriptionData | null> {
    try {
      const response = await fetch(this.getUrl('/status'), {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401) {
          return {
            ...DEFAULT_FREE_SUBSCRIPTION,
            subscriptionId: ''
          }
        }
        throw new Error('Failed to fetch subscription status')
      }

      const data: ApiResponse<SubscriptionData> = await response.json()
      
      if (!isSubscriptionResponse(data)) {
        throw new Error('Invalid subscription data received')
      }

      return data.data || null
    } catch (error: any) {
      logger.error(
        `Error fetching subscription for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      return null
    }
  }

  /**
   * Get tokens used by a user
   */
  static async getTokensUsed(userId: string): Promise<{ used: number; total: number }> {
    try {
      const response = await fetch(this.getUrl('/tokens'), {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch token usage')
      }

      const data = await response.json()
      return {
        used: data.tokensUsed || 0,
        total: data.totalTokens || 0
      }
    } catch (error: any) {
      logger.error(
        `Error fetching tokens for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      return { used: 0, total: 0 }
    }
  }

  /**
   * Get billing history for a user
   */
  static async getBillingHistory(userId: string): Promise<any[]> {
    try {
      const response = await fetch(this.getUrl('/billing-history'), {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch billing history')
      }

      const data = await response.json()
      return data.history || []
    } catch (error: any) {
      logger.error(
        `Error fetching billing history for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      return []
    }
  }

  /**
   * Get payment methods for a user
   */
  static async getPaymentMethods(userId: string): Promise<any[]> {
    try {
      const response = await fetch(this.getUrl('/payment-methods'), {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods')
      }

      const data = await response.json()
      return data.methods || []
    } catch (error: any) {
      logger.error(
        `Error fetching payment methods for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      return []
    }
  }

  /**
   * Refresh subscription data with force flag
   */
  static async refreshSubscription(userId: string, force = false): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(this.getUrl(`/status${force ? '?force=true' : ''}`), {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to refresh subscription')
      }

      const data: ApiResponse<SubscriptionData> = await response.json()
      
      if (!isSubscriptionResponse(data)) {
        throw new Error('Invalid subscription data received')
      }

      return data as SubscriptionResponse
    } catch (error: any) {
      logger.error(
        `Error refreshing subscription for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      throw error
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const response = await fetch(this.getUrl('/cancel'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to cancel subscription')
      }

      const data: ApiResponse = await response.json()
      return data.success
    } catch (error: any) {
      logger.error(
        `Error cancelling subscription ${SecurityService.maskSensitiveString(subscriptionId)}:`,
        SecurityService.sanitizeError(error)
      )
      return false
    }
  }

  /**
   * Resume canceled subscription
   */
  static async resumeSubscription(userId: string): Promise<boolean> {
    try {
      const response = await fetch(this.getUrl('/resume'), {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to resume subscription')
      }

      const data: ApiResponse = await response.json()
      return data.success
    } catch (error: any) {
      logger.error(
        `Error resuming subscription for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      return false
    }
  }

  /**
   * Update subscription data
   */
  static async updateSubscription(
    subscriptionId: string, 
    data: Partial<SubscriptionData>
  ): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(this.getUrl('/update'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, ...data }),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to update subscription')
      }

      const responseData: ApiResponse<SubscriptionData> = await response.json()
      
      if (!isSubscriptionResponse(responseData)) {
        throw new Error('Invalid subscription data received')
      }

      return responseData
    } catch (error: any) {
      logger.error(
        `Error updating subscription ${SecurityService.maskSensitiveString(subscriptionId)}:`,
        SecurityService.sanitizeError(error)
      )
      throw error
    }
  }

  /**
   * Subscribe to a plan
   */
  static async subscribeToPlan(planType: SubscriptionPlanType): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(this.getUrl('/subscribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to subscribe to plan')
      }

      const data: ApiResponse<SubscriptionData> = await response.json()
      
      if (!isSubscriptionResponse(data)) {
        throw new Error('Invalid subscription data received')
      }

      return data
    } catch (error: any) {
      logger.error(
        `Error subscribing to plan ${planType}:`,
        SecurityService.sanitizeError(error)
      )
      throw error
    }
  }

  /**
   * Activate a trial subscription
   */
  static async activateTrial(userId: string, planId: SubscriptionPlanType): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(this.getUrl('/start-trial'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to activate trial')
      }

      const data: ApiResponse<SubscriptionData> = await response.json()
      
      if (!isSubscriptionResponse(data)) {
        throw new Error('Invalid subscription data received')
      }

      return data
    } catch (error: any) {
      logger.error(
        `Error activating trial for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      throw error
    }
  }

  /**
   * Verify payment success for a given session/payment id
   * Returns a normalized object with important subscription details
   */
  static async verifyPaymentSuccess(userId: string, sessionId: string): Promise<any> {
    try {
      const response = await fetch(this.getUrl(`/verify-payment`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId }),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to verify payment')
      }

      const data = await response.json()

      // Normalize response to expected shape used by callers
      // Allowed fields: planId, credits, currentPeriodEnd, status, ...
      return {
        planId: data?.planId || data?.subscriptionPlan || data?.plan || null,
        credits: typeof data?.credits === 'number' ? data.credits : (data?.addedCredits ?? 0),
        currentPeriodEnd: data?.currentPeriodEnd || data?.nextBillingDate || null,
        status: data?.status || 'ACTIVE',
        raw: data,
      }
    } catch (error: any) {
      logger.error(`Error verifying payment for user ${SecurityService.maskSensitiveString(userId)}:`, SecurityService.sanitizeError(error))
      return null
    }
  }
}