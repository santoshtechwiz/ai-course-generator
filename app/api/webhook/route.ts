


import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-10-28.acacia",
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const payload = await req.text()
  const signature = req.headers.get("stripe-signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
  }

  try {
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        // Handle subscription checkout
        if (session.mode === "subscription" && session.metadata?.userId) {
          await handleSubscriptionCheckout(session)
        }

        // Handle token purchase
        if (session.mode === "payment" && session.metadata?.type === "token_purchase") {
          await handleTokenPurchase(session)
        }

        break
      }
      case "identity.verification_session.canceled": {
        const verificationSession = event.data.object as Stripe.Identity.VerificationSession
        const userId = verificationSession.metadata?.userId

        if (userId) {
          await handleSubscriptionCanceled(userId)
        }
        break


      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Error processing webhook" }, { status: 500 })
  }
}

async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const planName = session.metadata?.planName
  const tokens = Number.parseInt(session.metadata?.tokens || "0")
  const referrerId = session.metadata?.referrerId

  if (!userId || !planName) return

  // Get subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

  // Update user's subscription
  await prisma.userSubscription.update({
    where: { userId },
    data: {
      planId: planName,
      status: "ACTIVE",
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  })

  // Add tokens to user's account
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (user) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: user.credits + tokens,
      },
    })

    // Log the token addition
    await prisma.tokenTransaction.create({
      data: {
        userId,
        amount: tokens,
        type: "SUBSCRIPTION",
        description: `Added ${tokens} tokens from ${planName} plan subscription`,
      },
    })
  }

  // Process referral if applicable
  if (referrerId && referrerId !== "") {
    await processReferralReward(referrerId, userId, planName)
  }
}

async function handleTokenPurchase(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const tokenAmount = Number.parseInt(session.metadata?.tokenAmount || "0")

  if (!userId || !tokenAmount) return

  // Add tokens to user's account
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (user) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: user.credits + tokenAmount,
      },
    })

    // Log the token addition
    await prisma.tokenTransaction.create({
      data: {
        userId,
        amount: tokenAmount,
        type: "PURCHASE",
        description: `Purchased ${tokenAmount} tokens`,
      },
    })
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Find the user with this subscription
  const userSubscription = await prisma.userSubscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  })

  if (!userSubscription) return

  // Update subscription details
  await prisma.userSubscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status:
        subscription.status === "active"
          ? "ACTIVE"
          : subscription.status === "past_due"
            ? "PAST_DUE"
            : subscription.status === "canceled"
              ? "CANCELED"
              : subscription.status === "unpaid"
                ? "INACTIVE"
                : "PENDING",
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Find the user with this subscription
  const userSubscription = await prisma.userSubscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  })

  if (!userSubscription) return

  // Update subscription status
  await prisma.userSubscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: "INACTIVE",
    },
  })
}
async function handleSubscriptionCanceled(subscriptionId: string) {
  const userSubscription = await prisma.userSubscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!userSubscription) return;

  await prisma.userSubscription.delete({
    where: { id: subscriptionId },
  });
  
}
async function processReferralReward(referrerId: string, referredId: string, planName: string) {
  try {
    // Find the referral record
    const referral = await prisma.userReferral.findUnique({
      where: { userId: referrerId },
    })

    if (!referral) return

    // Find or create the referral use record
    const referralUse = await prisma.userReferralUse.findFirst({
      where: {
        referrerId,
        referredId,
      },
    })

    if (referralUse) {
      // Update existing referral use
      await prisma.userReferralUse.update({
        where: { id: referralUse.id },
        data: {
          status: "COMPLETED",
          planId: planName,
          completedAt: new Date(),
        },
      })
    } else {
      // Create new referral use
      await prisma.userReferralUse.create({
        data: {
          referrerId,
          referredId,
          referralId: referral.id,
          status: "COMPLETED",
          planId: planName,
          completedAt: new Date(),
        },
      })
    }

    // Add tokens to referrer (10 tokens)
    const referrer = await prisma.user.findUnique({
      where: { id: referrerId },
    })

    if (referrer) {
      await prisma.user.update({
        where: { id: referrerId },
        data: {
          credits: referrer.credits + 10,
        },
      })

      // Log the token addition
      await prisma.tokenTransaction.create({
        data: {
          userId: referrerId,
          amount: 10,
          type: "REFERRAL",
          description: `Earned 10 tokens from referral`,
        },
      })
    }

    // Add bonus tokens to referred user (5 tokens)
    const referred = await prisma.user.findUnique({
      where: { id: referredId },
    })

    if (referred) {
      await prisma.user.update({
        where: { id: referredId },
        data: {
          credits: referred.credits + 5,
        },
      })

      // Log the token addition
      await prisma.tokenTransaction.create({
        data: {
          userId: referredId,
          amount: 5,
          type: "REFERRAL_BONUS",
          description: `Received 5 bonus tokens from referral`,
        },
      })
    }
  } catch (error) {
    console.error("Error processing referral reward:", error)
  }
}

