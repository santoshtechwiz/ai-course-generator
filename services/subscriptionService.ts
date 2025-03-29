import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanType,
} from "@/app/dashboard/subscription/components/subscription.config"
import { prisma } from "@/lib/db"
import Stripe from "stripe"

const stripe = new Stripe(
  "***REMOVED***",
  {
    apiVersion: "2024-10-28.acacia",
  },
)

export class SubscriptionService {
  static async activateFreePlan(userId: string): Promise<{ success: boolean }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })

    if (!user) throw new Error("User not found")

    // Check if user already has an active subscription
    if (user.subscription && user.subscription.status === "ACTIVE" && user.subscription.planId !== "FREE") {
      throw new Error("User already has an active paid subscription")
    }

    const freePlan = SUBSCRIPTION_PLANS.find((p) => p.id === "FREE")
    if (!freePlan) throw new Error("Free plan not found")

    // Set up subscription period dates
    const currentPeriodStart = new Date()
    const currentPeriodEnd = new Date()
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 100) // Free plan doesn't expire

    // Create or update the user's subscription
    await prisma.userSubscription.upsert({
      where: { userId },
      update: {
        planId: "FREE",
        status: "ACTIVE",
        currentPeriodStart,
        currentPeriodEnd,
      },
      create: {
        userId,
        planId: "FREE",
        status: "ACTIVE",
        currentPeriodStart,
        currentPeriodEnd,
      },
    })

    // Add free tokens to the user's account if they don't already have them
    if (user.credits < freePlan.tokens) {
      const tokensToAdd = freePlan.tokens - user.credits

      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: freePlan.tokens,
        },
      })

      // Log the token addition
      await prisma.tokenTransaction.create({
        data: {
          userId,
          amount: tokensToAdd,
          type: "SUBSCRIPTION",
          description: `Added ${tokensToAdd} tokens from FREE plan activation`,
        },
      })
    }

    return { success: true }
  }

  static async createCheckoutSession(userId: string, planName: string, duration: number, referralCode?: string) {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.name === planName)
    if (!plan) {
      throw new Error("Invalid plan name")
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })

    if (!user) throw new Error("User not found")

    if (user.subscription && user.subscription.status === "ACTIVE") {
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

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${plan.name} Plan - ${duration} month${duration > 1 ? "s" : ""}`,
            },
            unit_amount: Math.round(option.price * 100),
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
      cancel_url: `${process.env.NEXT_PUBLIC_URL || "https://courseai.io"}/dashboard/cancelled`,
      metadata: {
        userId,
        planName,
        tokens: plan.tokens.toString(),
        referrerId: referrerUserId || "",
        referralUseId: referralUseId || "",
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

  static async getTokensUsed(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      throw new Error("User not found")
    }
    return user.credits || 0
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
  static validateReferralCode(referralCode: string): Promise<boolean> {
     return Promise.resolve(true);
  }
}

