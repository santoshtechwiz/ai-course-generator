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
import type { PaymentGateway, PaymentOptions } from "./payment-gateway-interface"

// Initialize Stripe with the API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-10-28.acacia",
})

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
  ): Promise<{ sessionId: string; url: string }> {
    try {
      // Find the plan in our configuration
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planName)
      if (!plan) {
        throw new Error("Invalid plan name")
      }

      // Get the user from the database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      })

      if (!user) {
        throw new Error("User not found")
      }

      // Check if user already has an active subscription
      if (user.subscription?.planId !== "FREE" && user.subscription?.status === "ACTIVE") {
        throw new Error("User already has an active subscription")
      }

      // Find the price option for the selected duration
      const priceOption = plan.options.find((o) => o.duration === duration)
      if (!priceOption) {
        throw new Error("Invalid duration for the selected plan")
      }

      // Get or create a Stripe customer for the user
      let stripeCustomerId = user.subscription?.stripeCustomerId
      if (!stripeCustomerId) {
        try {
          const customer = await stripe.customers.create({
            email: user.email!,
            name: user.name || undefined,
            metadata: { userId: user.id },
          })
          stripeCustomerId = customer.id

          // Create or update the user's subscription record
          await prisma.userSubscription.upsert({
            where: { userId: user.id },
            update: { stripeCustomerId },
            create: {
              userId: user.id,
              planId: plan.id,
              status: "PENDING",
              stripeCustomerId,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(),
            },
          })
        } catch (stripeError: any) {
          // More specific error handling for customer creation
          if (stripeError.type === "StripeCardError") {
            throw new Error(`Payment method error: ${stripeError.message}`)
          } else if (stripeError.type === "StripeInvalidRequestError") {
            throw new Error(`Invalid request: ${stripeError.message}`)
          } else {
            console.error("Error creating Stripe customer:", stripeError)
            throw new Error("Failed to create customer account")
          }
        }
      }

      // Process referral if provided
      let referrerUserId: string | undefined
      let referralRecordId: string | undefined
      let referralUseId: string | undefined
      let referralCodeToUse: string | undefined

      if (options?.referralCode) {
        // Store the original referral code even if processing fails
        referralCodeToUse = options.referralCode

        try {
          const referral = await prisma.userReferral.findUnique({
            where: { referralCode: options.referralCode },
            select: { userId: true, id: true },
          })

          if (referral && referral.userId !== userId) {
            referrerUserId = referral.userId
            referralRecordId = referral.id

            // Check if this user has already used a referral code
            const existingReferralUse = await prisma.userReferralUse.findFirst({
              where: {
                referredId: userId,
                status: { in: ["PENDING", "COMPLETED"] },
              },
            })

            if (!existingReferralUse) {
              // Record the referral
              const referralUse = await prisma.userReferralUse.create({
                data: {
                  referrerId: referrerUserId,
                  referredId: userId,
                  referralId: referralRecordId,
                  status: "PENDING",
                  planId: plan.id,
                },
              })

              referralUseId = referralUse.id
            }
          }
        } catch (error) {
          console.error("Error processing referral:", error)
          // Clean up if needed
          if (referralUseId) {
            try {
              await prisma.userReferralUse.delete({
                where: { id: referralUseId },
              })
              referralUseId = undefined
            } catch (cleanupError) {
              console.error("Failed to clean up referral use record:", cleanupError)
            }
          }
          // We keep referralCodeToUse even if there's an error
        }
      }

      // Calculate price with discount if promo code is provided
      let unitAmount = Math.round(priceOption.price * 100)
      let promoCodeApplied = false
      let promoCodeToUse: string | undefined
      let promoDiscountToUse: number | undefined

      if (options?.promoCode && options?.promoDiscount && options.promoDiscount > 0) {
        promoCodeToUse = options.promoCode
        promoDiscountToUse = options.promoDiscount
        unitAmount = Math.round(unitAmount * (1 - options.promoDiscount / 100))
        promoCodeApplied = true
      }

      // Create metadata object with only defined values
      const metadata: Record<string, string> = {
        userId,
        planName: plan.id,
        tokens: plan.tokens.toString(),
      }

      // Only add non-empty values to metadata
      if (referrerUserId) metadata.referrerId = referrerUserId
      if (referralUseId) metadata.referralUseId = referralUseId
      if (referralCodeToUse) metadata.referralCode = referralCodeToUse
      if (promoCodeToUse) metadata.promoCode = promoCodeToUse
      if (promoDiscountToUse !== undefined) metadata.promoDiscount = promoDiscountToUse.toString()

      // Add custom metadata from options
      if (options?.metadata) {
        Object.entries(options.metadata).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            metadata[key] = value
          }
        })
      }

      // Log metadata for debugging
      console.log("Session metadata:", metadata)

      // Create the Stripe checkout session
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
                    ? `Applied discount: ${promoDiscountToUse}% off with code ${promoCodeToUse}`
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
        })

        // Log the session for debugging
        console.log(`Created Stripe checkout session: ${session.id}`)
        console.log(`Checkout URL: ${session.url ? "Available" : "Not available"}`)

        // Make sure we have a URL
        if (!session.url) {
          console.error("Stripe did not return a checkout URL")
          throw new Error("Failed to generate checkout URL")
        }

        return {
          sessionId: session.id,
          url: session.url,
        }
      } catch (stripeError: any) {
        // Enhanced error handling for Stripe checkout creation
        if (stripeError.type === "StripeCardError") {
          // Handle card errors (e.g., declined card)
          console.error("Card error:", stripeError.message)
          throw new Error(`Payment failed: ${stripeError.message}`)
        } else if (stripeError.type === "StripeInvalidRequestError") {
          // Handle invalid request errors
          console.error("Invalid request:", stripeError.message)
          throw new Error("Invalid payment request. Please try again.")
        } else if (stripeError.type === "StripeAPIError") {
          // Handle API errors
          console.error("Stripe API error:", stripeError.message)
          throw new Error("Payment service unavailable. Please try again later.")
        } else if (stripeError.type === "StripeConnectionError") {
          // Handle connection errors
          console.error("Connection error:", stripeError.message)
          throw new Error("Could not connect to payment service. Please check your internet connection.")
        } else if (stripeError.type === "StripeAuthenticationError") {
          // Handle authentication errors
          console.error("Authentication error:", stripeError.message)
          throw new Error("Payment service authentication failed. Please contact support.")
        } else {
          // Handle other errors
          console.error("Unexpected payment error:", stripeError)
          throw new Error("An unexpected error occurred. Please try again.")
        }
      }
    } catch (error) {
      console.error("Error creating checkout session:", error)
      throw error
    }
  }

  /**
   * Cancel a Stripe subscription
   */
  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      // Get the user's subscription from the database
      const userSubscription = await prisma.userSubscription.findUnique({
        where: { userId },
      })

      if (!userSubscription || !userSubscription.stripeSubscriptionId) {
        throw new Error("No active subscription found")
      }

      try {
        await stripe.subscriptions.update(userSubscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        })
      } catch (stripeError: any) {
        // If the subscription doesn't exist in Stripe, log the error but don't fail
        if (stripeError.code === "resource_missing") {
          console.warn(`Stripe subscription ${userSubscription.stripeSubscriptionId} not found for user ${userId}`)
        } else {
          throw stripeError
        }
      }

      return true
    } catch (error) {
      console.error("Error canceling subscription:", error)
      throw error
    }
  }

  /**
   * Resume a canceled Stripe subscription
   */
  async resumeSubscription(userId: string): Promise<boolean> {
    try {
      // Get the user's subscription from the database
      const userSubscription = await prisma.userSubscription.findUnique({
        where: { userId },
      })

      if (!userSubscription || !userSubscription.stripeSubscriptionId) {
        throw new Error("No subscription found to resume")
      }

      try {
        await stripe.subscriptions.update(userSubscription.stripeSubscriptionId, {
          cancel_at_period_end: false,
        })
      } catch (stripeError: any) {
        // If the subscription doesn't exist in Stripe, log the error but don't fail
        if (stripeError.code === "resource_missing") {
          console.warn(`Stripe subscription ${userSubscription.stripeSubscriptionId} not found for user ${userId}`)
        } else {
          throw stripeError
        }
      }

      return true
    } catch (error) {
      console.error("Error resuming subscription:", error)
      throw error
    }
  }

  /**
   * Verify the status of a Stripe payment
   */
  async verifyPaymentStatus(sessionId: string): Promise<{
    status: "succeeded" | "pending" | "failed" | "canceled"
    subscription?: any
  }> {
    if (!sessionId) {
      return { status: "failed" }
    }

    try {
      // Implement retry logic with exponential backoff
      const maxRetries = 3
      let retryCount = 0
      let lastError: any = null

      while (retryCount < maxRetries) {
        try {
          // Retrieve the checkout session with expanded subscription
          const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ["subscription"],
          })

          // Check payment status
          if (session.status === "complete" && session.payment_status === "paid") {
            // Process successful payment
            if (session.metadata?.userId && session.metadata?.tokens) {
              const userId = session.metadata.userId
              const planId = session.metadata.planName

              // Find the plan to get the correct token amount
              const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
              const tokensToAdd = plan ? plan.tokens : Number.parseInt(session.metadata.tokens, 10)

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
              }

              // Process referral benefits if applicable
              if (session.metadata.referralCode || session.metadata.referralUseId) {
                await this.processReferralBenefits(session)
              }
            }

            return {
              status: "succeeded",
              subscription: session.subscription || session,
            }
          } else if (session.status === "open") {
            return { status: "pending" }
          } else if (session.payment_status === "unpaid") {
            return { status: "failed" }
          } else {
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
            console.log(`Retry ${retryCount}/${maxRetries} after ${delay}ms for session ${sessionId}`)
            await new Promise((resolve) => setTimeout(resolve, delay))
          } else {
            // Don't retry on other errors
            throw error
          }
        }
      }

      // If we've exhausted retries
      console.error(`Failed to verify payment after ${maxRetries} retries:`, lastError)
      throw lastError
    } catch (error) {
      console.error("Error verifying payment status:", error)
      return { status: "failed" }
    }
  }

  /**
   * Process referral benefits for a successful checkout
   * @private
   */
  private async processReferralBenefits(session: any): Promise<void> {
    try {
      const userId = session.metadata.userId
      const referralCode = session.metadata.referralCode
      const referralUseId = session.metadata.referralUseId

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
        console.log(`Referral for user ${userId} already processed`)
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
              planId: session.metadata.planName || "UNKNOWN",
            },
          })
        }
      }

      if (!referral || !referrerId || referrerId === userId) {
        console.log(`No valid referral found or self-referral for user ${userId}`)
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
      }

      console.log(`Successfully applied referral benefits for user ${userId}`)
    } catch (error) {
      console.error("Error processing referral benefits:", error)
      // Don't throw error to avoid disrupting the payment verification
    }
  }
}
