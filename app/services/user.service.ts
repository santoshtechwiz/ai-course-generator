import { userRepository } from "@/app/repositories/user.repository";

/**
 * Service for handling user-related business logic
 */
export class UserService {
  /**
   * Get user profile with subscription information
   */
  async getUserProfile(userId: string) {
    const user = await userRepository.getUserProfileDetails(userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    return {
      user: {
        ...user,
        subscriptionPlan: user.subscription?.planId || null,
        subscriptionStatus: user.subscription?.status || null,
        subscriptionExpirationDate: user.subscription?.currentPeriodEnd || null,
      },
    };
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updateData: { name?: string; image?: string }) {
    // Validate that we have at least one field to update
    const allowedFields = ["name", "image"];
    const filteredData: Record<string, any> = {};

    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key) && updateData[key as keyof typeof updateData] !== undefined) {
        filteredData[key] = updateData[key as keyof typeof updateData];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      throw new Error("No valid fields to update");
    }

    return userRepository.updateUserProfile(userId, filteredData);
  }

  /**
   * Check user credits
   */
  async getUserCredits(userId: string) {
    const user = await userRepository.getUserProfile(userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    return {
      credits: user.credits,
      creditsUsed: user.creditsUsed || 0,
    };
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    return userRepository.hasActiveSubscription(userId);
  }
}

export const userService = new UserService();
