import prisma from "@/lib/db"
import { startOfDay, sub, differenceInHours } from "date-fns"

/**
 * Streak Service
 * Manages daily review streaks and habit formation
 */
export class StreakService {
  /**
   * Track daily review streak
   */
  async updateStreak(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, longestStreak: true, lastReviewDate: true },
    })

    if (!user) {
      throw new Error("User not found")
    }

    const today = startOfDay(new Date())
    const yesterday = sub(today, { days: 1 })

    const reviewedToday = await prisma.flashCardReview.count({
      where: {
        userId,
        reviewDate: { gte: today },
      },
    })

    if (reviewedToday > 0) {
      // User reviewed today
      const lastReviewDate = user.lastReviewDate ? startOfDay(user.lastReviewDate) : null

      if (lastReviewDate && lastReviewDate.getTime() === yesterday.getTime()) {
        // Streak continues
        const newStreak = user.streak + 1
        return prisma.user.update({
          where: { id: userId },
          data: {
            streak: newStreak,
            longestStreak: Math.max(user.longestStreak, newStreak),
            lastReviewDate: new Date(),
          },
        })
      } else if (!lastReviewDate || lastReviewDate.getTime() < yesterday.getTime()) {
        // Streak broken or new streak - reset to 1
        return prisma.user.update({
          where: { id: userId },
          data: {
            streak: 1,
            longestStreak: Math.max(user.longestStreak, 1),
            lastReviewDate: new Date(),
          },
        })
      }
    }

    return user
  }

  /**
   * Check if streak is in danger (23 hours since last review)
   */
  async getStreakDanger(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, lastReviewDate: true },
    })

    if (!user || !user.lastReviewDate || user.streak === 0) {
      return { inDanger: false, hoursRemaining: 0, streak: 0 }
    }

    const hoursSinceReview = differenceInHours(new Date(), user.lastReviewDate)
    const hoursRemaining = Math.max(0, 24 - hoursSinceReview)

    return {
      inDanger: hoursSinceReview >= 23,
      hoursRemaining,
      streak: user.streak,
    }
  }

  /**
   * Get user streak info
   */
  async getStreakInfo(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        streak: true,
        longestStreak: true,
        lastReviewDate: true,
      },
    })

    if (!user) {
      return {
        current: 0,
        longest: 0,
        lastReview: null,
      }
    }

    return {
      current: user.streak,
      longest: user.longestStreak,
      lastReview: user.lastReviewDate,
    }
  }
}

export const streakService = new StreakService()
