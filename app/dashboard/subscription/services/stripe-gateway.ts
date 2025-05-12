/**
 * Stripe Payment Gateway Implementation
 *
 * This file contains the implementation of the Stripe payment gateway.
 * It handles all Stripe-specific operations like creating checkout sessions,
 * managing subscriptions, and verifying payments.
 */

import Stripe from "stripe"
import { prisma } from "@/lib/db"
import { SUBSCRIPTION_PLANS } from "@/app/dashboard/subscription/components/subscription-plans"
import type { PaymentGateway, PaymentOptions, CheckoutResult, PaymentStatusResult } from "./payment-gateway-interface"
import { createLogger } from "@/lib/logger"

// Initialize logger
const logger = createLogger("stripe-gateway")

// Initialize Stripe with the API key and proper configuration
const stripe = new Stripe("***REMOVED***", {
  apiVersion: "2024-10-28.acacia",
  timeout: 30000, // 30 second timeout for API requests
  maxNetworkRetries: 3, // Automatically retry failed requests
})

// Cache for customer IDs to reduce database lookups
const customerCache = new Map<string, string>()

/**
 * Stripe Payment Gateway implementation
 */
export class StripeGateway implements PaymentGateway {
  /**
   * Create a Stripe checkout session for subscription
   */
  async createCheckoutSession(
    userId: string,
    planName: string,
    duration: number,
    options?: PaymentOptions,
  ): Promise<CheckoutResult> {
    try {
      logger.info(`Creating checkout session for user ${userId}, plan ${planName}, duration ${duration}`)

      // Input validation
      if (!userId) throw new Error("User ID is required")
      if (!planName) throw new Error("Plan name is required")
      if (!duration || duration <= 0) throw new Error("Valid duration is required")

      // Find the plan in our configuration
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planName)
      if (!plan) {
        throw new Error(`Invalid plan name: ${planName}`)
      }

      // Get the user from the database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      })

      if (!user) {
        throw new Error(`User with ID ${userId} not found`)
      }

      // Check if user already has an active subscription
      if (user.subscription?.planId !== "FREE" && user.subscription?.status === "ACTIVE") {
        throw new Error("User already has an active subscription")
      }

      // Find the price option for the selected duration
      const priceOption = plan.options.find((o) => o.duration === duration)
      if (!priceOption) {
        throw new Error(`Invalid duration ${duration} for the selected plan`)
      }

      // Get or create a Stripe customer for the user
      const stripeCustomerId = await this.getOrCreateCustomer(user, options)

      // Process referral if provided
      const referralData = await this.processReferralCode(userId, options?.referralCode)

      // Calculate price with discount if promo code is provided
      let unitAmount = Math.round(priceOption.price * 100)
      let promoCodeApplied = false

      if (options?.promoCode && options?.promoDiscount && options.promoDiscount > 0) {
        unitAmount = Math.round(unitAmount * (1 - options.promoDiscount / 100))
        promoCodeApplied = true
        logger.info(`Applied promo code ${options.promoCode} with ${options.promoDiscount}% discount`)
      }

      // Create metadata object with only defined values
      const metadata: Record<string, string> = {
        userId,
        planName: plan.id,
        tokens: plan.tokens.toString(),
        duration: duration.toString(),
      }

      // Only add non-empty values to metadata
      if (referralData.referrerId) metadata.referrerId = referralData.referrerId
      if (referralData.referralUseId) metadata.referralUseId = referralData.referralUseId
      if (options?.referralCode) metadata.referralCode = options.referralCode
      if (options?.promoCode) metadata.promoCode = options.promoCode
      if (options?.promoDiscount !== undefined) metadata.promoDiscount = options.promoDiscount.toString()

      // Add custom metadata from options
      if (options?.metadata) {
        Object.entries(options.metadata).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            metadata[key] = value
          }
        })
      }

      // Create the Stripe checkout session with proper error handling
      try {
        const session = await stripe.checkout.sessions.create({
          customer: stripeCustomerId,
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `${plan.name} Plan - ${duration} month${duration > 1 ? "s" : ""}`,
                  description: promoCodeApplied
                    ? `Applied discount: ${options?.promoDiscount}% off with code ${options?.promoCode}`
                    : undefined,
                },
                unit_amount: unitAmount,
                recurring: {
                  interval: duration === 1 ? "month" : "year",
                  interval_count: duration === 1 ? 1 : duration / 12,
                },
              },
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: `${process.env.NEXT_PUBLIC_URL || "https://courseai.io"}/dashboard/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_URL || "https://courseai.io"}/dashboard/cancelled?session_id={CHECKOUT_SESSION_ID}`,
          metadata,
          allow_promotion_codes: !promoCodeApplied, // Only allow additional promo codes if none applied yet
        })

        logger.info(`Created Stripe checkout session: ${session.id}`)

        // Make sure we have a URL
        if (!session.url) {
          logger.error("Stripe did not return a checkout URL")
          throw new Error("Failed to generate checkout URL")
        }

        return {
          sessionId: session.id,
          url: session.url,
          customerId: stripeCustomerId,
        }
      } catch (stripeError: any) {
        // Enhanced error handling for Stripe checkout creation
        this.handleStripeError(stripeError, "creating checkout session")
      }
    } catch (error) {
      logger.error(`Error creating checkout session: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Cancel a Stripe subscription
   */
  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      logger.info(`Cancelling subscription for user ${userId}`)

      if (!userId) {
        throw new Error("User ID is required")
      }

      // Get the user's subscription from the database
      const userSubscription = await prisma.userSubscription.findUnique({
        where: { userId },
      })

      if (!userSubscription || !userSubscription.stripeSubscriptionId) {
        logger.warn(`No active subscription found for user ${userId}`)
        return false
      }

      try {
        // Cancel the subscription with Stripe
        await stripe.subscriptions.update(userSubscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        })

        // Update our database
        await prisma.userSubscription.update({
          where: { userId },
          data: {
            status: "CANCELED",
            cancelAtPeriodEnd: true,
          },
        })

        logger.info(`Successfully cancelled subscription for user ${userId}`)
        return true
      } catch (stripeError: any) {
        // If the subscription doesn't exist in Stripe, log the error but don't fail
        if (stripeError.code === "resource_missing") {
          logger.warn(`Stripe subscription ${userSubscription.stripeSubscriptionId} not found for user ${userId}`)

          // Update our database anyway
          await prisma.userSubscription.update({
            where: { userId },
            data: {
              status: "CANCELED",
              cancelAtPeriodEnd: true,
            },
          })

          return true
        } else {
          this.handleStripeError(stripeError, "cancelling subscription")
        }
      }
    } catch (error) {
      logger.error(`Error canceling subscription: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Resume a canceled Stripe subscription
   */
  async resumeSubscription(userId: string): Promise<boolean> {
    try {
      logger.info(`Resuming subscription for user ${userId}`)

      if (!userId) {
        throw new Error("User ID is required")
      }

      // Get the user's subscription from the database
      const userSubscription = await prisma.userSubscription.findUnique({
        where: { userId },
      })

      if (!userSubscription || !userSubscription.stripeSubscriptionId) {
        logger.warn(`No subscription found to resume for user ${userId}`)
        return false
      }

      try {
        // Resume the subscription with Stripe
        await stripe.subscriptions.update(userSubscription.stripeSubscriptionId, {
          cancel_at_period_end: false,
        })

        // Update our database
        await prisma.userSubscription.update({
          where: { userId },
          data: {
            status: "ACTIVE",
            cancelAtPeriodEnd: false,
          },
        })

        logger.info(`Successfully resumed subscription for user ${userId}`)
        return true
      } catch (stripeError: any) {
        // If the subscription doesn't exist in Stripe, log the error but don't fail
        if (stripeError.code === "resource_missing") {
          logger.warn(`Stripe subscription ${userSubscription.stripeSubscriptionId} not found for user ${userId}`)
          return false
        } else {
          this.handleStripeError(stripeError, "resuming subscription")
        }
      }
    } catch (error) {
      logger.error(`Error resuming subscription: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Verify the status of a Stripe payment
   */
  async verifyPaymentStatus(sessionId: string): Promise<PaymentStatusResult> {
    if (!sessionId) {
      return { status: "failed" }
    }

    try {
      logger.info(`Verifying payment status for session ${sessionId}`)

      // Implement retry logic with exponential backoff
      const maxRetries = 3
      let retryCount = 0
      let lastError: any = null

      while (retryCount < maxRetries) {
        try {
          // Retrieve the checkout session with expanded subscription
          const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ["subscription", "customer"],
          })

          // Check payment status
          if (session.status === "complete" && session.payment_status === "paid") {
            logger.info(`Payment succeeded for session ${sessionId}`)

            // Process successful payment
            if (session.metadata?.userId && session.metadata?.tokens) {
              await this.processSuccessfulPayment(session)
            }

            return {
              status: "succeeded",
              subscription: session.subscription,
              customerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
              amountPaid: session.amount_total ? session.amount_total / 100 : undefined,
            }
          } else if (session.status === "open") {
            logger.info(`Payment pending for session ${sessionId}`)
            return { status: "pending" }
          } else if (session.payment_status === "unpaid") {
            logger.info(`Payment failed for session ${sessionId}`)
            return { status: "failed" }
          } else {
            logger.info(`Payment canceled for session ${sessionId}`)
            return { status: "canceled" }
          }
        } catch (error: any) {
          lastError = error

          // Only retry on network errors or Stripe API errors that might be temporary
          if (
            error.type === "StripeConnectionError" ||
            error.type === "StripeAPIError" ||
            error.code === "ETIMEDOUT" ||
            error.code === "ECONNRESET"
          ) {
            retryCount++
            const delay = Math.pow(2, retryCount) * 1000 // Exponential backoff: 2s, 4s, 8s
            logger.warn(`Retry ${retryCount}/${maxRetries} after ${delay}ms for session ${sessionId}`)
            await new Promise((resolve) => setTimeout(resolve, delay))
          } else {
            // Don't retry on other errors
            throw error
          }
        }
      }

      // If we've exhausted retries
      logger.error(`Failed to verify payment after ${maxRetries} retries:`, lastError)
      throw lastError
    } catch (error) {
      logger.error(`Error verifying payment status: ${error instanceof Error ? error.message : String(error)}`)
      return { status: "failed" }
    }
  }

  /**
   * Get payment methods for a user
   */
  async getPaymentMethods(userId: string): Promise<any[]> {
    try {
      logger.info(`Fetching payment methods for user ${userId}`)

      if (!userId) {
        throw new Error("User ID is required")
      }

      // Get the user's Stripe customer ID
      const userSubscription = await prisma.userSubscription.findUnique({
        where: { userId },
        select: { stripeCustomerId: true },
      })

      if (!userSubscription?.stripeCustomerId) {
        logger.info(`No Stripe customer ID found for user ${userId}`)
        return []
      }

      // Fetch payment methods from Stripe
      const paymentMethods = await stripe.paymentMethods.list({
        customer: userSubscription.stripeCustomerId,
        type: "card",
      })

      // Format the payment methods for our application
      return paymentMethods.data.map((method) => ({
        id: method.id,
        type: method.type,
        brand: method.card?.brand,
        last4: method.card?.last4,
        expMonth: method.card?.exp_month,
        expYear: method.card?.exp_year,
        isDefault: method.metadata?.isDefault === "true",
      }))
    } catch (error) {
      logger.error(`Error fetching payment methods: ${error instanceof Error ? error.message : String(error)}`)
      return []
    }
  }

  /**
   * Update a subscription to a new plan
   */
  async updateSubscription(userId: string, planName: string): Promise<boolean> {
    try {
      logger.info(`Updating subscription for user ${userId} to plan ${planName}`)

      if (!userId || !planName) {
        throw new Error("User ID and plan name are required")
      }

      // Get the user's subscription
      const userSubscription = await prisma.userSubscription.findUnique({
        where: { userId },
      })

      if (!userSubscription?.stripeSubscriptionId) {
        logger.warn(`No subscription found for user ${userId}`)
        return false
      }

      // Find the plan in our configuration
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planName)
      if (!plan) {
        throw new Error(`Invalid plan name: ${planName}`)
      }

      // Get the price ID for the plan (this would need to be stored somewhere)
      const priceId = await this.getPriceIdForPlan(planName)
      if (!priceId) {
        throw new Error(`No price ID found for plan ${planName}`)
      }

      // Update the subscription with Stripe
      await stripe.subscriptions.update(userSubscription.stripeSubscriptionId, {
        items: [
          {
            id: await this.getSubscriptionItemId(userSubscription.stripeSubscriptionId),
            price: priceId,
          },
        ],
        proration_behavior: "create_prorations",
      })

      // Update our database
      await prisma.userSubscription.update({
        where: { userId },
        data: {
          planId: planName,
          status: "ACTIVE",
        },
      })

      logger.info(`Successfully updated subscription for user ${userId} to plan ${planName}`)
      return true
    } catch (error) {
      logger.error(`Error updating subscription: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Process a successful payment
   * @private
   */
  private async processSuccessfulPayment(session: Stripe.Checkout.Session): Promise<void> {
    try {
      const userId = session.metadata?.userId
      const planId = session.metadata?.planName
      const tokensStr = session.metadata?.tokens

      if (!userId || !tokensStr) {
        logger.warn("Missing userId or tokens in session metadata")
        return
      }

      // Find the plan to get the correct token amount
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
      const tokensToAdd = plan ? plan.tokens : Number.parseInt(tokensStr, 10)

      // Update user tokens
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (user) {
        // Update user credits
        await prisma.user.update({
          where: { id: userId },
          data: {
            credits: user.credits + tokensToAdd,
          },
        })

        // Log the token transaction
        await prisma.tokenTransaction.create({
          data: {
            userId,
            amount: tokensToAdd,
            type: session.mode === "subscription" ? "SUBSCRIPTION" : "PURCHASE",
            description: `Added ${tokensToAdd} tokens from ${planId || "subscription"} plan`,
          },
        })

        logger.info(`Added ${tokensToAdd} tokens to user ${userId}`)
      }

      // Process referral benefits if applicable
      if (session.metadata?.referralCode || session.metadata?.referralUseId) {
        await this.processReferralBenefits(session)
      }
    } catch (error) {
      logger.error(`Error processing successful payment: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Process referral benefits for a successful checkout
   * @private
   */
  private async processReferralBenefits(session: any): Promise<void> {
    try {
      const userId = session.metadata?.userId
      const referralCode = session.metadata?.referralCode
      const referralUseId = session.metadata?.referralUseId

      // Skip if no referral information
      if (!userId || (!referralCode && !referralUseId)) {
        return
      }

      // Check if this referral has already been processed
      const existingReferralUse = await prisma.userReferralUse.findFirst({
        where: {
          referredId: userId,
          status: "COMPLETED",
        },
      })

      if (existingReferralUse) {
        logger.info(`Referral for user ${userId} already processed`)
        return
      }

      // Find referral record either by ID or code
      let referral
      let referrerId

      if (referralUseId) {
        const referralUse = await prisma.userReferralUse.findUnique({
          where: { id: referralUseId },
          include: { referral: true },
        })

        if (referralUse) {
          referral = referralUse.referral
          referrerId = referralUse.referrerId

          // Update the referral use status
          await prisma.userReferralUse.update({
            where: { id: referralUseId },
            data: { status: "COMPLETED" },
          })
        }
      } else if (referralCode) {
        referral = await prisma.userReferral.findUnique({
          where: { referralCode },
        })

        if (referral) {
          referrerId = referral.userId

          // Create a new referral use record
          await prisma.userReferralUse.create({
            data: {
              referrerId: referrerId,
              referredId: userId,
              referralId: referral.id,
              status: "COMPLETED",
              planId: session.metadata?.planName || "UNKNOWN",
            },
          })
        }
      }

      if (!referral || !referrerId || referrerId === userId) {
        logger.info(`No valid referral found or self-referral for user ${userId}`)
        return
      }

      const REFERRER_BONUS = 10
      const REFERRED_USER_BONUS = 5

      // Add bonus to referred user (current user)
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (user) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            credits: user.credits + REFERRED_USER_BONUS,
          },
        })

        await prisma.tokenTransaction.create({
          data: {
            userId,
            amount: REFERRED_USER_BONUS,
            type: "REFERRAL",
            description: `Referral bonus for subscribing using referral code`,
          },
        })

        logger.info(`Added ${REFERRED_USER_BONUS} bonus tokens to referred user ${userId}`)
      }

      // Add bonus to referrer
      const referrer = await prisma.user.findUnique({
        where: { id: referrerId },
      })

      if (referrer) {
        await prisma.user.update({
          where: { id: referrerId },
          data: {
            credits: referrer.credits + REFERRER_BONUS,
          },
        })

        await prisma.tokenTransaction.create({
          data: {
            userId: referrerId,
            amount: REFERRER_BONUS,
            type: "REFERRAL",
            description: `Referral bonus for user ${userId} subscribing`,
          },
        })

        logger.info(`Added ${REFERRER_BONUS} bonus tokens to referrer ${referrerId}`)
      }

      logger.info(`Successfully applied referral benefits for user ${userId}`)
    } catch (error) {
      logger.error(`Error processing referral benefits: ${error instanceof Error ? error.message : String(error)}`)
      // Don't throw error to avoid disrupting the payment verification
    }
  }

  /**
   * Process a referral code and create necessary records
   * @private
   */
  private async processReferralCode(
    userId: string,
    referralCode?: string,
  ): Promise<{ referrerId?: string; referralUseId?: string }> {
    if (!referralCode) {
      return {}
    }

    try {
      const referral = await prisma.userReferral.findUnique({
        where: { referralCode },
        select: { userId: true, id: true },
      })

      if (referral && referral.userId !== userId) {
        // Check if this user has already used a referral code
        const existingReferralUse = await prisma.userReferralUse.findFirst({
          where: {
            referredId: userId,
            status: { in: ["PENDING", "COMPLETED"] },
          },
        })

        if (existingReferralUse) {
          logger.info(`User ${userId} has already used a referral code`)
          return { referrerId: referral.userId }
        }

        // Record the referral
        const referralUse = await prisma.userReferralUse.create({
          data: {
            referrerId: referral.userId,
            referredId: userId,
            referralId: referral.id,
            status: "PENDING",
          },
        })

        logger.info(`Created referral use record for user ${userId} with referrer ${referral.userId}`)
        return { referrerId: referral.userId, referralUseId: referralUse.id }
      }
    } catch (error) {
      logger.error(`Error processing referral code: ${error instanceof Error ? error.message : String(error)}`)
    }

    return {}
  }

  /**
   * Get or create a Stripe customer for a user
   * @private
   */
  private async getOrCreateCustomer(user: any, options?: PaymentOptions): Promise<string> {
    // Check cache first
    if (customerCache.has(user.id)) {
      return customerCache.get(user.id)!
    }

    // Check if user already has a Stripe customer ID
    if (user.subscription?.stripeCustomerId) {
      // Cache the customer ID
      customerCache.set(user.id, user.subscription.stripeCustomerId)
      return user.subscription.stripeCustomerId
    }

    // Create a new Stripe customer
    try {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.name || options?.customerName,
        metadata: { userId: user.id },
      })

      // Store the customer ID in our database
      await prisma.userSubscription.upsert({
        where: { userId: user.id },
        update: { stripeCustomerId: customer.id },
        create: {
          userId: user.id,
          planId: "FREE",
          status: "PENDING",
          stripeCustomerId: customer.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
        },
      })

      // Cache the customer ID
      customerCache.set(user.id, customer.id)

      logger.info(`Created new Stripe customer for user ${user.id}: ${customer.id}`)
      return customer.id
    } catch (stripeError: any) {
      this.handleStripeError(stripeError, "creating customer")
      throw stripeError
    }
  }

  /**
   * Get the subscription item ID for a subscription
   * @private
   */
  private async getSubscriptionItemId(subscriptionId: string): Promise<string> {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items"],
    })

    if (!subscription.items.data || subscription.items.data.length === 0) {
      throw new Error(`No items found for subscription ${subscriptionId}`)
    }

    return subscription.items.data[0].id
  }

  /**
   * Get the price ID for a plan
   * @private
   */
  private async getPriceIdForPlan(planName: string): Promise<string | null> {
    // In a real implementation, this would look up the price ID from a database or configuration
    // For now, we'll return a placeholder
    return `price_${planName.toLowerCase()}_monthly`
  }

  /**
   * Handle Stripe errors with proper logging and error translation
   * @private
   */
  private handleStripeError(error: any, operation: string): never {
    if (error.type === "StripeCardError") {
      // Handle card errors (e.g., declined card)
      logger.error(`Card error while ${operation}: ${error.message}`)
      throw new Error(`Payment failed: ${error.message}`)
    } else if (error.type === "StripeInvalidRequestError") {
      // Handle invalid request errors
      logger.error(`Invalid request while ${operation}: ${error.message}`)
      throw new Error(`Invalid payment request: ${error.message}`)
    } else if (error.type === "StripeAPIError") {
      // Handle API errors
      logger.error(`Stripe API error while ${operation}: ${error.message}`)
      throw new Error("Payment service unavailable. Please try again later.")
    } else if (error.type === "StripeConnectionError") {
      // Handle connection errors
      logger.error(`Connection error while ${operation}: ${error.message}`)
      throw new Error("Could not connect to payment service. Please check your internet connection.")
    } else if (error.type === "StripeAuthenticationError") {
      // Handle authentication errors
      logger.error(`Authentication error while ${operation}: ${error.message}`)
      throw new Error("Payment service authentication failed. Please contact support.")
    } else {
      // Handle other errors
      logger.error(`Unexpected payment error while ${operation}:`, error)
      throw new Error("An unexpected error occurred. Please try again.")
    }
  }
}
