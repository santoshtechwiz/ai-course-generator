import { prisma } from '@/lib/db';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
});

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const headersList = headers()
    const signature = (await headersList).get('stripe-signature')

    if (!signature) {
      console.error('No stripe-signature header found')
      return NextResponse.json(
        { error: 'No signature header found' },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('Stripe webhook secret is not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    console.log('Verifying webhook signature...')
    console.log('Signature:', signature)
    console.log('Body length:', body.length)

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      // Log more details about the verification failure
      if (err instanceof Error) {
        console.error('Error message:', err.message)
        console.error('Error name:', err.name)
      }
      return NextResponse.json(
        { error: `Webhook Error: ${(err as Error).message}` },
        { status: 400 }
      )
    }

    console.log('Processing event:', event.type)

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription
          await handleSubscriptionChange(subscription)
          break
        }
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session
          await handleCheckoutCompleted(session)
          break
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice
          await handleFailedPayment(invoice)
          break
        }
        default:
          console.log(`Unhandled event type ${event.type}`)
      }

      return NextResponse.json({ received: true })
    } catch (error) {
      // console.error('Error processing webhook:', error)
      // Return 200 to acknowledge receipt of the webhook
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('Fatal error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  if (!subscription.id) {
    console.error('Subscription ID is missing');
    return;
  }

  const customerId = subscription.customer as string;

  const userSubscription = await prisma.userSubscription.findFirst({
    where: { stripeCustomerId: customerId },
    include: { user: true },
  });

  if (!userSubscription) {
    console.error('User subscription not found for customer:', customerId);
    return;
  }

  await prisma.userSubscription.update({
    where: { userId: userSubscription.userId },
    data: {
      status: subscription.status,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!session.customer || !session.metadata?.userId || !session.metadata?.tokens) {
    console.error('Missing required session data');
    return;
  }

  const tokens = parseInt(session.metadata.tokens);

  await prisma.$transaction(async (prisma) => {
    // Update user credits
    await prisma.user.update({
      where: { id: session.metadata!.userId },
      data: {
        credits: { increment: tokens },
      },
    });

    // Update subscription status if it exists
    if (session.subscription) {
      await prisma.userSubscription.updateMany({
        where: {
          userId: session.metadata!.userId,
          stripeCustomerId: session.customer as string,
        },
        data: {
          status: 'ACTIVE',
        },
      });
    }
  });
}

async function handleFailedPayment(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

  const userSubscription = await prisma.userSubscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!userSubscription) {
    console.error('User subscription not found for:', subscription.id);
    return;
  }

  await prisma.userSubscription.update({
    where: { userId: userSubscription.userId },
    data: {
      status: 'PAST_DUE',
    },
  });
}
export const config = {
  api: {
    bodyParser: false,
  },
}
