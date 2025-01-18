import { prisma } from '@/lib/db';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
});

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No stripe-signature header found' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe webhook secret is not configured' },
        { status: 500 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${errorMessage}` },
        { status: 400 }
      );
    }

    try {
      await processStripeEvent(event);
      return NextResponse.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      // Return 200 to acknowledge receipt of the webhook
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Fatal error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionChange(event.data.object as Stripe.Subscription);
      break;
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'invoice.payment_failed':
      await handleFailedPayment(event.data.object as Stripe.Invoice);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
  if (!subscription.id || typeof subscription.customer !== 'string') {
    throw new Error('Invalid subscription data');
  }

  const userSubscription = await prisma.userSubscription.findFirst({
    where: { stripeCustomerId: subscription.customer },
    select: { userId: true },
  });

  if (!userSubscription) {
    throw new Error(`User subscription not found for customer: ${subscription.customer}`);
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (!session.customer || !session.metadata?.userId || !session.metadata?.tokens) {
    throw new Error('Missing required session data');
  }

  const tokens = parseInt(session.metadata.tokens, 10);
  if (isNaN(tokens)) {
    throw new Error('Invalid tokens value');
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.metadata!.userId },
      data: { credits: { increment: tokens } },
    });

    if (session.subscription && typeof session.customer === 'string') {
      await tx.userSubscription.updateMany({
        where: {
          userId: session.metadata!.userId,
          stripeCustomerId: session.customer,
        },
        data: { status: 'ACTIVE' },
      });
    }
  });
}

async function handleFailedPayment(invoice: Stripe.Invoice): Promise<void> {
  if (!invoice.subscription || typeof invoice.subscription !== 'string') {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const userSubscription = await prisma.userSubscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    select: { userId: true },
  });

  if (!userSubscription) {
    throw new Error(`User subscription not found for: ${subscription.id}`);
  }

  await prisma.userSubscription.update({
    where: { userId: userSubscription.userId },
    data: { status: 'PAST_DUE' },
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

