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

import { VALID_PROMO_CODES } from "@/app/dashboard/subscription/components/subscription-plans"
import type { SubscriptionPlanType, PromoValidationResult } from "@/app/dashboard/subscription/types/subscription"
import { prisma } from "@/lib/db"
import { getPaymentGateway } from "./payment-gateway-factory"
import { logger } from "@/lib/logger" // Fix: use named import instead of default import

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes cache TTL
const subscriptionCache = new Map<string, { data: any; timestamp: number }>()
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
      return await prisma.$transaction(async (tx) => {
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

        // Check if there's a token transaction record for free plan tokens
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

        // If user already has a free plan, just ensure it's active
        if (existingSubscription && existingSubscription.planId === "FREE") {
          // Update the subscription to ensure it's active
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

        // Only add tokens if the user hasn't received free tokens before
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
    } catch (error) {
      logger.error(`Error activating free plan for user ${userId}:`, error)
      throw new Error(`Failed to activate free plan: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Get the subscription status for a user
   *
   * @param userId - The ID of the user
   * @returns Object with subscription status information
   */
  static async getSubscriptionStatus(userId: string): Promise<any> {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      // Check cache first
      const cacheKey = `subscription_${userId}`
      const cachedData = subscriptionCache.get(cacheKey)

      if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
        //logger.debug(`Using cached subscription data for user ${userId}`)
        return cachedData.data
      }

      // Get user subscription data with improved error handling
      const userSubscription = await prisma.userSubscription
        .findUnique({
          where: { userId },
        })
        .catch((error) => {
          logger.error("Database error fetching user subscription:", error)
          throw new Error("Failed to fetch subscription data from database")
        })

      // Get user credits with improved error handling
      const user = await prisma.user
        .findUnique({
          where: { id: userId },
          select: { credits: true, creditsUsed: true },
        })
        .catch((error) => {
          logger.error("Database error fetching user credits:", error)
          throw new Error("Failed to fetch user credits from database")
        })

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
        subscriptionCache.set(cacheKey, { data: result, timestamp: Date.now() })

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

      // Cache the result
      subscriptionCache.set(cacheKey, { data: result, timestamp: Date.now() })

      return result
    } catch (error) {
      logger.error("Error getting subscription status:", error)
      // Return default values in case of error
      return {
        credits: 0,
        tokensUsed: 0,
        isSubscribed: false,
        subscriptionPlan: "FREE",
        status: "INACTIVE",
      }
    }
  }

  /**
   * Get the token usage for a user
   *
   * @param userId - The ID of the user
   * @returns Object with used and total tokens
   */
  static async getTokensUsed(userId: string): Promise<{ used: number; total: number }> {
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

      // Get user's current credits directly from the user table with improved error handling
      const user = await prisma.user
        .findUnique({
          where: { id: userId },
          select: { credits: true, creditsUsed: true },
        })
        .catch((error) => {
          logger.error("Database error fetching user token usage:", error)
          throw new Error("Failed to fetch token usage data from database")
        })

      if (!user) {
        logger.warn(`User with ID ${userId} not found when getting token usage`)
        return { used: 0, total: 0 }
      }

      // Get the user's subscription to determine token limit
      // const subscription = await this.getSubscriptionStatus(userId);

      // Find the plan to get the token limit
      // const plan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.subscriptionPlan);

      // Use the actual credits from the user record as the total available
      const totalTokens = user.credits || 0
      const tokensUsed = user.creditsUsed || 0

      const result = {
        used: tokensUsed,
        total: totalTokens,
      }

      // Cache the result
      subscriptionCache.set(cacheKey, { data: result, timestamp: Date.now() })

      return result
    } catch (error) {
      logger.error("Error getting token usage:", error)
      return { used: 0, total: 0 }
    }
  }

  /**
   * Cancel a user's subscription
   *
   * @param userId - The ID of the user
   * @returns Boolean indicating success
   */
  static async cancelSubscription(userId: string): Promise<boolean> {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      logger.info(`Cancelling subscription for user ${userId}`)

      // Use a transaction to ensure database consistency
      return await prisma.$transaction(async (tx) => {
        const userSubscription = await tx.userSubscription.findUnique({
          where: { userId },
        })

        if (!userSubscription) {
          logger.warn(`No subscription found for user ${userId}`)
          return false
        }

        const paymentGateway = getPaymentGateway()

        try {
          // Cancel with the payment gateway
          await paymentGateway.cancelSubscription(userId)
        } catch (error) {
          logger.error("Error when canceling subscription with payment gateway:", error)
          // Continue with database update even if payment gateway fails
        }

        // Update our database
        await tx.userSubscription.update({
          where: { userId },
          data: {
            status: "CANCELED",
            cancelAtPeriodEnd: true,
          },
        })

        // Log the cancellation as a token transaction for record-keeping
        await tx.tokenTransaction.create({
          data: {
            userId,
            credits: 0,
            amount: 0,
            type: "SUBSCRIPTION",
            description: "Subscription canceled",
          },
        })

        // Clear cache for this user
        this.clearUserCache(userId)

        logger.info(`Successfully cancelled subscription for user ${userId}`)
        return true
      })
    } catch (error) {
      logger.error("Error canceling subscription:", error)
      throw new Error(`Failed to cancel subscription: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Resume a canceled subscription
   *
   * @param userId - The ID of the user
   * @returns Boolean indicating success
   */
  static async resumeSubscription(userId: string): Promise<boolean> {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      logger.info(`Resuming subscription for user ${userId}`)

      // Use a transaction to ensure database consistency
      return await prisma.$transaction(async (tx) => {
        const userSubscription = await tx.userSubscription.findUnique({
          where: { userId },
        })

        if (!userSubscription) {
          logger.warn(`No subscription found for user ${userId}`)
          return false
        }

        const paymentGateway = getPaymentGateway()

        try {
          // Resume with the payment gateway
          await paymentGateway.resumeSubscription(userId)
        } catch (error) {
          logger.error("Error when resuming subscription with payment gateway:", error)
          // Continue with database update even if payment gateway fails
        }

        // Update our database
        await tx.userSubscription.update({
          where: { userId },
          data: {
            status: "ACTIVE",
            cancelAtPeriodEnd: false,
          },
        })

        // Log the resumption as a token transaction for record-keeping
        await tx.tokenTransaction.create({
          data: {
            userId,
            credits: 0,
            amount: 0,
            type: "SUBSCRIPTION",
            description: "Subscription resumed",
          },
        })

        // Clear cache for this user
        this.clearUserCache(userId)

        logger.info(`Successfully resumed subscription for user ${userId}`)
        return true
      })
    } catch (error) {
      logger.error("Error resuming subscription:", error)
      throw new Error(`Failed to resume subscription: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Validate a referral code
   *
   * @param referralCode - The referral code to validate
   * @returns Boolean indicating if the code is valid
   */
  static async validateReferralCode(referralCode: string): Promise<boolean> {
    try {
      if (!referralCode || typeof referralCode !== "string") {
        return false
      }

      const normalizedCode = referralCode.trim()

      if (normalizedCode.length === 0) {
        return false
      }

      // Check cache first
      const cacheKey = `referral_${normalizedCode}`
      const cachedData = subscriptionCache.get(cacheKey)

      if (cachedData) {
        logger.debug(`Using cached referral validation for code ${normalizedCode}`)
        return cachedData.data
      }

      const referral = await prisma.userReferral.findUnique({
        where: { referralCode: normalizedCode },
      })

      const isValid = !!referral

      // Cache the result
      subscriptionCache.set(cacheKey, { data: isValid, timestamp: Date.now() })

      return isValid
    } catch (error) {
      logger.error("Error validating referral code:", error)
      return false
    }
  }

  /**
   * Validate a promo code
   *
   * @param promoCode - The promo code to validate
   * @returns Object with validation result and discount percentage
   */
  static async validatePromoCode(promoCode: string): Promise<PromoValidationResult> {
    try {
      if (!promoCode || typeof promoCode !== "string") {
        return { valid: false, discountPercentage: 0 }
      }

      const normalizedCode = promoCode.trim().toUpperCase()

      if (normalizedCode.length === 0) {
        return { valid: false, discountPercentage: 0 }
      }

      // Check cache first
      const cacheKey = `promo_${normalizedCode}`
      const cachedData = subscriptionCache.get(cacheKey)

      if (cachedData) {
        logger.debug(`Using cached promo validation for code ${normalizedCode}`)
        return cachedData.data
      }

      // Check if the provided code exists in our valid codes
      if (normalizedCode in VALID_PROMO_CODES) {
        const result = {
          valid: true,
          discountPercentage: VALID_PROMO_CODES[normalizedCode],
          code: normalizedCode,
        }

        // Cache the result
        subscriptionCache.set(cacheKey, { data: result, timestamp: Date.now() })

        return result
      }

      // Check database for dynamic promo codes
      const dbPromoCode = await prisma.promoCode.findUnique({
        where: { code: normalizedCode, isActive: true },
        select: { discountPercentage: true, expiresAt: true },
      })

      if (dbPromoCode) {
        // Check if the promo code has expired
        if (dbPromoCode.expiresAt && dbPromoCode.expiresAt < new Date()) {
          return { valid: false, discountPercentage: 0 }
        }

        const result = {
          valid: true,
          discountPercentage: dbPromoCode.discountPercentage,
          code: normalizedCode,
        }

        // Cache the result
        subscriptionCache.set(cacheKey, { data: result, timestamp: Date.now() })

        return result
      }

      return { valid: false, discountPercentage: 0 }
    } catch (error) {
      logger.error("Error validating promo code:", error)
      return { valid: false, discountPercentage: 0 }
    }
  }

  /**
   * Verify the status of a payment
   *
   * @param sessionId - The ID of the checkout session
   * @returns Object with payment status and subscription details
   */
  static async verifyPaymentStatus(sessionId: string): Promise<{
    status: "succeeded" | "pending" | "failed" | "canceled"
    subscription?: any
  }> {
    try {
      if (!sessionId) {
        throw new Error("Session ID is required")
      }

      const paymentGateway = getPaymentGateway()
      return await paymentGateway.verifyPaymentStatus(sessionId)
    } catch (error) {
      logger.error(`Error verifying payment status: ${error instanceof Error ? error.message : String(error)}`)
      return { status: "failed" }
    }
  }

  /**
   * Get billing history for a user
   *
   * @param userId - The ID of the user
   * @returns Array of billing history items
   */
  static async getBillingHistory(userId: string): Promise<any[]> {
    try {
      if (!userId) {
        logger.warn("No user ID provided for billing history")
        return []
      }

      // Check cache first
      const cacheKey = `billing_${userId}`
      const cachedData = subscriptionCache.get(cacheKey)

      if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
        logger.debug(`Using cached billing history for user ${userId}`)
        return cachedData.data
      }

      // Get invoices from database
      const transactions = await prisma.tokenTransaction
        .findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
        .catch((error) => {
          logger.error("Database error fetching billing history:", error)
          return []
        })

      // Format transactions
      const result = transactions.map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount,
        credits: transaction.credits,
        type: transaction.type,
        description: transaction.description,
        date: transaction.createdAt.toISOString(),
      }))

      // Cache the result
      subscriptionCache.set(cacheKey, { data: result, timestamp: Date.now() })

      return result
    } catch (error) {
      logger.error("Error fetching billing history:", error)
      return []
    }
  }

  /**
   * Get payment methods for a user
   *
   * @param userId - The ID of the user
   * @returns Array of payment methods
   */
  static async getPaymentMethods(userId: string): Promise<any[]> {
    try {
      if (!userId) {
        logger.warn("No user ID provided for payment methods")
        return []
      }

      const paymentGateway = getPaymentGateway()

      // Check if the gateway implements getPaymentMethods
      if (typeof paymentGateway.getPaymentMethods === "function") {
        return await paymentGateway.getPaymentMethods(userId)
      }

      return []
    } catch (error) {
      logger.error("Error fetching payment methods:", error)
      return []
    }
  }

  /**
   * Update user credits and create a token transaction record
   * This method ensures that user credits and token transactions stay in sync
   *
   * @param userId - The ID of the user
   * @param credits - Number of credits to add (positive) or subtract (negative)
   * @param type - Type of transaction (e.g., "SUBSCRIPTION", "USAGE", "REFUND")
   * @param description - Description of the transaction
   * @param amount - Optional monetary amount associated with the transaction
   * @returns Updated user with new credit balance
   */
  static async updateUserCredits(
    userId: string,
    credits: number,
    type: string,
    description: string,
    amount = 0,
  ): Promise<any> {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      logger.info(`Updating credits for user ${userId}: ${credits > 0 ? "+" : ""}${credits}, type: ${type}`)

      // Use a transaction to ensure user credits and token transaction stay in sync
      const result = await prisma.$transaction(async (tx) => {
        // Update user credits
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            credits: {
              increment: credits,
            },
            // If credits are negative, they're being used, so update creditsUsed
            ...(credits < 0 ? { creditsUsed: { increment: Math.abs(credits) } } : {}),
          },
          select: {
            id: true,
            credits: true,
            creditsUsed: true,
          },
        })

        // Create token transaction record
        await tx.tokenTransaction.create({
          data: {
            userId,
            credits,
            amount,
            type,
            description,
          },
        })

        return updatedUser
      })

      // Clear cache for this user
      this.clearUserCache(userId)

      logger.info(
        `Updated credits for user ${userId}: ${credits > 0 ? "+" : ""}${credits}, new balance: ${result.credits}`,
      )
      return result
    } catch (error) {
      logger.error(`Error updating user credits: ${error instanceof Error ? error.message : String(error)}`)
      throw new Error(`Failed to update user credits: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Add a new method to efficiently check if a user can perform a token-consuming action
  static async canPerformTokenAction(
    userId: string,
    requiredTokens: number,
  ): Promise<{
    canPerform: boolean
    reason?: string
    currentCredits: number
  }> {
    try {
      if (!userId) {
        return { canPerform: false, reason: "User ID is required", currentCredits: 0 }
      }

      // Get user's current credits
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      })

      if (!user) {
        return { canPerform: false, reason: "User not found", currentCredits: 0 }
      }

      const currentCredits = user.credits || 0

      // Check if user has enough tokens
      if (currentCredits < requiredTokens) {
        return {
          canPerform: false,
          reason: `Insufficient tokens. You need ${requiredTokens} tokens but have ${currentCredits}.`,
          currentCredits,
        }
      }

      return { canPerform: true, currentCredits }
    } catch (error) {
      console.error("Error checking if user can perform token action:", error)
      return { canPerform: false, reason: "An error occurred while checking token availability", currentCredits: 0 }
    }
  }
}
