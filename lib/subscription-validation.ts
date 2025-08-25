import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { SubscriptionService } from "@/app/dashboard/subscription/services/subscription-service";
import { SubscriptionPlanType } from "@/app/types/subscription";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  subscription?: {
    plan: SubscriptionPlanType;
    isActive: boolean;
    hasCredits: boolean;
  };
}

/**
 * Server-side subscription validation utility
 * Used in API routes to validate subscription status before performing protected actions
 */
export async function validateSubscriptionServer(
  userId: string,
  options: {
    requireSubscription?: boolean;
    requireCredits?: boolean;
    requiredPlan?: SubscriptionPlanType;
  } = {}
): Promise<ValidationResult> {
  const {
    requireSubscription = true,
    requireCredits = true,
    requiredPlan = "FREE"
  } = options;

  try {
    const subscriptionData = await SubscriptionService.getUserSubscriptionData(userId);
    
    if (!subscriptionData) {
      return {
        isValid: false,
        error: "No subscription data found"
      };
    }

    const { isActive, userType: plan, credits, creditsUsed } = subscriptionData;
    const hasCredits = credits > creditsUsed;

    // Plan hierarchy for validation
    const planHierarchy: Record<SubscriptionPlanType, number> = {
      "FREE": 0,
      "BASIC": 1,
      "PREMIUM": 2,
      "ULTIMATE": 3
    };

    const currentPlanLevel = planHierarchy[plan] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan];

    const subscription = {
      plan,
      isActive,
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
      error: "Failed to validate subscription"
    };
  }
}

/**
 * Route handler wrapper for subscription validation
 */
export function withSubscriptionValidation(
  handler: Function,
  options: {
    requireSubscription?: boolean;
    requireCredits?: boolean;
    requiredPlan?: SubscriptionPlanType;
  } = {}
) {
  return async function(req: Request) {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
      }

      const validation = await validateSubscriptionServer(session.user.id, options);

      if (!validation.isValid) {
        return new Response(validation.error, { 
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
          statusText: validation.error
        });
      }

      // Call the original handler with validation result
      return handler(req, validation);
    } catch (error) {
      console.error("API route error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  };
}
