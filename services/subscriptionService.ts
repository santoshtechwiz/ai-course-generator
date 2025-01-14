import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from '@/config/subscriptionPlans'
import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia', // Update to the latest stable version
})

export class SubscriptionService {
  static async createCheckoutSession(userId: string, plan: SubscriptionPlanType): Promise<{ sessionId: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscriptions: true },
    })
    if (!user) throw new Error('User not found')

    if (user.subscriptions && user.subscriptions.status === 'ACTIVE') {
      throw new Error('User already has an active subscription')
    }

    const planDetails = SUBSCRIPTION_PLANS.find(p => p.name === plan)
    if (!planDetails) throw new Error('Invalid plan')

    let stripeCustomer = user.subscriptions?.stripeCustomerId
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
          planId: planDetails.name,
          status: 'PENDING',
          stripeCustomerId: stripeCustomer,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
        },
      })
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planDetails.name,
            },
            unit_amount: planDetails.options[0].price * 100,
            recurring: {
              interval: planDetails.options[0].duration === 1 ? 'month' : 'year',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/cancelled`,
      metadata: {
        userId: user.id,
        planName: plan,
        duration: planDetails.options[0].duration.toString(),
        tokens: planDetails.tokens.toString(),
      },
    })

    return { sessionId: session.id }
  }

  static async handleSubscriptionCreated(sessionId: string): Promise<void> {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    if (session.status !== 'complete') {
      throw new Error('Payment not completed')
    }

    const userId = session.metadata?.userId
    const plan = session.metadata?.planName as SubscriptionPlanType

    if (!userId || !plan) {
      throw new Error('Invalid session metadata')
    }

    const subscription = session.subscription as Stripe.Subscription
    const planDetails = SUBSCRIPTION_PLANS.find(p => p.name === plan)
    if (!planDetails) throw new Error('Invalid plan')

    await prisma.$transaction(async (prisma) => {
      await prisma.userSubscription.upsert({
        where: { userId },
        update: {
          planId: planDetails.name,
          status: 'ACTIVE',
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          stripeSubscriptionId: subscription.id,
        },
        create: {
          userId,
          planId: planDetails.name,
          status: 'ACTIVE',
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: session.customer as string,
        },
      })

      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: { increment: planDetails.tokens },
          userType: planDetails.name,
        },
      })
    })
  }

  static async cancelSubscription(userId: string): Promise<void> {
    const userSubscription = await prisma.userSubscription.findUnique({
      where: { userId },
    })
    if (!userSubscription || !userSubscription.stripeSubscriptionId) {
      throw new Error('No active subscription found')
    }

    await stripe.subscriptions.cancel(userSubscription.stripeSubscriptionId)

    await prisma.userSubscription.update({
      where: { userId },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: true,
      },
    })
  }

  static async getSubscriptionStatus(userId: string): Promise<{
    plan: SubscriptionPlanType | 'FREE' | null;
    status: string | null;
    endDate: Date | null;
  }> {
    const userSubscription = await prisma.userSubscription.findUnique({
      where: { userId },
    })

    if (!userSubscription) {
      return {
        plan: 'FREE',
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

