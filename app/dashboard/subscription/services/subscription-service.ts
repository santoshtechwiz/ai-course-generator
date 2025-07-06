import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { LRUCache } from "lru-cache";
import { getPaymentGateway } from "./payment-gateway-factory";
import { PaymentGateway } from "./payment-gateway-interface";
import { PromoValidationResult, SubscriptionPlanType, SubscriptionStatusType } from "@/app/types/subscription";
import { VALID_PROMO_CODES } from "../components/subscription-plans";

const MAX_CACHE_SIZE = 1000; // Set an appropriate cache size
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const subscriptionCache = new LRUCache<string, { data: any; timestamp: number }>({ max: MAX_CACHE_SIZE });
export class SubscriptionService {

  /**
   * Clear cache for a specific user
   * @param userId - The ID of the user
   */
  static clearUserCache(userId: string): void {
    if (!userId) return

    const keysToDelete = [`subscription_${userId}`, `tokens_${userId}`, `billing_${userId}`]

    keysToDelete.forEach((key) => subscriptionCache.delete(key))
    logger.debug(`Cleared cache for user ${userId}`)
  }  /**
   * 
   * Activate the free plan for a user with guaranteed consistency
   *
   * @param userId - The ID of the user
   * @returns Object with success status and plan information
   */
  static async activateFreePlan(
    userId: string,
  ): Promise<{ success: boolean; message?: string; alreadySubscribed?: boolean }> {
    try {
      logger.info(`Activating free plan for user ${userId}`)
      
      return await prisma.$transaction(async (tx) => {
        // Check if user already has a subscription
        const existingSubscription = await tx.userSubscription.findUnique({
          where: { userId },
        })

        // If user already has active free plan, return success
        if (existingSubscription?.planId === "FREE" && existingSubscription.status === "ACTIVE") {
          return { success: true, message: "Already on free plan", alreadySubscribed: true }
        }

        // Check if user already received free tokens
        const existingFreeTokens = await tx.tokenTransaction.findFirst({
          where: {
            userId,
            type: "SUBSCRIPTION",
            description: "Added 5 tokens for free plan",
          },
        })

        const tokensToAdd = existingFreeTokens ? 0 : 5
        const currentPeriodEnd = new Date()
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)

        // Update subscription
        await tx.userSubscription.upsert({
          where: { userId },
          update: {
            planId: "FREE",
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd,
          },
          create: {
            userId,
            planId: "FREE",
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd,
          },
        })

        // Update user with consistent data
        await tx.user.update({
          where: { id: userId },
          data: {
            userType: "FREE",
            ...(tokensToAdd > 0 && {
              credits: { increment: tokensToAdd }
            })
          },
        })

        // Add token transaction if applicable
        if (tokensToAdd > 0) {
          await tx.tokenTransaction.create({
            data: {
              userId,
              credits: tokensToAdd,
              amount: 0,
              type: "SUBSCRIPTION",
              description: "Added 5 tokens for free plan",
            },
          })
        }

        // Clear cache for this user
        this.clearUserCache(userId)

        logger.info(`Successfully activated free plan for user ${userId}`, { tokensAdded: tokensToAdd })
        return { success: true, message: "Free plan activated successfully" }
      })
    } catch (error: any) {
      logger.error(`Error activating free plan for user ${userId}:`, error)
      throw new Error(`Failed to activate free plan: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Get the subscription status for a user
   *
   * @param userId - The ID of the user
   * @returns Object with subscription status information
   */  static async getSubscriptionStatus(userId: string): Promise<any> {
    try {
      if (!userId) {
        logger.warn("getSubscriptionStatus called without userId")
        return {
          credits: 0,
          tokensUsed: 0,
          isSubscribed: false,
          subscriptionPlan: "FREE",
          status: "INACTIVE",
        }
      }

      // Check cache first with extended TTL during errors
      const cacheKey = `subscription_${userId}`
      let cachedData = subscriptionCache.get(cacheKey) // Declare cachedData with let
      const now = Date.now()

      // Use cached data if available and not expired
      if (cachedData) {
        const cacheAge = now - cachedData.timestamp;
        
        // Always use cache if within normal TTL
        if (cacheAge < CACHE_TTL) {
          logger.debug(`Using cached subscription data for user ${userId}, age: ${cacheAge}ms`)
          return cachedData.data;
        }
        
        // Use stale cache if we had errors recently (circuit breaker pattern)
        const errorKey = `error_count_${userId}`;
        const recentErrors = subscriptionCache.get(errorKey);
        if (recentErrors && recentErrors.data > 3 && cacheAge < CACHE_TTL * 3) {
          logger.warn(`Using stale cache due to recent errors for user ${userId}, age: ${cacheAge}ms`);
          return cachedData.data;        }
      }

      // Get user subscription data and credits in parallel with timeout protection
      const DB_TIMEOUT = 8000 // Increased timeout to 8 seconds

      // Use a real Error object for timeout
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database query timed out")), DB_TIMEOUT)
      )

      try {
        // Use promise.race to implement timeout
        const [userSubscription, user] = await Promise.race([
          Promise.all([
            prisma.userSubscription.findUnique({
              where: { userId }
            }),
            prisma.user.findUnique({
              where: { id: userId },
              select: { credits: true, creditsUsed: true }
            })
          ]),
          timeout
        ]) as [any, any];

        // Reset error counter on success
        subscriptionCache.delete(`error_count_${userId}`);
        
        // Default values if no subscription exists
        if (!userSubscription) {
          const result = {
            credits: user?.credits || 0,
            tokensUsed: user?.creditsUsed || 0,
            isSubscribed: false,
            subscriptionPlan: "FREE",
            status: "INACTIVE",
          }

          // Cache the result
          subscriptionCache.set(cacheKey, { data: result, timestamp: now })
          return result
        }

        // Determine if the subscription is active
        const isSubscribed = userSubscription.status === "ACTIVE"

        // Format the expiration date if it exists
        const expirationDate = userSubscription.currentPeriodEnd
          ? userSubscription.currentPeriodEnd.toISOString()
          : undefined

        const result = {
          credits: user?.credits || 0,
          tokensUsed: user?.creditsUsed || 0,
          isSubscribed,
          subscriptionPlan: userSubscription.planId as SubscriptionPlanType,
          expirationDate,
          status: userSubscription.status,
        }

        // Cache the result with current timestamp
        subscriptionCache.set(cacheKey, { data: result, timestamp: now })
        return result
      } catch (dbError: any) {
        // Track errors to implement circuit breaker pattern
        const errorKey = `error_count_${userId}`;
        const currentErrors = subscriptionCache.get(errorKey);
        const errorCount = currentErrors ? currentErrors.data + 1 : 1;
        subscriptionCache.set(errorKey, { data: errorCount, timestamp: now });

        // Enhanced error logging with more details
        if (dbError instanceof Error) {
          logger.error(`Database error fetching subscription data: ${dbError.message}`, {
            userId,
            errorCount,
            errorName: dbError.name,
            stack: dbError.stack?.slice(0, 200)
          });
        } else {
          logger.error(`Database error fetching subscription data: ${typeof dbError === "string" ? dbError : JSON.stringify(dbError)}`, { userId, errorCount });
        }
        
        // Fall back to cached data even if expired, or default values
        if (cachedData) {
          logger.warn(`Using expired cached subscription data for user ${userId} due to DB error`);
          return cachedData.data;
        }

        const defaultData = {
          credits: 0,
          tokensUsed: 0,
          isSubscribed: false,
          subscriptionPlan: "FREE",
          status: "INACTIVE",
        };
        // Cache the default data with a short TTL
        subscriptionCache.set(cacheKey, { data: defaultData, timestamp: now - CACHE_TTL + 60000 }); // 1 minute TTL
        return defaultData;
      }
    } catch (error: any) {
      // Enhanced error logging and handling
      if (error instanceof Error) {
        logger.error(`Error in getSubscriptionStatus for user ${userId}: ${error.message}`, {
          errorName: error.name,
          stack: error.stack?.slice(0, 200), // Log limited stack trace
          userId
        });
      } else {
        logger.error(`Error in getSubscriptionStatus for user ${userId}: ${error}`);
      }
      
      // Return cached data if available, otherwise provide default with more detailed status
      if (cachedData) {
        logger.info(`Returning cached data for user ${userId} due to error`);
        return cachedData.data;
      }
      
      // If we get here, we have a network or service failure
      return {
        credits: 0,
        tokensUsed: 0,
        isSubscribed: false,
        subscriptionPlan: "FREE" as SubscriptionPlanType,
        status: "NETWORK_ERROR",
        error: error instanceof Error ? error.message : "Service temporarily unavailable"
      };
    }
  }

  /**
   * Get the token usage for a user
   *
   * @param userId - The ID of the user
   * @returns Object with used and total tokens
   */
  static async getTokensUsed(
    userId: string,
  ): Promise<{ used: number; total: number }> {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      // Check cache first
      const cacheKey = `tokens_${userId}`
      const cachedData = subscriptionCache.get(cacheKey)

      if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
        // logger.debug(`Using cached token usage data for user ${userId}`)
        return cachedData.data
      }

      // Get user\'s current credits directly from the user table with improved error handling
      const user = await prisma.user
        .findUnique({
          where: { id: userId },
          select: { credits: true, creditsUsed: true },
        })
        .catch((error: any) => {
          logger.error("Database error fetching user token usage:", error)
          throw new Error("Failed to fetch token usage data from database")
        })

      if (!user) {
        logger.warn(`User with ID ${userId} not found when getting token usage`)
        return { used: 0, total: 0 }
      }

      // Get the user\'s subscription to determine token
      const userSubscription = await prisma.userSubscription.findUnique({
        where: { userId },
      })

      // If user has an active subscription, total tokens are based on the plan
      let totalTokens = user?.credits || 0
      if (
        userSubscription &&
        userSubscription.status === "ACTIVE" &&
        userSubscription.planId !== "FREE"
      ) {
        // For paid plans, total tokens might be dynamic or based on plan details
        // For simplicity, let\'s assume a fixed large number for paid plans if not specified
        // In a real app, this would come from a plan configuration
        totalTokens = 1000000 // Example: a large number for paid plans
      }

      const result = {
        used: user?.creditsUsed || 0,
        total: totalTokens,
      }

      // Cache the result
      subscriptionCache.set(cacheKey, { data: result, timestamp: Date.now() })

      return result
    } catch (error: any) {
      logger.error(`Error getting tokens used for user ${userId}:`, error)
      throw new Error(
        `Failed to retrieve token usage: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Validate a promo code
   *
   * @param promoCode - The promo code to validate
   * @returns Object with validation status and applicable plan
   */
  static async validatePromoCode(
    promoCode: string,
  ): Promise<PromoValidationResult> {
    // Simulate promo code validation
    const validPromo = VALID_PROMO_CODES.find((p: any) => p.code === promoCode)

    if (validPromo) {
      return {
        isValid: true,
        planId: validPromo.planId,
        discount: validPromo.discount,
        message: "Promo code applied successfully!",
      }
    } else {
      return {
        isValid: false,
        message: "Invalid promo code.",
      }
    }
  }

  /**
   * Apply a promo code to a user\'s subscription
   *
   * @param userId - The ID of the user
   * @param promoCode - The promo code to apply
   * @returns Object with success status and message
   */
  static async applyPromoCode(
    userId: string,
    promoCode: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const validationResult = await this.validatePromoCode(promoCode)

      if (!validationResult.isValid) {
        return { success: false, message: validationResult.message || "Invalid promo code." }
      }

      // In a real application, you would apply the discount or plan change here
      // For this example, we\'ll just log it
      logger.info(
        `Promo code ${promoCode} applied for user ${userId}. Discount: ${validationResult.discount}`,
      )

      return { success: true, message: "Promo code applied successfully." }
    } catch (error: any) {
      logger.error(`Error applying promo code ${promoCode} for user ${userId}:`, error)
      return { success: false, message: "Failed to apply promo code." }
    }
  }

 

  /**
   * Create a checkout session for a subscription plan
   *
   * @param userId - The ID of the user
   * @param planId - The ID of the subscription plan
   * @returns Object with success status and checkout URL
   */
  static async createCheckoutSession(
    userId: string,
    planId: string,
    duration: number = 12, // Default to 12 months if not specified
    options?: any // Accept options for promo/referral
  ): Promise<{ success: boolean; url?: string; message?: string }> {
    try {
      // For simplicity, assume Stripe as the payment gateway
      const paymentGateway = getPaymentGateway() as PaymentGateway
      const checkoutResult = await paymentGateway.createCheckoutSession(userId, planId, duration, options)
      console.log(`Checkout URL created for user ${userId} and plan ${planId}: ${checkoutResult.url}`);
      return { success: true, url: checkoutResult.url }
    } catch (error: any) {
      logger.error(
        `Error creating checkout session for user ${userId} and plan ${planId}:`,
        error,
      )
      return { success: false, message: "Failed to create checkout session." }
    }
  }

  /**
   * Get billing details for a user
   *
   * @param userId - The ID of the user
   * @returns Object with billing information
   */
  static async getBillingDetails(userId: string): Promise<any> {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      // Check cache first
      const cacheKey = `billing_${userId}`
      const cachedData = subscriptionCache.get(cacheKey)

      if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
        logger.debug(`Using cached billing data for user ${userId}`)
        return cachedData.data
      }

      // For simplicity, assume Stripe as the payment gateway
      const paymentGateway = getPaymentGateway("stripe") as PaymentGateway
      const billingDetails = await paymentGateway.getBillingDetails(userId)

      // Cache the result
      subscriptionCache.set(cacheKey, { data: billingDetails, timestamp: Date.now() })

      return billingDetails
    } catch (error: any) {
      logger.error(`Error getting billing details for user ${userId}:`, error)
      throw new Error(
        `Failed to retrieve billing details: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }  /**
   * Cancel a user\'s subscription with guaranteed consistency
   *
   * @param userId - The ID of the user
   * @returns Object with success status and message
   */
  static async cancelSubscription(
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {      // For simplicity, assume Stripe as the payment gateway
      const paymentGateway = getPaymentGateway()
      await paymentGateway.cancelSubscription(userId)

      // Use transactional update to ensure consistency
      return await prisma.$transaction(async (tx) => {
        // Update subscription to canceled
        await tx.userSubscription.update({
          where: { userId },
          data: {
            status: "CANCELED",
            cancelAtPeriodEnd: true,
          },
        })

        // Update user type to FREE
        await tx.user.update({
          where: { id: userId },
          data: {
            userType: "FREE",
          },
        })

        // Clear cache for this user
        this.clearUserCache(userId)

        logger.info(`Subscription canceled for user ${userId}`)
        return { success: true, message: "Subscription canceled successfully." }
      })
    } catch (error: any) {
      logger.error(`Error canceling subscription for user ${userId}:`, error)
      return { success: false, message: "Failed to cancel subscription." }
    }
  }

  static async verifyPaymentSuccess(
    userId: string,
    sessionId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      if (!userId || !sessionId) {
        throw new Error("User ID and Session ID are required")
      }

      // For simplicity, assume Stripe as the payment gateway
      const paymentGateway = getPaymentGateway("stripe") as PaymentGateway | undefined
      if (!paymentGateway || typeof paymentGateway.getPaymentStatus !== "function") {
        logger.error("Payment gateway is not available or does not support getPaymentStatus")
        return { success: false, message: "Payment gateway unavailable." }
      }
      const status = await paymentGateway.getPaymentStatus(sessionId)

      if (status?.status === "succeeded") {
        logger.info(`Payment successful for user ${userId} and session ${sessionId}`)
        return { success: true }
      } else {
        logger.warn(`Payment failed for user ${userId} and session ${sessionId}`)
        return { success: false, message: "Payment failed." }
      }
    } catch (error: any) {
      logger.error(`Error verifying payment status for user ${userId}:`, error)
      return { success: false, message: "Failed to verify payment status." }
    }
  }

  /**
   * Simulate a token usage for a user
   *
   * @param userId - The ID of the user
   * @param tokensUsed - The number of tokens used
   * @returns Object with success status and updated credits
   */
  static async useTokens(
    userId: string,
    tokensUsed: number,
  ): Promise<{ success: boolean; newCredits?: number; message?: string }> {
    try {
      if (tokensUsed <= 0) {
        return { success: false, message: "Tokens used must be a positive number." }
      }        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { credits: true, creditsUsed: true },
        })

      if (!user) {
        return { success: false, message: "User not found." }
      }

      if (user.credits < tokensUsed) {
        return { success: false, message: "Insufficient credits." }
      }

      const newCredits = user.credits - tokensUsed
      const newCreditsUsed = user.creditsUsed + tokensUsed

      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: newCredits,
          creditsUsed: newCreditsUsed,
        },
      })

      // Create a token transaction record
      await prisma.tokenTransaction.create({
        data: {
          userId,
          credits: -tokensUsed, // Negative value for tokens used
          amount: 0, // No monetary amount for token usage
          type: "USAGE",
          description: `Used ${tokensUsed} tokens`,
        },
      })

      // Clear cache for this user
      this.clearUserCache(userId)

      logger.info(`User ${userId} used ${tokensUsed} tokens. Remaining credits: ${newCredits}`)

      return { success: true, newCredits }
    } catch (error: any) {
      logger.error(`Error using tokens for user ${userId}:`, error)
      return { success: false, message: "Failed to use tokens." }
    }
  }

  /**
   * Get the subscription plans available
   *
   * @returns Array of subscription plans
   */
  /**
   * Get billing history for a user from Stripe
   * @param userId - The user ID (will be converted to customer ID internally)
   * @returns Promise resolving to billing history with success status
   */
  static getBillingHistory = async (userId: string): Promise<{
    success: boolean;
    history?: Array<{
      id: string;
      date: string;
      amount: number;
      status: "paid" | "pending" | "failed";
      description: string;
      invoiceUrl?: string;
    }>;
    error?: string;
  }> => {
    try {
      if (!userId) {
        return { success: false, error: "User ID is required" }
      }

      // Check cache first
      const cacheKey = `billing_${userId}`
      const cached = subscriptionCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        logger.debug(`Returning cached billing history for user ${userId}`)
        return { success: true, history: cached.data }
      }

      // Get payment gateway (Stripe)
      const paymentGateway = getPaymentGateway() as PaymentGateway | undefined
      if (!paymentGateway || typeof paymentGateway.getBillingHistory !== "function") {
        logger.error("Payment gateway is not available or does not support getBillingHistory")
        return { success: false, error: "Billing history not available" }
      }

      // Fetch billing history from Stripe - this returns any[] directly
      const billingData = await paymentGateway.getBillingHistory(userId)

      // Transform Stripe data to our format
      const history = billingData.map((item: any) => ({
        id: item.id || '',
        date: new Date(item.created * 1000).toISOString(), // Stripe uses unix timestamps
        amount: item.amount_paid || item.total || 0,
        status: (item.status === "paid" ? "paid" : item.status === "open" ? "pending" : "failed") as "paid" | "pending" | "failed",
        description: item.description || `${item.lines?.data?.[0]?.description || 'Subscription'} - ${item.billing_reason || 'Payment'}`,
        invoiceUrl: item.invoice_pdf || item.hosted_invoice_url || undefined,
      }))

      // Cache the result
      subscriptionCache.set(cacheKey, { data: history, timestamp: Date.now() })

      logger.info(`Retrieved billing history for user ${userId}, ${history.length} items`)
      return { success: true, history }

    } catch (error: any) {
      logger.error(`Error fetching billing history for user ${userId}:`, error)
      return { success: false, error: "Failed to retrieve billing history" }
    }
  }
  static getPaymentMethods = async (userId: string): Promise<any[]> => {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      // For simplicity, assume Stripe as the payment gateway
      const paymentGateway = getPaymentGateway("stripe") as PaymentGateway | undefined
      if (!paymentGateway || typeof paymentGateway.getPaymentMethods !== "function") {
        logger.error("Payment gateway is not available or does not support getPaymentMethods")
        return []
      }

      const paymentMethods = await paymentGateway.getPaymentMethods(userId)
      return paymentMethods
    } catch (error: any) {
      logger.error(`Error fetching payment methods for user ${userId}:`, error)
      return []
    }
  }

  /**
   * Update user subscription with guaranteed consistency
   * This method ensures user.userType stays in sync with subscription data
   */
  static async updateUserSubscription(
    userId: string, 
    subscriptionData: {
      planId: SubscriptionPlanType
      status: SubscriptionStatusType
      currentPeriodStart?: Date
      currentPeriodEnd?: Date
      cancelAtPeriodEnd?: boolean
      stripeSubscriptionId?: string
      stripeCustomerId?: string
    },
    tokensToAdd: number = 0
  ): Promise<{ success: boolean; message?: string }> {
    try {
      return await prisma.$transaction(async (tx) => {
        // Determine effective user type based on subscription status
        const effectiveUserType: SubscriptionPlanType = 
          subscriptionData.status === "ACTIVE" ? subscriptionData.planId : "FREE"

        // Update or create subscription
        await tx.userSubscription.upsert({
          where: { userId },
          update: {
            planId: subscriptionData.planId,
            status: subscriptionData.status,
            currentPeriodStart: subscriptionData.currentPeriodStart,
            currentPeriodEnd: subscriptionData.currentPeriodEnd,
            cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
            stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
            stripeCustomerId: subscriptionData.stripeCustomerId,
          },
          create: {
            userId,
            planId: subscriptionData.planId,
            status: subscriptionData.status,
            currentPeriodStart: subscriptionData.currentPeriodStart || new Date(),
            currentPeriodEnd: subscriptionData.currentPeriodEnd || new Date(),
            cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd || false,
            stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
            stripeCustomerId: subscriptionData.stripeCustomerId,
          },
        })

        // Update user with consistent data
        await tx.user.update({
          where: { id: userId },
          data: {
            userType: effectiveUserType,
            ...(tokensToAdd > 0 && {
              credits: { increment: tokensToAdd }
            })
          },
        })

        // Create token transaction if tokens were added
        if (tokensToAdd > 0) {
          await tx.tokenTransaction.create({
            data: {
              userId,
              credits: tokensToAdd,
              amount: 0,
              type: "SUBSCRIPTION",
              description: `Added ${tokensToAdd} tokens from ${subscriptionData.planId} plan`,
            },
          })
        }

        // Clear cache
        this.clearUserCache(userId)

        logger.info(`Successfully updated subscription for user ${userId}`, {
          planId: subscriptionData.planId,
          status: subscriptionData.status,
          userType: effectiveUserType,
          tokensAdded: tokensToAdd,
        })

        return { success: true, message: "Subscription updated successfully" }
      })
    } catch (error) {
      logger.error(`Error updating subscription for user ${userId}:`, error)
      return { success: false, message: `Failed to update subscription: ${error instanceof Error ? error.message : String(error)}` }
    }
  }

  /**
   * Get user subscription data with guaranteed consistency
   */
  static async getUserSubscriptionData(userId: string): Promise<{
    userId: string
    userType: SubscriptionPlanType
    credits: number
    creditsUsed: number
    subscription: any
    isActive: boolean
    isSubscribed: boolean
  } | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
        },
      })

      if (!user) {
        return null
      }

      // Determine the effective subscription status
      const subscription = user.subscription
      const isActive = subscription?.status === "ACTIVE" && 
                      subscription.currentPeriodEnd && 
                      subscription.currentPeriodEnd > new Date()
      
      const effectivePlan: SubscriptionPlanType = isActive && subscription 
        ? subscription.planId as SubscriptionPlanType 
        : "FREE"
      
      const isSubscribed = isActive && effectivePlan !== "FREE"

      return {
        userId: user.id,
        userType: effectivePlan, // Use subscription data as source of truth
        credits: user.credits,
        creditsUsed: user.creditsUsed,
        subscription: subscription ? {
          planId: subscription.planId as SubscriptionPlanType,
          status: subscription.status as SubscriptionStatusType,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          stripeSubscriptionId: subscription.stripeSubscriptionId || undefined,
          stripeCustomerId: subscription.stripeCustomerId || undefined,
        } : null,
        isActive: isActive || false,
        isSubscribed,
      }
    } catch (error) {
      logger.error(`Error getting user subscription data for ${userId}:`, error)
      throw error
    }
  }

  /**
   * Cancel user subscription with guaranteed consistency
   */
  static async cancelUserSubscription(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      return await prisma.$transaction(async (tx) => {
        // Update subscription to canceled
        await tx.userSubscription.update({
          where: { userId },
          data: {
            status: "CANCELED",
            cancelAtPeriodEnd: true,
          },
        })

        // Update user type to FREE
        await tx.user.update({
          where: { id: userId },
          data: {
            userType: "FREE",
          },
        })

        logger.info(`Successfully canceled subscription for user ${userId}`)
        return { success: true, message: "Subscription canceled successfully" }
      })
    } catch (error) {
      logger.error(`Error canceling subscription for user ${userId}:`, error)
      return { success: false, message: `Failed to cancel subscription: ${error instanceof Error ? error.message : String(error)}` }
    }
  }

  /**
   * Validate subscription data consistency for a user
   */
  static async validateUserConsistency(userId: string): Promise<{
    isConsistent: boolean
    issues: string[]
    userData: any
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      })

      if (!user) {
        return {
          isConsistent: false,
          issues: ["User not found"],
          userData: null,
        }
      }

      const issues: string[] = []
      const subscription = user.subscription

      // Check consistency rules
      if (subscription) {
        if (subscription.status === "ACTIVE" && user.userType !== subscription.planId) {
          issues.push(`User type "${user.userType}" does not match active subscription plan "${subscription.planId}"`)
        }
        if (subscription.status !== "ACTIVE" && user.userType !== "FREE") {
          issues.push(`User type should be "FREE" when subscription status is "${subscription.status}"`)
        }
      } else {
        if (user.userType !== "FREE") {
          issues.push(`User has no subscription but userType is "${user.userType}" instead of "FREE"`)
        }
      }

      return {
        isConsistent: issues.length === 0,
        issues,
        userData: {
          userId: user.id,
          userType: user.userType,
          subscription: subscription ? {
            planId: subscription.planId,
            status: subscription.status,
          } : null,
        },
      }
    } catch (error) {
      logger.error(`Error validating consistency for user ${userId}:`, error)
      return {
        isConsistent: false,
        issues: [`Validation error: ${error instanceof Error ? error.message : String(error)}`],
        userData: null,
      }
    }
  }

  /**
   * Fix inconsistent data for a user
   */
  static async fixUserConsistency(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const validation = await this.validateUserConsistency(userId)
      
      if (validation.isConsistent) {
        return { success: true, message: "Data is already consistent" }
      }

      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          include: { subscription: true },
        })

        if (!user) {
          throw new Error("User not found")
        }

        const subscription = user.subscription
        let correctUserType: SubscriptionPlanType = "FREE"

        if (subscription && subscription.status === "ACTIVE") {
          correctUserType = subscription.planId as SubscriptionPlanType
        }

        // Update user type to match subscription
        await tx.user.update({
          where: { id: userId },
          data: { userType: correctUserType },
        })

        logger.info(`Fixed consistency for user ${userId}`, {
          oldUserType: user.userType,
          newUserType: correctUserType,
          subscriptionPlan: subscription?.planId,
          subscriptionStatus: subscription?.status,
        })

        return { success: true, message: `Fixed consistency: set userType to ${correctUserType}` }
      })
    } catch (error) {
      logger.error(`Error fixing consistency for user ${userId}:`, error)
      return { success: false, message: `Failed to fix consistency: ${error instanceof Error ? error.message : String(error)}` }    }
  }
}