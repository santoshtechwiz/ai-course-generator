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
}
