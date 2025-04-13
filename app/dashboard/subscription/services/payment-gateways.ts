/**
 * Stripe Payment Gateway Implementation
 *
 * This file contains the implementation of the Stripe payment gateway.
 * It handles all Stripe-specific operations like creating checkout sessions,
 * managing subscriptions, and verifying payments.
 */

import Stripe from "stripe"

import { prisma } from "@/lib/db"
import { PaymentGateway, PaymentOptions } from "@/app/types/types"
import { SUBSCRIPTION_PLANS } from "@/app/dashboard/subscription/components/subscription-plans"

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
  ): Promise<{ sessionId: string }> {
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
    }

    // Process referral if provided
    let referrerUserId: string | undefined
    let referralRecordId: string | undefined
    let referralUseId: string | undefined

    if (options?.referralCode) {
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
          } catch (cleanupError) {
            console.error("Failed to clean up referral use record:", cleanupError)
          }
        }
      }
    }

    // Calculate price with discount if promo code is provided
    let unitAmount = Math.round(priceOption.price * 100)
    let promoCodeApplied = false

    if (options?.promoCode && options?.promoDiscount && options.promoDiscount > 0) {
      unitAmount = Math.round(unitAmount * (1 - options.promoDiscount / 100))
      promoCodeApplied = true
    }

    // Create the Stripe checkout session
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
      metadata: {
        userId,
        planName: plan.id,
        tokens: plan.tokens.toString(),
        referrerId: referrerUserId || "",
        referralUseId: referralUseId || "",
        promoCode: options?.promoCode || "",
        promoDiscount: options?.promoDiscount ? options.promoDiscount.toString() : "",
        ...options?.metadata,
      },
    })

    return { sessionId: session.id }
  }

  /**
   * Cancel a Stripe subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
      return true
    } catch (error) {
      console.error("Error canceling subscription:", error)
      throw new Error("Failed to cancel subscription")
    }
  }

  /**
   * Resume a canceled Stripe subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      })
      return true
    } catch (error) {
      console.error("Error resuming subscription:", error)
      throw new Error("Failed to resume subscription")
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
        }

        return {
          status: "succeeded",
          subscription: session.subscription,
        }
      } else if (session.status === "open") {
        return { status: "pending" }
      } else if (session.payment_status === "unpaid") {
        return { status: "failed" }
      } else {
        return { status: "canceled" }
      }
    } catch (error) {
      console.error("Error verifying payment status:", error)
      return { status: "failed" }
    }
  }
}

