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
   * Get current subscription status directly from database for improved performance
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

      // User exists but no subscription
      if (!user.subscription) {
        return {
          ...DEFAULT_FREE_SUBSCRIPTION,
          userId: userId,
          subscriptionId: 'free'
        }
      }

      // User has subscription, transform to SubscriptionData
      const isSubscribed = user.subscription.status === 'ACTIVE' || 
                          (user.subscription.status === 'TRIAL' && 
                           user.subscription.currentPeriodEnd && 
                           new Date(user.subscription.currentPeriodEnd) > new Date())

      return {
        id: user.subscription.id,
        userId: user.id,
        subscriptionId: user.subscription.stripeSubscriptionId || user.subscription.id,
        credits: user.credits || 0,
        tokensUsed: user.creditsUsed || 0,
        isSubscribed,
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
      logger.error(
        `Error fetching subscription status for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
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
      logger.error(
        `Error fetching tokens for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
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
      logger.error(
        `Error fetching billing history for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
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
      logger.error(
        `Error fetching payment methods for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
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
          // TODO: Implement StripeService.updateSubscriptionPlan
          // await StripeService.updateSubscriptionPlan(
          //   subscription.stripeSubscriptionId, 
          //   data.subscriptionPlan
          // )
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
   * Subscribe to a plan - creates a direct subscription in the database for free plans
   * or redirects to Stripe checkout for paid plans
   */
  static async subscribeToPlan(planType: SubscriptionPlanType, userId: string): Promise<SubscriptionResponse> {
    try {
      // Validate the plan type
      if (!validateSubscriptionPlan(planType)) {
        throw new Error(`Invalid subscription plan: ${planType}`)
      }

      // For free plans, handle directly
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
          status: 'INACTIVE', // Use valid status type
          metadata: {
            source: 'create_subscription_checkout',
            timestamp: new Date().toISOString()
          }
        },
        metadata: {
          source: 'create_subscription',
          timestamp: new Date().toISOString(),
          redirectUrl: checkoutSession.url
        }
      }
    } catch (error: any) {
      logger.error(
        `Error subscribing to plan ${planType}:`,
        SecurityService.sanitizeError(error)
      )
      throw error
    }
  }

  /**
   * Activate a trial subscription by creating subscription record in database
   */
  static async activateTrial(userId: string, planId: SubscriptionPlanType): Promise<SubscriptionResponse> {
    try {
      // Validate the plan
      if (!validateSubscriptionPlan(planId)) {
        throw new Error(`Invalid subscription plan: ${planId}`)
      }
      
      // Check if user already has a subscription
              const existingSubscription = await prisma.userSubscription.findUnique({
        where: { userId }
      })
      
      if (existingSubscription) {
        throw new Error('User already has an active subscription')
      }
      
      // Calculate trial period (e.g., 14 days)
      const trialDays = 14
      const now = new Date()
      const trialEnd = new Date(now)
      trialEnd.setDate(trialEnd.getDate() + trialDays)
      
      // Create subscription record
      const subscription = await prisma.userSubscription.create({
        data: {
          userId,
          planId,
          status: 'TRIAL',
          trialEnd,
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd
        }
      })
      
      // Update user with trial credits based on plan
      const credits = planId === 'BASIC' ? 1000 : planId === 'PREMIUM' ? 5000 : planId === 'ULTIMATE' ? 10000 : 100
      await prisma.user.update({
        where: { id: userId },
        data: { credits }
      })
      
      // Get fresh subscription data
      const subscriptionData = await this.getSubscriptionStatus(userId)
      
      return {
        success: true,
        data: subscriptionData as SubscriptionData,
        metadata: {
          source: 'start_trial',
          timestamp: new Date().toISOString()
        }
      }
    } catch (error: any) {
      logger.error(
        `Error activating trial for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
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
          credits: 50, // Default free credits
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
    // TODO: Implement this method when StripeService methods are available
    throw new Error('verifyPaymentSuccess not implemented - use webhook handler instead')
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