import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/db"
import { SUBSCRIPTION_PLANS } from "@/app/dashboard/subscription/components/subscription-plans"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-10-28.acacia",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const sig = req.headers.get("stripe-signature")!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err}`)
      return NextResponse.json({ message: `Webhook Error: ${err}` }, { status: 400 })
    }

    // Handle the event
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session
          await handleCheckoutSessionCompleted(session)
          break
        }
        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice
          await handleInvoicePaid(invoice)
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
        default:
          console.log(`Unhandled event type: ${event.type}`)
      }
    } catch (error) {
      console.error(`Error processing webhook event ${event.type}:`, error)
      // Don't return an error response, as Stripe will retry the webhook
      // Instead, log the error and return a 200 response to acknowledge receipt
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ message: "Webhook handler failed", error: String(error) }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Process the checkout session
  if (!session.metadata?.userId) {
    console.error("No user ID in session metadata")
    return
  }

  const userId = session.metadata.userId
  const planId = session.metadata.planName

  // Find the plan to get the correct token amount
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
  const tokensToAdd = plan ? plan.tokens : Number.parseInt(session.metadata.tokens || "0", 10)

  try {
    // If this is a subscription checkout
    if (session.mode === "subscription" && session.subscription) {
      let subscription

      try {
        subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      } catch (stripeError) {
        console.error("Error retrieving subscription from Stripe:", stripeError)
        // Continue with the session data we have
        subscription = {
          id: session.subscription,
          customer: session.customer,
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
        }
      }

      // Update the user's subscription in the database
      await prisma.userSubscription.upsert({
        where: { userId },
        update: {
          planId: planId || "FREE",
          status: "ACTIVE",
          stripeSubscriptionId: typeof subscription.id === "string" ? subscription.id : null,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
        create: {
          userId,
          planId: planId || "FREE",
          status: "ACTIVE",
          stripeSubscriptionId: typeof subscription.id === "string" ? subscription.id : null,
          stripeCustomerId: subscription.customer as string,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      })

      // Add tokens to the user's account
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (user) {
        console.log(`Adding ${tokensToAdd} tokens to user ${userId} from plan ${planId}`)

        await prisma.user.update({
          where: { id: userId },
          data: {
            credits: user.credits + tokensToAdd,
          },
        })

        // Log the token addition
        await prisma.tokenTransaction.create({
          data: {
            userId,
            amount: tokensToAdd,
            type: "SUBSCRIPTION",
            description: `Added ${tokensToAdd} tokens from ${planId || "subscription"} plan`,
          },
        })
      }

      // Process referral if applicable
      if (session.metadata.referralUseId || session.metadata.referralCode) {
        await processReferralBenefits(session)
      }
    }
  } catch (error) {
    console.error("Error processing checkout session:", error)
  }
}

async function processReferralBenefits(session: any) {
  try {
    const userId = session.metadata.userId
    const referralUseId = session.metadata.referralUseId
    const referralCode = session.metadata.referralCode

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
          description: `Referral bonus for user ${userId} subscribing to ${session.metadata.planName || "subscription"} plan`,
        },
      })
    }

    console.log(`Successfully applied referral benefits for user ${userId}`)
  } catch (error) {
    console.error("Error processing referral benefits:", error)
    // Don't throw error to avoid disrupting the webhook processing
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription || !invoice.customer) {
    return
  }

  try {
    // Find the user by Stripe customer ID
    const userSubscription = await prisma.userSubscription.findFirst({
      where: { stripeCustomerId: invoice.customer as string },
    })

    if (!userSubscription) {
      console.error(`No user found with Stripe customer ID: ${invoice.customer}`)
      return
    }

    // Update subscription status to ACTIVE
    await prisma.userSubscription.update({
      where: { id: userSubscription.id },
      data: { status: "ACTIVE" },
    })

    // Get subscription details to check if this is a renewal
    let subscription

    try {
      subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    } catch (stripeError) {
      console.error("Error retrieving subscription from Stripe:", stripeError)
      return
    }

    // If this is a renewal (not the first invoice), add tokens again
    if (subscription.metadata.planName) {
      const planId = subscription.metadata.planName
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)

      if (plan) {
        const user = await prisma.user.findUnique({
          where: { id: userSubscription.userId },
        })

        if (user) {
          console.log(`Adding ${plan.tokens} tokens to user ${userSubscription.userId} from plan ${planId} renewal`)

          await prisma.user.update({
            where: { id: userSubscription.userId },
            data: {
              credits: user.credits + plan.tokens,
            },
          })

          // Log the token addition for renewal
          await prisma.tokenTransaction.create({
            data: {
              userId: userSubscription.userId,
              amount: plan.tokens,
              type: "RENEWAL",
              description: `Added ${plan.tokens} tokens from ${planId} plan renewal`,
            },
          })
        }
      }
    }
  } catch (error) {
    console.error("Error processing invoice paid:", error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    // Find the user by Stripe subscription ID
    const userSubscription = await prisma.userSubscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    })

    if (!userSubscription) {
      console.error(`No user found with Stripe subscription ID: ${subscription.id}`)
      return
    }

    // Update subscription status based on Stripe status
    let status: string
    switch (subscription.status) {
      case "active":
        status = "ACTIVE"
        break
      case "past_due":
        status = "PAST_DUE"
        break
      case "canceled":
        status = "CANCELED"
        break
      case "unpaid":
        status = "PAST_DUE"
        break
      default:
        status = "INACTIVE"
    }

    await prisma.userSubscription.update({
      where: { id: userSubscription.id },
      data: {
        status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    })
  } catch (error) {
    console.error("Error processing subscription updated:", error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Find the user by Stripe subscription ID
    const userSubscription = await prisma.userSubscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    })

    if (!userSubscription) {
      console.error(`No user found with Stripe subscription ID: ${subscription.id}`)
      return
    }

    // Update subscription status to CANCELED
    await prisma.userSubscription.update({
      where: { id: userSubscription.id },
      data: { status: "CANCELED" },
    })
  } catch (error) {
    console.error("Error processing subscription deleted:", error)
  }
}
