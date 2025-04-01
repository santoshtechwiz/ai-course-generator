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
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

      // Update the user's subscription in the database
      await prisma.userSubscription.upsert({
        where: { userId },
        update: {
          planId: planId || "FREE",
          status: "ACTIVE",
          stripeSubscriptionId: subscription.id,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
        create: {
          userId,
          planId: planId || "FREE",
          status: "ACTIVE",
          stripeSubscriptionId: subscription.id,
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
      if (session.metadata.referralUseId) {
        await prisma.userReferralUse.update({
          where: { id: session.metadata.referralUseId },
          data: { status: "COMPLETED" },
        })

        // Add bonus tokens to the referrer
        if (session.metadata.referrerId) {
          const referrerUser = await prisma.user.findUnique({
            where: { id: session.metadata.referrerId },
          })

          if (referrerUser) {
            const REFERRAL_BONUS_TOKENS = 50 // Define your referral bonus amount

            await prisma.user.update({
              where: { id: session.metadata.referrerId },
              data: {
                credits: referrerUser.credits + REFERRAL_BONUS_TOKENS,
              },
            })

            // Log the referral bonus
            await prisma.tokenTransaction.create({
              data: {
                userId: session.metadata.referrerId,
                amount: REFERRAL_BONUS_TOKENS,
                type: "REFERRAL",
                description: `Referral bonus for user ${userId} subscribing to ${planId || "subscription"} plan`,
              },
            })
          }
        }
      }
    }
  } catch (error) {
    console.error("Error processing checkout session:", error)
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
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)

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

