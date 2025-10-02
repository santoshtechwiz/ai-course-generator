import prisma from "@/lib/db";
import { BaseRepository } from "./base.repository";

/**
 * Repository for handling user data operations
 */
export class UserRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.user);
  }

  /**
   * Update user credits after quiz generation
   */
  async updateUserCredits(userId: string, quizType: string) {
    // First, get the current user's credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, creditsUsed: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.credits <= 0) {
      throw new Error("Not enough credits");
    }

    // Update credits (decrement by 1) and creditsUsed (increment by 1)
    return prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: 1,
        },
        creditsUsed: {
          increment: 1,
        },
        // Track quiz type in a token transaction for analytics
        TokenTransaction: {
          create: {
            type: "QUIZ_GENERATION",
            amount: -1,
            description: `Generated a ${quizType} quiz`,
          },
        },
      },
    });
  }

  /**
   * Get user profile with subscription information
   */
  async getUserProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    if (!user || !user.subscription) {
      return false;
    }

    return (
      user.subscription.status === "active" && 
      new Date(user.subscription.currentPeriodEnd) > new Date()
    );
  }

  /**
   * Get user profile with detailed information
   */
  async getUserProfileDetails(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        credits: true,
        userType: true,
        isAdmin: true,
        createdAt: true,
        subscription: {
          select: {
            planId: true,
            status: true,
            currentPeriodEnd: true,
          },
        },
      },
    });
  }

  /**
   * Get user subscription data for server-side validation (avoids HTTP calls)
   */
  async getUserSubscriptionData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        credits: true,
        creditsUsed: true,
        userType: true,
        subscription: {
          select: {
            id: true,
            planId: true,
            status: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Calculate subscription status
    const hasActiveSubscription = user.subscription && 
      user.subscription.status === "active" && 
      new Date(user.subscription.currentPeriodEnd) > new Date();

    return {
      credits: user.credits || 0,
      tokensUsed: user.creditsUsed || 0,
      creditsUsed: user.creditsUsed || 0,
      isSubscribed: hasActiveSubscription,
      isActive: hasActiveSubscription,
      subscriptionPlan: user.userType || "FREE",
      userType: user.userType || "FREE",
      expirationDate: user.subscription?.currentPeriodEnd || null,
      status: user.subscription?.status || "INACTIVE",
      cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false,
      subscriptionId: user.subscription?.id || "",
    };
  }

  /**
   * Update user profile information
   */
  async updateUserProfile(userId: string, updateData: { name?: string; image?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });
  }
}

export const userRepository = new UserRepository();
