export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  plans: [
    {
      "name": "price_12345ABCDE",
      "priceId": "price_12345ABCDE",
      "description": "Access to all features",
      "unitAmount": 2000,
      "currency": "usd",
      "type": "subscription"
    },
    {
      "name": "price_67890FGHIJ",
      "priceId": "price_67890FGHIJ",
      "description": "Purchase 100 tokens",
      "unitAmount": 500,
      "currency": "usd",
      "type": "one-time"
    }
  ]
  ,
  successUrl: `${process.env.NEXT_PUBLIC_URL}/success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_URL}/canceled`,
};

export type Plan = typeof stripeConfig.plans[number];

