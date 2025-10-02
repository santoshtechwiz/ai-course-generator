import { SubscriptionData, SubscriptionPlanType } from '@/types/subscription'

interface ValidationResult {
  isValid: boolean
  error?: string
  subscription: {
    plan: SubscriptionPlanType
    isActive: boolean
    hasCredits: boolean
  }
}

export const validateSubscription = (
  subscriptionData: SubscriptionData,
  options: {
    requiredPlan?: SubscriptionPlanType
    requireSubscription?: boolean
    requireCredits?: boolean
  } = {}
): ValidationResult => {
  try {
    const {
      requiredPlan = 'FREE',
      requireSubscription = false,
      requireCredits = false
    } = options

    const { isSubscribed: isActive, subscriptionPlan: plan, credits, tokensUsed } = subscriptionData;
    const hasCredits = credits > tokensUsed;

    // Plan hierarchy for validation  
    const planHierarchy: Record<SubscriptionPlanType, number> = {
      "FREE": 0,
      "BASIC": 1,
      "PREMIUM": 2,
      "ULTIMATE": 3
    };

    const currentPlanLevel = planHierarchy[plan as SubscriptionPlanType] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan];

    const subscription = {
      plan: plan as SubscriptionPlanType,
      isActive: isActive || false,
      hasCredits
    };

    // Validate subscription requirements
    if (requireSubscription && !isActive) {
      return {
        isValid: false,
        error: "Subscription is not active",
        subscription
      };
    }

    // Validate plan level
    if (currentPlanLevel < requiredPlanLevel) {
      return {
        isValid: false,
        error: `${requiredPlan} plan or higher required`,
        subscription
      };
    }

    // Validate credits
    if (requireCredits && !hasCredits) {
      return {
        isValid: false,
        error: "Insufficient credits",
        subscription
      };
    }

    return {
      isValid: true,
      subscription
    };

  } catch (error) {
    console.error("Subscription validation error:", error);
    return {
      isValid: false,
      error: "Validation failed",
      subscription: {
        plan: 'FREE' as SubscriptionPlanType,
        isActive: false,
        hasCredits: false
      }
    };
  }
}

export default validateSubscription;