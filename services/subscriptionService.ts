import { SUBSCRIPTION_PLANS, type SubscriptionPlanType } from "@/config/subscriptionPlans"
import { prisma } from "@/lib/db"

import Stripe from "stripe"


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-10-28.acacia", // Update to the latest stable version
})

export class SubscriptionService {
  static async createCheckoutSession(userId: string, planName: string, duration: number) {
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
      success_url: `${process.env.NEXT_PUBLIC_URL||'https://courseai.dev'}/dashboard/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL||'https://courseai.dev'}/dashboard/cancelled`,
      metadata: {
        userId,
        planName,
        tokens: plan.tokens.toString(),
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
    console.log(userSubscription);
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
}

