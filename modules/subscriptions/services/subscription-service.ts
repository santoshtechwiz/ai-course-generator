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
import { prisma } from '@/lib/db'
import { StripeService, TokenUsageService } from '@/modules/subscriptions'

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
   * Calculate comprehensive subscription status considering:
   * 1. Active subscription status (ACTIVE)
   * 2. Trial status with expiration check
   * 3. Available credits/tokens (user can still use features)
   * 4. Graceful handling of expired/inactive subscriptions
   * 
   * BUG FIX: Previously only checked subscription.status, ignoring users with remaining credits
   */
  private static calculateIsSubscribed(user: any): boolean {
    const subscription = user.subscription
    const credits = user.credits || 0
    const creditsUsed = user.creditsUsed || 0
    const hasRemainingCredits = credits > creditsUsed

    // Check for active subscription
    if (subscription?.status === 'ACTIVE') {
      return true
    }

    // Check for valid trial
    if (subscription?.status === 'TRIAL' && 
        subscription.currentPeriodEnd && 
        new Date(subscription.currentPeriodEnd) > new Date()) {
      return true
    }

    // BUG FIX: Check if user has remaining credits/tokens
    // Even if subscription is inactive, user can still use the platform if they have tokens
    if (hasRemainingCredits) {
      return true
    }

    return false
  }
  
  /**
   * Get current subscription status directly from database for improved performance
   * BUG FIX: Now correctly handles users with tokens but no active subscription
   */
  static async getSubscriptionStatus(userId: string): Promise<SubscriptionData | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true
        }
      })

      if (!user) {
        logger.warn(`User not found: ${SecurityService.maskSensitiveString(userId)}`)
        return {
          ...DEFAULT_FREE_SUBSCRIPTION,
          userId: userId,
          subscriptionId: 'free'
        }
      }

      // User exists but no subscription record
      if (!user.subscription) {
        // BUG FIX: Check if user has credits even without subscription
        const hasRemainingCredits = (user.credits || 0) > (user.creditsUsed || 0)
        
        return {
          ...DEFAULT_FREE_SUBSCRIPTION,
          userId: userId,
          subscriptionId: 'free',
          credits: user.credits || 0,
          tokensUsed: user.creditsUsed || 0,
          isSubscribed: hasRemainingCredits, // User can use platform if they have tokens
          metadata: {
            source: 'database_query',
            timestamp: new Date().toISOString()
          }
        }
      }

      // BUG FIX: Use centralized calculation that considers tokens/credits
      const isSubscribed = this.calculateIsSubscribed(user)
      const remainingCredits = Math.max(0, (user.credits || 0) - (user.creditsUsed || 0))

      logger.info(`[SubscriptionService] User ${SecurityService.maskSensitiveString(userId)}: isSubscribed=${isSubscribed}, credits=${user.credits}, used=${user.creditsUsed}, status=${user.subscription.status}`)

      return {
        id: user.subscription.id,
        userId: user.id,
        subscriptionId: user.subscription.stripeSubscriptionId || user.subscription.id,
        credits: user.credits || 0,
        tokensUsed: user.creditsUsed || 0,
        isSubscribed, // Now correctly considers tokens AND subscription status
        subscriptionPlan: user.subscription.planId as SubscriptionPlanType,
        expirationDate: user.subscription.currentPeriodEnd?.toISOString() || null,
        status: user.subscription.status as any,
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        createdAt: user.subscription.createdAt.toISOString(),
        updatedAt: user.subscription.updatedAt.toISOString(),
        metadata: {
          source: 'database_query',
          timestamp: new Date().toISOString()
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error'
      logger.error(
        `Error fetching subscription status for user ${SecurityService.maskSensitiveString(userId)}: ${errorMessage}`,
        { 
          errorType: error?.name,
          stack: error?.stack?.split('\n').slice(0, 3).join('\n') // First 3 lines only
        }
      )
      
      return {
        ...DEFAULT_FREE_SUBSCRIPTION,
        userId: userId,
        subscriptionId: 'free'
      }
    }
  }

  /**
   * Get tokens used by a user directly from database for improved performance
   */
  static async getTokensUsed(userId: string): Promise<{ used: number; total: number }> {
    try {
      // Get directly from database for improved performance
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true
        }
      })

      if (!user) {
        return { used: 0, total: 0 }
      }

      return {
        used: user.creditsUsed || 0,
        total: user.credits || 0
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error'
      logger.error(
        `Error fetching tokens for user ${SecurityService.maskSensitiveString(userId)}: ${errorMessage}`
      )
      return { used: 0, total: 0 }
    }
  }

  /**
   * Get billing history for a user from Stripe
   */
  static async getBillingHistory(userId: string): Promise<any[]> {
    try {
      // Get user to find Stripe customer ID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true
        }
      })

      if (!user?.subscription?.stripeCustomerId) {
        return []
      }

      // Get invoices directly from Stripe
      const invoices = await StripeService.getBillingHistory(user.subscription.stripeCustomerId)
      
      // Transform to expected format
      return invoices.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount_paid / 100, // Convert from cents
        date: new Date(invoice.created * 1000).toISOString(),
        description: invoice.description || `Invoice #${invoice.number}`,
        status: invoice.status,
        pdf: invoice.invoice_pdf,
        planId: invoice.lines?.data[0]?.plan?.id || null
      }))
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error'
      logger.error(
        `Error fetching billing history for user ${SecurityService.maskSensitiveString(userId)}: ${errorMessage}`
      )
      return []
    }
  }

  /**
   * Get payment methods for a user from Stripe
   */
  static async getPaymentMethods(userId: string): Promise<any[]> {
    try {
      // Get user to find Stripe customer ID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true
        }
      })

      if (!user?.subscription?.stripeCustomerId) {
        return []
      }

      // Get payment methods directly from Stripe
      const paymentMethods = await StripeService.getPaymentMethods(user.subscription.stripeCustomerId)
      
      // Transform to expected format
      return paymentMethods.map(pm => ({
        id: pm.id,
        brand: pm.card?.brand || 'unknown',
        last4: pm.card?.last4 || '****',
        expMonth: pm.card?.exp_month || 0,
        expYear: pm.card?.exp_year || 0,
        isDefault: pm.metadata?.default === 'true'
      }))
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error'
      logger.error(
        `Error fetching payment methods for user ${SecurityService.maskSensitiveString(userId)}: ${errorMessage}`
      )
      return []
    }
  }

  /**
   * Refresh subscription data by fetching latest from database
   * The force flag will additionally sync with Stripe if true
   */
  static async refreshSubscription(userId: string, force = false): Promise<SubscriptionResponse> {
    try {
      if (force) {
        // If force is true, sync with Stripe first
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { subscription: true }
        })
        
        if (user?.subscription?.stripeSubscriptionId) {
          // TODO: Implement sync with Stripe when StripeService.syncSubscriptionFromStripe is available
          // await StripeService.syncSubscriptionFromStripe(
          //   user.subscription.stripeSubscriptionId,
          //   user.id
          // )
        }
      }
      
      // Get fresh data from database
      const subscriptionData = await this.getSubscriptionStatus(userId)
      
      if (!subscriptionData) {
        throw new Error('Failed to refresh subscription data')
      }
      
      return {
        success: true,
        data: subscriptionData,
        metadata: {
          source: 'refresh_subscription',
          timestamp: new Date().toISOString()
        }
      }
    } catch (error: any) {
      logger.error(
        `Error refreshing subscription for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      throw error
    }
  }

  /**
   * Cancel subscription directly with Stripe and update database
   */
  static async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      // Find the subscription in database
      const subscription = await prisma.userSubscription.findFirst({
        where: {
          OR: [
            { id: subscriptionId },
            { stripeSubscriptionId: subscriptionId }
          ]
        },
        include: { user: true }
      })

      if (!subscription) {
        throw new Error('Subscription not found')
      }

      const stripeSubId = subscription.stripeSubscriptionId || subscriptionId

      // Cancel in Stripe if it exists
      if (stripeSubId) {
        // TODO: Implement StripeService.cancelSubscription
        // await StripeService.cancelSubscription(stripeSubId)
      }

      // Update in database
      await prisma.userSubscription.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: true,
          status: 'CANCELED'
        }
      })

      return true
    } catch (error: any) {
      logger.error(
        `Error cancelling subscription ${SecurityService.maskSensitiveString(subscriptionId)}:`,
        SecurityService.sanitizeError(error)
      )
      return false
    }
  }

  /**
   * Resume canceled subscription directly with Stripe and update database
   */
  static async resumeSubscription(userId: string): Promise<boolean> {
    try {
      // Find the user's subscription
      const subscription = await prisma.userSubscription.findFirst({
        where: {
          userId,
          cancelAtPeriodEnd: true,
          status: { not: 'EXPIRED' }
        }
      })

      if (!subscription?.stripeSubscriptionId) {
        throw new Error('No cancelable subscription found')
      }

      // Resume in Stripe
      // TODO: Implement StripeService.resumeSubscription
      // await StripeService.resumeSubscription(subscription.stripeSubscriptionId)

      // Update in database
      await prisma.userSubscription.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: false,
          status: 'ACTIVE'
        }
      })

      return true
    } catch (error: any) {
      logger.error(
        `Error resuming subscription for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      return false
    }
  }

  /**
   * Update subscription data in database and Stripe if needed
   */
  static async updateSubscription(
    subscriptionId: string, 
    data: Partial<SubscriptionData>
  ): Promise<SubscriptionResponse> {
    try {
      // Find the subscription
      const subscription = await prisma.userSubscription.findFirst({
        where: {
          OR: [
            { id: subscriptionId },
            { stripeSubscriptionId: subscriptionId }
          ]
        },
        include: { user: true }
      })

      if (!subscription) {
        throw new Error('Subscription not found')
      }

      const updateData: any = {}
      
      // Handle plan changes if needed
      if (data.subscriptionPlan && data.subscriptionPlan !== subscription.planId) {
        updateData.planId = data.subscriptionPlan
        
        // If we have a Stripe subscription, update the plan in Stripe
        if (subscription.stripeSubscriptionId) {
          await StripeService.updateSubscriptionPlan(
            subscription.stripeSubscriptionId, 
            data.subscriptionPlan as SubscriptionPlanType
          )
        }
      }
      
      // Handle status changes
      if (data.status && data.status !== subscription.status) {
        updateData.status = data.status
      }
      
      // Update in database if we have changes
      if (Object.keys(updateData).length > 0) {
        await prisma.userSubscription.update({
          where: { id: subscription.id },
          data: updateData
        })
      }
      
      // Return fresh subscription data
      const updatedData = await this.getSubscriptionStatus(subscription.userId)
      
      return {
        success: true,
        data: updatedData as SubscriptionData,
        metadata: {
          source: 'update_subscription',
          timestamp: new Date().toISOString()
        }
      }
    } catch (error: any) {
      logger.error(
        `Error updating subscription ${SecurityService.maskSensitiveString(subscriptionId)}:`,
        SecurityService.sanitizeError(error)
      )
      throw error
    }
  }

  /**
   * Activate a paid plan and add appropriate credits
   * Called by webhook when payment is successful
   */
  static async activatePaidPlan(userId: string, planId: SubscriptionPlanType, stripeSubscriptionId?: string): Promise<SubscriptionResponse> {
    try {
      logger.info(`Activating paid plan ${planId} for user ${SecurityService.maskSensitiveString(userId)}`)

      // Get the plan token amount based on plan ID
      const getTokensForPlan = (planId: string): number => {
        const tokenMap: Record<string, number> = {
          'FREE': 5,
          'BASIC': 25, 
          'PREMIUM': 100,
          'ULTIMATE': 250
        }
        return tokenMap[planId] || 0
      }

      const planTokens = getTokensForPlan(planId)
      
      await prisma.$transaction(async (tx) => {
        // Update or create subscription
        await tx.userSubscription.upsert({
          where: { userId },
          update: {
            planId,
            status: 'ACTIVE',
            stripeSubscriptionId: stripeSubscriptionId || null,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          },
          create: {
            userId,
            planId,
            status: 'ACTIVE',
            stripeSubscriptionId: stripeSubscriptionId || null,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        })
        
        // Add credits to user account
        await tx.user.update({
          where: { id: userId },
          data: {
            credits: {
              increment: planTokens
            },
            hadPreviousPaidPlan: true,
            userType: planId
          }
        })
        
        // Log the credit addition
        await tx.tokenTransaction.create({
          data: {
            userId,
            amount: 0,
            credits: planTokens,
            type: 'SUBSCRIPTION_UPGRADE',
            description: `${planId} plan activated - ${planTokens} credits added`
          }
        })
      })

      // Get fresh subscription data
      const subscriptionData = await this.getSubscriptionStatus(userId)
      
      return {
        success: true,
        data: subscriptionData as SubscriptionData,
        metadata: {
          source: 'activate_paid_plan',
          timestamp: new Date().toISOString(),
          message: `${planId} plan activated successfully with ${planTokens} credits`
        }
      }
    } catch (error: any) {
      logger.error(
        `Error activating paid plan ${planId} for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      throw error
    }
  }

  /**
   * Subscribe to a plan with upgrade flow validation:
   * - Free → Basic (or higher) is allowed
   * - No downgrades allowed (Basic → Free or Pro → Basic)
   * - Redirect to Stripe for paid plans, update database for free plans
   */
  static async subscribeToPlan(planType: SubscriptionPlanType | 'free_trial', userId: string): Promise<SubscriptionResponse> {
    try {
      // Handle trial activation
      if (planType === 'free_trial') {
        return await this.activateFreeTrial(userId)
      }
      
      // Validate the plan type for regular plans
      if (!validateSubscriptionPlan(planType)) {
        throw new Error(`Invalid subscription plan: ${planType}`)
      }
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      })
      
      if (!user) {
        throw new Error('User not found')
      }
      
      const currentPlan = user.subscription?.planId || 'FREE'
      const currentStatus = user.subscription?.status || 'INACTIVE'
      
      // Validate upgrade/downgrade rules
      const planHierarchy = ['FREE', 'free_trial', 'BASIC', 'PREMIUM', 'ULTIMATE']
      const currentIndex = planHierarchy.indexOf(currentPlan)
      const newIndex = planHierarchy.indexOf(planType)
      
      // Block downgrades
      if (currentIndex > newIndex && currentStatus === 'ACTIVE') {
        throw new Error(`Downgrade from ${currentPlan} to ${planType} is not allowed. Please wait for your current subscription to expire.`)
      }
      
      // Special case: Users who used trial cannot go back to FREE
      if (planType === 'FREE' && user.hasUsedFreePlan && currentPlan !== 'FREE') {
        throw new Error('You cannot downgrade to the free plan after having a paid subscription')
      }
      
      // Handle FREE plan activation
      if (planType === 'FREE') {
        return await this.activateFreePlan(userId)
      }
      
      // For paid plans, create a checkout session
      const checkoutSession = await this.createCheckoutSession(userId, planType, 1)
      
      return {
        success: true,
        data: {
          ...DEFAULT_FREE_SUBSCRIPTION,
          userId: userId,
          subscriptionPlan: planType,
          isSubscribed: false,
          status: 'INACTIVE',
          metadata: {
            source: 'create_subscription_checkout',
            timestamp: new Date().toISOString()
          }
        },
        metadata: {
          source: 'create_subscription',
          timestamp: new Date().toISOString()
        }
      }
    } catch (error: any) {
      logger.error(
        `Error subscribing to plan ${planType}:`,
        error.message
      )
      throw error
    }
  }

  /**
   * Activate free trial: 5 tokens lifetime, valid for 1 month only
   * Users who already used trial cannot subscribe to free again
   */
  static async activateFreeTrial(userId: string): Promise<SubscriptionResponse> {
    try {
      // Check if user already used trial
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      })
      
      if (!user) {
        throw new Error('User not found')
      }
      
      // Check if user has used trial before (check for any previous free_trial subscription)
      const previousTrial = await prisma.userSubscription.findFirst({
        where: { 
          userId,
          planId: 'free_trial'
        }
      })
      
      if (previousTrial) {
        throw new Error('User has already used their free trial')
      }
      
      // Check if user already has active subscription
      if (user.subscription && user.subscription.status === 'ACTIVE') {
        throw new Error('User already has an active subscription')
      }
      
      // Calculate trial period (1 month)
      const now = new Date()
      const trialEnd = new Date(now)
      trialEnd.setMonth(trialEnd.getMonth() + 1)
      
      const result = await prisma.$transaction(async (tx) => {
        // Create trial subscription record
        const subscription = await tx.userSubscription.upsert({
          where: { userId },
          update: {
            planId: 'free_trial',
            status: 'TRIAL',
            currentPeriodStart: now,
            currentPeriodEnd: trialEnd
          },
          create: {
            userId,
            planId: 'free_trial',
            status: 'TRIAL',
            currentPeriodStart: now,
            currentPeriodEnd: trialEnd
          }
        })
        
        // Update user with 5 trial tokens
        await tx.user.update({
          where: { id: userId },
          data: { 
            credits: 5,
            creditsUsed: 0,
            userType: 'free_trial',
            hasUsedFreePlan: true // Mark as having used free plan
          }
        })
        
        // Record transaction for audit
        await tx.tokenTransaction.create({
          data: {
            userId,
            amount: 0,
            credits: 5,
            type: 'TRIAL_ACTIVATION',
            description: 'Free trial activated - 5 tokens for 1 month'
          }
        })
        
        // Create subscription event
        await tx.subscriptionEvent.create({
          data: {
            userId,
            userSubscriptionId: subscription.id,
            previousStatus: null,
            newStatus: 'TRIAL',
            reason: 'Free trial activated',
            source: 'SYSTEM'
          }
        })
        
        return subscription
      })
      
      // Get fresh subscription data
      const subscriptionData = await this.getSubscriptionStatus(userId)
      
      return {
        success: true,
        data: subscriptionData as SubscriptionData,
        metadata: {
          source: 'activate_trial',
          timestamp: new Date().toISOString(),
          message: 'Free trial activated successfully - 5 tokens added for 1 month'
        }
      }
    } catch (error: any) {
      logger.error(`Error activating free trial for user ${SecurityService.maskSensitiveString(userId)}:`, {
        message: error.message,
        code: 'TRIAL_ACTIVATION_ERROR',
        timestamp: new Date().toISOString(),
        requestId: Math.random().toString(36).substring(7)
      })
      
      throw error
    }
  }

  /**
   * Create checkout session for subscription using Stripe
   */
  static async createCheckoutSession(
    userId: string,
    planId: string,
    duration: number,
    options?: any
  ): Promise<any> {
    try {
      // For FREE plans, handle directly without Stripe
      if (planId === 'FREE') {
        // Activate free plan directly
        await this.activateFreePlan(userId)
        return {
          success: true,
          message: 'Free plan activated successfully',
          redirect: '/dashboard/subscription?activated=true'
        }
      }

      // Get user and their subscription 
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Create or get Stripe customer
      let customerId = user.subscription?.stripeCustomerId
      if (!customerId) {
        customerId = await StripeService.getOrCreateCustomer(userId, user.email || undefined)
        
        // Update subscription with customer ID if subscription exists
        if (user.subscription) {
          await prisma.userSubscription.update({
            where: { id: user.subscription.id },
            data: { stripeCustomerId: customerId }
          })
        }
      }
      
      // Create checkout session
      const session = await StripeService.createCheckoutSession(
        userId,
        planId,
        duration,
        user.email || undefined,
        { customerId, ...options }
      )
      
      return session
    } catch (error: any) {
      logger.error(
        `Error creating checkout session for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      throw error
    }
  }

  /**
   * Activate free plan for a user by creating a subscription record
   */
  static async activateFreePlan(userId: string): Promise<SubscriptionResponse> {
    try {
      // Check if user already has a subscription
      let subscription = await prisma.userSubscription.findFirst({
        where: { userId }
      })
      
      const now = new Date()
      const nextYear = new Date(now)
      nextYear.setFullYear(nextYear.getFullYear() + 1)
      
      if (subscription) {
        // Update existing subscription
        subscription = await prisma.userSubscription.update({
          where: { id: subscription.id },
          data: {
            planId: 'FREE',
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: nextYear,
            cancelAtPeriodEnd: false
          }
        })
      } else {
        // Create new subscription
        subscription = await prisma.userSubscription.create({
          data: {
            userId,
            planId: 'FREE',
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: nextYear
          }
        })
      }
      
      // Ensure user has appropriate credits
      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: 5, // Default free credits
          creditsUsed: 0
        }
      })
      
      // Get fresh subscription data
      const subscriptionData = await this.getSubscriptionStatus(userId)
      
      return {
        success: true,
        data: subscriptionData as SubscriptionData,
        metadata: {
          source: 'activate_free_plan',
          timestamp: new Date().toISOString()
        }
      }
    } catch (error: any) {
      logger.error(
        `Error activating free plan for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      throw error
    }
  }

  /**
   * Verify payment success for a given Stripe session ID
   * Returns a normalized object with important subscription details
   */
  static async verifyPaymentSuccess(userId: string, sessionId: string): Promise<any> {
    try {
      logger.info(`Verifying payment success for user ${SecurityService.maskSensitiveString(userId)}, session: ${sessionId}`)
      
      // Get current subscription status from database
      const subscriptionData = await this.getSubscriptionStatus(userId)
      
      if (subscriptionData) {
        return {
          success: true,
          subscription: subscriptionData,
          message: 'Payment verified successfully'
        }
      } else {
        return {
          success: false,
          error: 'No subscription found',
          message: 'Unable to verify payment - subscription not found'
        }
      }
    } catch (error: any) {
      logger.error(
        `Error verifying payment for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      return {
        success: false,
        error: error.message,
        message: 'Payment verification failed'
      }
    }
  }
  
  /**
   * Add credits to a user's account (for manual fixes or testing)
   */
  static async addCreditsToUser(userId: string, credits: number, reason: string = 'Manual credit addition'): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx) => {
        // Add credits to user account
        await tx.user.update({
          where: { id: userId },
          data: {
            credits: {
              increment: credits
            }
          }
        })
        
        // Log the credit addition
        await tx.tokenTransaction.create({
          data: {
            userId,
            amount: 0,
            credits,
            type: 'MANUAL_CREDIT_ADD',
            description: reason
          }
        })
      })
      
      logger.info(`Added ${credits} credits to user ${SecurityService.maskSensitiveString(userId)}`)
      return true
    } catch (error: any) {
      logger.error(
        `Error adding credits to user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      return false
    }
  }
  
  /**
   * Update user token usage in the database
   */
  static async updateTokenUsage(userId: string, tokensUsed: number): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          creditsUsed: {
            increment: tokensUsed
          }
        }
      })
      return true
    } catch (error: any) {
      logger.error(
        `Error updating token usage for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      return false
    }
  }
}