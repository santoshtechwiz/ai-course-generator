export enum PlanType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM'
}
export const SUBSCRIPTION_PLANS = [
  {
    name: PlanType.FREE,
    options: [
      { duration: 1, price: 0 }
    ],
    tokens: 3,
    features: ['3 credits per month', 'Basic access', 'Community support']
  },
  {
    name: PlanType.BASIC,
    options: [
      { duration: 1, price: 5 }
    ],
    tokens: 10,
    features: ['10 credits per month', 'Basic support', 'Access to standard features']
  },
  {
    name: PlanType.PREMIUM,
    options: [
      { duration: 6, price: 25 }
    ],
    tokens: 50,
    features: ['50 credits for 6 months', 'Priority support', 'Access to all features', 'Premium content access']
  }
];

export const FAQ_ITEMS = [
  {
    question: "What are credits used for?",
    answer: "Credits are used to access premium features and content on our platform. Each credit represents a unit of access to our services."
  },
  {
    question: "How long are my credits valid?",
    answer: "Credit validity depends on your plan - Free and Basic plan credits are valid for 1 month, while Premium plan credits are valid for 6 months."
  },
  {
    question: "Can I upgrade my plan?",
    answer: "Yes, you can upgrade your plan at any time. Your new benefits will be available immediately after upgrading."
  },
  {
    question: "Is there a refund policy?",
    answer: "We offer a 14-day money-back guarantee for paid plans. If you're not satisfied, you can request a full refund within this period."
  }
];

export type SubscriptionPlanType = keyof typeof SUBSCRIPTION_PLANS;
  
export const SUBSCRIPTION_STATUSES = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PAST_DUE: 'PAST_DUE',
  CANCELED: 'CANCELED',
} as const;

export type SubscriptionStatusType = keyof typeof SUBSCRIPTION_STATUSES;

