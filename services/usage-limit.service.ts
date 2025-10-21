import { PrismaClient } from '@prisma/client'
import { addDays, addHours, isAfter, startOfDay } from 'date-fns'

const prisma = new PrismaClient()

type ResourceType = 
  | 'flashcard_decks' 
  | 'flashcard_cards' 
  | 'flashcard_reviews'
  | 'quiz_attempts'
  | 'course_access'

interface UsageLimitConfig {
  free: number
  basic: number
  pro: number
  unlimited: number
}

// Define limits for each resource type
const USAGE_LIMITS: Record<ResourceType, UsageLimitConfig> = {
  flashcard_decks: {
    free: 3,
    basic: 10,
    pro: 50,
    unlimited: 999999
  },
  flashcard_cards: {
    free: 50,  // 50 cards per deck
    basic: 200,
    pro: 1000,
    unlimited: 999999
  },
  flashcard_reviews: {
    free: 20,  // 20 reviews per day
    basic: 100,
    pro: 500,
    unlimited: 999999
  },
  quiz_attempts: {
    free: 5,   // 5 quiz attempts per day
    basic: 20,
    pro: 100,
    unlimited: 999999
  },
  course_access: {
    free: 3,   // 3 courses
    basic: 10,
    pro: 50,
    unlimited: 999999
  }
}

class UsageLimitService {
  /**
   * Check if user can perform an action
   */
  async canUseResource(
    userId: string,
    resourceType: ResourceType,
    userType: string = 'FREE'
  ): Promise<{ allowed: boolean; current: number; limit: number; resetAt?: Date }> {
    try {
      // Get or create usage limit
      const usage = await this.getOrCreateUsageLimit(userId, resourceType, userType)

      // Check if period has expired and reset if needed
      if (isAfter(new Date(), usage.periodEnd)) {
        await this.resetUsageLimit(userId, resourceType, usage.resetFrequency)
        return {
          allowed: true,
          current: 0,
          limit: usage.limitCount,
          resetAt: usage.periodEnd
        }
      }

      const allowed = usage.usedCount < usage.limitCount
      
      return {
        allowed,
        current: usage.usedCount,
        limit: usage.limitCount,
        resetAt: usage.periodEnd
      }
    } catch (error) {
      console.error('[UsageLimitService] Error checking resource:', error)
      // Allow by default in case of error
      return { allowed: true, current: 0, limit: 999999 }
    }
  }

  /**
   * Increment usage count
   */
  async incrementUsage(
    userId: string,
    resourceType: ResourceType,
    count: number = 1
  ): Promise<boolean> {
    try {
      await prisma.$executeRaw`
        UPDATE "UsageLimit"
        SET "usedCount" = "usedCount" + ${count}
        WHERE "userId" = ${userId} AND "resourceType" = ${resourceType}
      `

      console.log(`[UsageLimitService] Incremented ${resourceType} for user ${userId} by ${count}`)
      return true
    } catch (error) {
      console.error('[UsageLimitService] Error incrementing usage:', error)
      return false
    }
  }

  /**
   * Get or create usage limit entry
   */
  private async getOrCreateUsageLimit(
    userId: string,
    resourceType: ResourceType,
    userType: string
  ): Promise<any> {
    const existing = await prisma.$queryRaw<any[]>`
      SELECT * FROM "UsageLimit"
      WHERE "userId" = ${userId} AND "resourceType" = ${resourceType}
      LIMIT 1
    `

    if (existing.length > 0) {
      return existing[0]
    }

    // Create new usage limit
    const limitCount = this.getLimitForUserType(resourceType, userType)
    const resetFrequency = this.getResetFrequency(resourceType)
    const periodEnd = this.calculatePeriodEnd(resetFrequency)

    const created = await prisma.$queryRaw<any[]>`
      INSERT INTO "UsageLimit" (
        "id", "userId", "resourceType", "usedCount", "limitCount",
        "periodStart", "periodEnd", "resetFrequency"
      )
      VALUES (
        gen_random_uuid()::text,
        ${userId},
        ${resourceType},
        0,
        ${limitCount},
        NOW(),
        ${periodEnd},
        ${resetFrequency}
      )
      RETURNING *
    `

    return created[0]
  }

  /**
   * Reset usage limit after period expires
   */
  private async resetUsageLimit(
    userId: string,
    resourceType: ResourceType,
    resetFrequency: string
  ): Promise<void> {
    const newPeriodEnd = this.calculatePeriodEnd(resetFrequency)

    await prisma.$executeRaw`
      UPDATE "UsageLimit"
      SET 
        "usedCount" = 0,
        "periodStart" = NOW(),
        "periodEnd" = ${newPeriodEnd}
      WHERE "userId" = ${userId} AND "resourceType" = ${resourceType}
    `

    console.log(`[UsageLimitService] Reset ${resourceType} limit for user ${userId}`)
  }

  /**
   * Get limit based on user type
   */
  private getLimitForUserType(resourceType: ResourceType, userType: string): number {
    const config = USAGE_LIMITS[resourceType]
    
    switch (userType.toUpperCase()) {
      case 'FREE':
        return config.free
      case 'BASIC':
        return config.basic
      case 'PRO':
      case 'PREMIUM':
        return config.pro
      case 'UNLIMITED':
      case 'ADMIN':
        return config.unlimited
      default:
        return config.free
    }
  }

  /**
   * Get reset frequency for resource type
   */
  private getResetFrequency(resourceType: ResourceType): string {
    // Reviews and quiz attempts reset daily
    if (resourceType === 'flashcard_reviews' || resourceType === 'quiz_attempts') {
      return 'daily'
    }
    // Deck and course limits reset monthly
    return 'monthly'
  }

  /**
   * Calculate period end based on frequency
   */
  private calculatePeriodEnd(frequency: string): Date {
    const now = startOfDay(new Date())
    
    if (frequency === 'daily') {
      return addDays(now, 1)
    }
    
    if (frequency === 'weekly') {
      return addDays(now, 7)
    }
    
    // Monthly
    return addDays(now, 30)
  }

  /**
   * Get usage stats for user dashboard
   */
  async getUserUsageStats(userId: string): Promise<Record<ResourceType, any>> {
    const resources: ResourceType[] = [
      'flashcard_decks',
      'flashcard_cards',
      'flashcard_reviews',
      'quiz_attempts',
      'course_access'
    ]

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true }
    })

    const stats: any = {}

    for (const resource of resources) {
      const usage = await this.canUseResource(userId, resource, user?.userType || 'FREE')
      stats[resource] = usage
    }

    return stats
  }
}

export const usageLimitService = new UsageLimitService()
