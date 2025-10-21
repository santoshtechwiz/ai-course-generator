/**
 * Daily Limit Helpers for Ordering Quiz
 * Manages daily generation limits based on subscription tier
 * Uses OrderingQuiz table (dedicated table, not UserQuiz metadata)
 */

import { prisma } from "@/lib/db"

export interface DailyLimitStatus {
  remaining: number
  total: number
  limit: number
  resetTime: Date
}

/**
 * Get today's ordering quiz generation count for a user
 * Queries OrderingQuiz table (dedicated table) where createdAt is today
 */
export async function getTodayOrderingCount(userId: string): Promise<number> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const count = await prisma.orderingQuiz.count({
      where: {
        createdBy: userId,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    return count
  } catch (error) {
    console.error("[DAILY_LIMIT] Error querying quiz count:", error)
    // Fail open - allow quiz if query fails (better UX)
    return 0
  }
}

/**
 * Check if user can generate more quizzes today
 * Compares today's count against the user's plan limit
 */
export async function canGenerateMoreQuizzes(
  userId: string,
  userPlan: "FREE" | "PREMIUM" | "PRO"
): Promise<boolean> {
  try {
    const count = await getTodayOrderingCount(userId)
    const limits: Record<string, number> = {
      FREE: 2,
      PREMIUM: 10,
      PRO: 50
    }
    const limit = limits[userPlan] || 2
    return count < limit
  } catch (error) {
    console.error("[DAILY_LIMIT] Error checking generation limit:", error)
    // Fail open
    return true
  }
}

/**
 * Get daily limit status for display/UI purposes
 * Returns remaining quizzes, total generated today, limit, and reset time
 */
export async function getDailyLimitStatus(
  userId: string,
  userPlan: "FREE" | "PREMIUM" | "PRO"
): Promise<DailyLimitStatus> {
  try {
    const count = await getTodayOrderingCount(userId)
    const limits: Record<string, number> = {
      FREE: 2,
      PREMIUM: 10,
      PRO: 50
    }
    const limit = limits[userPlan] || 2

    // Calculate reset time (next midnight UTC)
    const resetTime = new Date()
    resetTime.setUTCHours(24, 0, 0, 0)

    return {
      remaining: Math.max(0, limit - count),
      total: count,
      limit,
      resetTime
    }
  } catch (error) {
    console.error("[DAILY_LIMIT] Error getting limit status:", error)
    // Return safe defaults on error
    return {
      remaining: 0,
      total: 0,
      limit: 2,
      resetTime: new Date()
    }
  }
}

/**
 * Get the subscription tier limit for ordering quizzes
 */
export function getQuizLimitForPlan(
  plan: "FREE" | "PREMIUM" | "PRO"
): number {
  const limits: Record<string, number> = {
    FREE: 2,
    PREMIUM: 10,
    PRO: 50
  }
  return limits[plan] || 2
}

/**
 * Format remaining quizzes message for display
 */
export function formatRemainingMessage(
  remaining: number,
  total: number,
  limit: number
): string {
  if (remaining <= 0) {
    return `Daily limit reached (${total}/${limit})`
  }
  return `${remaining}/${limit} quizzes remaining today`
}
