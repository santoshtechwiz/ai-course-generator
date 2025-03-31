import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanType,
} from "@/app/dashboard/subscription/components/subscription.config"
import { prisma } from "@/lib/db"
import Stripe from "stripe"

const key =
  "***REMOVED***"
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || key, {
  apiVersion: "2024-10-28.acacia",
})

export class SubscriptionService {
  // Update the activateFreePlan method to fix the token duplication bug
  static async activateFreePlan(userId: string) {
    try {
      // Check if user already has a subscription
      const existingSubscription = await prisma.userSubscription.findUnique({
        where: { userId },
      })

      // Get the user to check their current credits
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      })

      // Check if there's a token transaction record for free plan tokens
      const existingFreeTokens = await prisma.tokenTransaction.findFirst({
        where: {
          userId,
          type: "SUBSCRIPTION",
          description: "Added 5 tokens for free plan",
        },
      })

      if (existingSubscription) {
        // If user already has any subscription, they cannot activate the free plan
        // They must subscribe to a paid plan instead
        throw new Error("User already has a subscription. Please subscribe to a paid plan instead.")
      } else {
        // Create new free subscription
        await prisma.userSubscription.create({
          data: {
            userId,
            planId: "FREE",
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
          },
        })

        // Only add tokens if the user hasn't received free tokens before
        if (!existingFreeTokens) {
          // Add 5 tokens for new free plan users
          await prisma.user.update({
            where: { id: userId },
            data: {
              credits: {
                increment: 5,
              },
            },
          })

          await prisma.tokenTransaction.create({
            data: {
              userId,
              amount: 5,
              type: "SUBSCRIPTION",
              description: "Added 5 tokens for free plan",
            },
          })
        }
      }

      return { success: true, plan: "FREE" }
    } catch (error) {
      console.error("Error activating free plan:", error)
      throw error
    }
  }

  static async createCheckoutSession(
    userId: string,
    planName: string,
    duration: number,
    referralCode?: string,
    promoCode?: string,
    promoDiscount?: number,
  ) {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.name === planName)
    if (!plan) {
      throw new Error("Invalid plan name")
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })

    if (!user) throw new Error("User not found")

    if (user.subscription && user.subscription.planId !== "FREE" && user.subscription.status === "ACTIVE") {
      throw new Error("User already has an active subscription")
    }
    const option = plan.options.find((o) => o.duration === duration)
    if (!option) {
      throw new Error("Invalid duration for the selected plan")
    }
    let stripeCustomer = user.subscription?.stripeCustomerId
    if (!stripeCustomer) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.name || undefined,
        metadata: { userId: user.id },
      })
      stripeCustomer = customer.id

      await prisma.userSubscription.upsert({
        where: { userId: user.id },
        update: { stripeCustomerId: stripeCustomer },
        create: {
          userId: user.id,
          planId: plan.name,
          status: "PENDING",
          stripeCustomerId: stripeCustomer,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
        },
      })
    }

    // Process referral if a code is provided
    let referrerUserId: string | undefined
    let referralRecordId: string | undefined
    let referralUseId: string | undefined

    if (referralCode) {
      try {
        // First check if the referral code exists
        const referral = await prisma.userReferral.findUnique({
          where: { referralCode },
          select: { userId: true, id: true },
        })

        if (!referral) {
          console.warn(`Invalid referral code: ${referralCode}`)
        } else if (referral.userId === userId) {
          console.warn(`User attempted to use their own referral code: ${userId}`)
        } else {
          // Store both the user ID who created the referral and the referral record ID
          referrerUserId = referral.userId
          referralRecordId = referral.id

          // Check if this user has already used a referral code
          const existingReferralUse = await prisma.userReferralUse.findFirst({
            where: {
              referredId: userId,
              status: { in: ["PENDING", "COMPLETED"] },
            },
          })

          if (existingReferralUse) {
            console.warn(`User ${userId} has already used a referral code`)
          } else {
            // Record the referral - using the correct IDs for each field
            const referralUse = await prisma.userReferralUse.create({
              data: {
                referrerId: referrerUserId, // User ID who created the referral
                referredId: userId, // Current user being referred
                referralId: referralRecordId, // The actual referral record ID
                status: "PENDING", // Will be updated to COMPLETED after successful payment
                planId: plan.name,
              },
            })

            referralUseId = referralUse.id
          }
        }
      } catch (error) {
        console.error("Error processing referral:", error)

        // If we created a referral use record but encountered an error later,
        // clean it up to avoid orphaned records
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

    // Calculate the price with discount if a valid promo code is provided
    let unitAmount = Math.round(option.price * 100)
    let promoCodeApplied = false

    if (promoCode && promoDiscount && promoDiscount > 0) {
      // Apply the discount percentage
      unitAmount = Math.round(unitAmount * (1 - promoDiscount / 100))
      promoCodeApplied = true

      // Log the promo code usage instead of storing in database
      console.log(
        `Promo code ${promoCode} with ${promoDiscount}% discount applied for user ${userId} on ${plan.name} plan`,
      )
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${plan.name} Plan - ${duration} month${duration > 1 ? "s" : ""}`,
              description: promoCodeApplied
                ? `Applied discount: ${promoDiscount}% off with code ${promoCode}`
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
        planName: plan.id, // Store plan ID instead of name for consistency
        tokens: plan.tokens.toString(), // Store the correct token amount based on plan
        referrerId: referrerUserId || "",
        referralUseId: referralUseId || "",
        promoCode: promoCode || "",
        promoDiscount: promoDiscount ? promoDiscount.toString() : "",
      },
    })

    return { sessionId: session.id }
  }

  static async getSubscriptionStatus(userId: string): Promise<{
    plan: SubscriptionPlanType | "FREE" | null
    status: string | null
    endDate: Date | null
  }> {
    const userSubscription = await prisma.userSubscription.findUnique({
      where: { userId },
    })

    if (!userSubscription) {
      return {
        plan: "FREE",
        status: null,
        endDate: null,
      }
    }

    return {
      plan: userSubscription.planId as SubscriptionPlanType,
      status: userSubscription.status,
      endDate: userSubscription.currentPeriodEnd,
    }
  }

  static async getTokensUsed(userId: string): Promise<{ used: number; total: number }> {
    try {
      // Get user's current credits directly from the user table
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true,creditsUsed: true }, // Assuming creditsUsed is the field for used tokens
      })

      // Get the user's current plan to determine token limit
      const { plan } = await this.getSubscriptionStatus(userId)
     
      const totalToken = user?.credits || 0
      const tokensUsed =user?.creditsUsed||0; // Ensure used tokens are not negative

      return {
        used: tokensUsed,
        total: totalToken,
      }
    } catch (error) {
      console.error("Error getting token usage:", error)
      return { used: 0, total: 0 }
    }
  }

  static async cancelSubscription(userId: string): Promise<boolean> {
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

      await prisma.userSubscription.update({
        where: { userId },
        data: {
          status: "CANCELED",
        },
      })

      return true
    } catch (error) {
      console.error("Error canceling subscription:", error)
      throw new Error("Failed to cancel subscription")
    }
  }

  static async resumeSubscription(userId: string): Promise<boolean> {
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

      await prisma.userSubscription.update({
        where: { userId },
        data: {
          status: "ACTIVE",
        },
      })

      return true
    } catch (error) {
      console.error("Error resuming subscription:", error)
      throw new Error("Failed to resume subscription")
    }
  }

  static async getBillingHistory(userId: string): Promise<any[]> {
    const userSubscription = await prisma.userSubscription.findUnique({
      where: { userId },
    })

    if (!userSubscription || !userSubscription.stripeCustomerId) {
      return []
    }

    try {
      // Get invoices from Stripe
      const invoices = await stripe.invoices.list({
        customer: userSubscription.stripeCustomerId,
        limit: 24, // Last 2 years of monthly invoices
      })

      // Get charges from Stripe (for one-time payments like token purchases)
      const charges = await stripe.charges.list({
        customer: userSubscription.stripeCustomerId,
        limit: 100,
      })

      // Format invoices
      const formattedInvoices = invoices.data.map((invoice) => ({
        id: invoice.id,
        amount: invoice.amount_paid,
        status: invoice.status,
        date: new Date(invoice.created * 1000).toISOString(),
        invoiceUrl: invoice.hosted_invoice_url,
        receiptUrl: invoice.receipt_number ? `https://dashboard.stripe.com/receipts/${invoice.receipt_number}` : null,
        description: invoice.description || `Invoice #${invoice.number}`,
      }))

      // Format charges
      const formattedCharges = charges.data.map((charge) => ({
        id: charge.id,
        amount: charge.amount,
        status: charge.status,
        date: new Date(charge.created * 1000).toISOString(),
        receiptUrl: charge.receipt_url,
        description: charge.description || "One-time payment",
      }))

      // Combine and sort by date (newest first)
      return [...formattedInvoices, ...formattedCharges].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
    } catch (error) {
      console.error("Error fetching billing history:", error)
      throw new Error("Failed to fetch billing history")
    }
  }

  static async getPaymentMethods(userId: string): Promise<any[]> {
    const userSubscription = await prisma.userSubscription.findUnique({
      where: { userId },
    })

    if (!userSubscription || !userSubscription.stripeCustomerId) {
      return []
    }

    try {
      const customer = (await stripe.customers.retrieve(userSubscription.stripeCustomerId, {
        expand: ["default_source", "sources"],
      })) as Stripe.Customer

      const paymentMethods = await stripe.paymentMethods.list({
        customer: userSubscription.stripeCustomerId,
        type: "card",
      })

      // Get the default payment method
      const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method as string | null

      return paymentMethods.data.map((method) => ({
        id: method.id,
        brand: method.card?.brand,
        last4: method.card?.last4,
        exp_month: method.card?.exp_month,
        exp_year: method.card?.exp_year,
        isDefault: method.id === defaultPaymentMethodId,
      }))
    } catch (error) {
      console.error("Error fetching payment methods:", error)
      throw new Error("Failed to fetch payment methods")
    }
  }

  static async validateReferralCode(referralCode: string): Promise<boolean> {
    return Promise.resolve(true)
  }

  // New method to validate promo codes
  static async validatePromoCode(promoCode: string): Promise<{ valid: boolean; discountPercentage: number }> {
    // Hardcoded valid promo codes
    const validPromoCodes: Record<string, number> = {
      AILAUNCH20: 20,
      WELCOME10: 10,
      SPRING2025: 15,
    }

    // Check if the provided code exists in our valid codes
    if (promoCode in validPromoCodes) {
      return {
        valid: true,
        discountPercentage: validPromoCodes[promoCode],
      }
    }

    return { valid: false, discountPercentage: 0 }
  }

  static async verifyPaymentStatus(sessionId: string): Promise<{
    status: "succeeded" | "pending" | "failed" | "canceled"
    subscription?: any
  }> {
    if (!sessionId) {
      return { status: "failed" }
    }

    try {
      // Only expand subscription, not payment_intent
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription"],
      })

      // Check status without relying on payment_intent
      if (session.status === "complete" && session.payment_status === "paid") {
        // Add credits for successful payment
        if (session.metadata?.userId && session.metadata?.tokens) {
          const userId = session.metadata.userId
          const tokens = Number.parseInt(session.metadata.tokens, 10)

          // Find the plan to get the correct token amount
          const planId = session.metadata.planName
          const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)

          // Use the plan tokens if available, otherwise fall back to metadata tokens
          const tokensToAdd = plan ? plan.tokens : tokens

          const user = await prisma.user.findUnique({
            where: { id: userId },
          })

          if (user) {
            console.log(`Adding ${tokensToAdd} tokens to user ${userId} from plan ${planId}`)

            // Update user credits with the correct token amount
            await prisma.user.update({
              where: { id: userId },
              data: {
                credits: user.credits + tokensToAdd,
              },
            })

            // Log the token addition with the correct amount
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

