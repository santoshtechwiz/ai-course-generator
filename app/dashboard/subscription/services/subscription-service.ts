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

import { SUBSCRIPTION_PLANS, VALID_PROMO_CODES } from "@/app/dashboard/subscription/components/subscription-plans"
import type { SubscriptionPlanType, PromoValidationResult } from "@/app/dashboard/subscription/types/subscription"
import { prisma } from "@/lib/db"
import type { SubscriptionStatus } from "@/store/useSubscriptionStore"
import type { TokenUsage } from "@langchain/core/language_models/base"
import { getPaymentGateway } from "./payment-gateway-factory"
import type { PaymentOptions } from "./payment-gateway-factory"

/**
 * Service for managing user subscriptions and token transactions
 */
export class SubscriptionService {
  /**
   * Activate the free plan for a user
   *
   * @param userId - The ID of the user
   * @returns Object with success status and plan information
   */
  static async activateFreePlan(
    userId: string,
  ): Promise<{ success: boolean; message?: string; alreadySubscribed?: boolean }> {
    try {
      console.log(`Activating free plan for user ${userId}`)

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
          console.log(`User ${userId} is already on the free plan. Not adding tokens again.`)
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
            "User already has an active paid subscription. Please cancel it before activating the free plan.",
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

          console.log(`Added 5 tokens to user ${userId}, new balance: ${updatedUser.credits}`)
        }

        console.log(`Free plan activated successfully for user ${userId}`)

        return {
          success: true,
          message: "Free plan activated successfully",
        }
      })
    } catch (error) {
      console.error(`Error activating free plan for user ${userId}:`, error)
      throw new Error(`Failed to activate free plan: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Create a checkout session for a subscription
   *
   * @param userId - The ID of the user
   * @param planName - The name of the plan to subscribe to
   * @param duration - The duration of the subscription in months
   * @param referralCode - Optional referral code
   * @param promoCode - Optional promo code
   * @param promoDiscount - Optional promo discount percentage
   * @returns Object with the session ID and checkout URL
   */
  static async createCheckoutSession(
    userId: string,
    planName: string,
    duration: number,
    referralCode?: string,
    promoCode?: string,
    promoDiscount?: number,
  ): Promise<{ sessionId: string; url: string }> {
    try {
      // Validate inputs
      if (!userId) throw new Error("User ID is required")
      if (!planName) throw new Error("Plan name is required")
      if (!duration || duration <= 0) throw new Error("Valid duration is required")

      console.log(`Creating checkout session for user ${userId}, plan ${planName}, duration ${duration}`)

      // Verify user exists before proceeding
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })

      if (!user) {
        throw new Error(`User with ID ${userId} not found`)
      }

      const paymentGateway = getPaymentGateway()
      const options: PaymentOptions = {}

      if (referralCode) {
        // Validate referral code before applying
        const isValidReferral = await this.validateReferralCode(referralCode)
        if (isValidReferral) {
          options.referralCode = referralCode
          console.log(`Applied referral code: ${referralCode}`)
        } else {
          console.warn(`Invalid referral code attempted: ${referralCode}`)
        }
      }

      if (promoCode && promoDiscount) {
        // Validate promo code before applying
        const promoValidation = await this.validatePromoCode(promoCode)
        if (promoValidation.valid) {
          options.promoCode = promoCode
          options.promoDiscount = promoDiscount
          console.log(`Applied promo code: ${promoCode} with discount: ${promoDiscount}%`)
        } else {
          console.warn(`Invalid promo code attempted: ${promoCode}`)
        }
      }

      const result = await paymentGateway.createCheckoutSession(userId, planName, duration, options)

      // Log the result for debugging
      console.log("Payment gateway checkout session created:", {
        sessionId: result.sessionId,
        hasUrl: !!result.url,
      })

      // Ensure we have a URL
      if (!result.url) {
        console.error("No checkout URL returned from payment gateway")
        throw new Error("No checkout URL returned from payment gateway")
      }

      return {
        sessionId: result.sessionId,
        url: result.url,
      }
    } catch (error) {
      console.error(`Error creating checkout session:`, error)
      throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Get the subscription status for a user
   *
   * @param userId - The ID of the user
   * @returns Object with subscription status information
   */
  static async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      // Get user subscription data with improved error handling
      const userSubscription = await prisma.userSubscription
        .findUnique({
          where: { userId },
        })
        .catch((error) => {
          console.error("Database error fetching user subscription:", error)
          throw new Error("Failed to fetch subscription data from database")
        })

      // Get user credits with improved error handling
      const user = await prisma.user
        .findUnique({
          where: { id: userId },
          select: { credits: true },
        })
        .catch((error) => {
          console.error("Database error fetching user credits:", error)
          throw new Error("Failed to fetch user credits from database")
        })

      // Default values if no subscription exists
      if (!userSubscription) {
        return {
          credits: user?.credits || 0,
          isSubscribed: false,
          subscriptionPlan: "FREE",
        }
      }

      // Determine if the subscription is active
      const isSubscribed = userSubscription.status === "ACTIVE"

      // Format the expiration date if it exists
      const expirationDate = userSubscription.currentPeriodEnd
        ? userSubscription.currentPeriodEnd.toISOString()
        : undefined

      return {
        credits: user?.credits || 0,
        isSubscribed,
        subscriptionPlan: userSubscription.planId as SubscriptionPlanType,
        expirationDate,
      }
    } catch (error) {
      console.error("Error getting subscription status:", error)
      // Return default values in case of error
      return {
        credits: 0,
        isSubscribed: false,
        subscriptionPlan: "FREE",
      }
    }
  }

  /**
   * Get the token usage for a user
   *
   * @param userId - The ID of the user
   * @returns Object with used and total tokens
   */
  static async getTokensUsed(userId: string): Promise<TokenUsage> {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      // Get user's current credits directly from the user table with improved error handling
      const user = await prisma.user
        .findUnique({
          where: { id: userId },
          select: { credits: true, creditsUsed: true },
        })
        .catch((error) => {
          console.error("Database error fetching user token usage:", error)
          throw new Error("Failed to fetch token usage data from database")
        })

      if (!user) {
        console.warn(`User with ID ${userId} not found when getting token usage`)
        return { used: 0, total: 0 }
      }

      // Get the user's subscription to determine token limit
      const subscription = await this.getSubscriptionStatus(userId)

      // Find the plan to get the token limit
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.subscriptionPlan)

      // Use the actual credits from the user record as the total available
      const totalTokens = user.credits || 0
      const tokensUsed = user.creditsUsed || 0

      return {
        used: tokensUsed,
        total: totalTokens,
      }
    } catch (error) {
      console.error("Error getting token usage:", error)
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

      // Use a transaction to ensure database consistency
      return await prisma.$transaction(async (tx) => {
        const userSubscription = await tx.userSubscription.findUnique({
          where: { userId },
        })

        if (!userSubscription) {
          console.warn(`No subscription found for user ${userId}`)
          return false
        }

        if (!userSubscription.stripeSubscriptionId) {
          console.warn(`No Stripe subscription ID found for user ${userId}`)

          // Update our database to mark as canceled even if no Stripe subscription exists
          await tx.userSubscription.update({
            where: { userId },
            data: {
              status: "CANCELED",
              cancelAtPeriodEnd: true,
            },
          })

          return true
        }

        try {
          const paymentGateway = getPaymentGateway()
          // Cancel with the payment gateway
          await paymentGateway.cancelSubscription(userId)
        } catch (stripeError: any) {
          console.error("Stripe error when canceling subscription:", stripeError)

          // If the subscription doesn't exist in Stripe, we should still update our database
          if (stripeError.type === "StripeInvalidRequestError" && stripeError.code === "resource_missing") {
            console.warn(
              `Stripe subscription ${userSubscription.stripeSubscriptionId} not found, updating local database only`,
            )
          } else {
            throw stripeError
          }
        }

        // Update our database regardless of Stripe status
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

        return true
      })
    } catch (error) {
      console.error("Error canceling subscription:", error)
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

      // Use a transaction to ensure database consistency
      return await prisma.$transaction(async (tx) => {
        const userSubscription = await tx.userSubscription.findUnique({
          where: { userId },
        })

        if (!userSubscription) {
          console.warn(`No subscription found for user ${userId}`)
          return false
        }

        if (!userSubscription.stripeSubscriptionId) {
          console.warn(`No Stripe subscription ID found for user ${userId}`)

          // Update our database to mark as active even if no Stripe subscription exists
          await tx.userSubscription.update({
            where: { userId },
            data: {
              status: "ACTIVE",
              cancelAtPeriodEnd: false,
            },
          })

          return true
        }

        try {
          const paymentGateway = getPaymentGateway()
          // Resume with the payment gateway
          await paymentGateway.resumeSubscription(userId)
        } catch (stripeError: any) {
          console.error("Stripe error when resuming subscription:", stripeError)

          // If the subscription doesn't exist in Stripe, we should still update our database
          if (stripeError.type === "StripeInvalidRequestError" && stripeError.code === "resource_missing") {
            console.warn(
              `Stripe subscription ${userSubscription.stripeSubscriptionId} not found, updating local database only`,
            )
          } else {
            throw stripeError
          }
        }

        // Update our database regardless of Stripe status
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

        return true
      })
    } catch (error) {
      console.error("Error resuming subscription:", error)
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

      const referral = await prisma.userReferral.findUnique({
        where: { referralCode: normalizedCode },
      })

      return !!referral
    } catch (error) {
      console.error("Error validating referral code:", error)
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

      // Check if the provided code exists in our valid codes
      if (normalizedCode in VALID_PROMO_CODES) {
        return {
          valid: true,
          discountPercentage: VALID_PROMO_CODES[normalizedCode],
          code: normalizedCode,
        }
      }

      // Additional validation logic could be added here
      // For example, checking a database for dynamic promo codes

      return { valid: false, discountPercentage: 0 }
    } catch (error) {
      console.error("Error validating promo code:", error)
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
      console.error(`Error verifying payment status: ${error instanceof Error ? error.message : String(error)}`)
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
        console.warn("No user ID provided for billing history")
        return []
      }

      // Get invoices from database
      const transactions = await prisma.tokenTransaction
        .findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
        .catch((error) => {
          console.error("Database error fetching billing history:", error)
          return []
        })

      // Format transactions
      return transactions.map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount,
        credits: transaction.credits,
        type: transaction.type,
        description: transaction.description,
        date: transaction.createdAt.toISOString(),
      }))
    } catch (error) {
      console.error("Error fetching billing history:", error)
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
        console.warn("No user ID provided for payment methods")
        return []
      }

      // Get the user's subscription to find the Stripe customer ID
      const userSubscription = await prisma.userSubscription
        .findUnique({
          where: { userId },
          select: { stripeCustomerId: true },
        })
        .catch((error) => {
          console.error("Database error fetching user subscription for payment methods:", error)
          return null
        })

      if (!userSubscription || !userSubscription.stripeCustomerId) {
        // No Stripe customer ID found, return empty array
        return []
      }

      // In a real implementation, we would fetch payment methods from Stripe
      // For now, we'll return a placeholder
      return []
    } catch (error) {
      console.error("Error fetching payment methods:", error)
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

      // Use a transaction to ensure user credits and token transaction stay in sync
      return await prisma.$transaction(async (tx) => {
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

        console.log(
          `Updated credits for user ${userId}: ${credits > 0 ? "+" : ""}${credits}, new balance: ${updatedUser.credits}`,
        )
        return updatedUser
      })
    } catch (error) {
      console.error(`Error updating user credits: ${error instanceof Error ? error.message : String(error)}`)
      throw new Error(`Failed to update user credits: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }
}
