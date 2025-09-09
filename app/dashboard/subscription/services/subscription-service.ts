import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { getPaymentGateway } from "./payment-gateway-factory";
import { PaymentGateway } from "./payment-gateway-interface";
import { PromoValidationResult, SubscriptionPlanType, SubscriptionStatusType } from "@/app/types/subscription";
import { VALID_PROMO_CODES } from "../components/subscription-plans";

export class SubscriptionService {

  /**
   * Clear cache for a specific user
   */
  static clearUserCache(userId: string): void {
    if (!userId) return;
    logger.debug(`Cleared cache for user ${userId}`);
  }

  /**
   * Activate the free plan for a user
   */
  static async activateFreePlan(
    userId: string,
  ): Promise<{ success: boolean; message?: string; alreadySubscribed?: boolean }> {
    try {
      // Input validation
      if (!userId || typeof userId !== 'string' || userId.length < 10) {
        return { success: false, message: "Invalid user ID provided" };
      }

      // Additional security check - validate user ID format
      if (!/^[a-zA-Z0-9-_]+$/.test(userId)) {
        return { success: false, message: "Invalid user ID format" };
      }

      logger.info(`Activating free plan for user ${userId}`);

      return await prisma.$transaction(async (tx) => {
        // Check if user already has an active free subscription
        const existingSubscription = await tx.userSubscription.findUnique({
          where: { userId },
        });

        if (existingSubscription?.planId === "FREE" && existingSubscription.status === "ACTIVE") {
          return { success: true, message: "Already on free plan", alreadySubscribed: true };
        }

        // Check if user already received free tokens
        const existingFreeTokens = await tx.tokenTransaction.findFirst({
          where: {
            userId,
            type: "SUBSCRIPTION",
            description: "Added 5 tokens for free plan",
          },
        });

        const tokensToAdd = existingFreeTokens ? 0 : 5;
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);

        // Update subscription
        await tx.userSubscription.upsert({
          where: { userId },
          update: {
            planId: "FREE",
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd,
          },
          create: {
            userId,
            planId: "FREE",
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd,
          },
        });

        // Update user with consistent data
        await tx.user.update({
          where: { id: userId },
          data: {
            userType: "FREE",
            ...(tokensToAdd > 0 && {
              credits: { increment: tokensToAdd }
            })
          },
        });

        // Add token transaction if applicable
        if (tokensToAdd > 0) {
          await tx.tokenTransaction.create({
            data: {
              userId,
              credits: tokensToAdd,
              amount: 0,
              type: "SUBSCRIPTION",
              description: "Added 5 tokens for free plan",
            },
          });
        }

        logger.info(`Successfully activated free plan for user ${userId}`, { tokensAdded: tokensToAdd });
        return { success: true, message: "Free plan activated successfully" };
      });
    } catch (error: any) {
      logger.error(`Error activating free plan for user ${userId}:`, error);
      return { success: false, message: "Failed to activate free plan" };
    }
  }

  /**
   * Activate trial for a user (not managed by Stripe)
   */
  static async activateTrial(
    userId: string,
    planId: SubscriptionPlanType = "BASIC"
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Input validation
      if (!userId || typeof userId !== 'string' || userId.length < 10) {
        return { success: false, message: "Invalid user ID provided" };
      }

      // Validate plan ID
      const validPlans: SubscriptionPlanType[] = ['BASIC', 'PREMIUM', 'ULTIMATE'];
      if (!validPlans.includes(planId)) {
        return { success: false, message: "Invalid plan ID provided" };
      }

      // Additional security check
      if (!/^[a-zA-Z0-9-_]+$/.test(userId)) {
        return { success: false, message: "Invalid user ID format" };
      }

      logger.info(`Activating trial for user ${userId} with plan ${planId}`);

      return await prisma.$transaction(async (tx) => {
        // Check if user already has an active subscription
        const existingSubscription = await tx.userSubscription.findUnique({
          where: { userId },
        });

        if (existingSubscription && existingSubscription.status === "ACTIVE") {
          return { success: false, message: "User already has an active subscription" };
        }

        // Set trial end date (30 days from now)
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 30);

        // Create trial subscription
        await tx.userSubscription.upsert({
          where: { userId },
          update: {
            planId,
            status: "TRIAL",
            trialEnd,
            currentPeriodStart: new Date(),
            currentPeriodEnd: trialEnd,
          },
          create: {
            userId,
            planId,
            status: "TRIAL",
            trialEnd,
            currentPeriodStart: new Date(),
            currentPeriodEnd: trialEnd,
          },
        });

        // Add trial credits
        const trialCredits = 5;
        await tx.user.update({
          where: { id: userId },
          data: {
            userType: planId,
            credits: { increment: trialCredits }
          },
        });

        // Record the trial credit addition
        await tx.tokenTransaction.create({
          data: {
            userId,
            credits: trialCredits,
            amount: 0,
            type: "TRIAL",
            description: `Added ${trialCredits} tokens for trial`,
          },
        });

        logger.info(`Successfully activated trial for user ${userId}`);
        return { success: true, message: "Trial activated successfully" };
      });
    } catch (error: any) {
      logger.error(`Error activating trial for user ${userId}:`, error);
      return { success: false, message: "Failed to activate trial" };
    }
  }

  /**
   * Get the subscription status for a user
   */
  static async getSubscriptionStatus(userId: string): Promise<any> {
    try {
      if (!userId) {
        return {
          credits: 0,
          tokensUsed: 0,
          isSubscribed: false,
          subscriptionPlan: "FREE",
          status: "INACTIVE",
        };
      }

      // Get user subscription data and credits
      const [userSubscription, user] = await Promise.all([
        prisma.userSubscription.findUnique({
          where: { userId }
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { credits: true, creditsUsed: true }
        })
      ]);

      // Default values if no subscription exists
      if (!userSubscription) {
        return {
          credits: user?.credits || 0,
          tokensUsed: user?.creditsUsed || 0,
          isSubscribed: false,
          subscriptionPlan: "FREE",
          status: "INACTIVE",
        };
      }

      // Determine if the subscription is active
      const isSubscribed = userSubscription.status === "ACTIVE" ||
                          (userSubscription.status === "TRIAL" && userSubscription.trialEnd && userSubscription.trialEnd > new Date());

      // Format the expiration date if it exists
      const expirationDate = userSubscription.currentPeriodEnd
        ? userSubscription.currentPeriodEnd.toISOString()
        : undefined;

      const trialEndsAt = userSubscription.trialEnd
        ? userSubscription.trialEnd.toISOString()
        : undefined;

      return {
        credits: user?.credits || 0,
        tokensUsed: user?.creditsUsed || 0,
        isSubscribed,
        subscriptionPlan: userSubscription.planId as SubscriptionPlanType,
        expirationDate,
        trialEndsAt,
        status: userSubscription.status as SubscriptionStatusType,
      };
    } catch (error: any) {
      logger.error(`Error fetching subscription status for user ${userId}:`, error);
      return {
        credits: 0,
        tokensUsed: 0,
        isSubscribed: false,
        subscriptionPlan: "FREE" as SubscriptionPlanType,
        status: "INACTIVE",
      };
    }
  }

  /**
   * Validate a promo code
   */
  static async validatePromoCode(
    promoCode: string,
  ): Promise<PromoValidationResult> {
    const discount = VALID_PROMO_CODES[promoCode]

    if (discount) {
      return {
        valid: true,
        code: promoCode,
        discount,
        discountPercentage: discount,
        discountType: "percentage",
        message: "Promo code applied successfully!",
      }
    } else {
      return {
        valid: false,
        message: "Invalid promo code.",
      }
    }
  }

  /**
   * Apply a promo code to a user's subscription
   */
  static async applyPromoCode(
    userId: string,
    promoCode: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const validationResult = await this.validatePromoCode(promoCode)

      if (!validationResult.valid) {
        return { success: false, message: validationResult.message || "Invalid promo code." }
      }

      logger.info(`Promo code ${promoCode} applied for user ${userId}. Discount: ${validationResult.discount}`)

      return { success: true, message: "Promo code applied successfully." }
    } catch (error: any) {
      logger.error(`Error applying promo code ${promoCode} for user ${userId}:`, error)
      return { success: false, message: "Failed to apply promo code." }
    }
  }

  /**
   * Create a checkout session for a subscription plan
   */
  static async createCheckoutSession(
    userId: string,
    planId: string,
    duration: number = 12,
    options?: any
  ): Promise<{ success: boolean; url?: string; message?: string }> {
    try {
      // Handle FREE plan directly without Stripe
      if (planId === 'FREE') {
        logger.info(`Activating free plan directly for user ${userId}`)
        const result = await SubscriptionService.activateFreePlan(userId)
        
        if (result.success) {
          return {
            success: true,
            message: result.message || 'Free plan activated successfully!'
          }
        } else {
          return {
            success: false,
            message: result.message || 'Failed to activate free plan'
          }
        }
      }

      // For paid plans, use the payment gateway (Stripe)
      logger.info(`Creating Stripe checkout session for user ${userId} and plan ${planId}`)
      const paymentGateway = await getPaymentGateway()
      const checkoutResult = await paymentGateway.createCheckoutSession(userId, planId, duration, options)
      console.log(`Checkout URL created for user ${userId} and plan ${planId}: ${checkoutResult.url}`);
      return { success: true, url: checkoutResult.url }
    } catch (error: any) {
      logger.error(`Error creating checkout session for user ${userId} and plan ${planId}:`, error)
      return { success: false, message: "Failed to create checkout session." }
    }
  }

  /**
   * Get billing details for a user
   *
   * @param userId - The ID of the user
   * @returns Object with billing information
   */
  static async getBillingDetails(userId: string): Promise<any> {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      // Check cache first
      const cacheKey = `billing_${userId}`
      const cachedData = subscriptionCache.get(cacheKey)

      if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
        logger.debug(`Using cached billing data for user ${userId}`)
        return cachedData.data
      }      // For simplicity, assume Stripe as the payment gateway
      const paymentGateway = await getPaymentGateway()
      const billingDetails = await paymentGateway.getBillingHistory(userId)

      // Cache the result
      subscriptionCache.set(cacheKey, { data: billingDetails, timestamp: Date.now() })

      return billingDetails
    } catch (error: any) {
      logger.error(`Error getting billing details for user ${userId}:`, error)
      throw new Error(
        `Failed to retrieve billing details: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }  /**
   * Cancel a user\'s subscription with guaranteed consistency
   *
   * @param userId - The ID of the user
   * @returns Object with success status and message
   */
  static async cancelSubscription(
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const paymentGateway = await getPaymentGateway()
      await paymentGateway.cancelSubscription(userId)

      await prisma.userSubscription.update({
        where: { userId },
        data: {
          status: "CANCELED",
          cancelAtPeriodEnd: true,
        },
      })

      await prisma.user.update({
        where: { id: userId },
        data: {
          userType: "FREE",
        },
      })

      logger.info(`Subscription canceled for user ${userId}`)
      return { success: true, message: "Subscription canceled successfully." }
    } catch (error: any) {
      logger.error(`Error canceling subscription for user ${userId}:`, error)
      return { success: false, message: "Failed to cancel subscription." }
    }
  }

  /**
   * Verify payment success
   */
  static async verifyPaymentSuccess(
    userId: string,
    sessionId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      if (!userId || !sessionId) {
        return { success: false, message: "User ID and Session ID are required" }
      }

      const paymentGateway = await getPaymentGateway()
      const status = await paymentGateway.getPaymentStatus(sessionId)

      if (status?.status === "succeeded") {
        logger.info(`Payment successful for user ${userId} and session ${sessionId}`)
        return { success: true }
      } else {
        logger.warn(`Payment failed for user ${userId} and session ${sessionId}`)
        return { success: false, message: "Payment failed." }
      }
    } catch (error: any) {
      logger.error(`Error verifying payment status for user ${userId}:`, error)
      return { success: false, message: "Failed to verify payment status." }
    }
  }

  /**
   * Use tokens for a user
   */
  static async useTokens(
    userId: string,
    tokensUsed: number,
  ): Promise<{ success: boolean; newCredits?: number; message?: string }> {
    try {
      if (tokensUsed <= 0) {
        return { success: false, message: "Tokens used must be a positive number." }
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true, creditsUsed: true },
      })

      if (!user) {
        return { success: false, message: "User not found." }
      }

      if (user.credits < tokensUsed) {
        return { success: false, message: "Insufficient credits." }
      }

      const newCredits = user.credits - tokensUsed
      const newCreditsUsed = user.creditsUsed + tokensUsed

      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: newCredits,
          creditsUsed: newCreditsUsed,
        },
      })

      await prisma.tokenTransaction.create({
        data: {
          userId,
          credits: -tokensUsed,
          amount: 0,
          type: "USAGE",
          description: `Used ${tokensUsed} tokens`,
        },
      })

      logger.info(`User ${userId} used ${tokensUsed} tokens. Remaining credits: ${newCredits}`)

      return { success: true, newCredits }
    } catch (error: any) {
      logger.error(`Error using tokens for user ${userId}:`, error)
      return { success: false, message: "Failed to use tokens." }
    }
  }

  /**
   * Get billing history for a user
   */
  static getBillingHistory = async (userId: string): Promise<{
    success: boolean;
    history?: Array<{
      id: string;
      date: string;
      amount: number;
      status: "paid" | "pending" | "failed";
      description: string;
      invoiceUrl?: string;
    }>;
    error?: string;
  }> => {
    try {
      if (!userId) {
        return { success: false, error: "User ID is required" }
      }

      const paymentGateway = await getPaymentGateway()
      const billingData = await paymentGateway.getBillingHistory(userId)

      const history = billingData.map((item: any) => ({
        id: item.id || '',
        date: new Date(item.created * 1000).toISOString(),
        amount: item.amount_paid || item.total || 0,
        status: (item.status === "paid" ? "paid" : item.status === "open" ? "pending" : "failed") as "paid" | "pending" | "failed",
        description: item.description || `${item.lines?.data?.[0]?.description || 'Subscription'} - ${item.billing_reason || 'Payment'}`,
        invoiceUrl: item.invoice_pdf || item.hosted_invoice_url || undefined,
      }))

      logger.info(`Retrieved billing history for user ${userId}, ${history.length} items`)
      return { success: true, history }

    } catch (error: any) {
      logger.error(`Error fetching billing history for user ${userId}:`, error)
      return { success: false, error: "Failed to retrieve billing history" }
    }
  }

  /**
   * Get payment methods for a user
   */
  static getPaymentMethods = async (userId: string): Promise<any[]> => {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      const paymentGateway = await getPaymentGateway()
      const paymentMethods = await paymentGateway.getPaymentMethods(userId)
      return paymentMethods
    } catch (error: any) {
      logger.error(`Error fetching payment methods for user ${userId}:`, error)
      return []
    }
  }
}