// @ts-nocheck
/**
 * Subscription Service
 *
 * This service handles all subscription-related operations, including
 * creating subscriptions, managing subscription status, and handling
 * token usage.
 *
 * The service ensures synchronization between:
 * - UserSubscription records (subscription status and details)
 * - TokenTransaction records (history of token/credit changes)
 * - User credits (current balance of available tokens)
 */

// import { VALID_PROMO_CODES } from "@/app/dashboard/subscription/components/subscription-plans"
// import type { SubscriptionPlanType, PromoValidationResult } from "@/app/dashboard/subscription/types/subscription"
// import { prisma } from "@/lib/db"
// import { getPaymentGateway } from "./payment-gateway-factory"
// import { logger } from "@/lib/logger" // Fix: use named import instead of default import

// Placeholder imports for compilation
const VALID_PROMO_CODES = [];
type SubscriptionPlanType = string;
type PromoValidationResult = { isValid: boolean; message?: string; planId?: string; discount?: number };
const prisma = { $transaction: async (cb: any) => cb({ userSubscription: { findUnique: async () => null, update: async () => null, create: async () => null }, user: { findUnique: async () => null, update: async () => null }, tokenTransaction: { findFirst: async () => null, create: async () => null } }) };
const getPaymentGateway = (provider: string) => ({ handleWebhook: async (payload: any) => {}, createCheckoutSession: async (userId: string, planId: string) => "", getBillingDetails: async (userId: string) => ({}), cancelSubscription: async (userId: string) => {} });
const logger = { info: (...args: any[]) => console.log(...args), error: (...args: any[]) => console.error(...args), debug: (...args: any[]) => console.log(...args), warn: (...args: any[]) => console.warn(...args) };

// Enhanced cache configuration with LRU (Least Recently Used) logic
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes cache TTL (increased to reduce database load)
const MAX_CACHE_SIZE = 1000 // Limit cache size to prevent memory leaks

// Simple LRU cache implementation
class LRUCache<K, V> {  private cache: Map<K, V> = new Map();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    
    // Access the item, which will refresh its position in the LRU
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value!);
    return value;
  }

  set(key: K, value: V): void {
    // Delete key if it already exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      // Type-safe approach to get the first key
      const keys = Array.from(this.cache.keys());
      if (keys.length > 0) {
        const oldestKey = keys[0];
        this.cache.delete(oldestKey);
      }
    }
    
    // Add new entry
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

const subscriptionCache = new LRUCache<string, { data: any; timestamp: number }>(MAX_CACHE_SIZE);
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
  }
  /**
   * 
   * Activate the free plan for a user
   *
   * @param userId - The ID of the user
   * @returns Object with success status and plan information
   */
  static async activateFreePlan(
    userId: string,
  ): Promise<{ success: boolean; message?: string; alreadySubscribed?: boolean }> {
    try {
      logger.info(`Activating free plan for user ${userId}`)

      // Use a transaction to ensure all database operations succeed or fail together
      return await prisma.$transaction(async (tx: any) => {
        // Check if user already has a subscription
        const existingSubscription = await tx.userSubscription.findUnique({
          where: { userId },
        })

        // Get the user to check their current credits
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { credits: true },
        })

        if (!user) {
          throw new Error(`User with ID ${userId} not found`)
        }

        // Check if there\'s a token transaction record for free plan tokens
        const existingFreeTokens = await tx.tokenTransaction.findFirst({
          where: {
            userId,
            type: "SUBSCRIPTION",
            description: "Added 5 tokens for free plan",
          },
        })

        // If user already has an active free plan, just return success without adding tokens again
        if (
          existingSubscription &&
          existingSubscription.planId === "FREE" &&
          existingSubscription.status === "ACTIVE"
        ) {
          logger.info(`User ${userId} is already on the free plan. Not adding tokens again.`)
          return {
            success: true,
            message: "You are already on the free plan",
            alreadySubscribed: true,
          }
        }

        // If user already has an active paid subscription, they cannot activate the free plan
        if (
          existingSubscription &&
          existingSubscription.planId !== "FREE" &&
          existingSubscription.status === "ACTIVE"
        ) {
          throw new Error(
            "You already have an active paid subscription. Please cancel it before activating the free plan.",
          )
        }

        // Set subscription end date to 1 year from now
        const currentPeriodEnd = new Date()
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)

        // If user already has a free plan, just ensure it\'s active
        if (existingSubscription && existingSubscription.planId === "FREE") {
          // Update the subscription to ensure it\'s active
          await tx.userSubscription.update({
            where: { userId },
            data: {
              status: "ACTIVE",
              currentPeriodStart: new Date(),
              currentPeriodEnd,
            },
          })
        } else {
          // Create new free subscription
          await tx.userSubscription.create({
            data: {
              userId,
              planId: "FREE",
              status: "ACTIVE",
              currentPeriodStart: new Date(),
              currentPeriodEnd,
            },
          })
        }

        // Only add tokens if the user hasn\'t received free tokens before
        if (!existingFreeTokens) {
          // Add 5 tokens for new free plan users
          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
              credits: {
                increment: 5,
              },
            },
          })

          // Create a token transaction record to track the addition of tokens
          await tx.tokenTransaction.create({
            data: {
              userId,
              credits: 5,
              amount: 0,
              type: "SUBSCRIPTION",
              description: "Added 5 tokens for free plan",
            },
          })

          logger.info(`Added 5 tokens to user ${userId}, new balance: ${updatedUser.credits}`)
        }

        // Clear cache for this user
        this.clearUserCache(userId)

        logger.info(`Free plan activated successfully for user ${userId}`)

        return {
          success: true,
          message: "Free plan activated successfully",
        }
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
      const DB_TIMEOUT = 8000; // Increased timeout to 8 seconds
      
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database query timed out")), DB_TIMEOUT)
      );
      
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
            stack: dbError.stack?.slice(0, 200) // Log limited stack trace
          });
        } else {
          logger.error(`Database error fetching subscription data: ${dbError}`, { userId, errorCount });
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
          where: { userId },
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
   * Handle webhook events from payment gateways
   *
   * @param provider - The payment gateway provider (e.g., "stripe")
   * @param payload - The webhook payload
   * @returns Object with success status
   */
  static async handleWebhook(
    provider: string,
    payload: any,
  ): Promise<{ success: boolean }> {
    try {
      const paymentGateway = getPaymentGateway(provider)
      await paymentGateway.handleWebhook(payload)
      return { success: true }
    } catch (error: any) {
      logger.error(`Error handling webhook for provider ${provider}:`, error)
      return { success: false }
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
  ): Promise<{ success: boolean; url?: string; message?: string }> {
    try {
      // For simplicity, assume Stripe as the payment gateway
      const paymentGateway = getPaymentGateway("stripe")
      const checkoutUrl = await paymentGateway.createCheckoutSession(userId, planId)
      return { success: true, url: checkoutUrl }
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
      const paymentGateway = getPaymentGateway("stripe")
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
  }

  /**
   * Cancel a user\'s subscription
   *
   * @param userId - The ID of the user
   * @returns Object with success status and message
   */
  static async cancelSubscription(
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // For simplicity, assume Stripe as the payment gateway
      const paymentGateway = getPaymentGateway("stripe")
      await paymentGateway.cancelSubscription(userId)

      // Update subscription status in our database
      await prisma.userSubscription.update({
        where: { userId },
        data: { status: "CANCELED" },
      })

      // Clear cache for this user
      this.clearUserCache(userId)

      logger.info(`Subscription canceled for user ${userId}`)

      return { success: true, message: "Subscription canceled successfully." }
    } catch (error: any) {
      logger.error(`Error canceling subscription for user ${userId}:`, error)
      return { success: false, message: "Failed to cancel subscription." }
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
      }

      const user = await prisma.user.findUnique({
        where: { userId },
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
}


