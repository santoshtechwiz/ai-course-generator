export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,

  successUrl: `${process.env.NEXT_PUBLIC_URL}/success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_URL}/canceled`,
}
