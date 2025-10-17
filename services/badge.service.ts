import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface Badge {
  id: string
  name: string
  description: string
  category: 'flashcard_streak' | 'flashcard_reviews' | 'flashcard_mastery' | 'quiz_completion' | 'quiz_accuracy' | 'special'
  icon: string
  requiredValue: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  createdAt: Date
}

export interface UserBadge {
  id: string
  userId: string
  badgeId: string
  unlockedAt: Date
  progress: number
  badge?: Badge
}

export class BadgeService {
  /**
   * Check and unlock badges for a user based on their activity
   */
  async checkAndUnlockBadges(userId: string): Promise<UserBadge[]> {
    const newBadges: UserBadge[] = []

    // Get user stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, longestStreak: true }
    })

    if (!user) return newBadges

    // Get review stats
    const reviewCount = await prisma.flashCardReview.count({
      where: { userId }
    })

    const masteredCount = await prisma.flashCardReview.groupBy({
      by: ['flashCardId'],
      where: {
        userId,
        reviewCount: { gte: 3 }
      },
      _count: true
    })

    const totalMastered = masteredCount.length

    // Check streak badges
    const streakBadges = await this.checkStreakBadges(userId, user.longestStreak, newBadges)
    
    // Check review count badges
    const reviewBadges = await this.checkReviewBadges(userId, reviewCount, newBadges)
    
    // Check mastery badges
    const masteryBadges = await this.checkMasteryBadges(userId, totalMastered, newBadges)

    return [...streakBadges, ...reviewBadges, ...masteryBadges]
  }

  private async checkStreakBadges(userId: string, longestStreak: number, newBadges: UserBadge[]): Promise<UserBadge[]> {
    const streakThresholds = [
      { id: 'streak-7', value: 7 },
      { id: 'streak-30', value: 30 },
      { id: 'streak-100', value: 100 },
      { id: 'streak-365', value: 365 }
    ]

    for (const threshold of streakThresholds) {
      if (longestStreak >= threshold.value) {
        const unlocked = await this.unlockBadge(userId, threshold.id, longestStreak)
        if (unlocked) newBadges.push(unlocked)
      }
    }

    return newBadges
  }

  private async checkReviewBadges(userId: string, reviewCount: number, newBadges: UserBadge[]): Promise<UserBadge[]> {
    const reviewThresholds = [
      { id: 'reviews-10', value: 10 },
      { id: 'reviews-50', value: 50 },
      { id: 'reviews-100', value: 100 },
      { id: 'reviews-500', value: 500 },
      { id: 'reviews-1000', value: 1000 }
    ]

    for (const threshold of reviewThresholds) {
      if (reviewCount >= threshold.value) {
        const unlocked = await this.unlockBadge(userId, threshold.id, reviewCount)
        if (unlocked) newBadges.push(unlocked)
      }
    }

    return newBadges
  }

  private async checkMasteryBadges(userId: string, masteredCount: number, newBadges: UserBadge[]): Promise<UserBadge[]> {
    const masteryThresholds = [
      { id: 'mastery-5', value: 5 },
      { id: 'mastery-25', value: 25 },
      { id: 'mastery-50', value: 50 },
      { id: 'mastery-100', value: 100 }
    ]

    for (const threshold of masteryThresholds) {
      if (masteredCount >= threshold.value) {
        const unlocked = await this.unlockBadge(userId, threshold.id, masteredCount)
        if (unlocked) newBadges.push(unlocked)
      }
    }

    return newBadges
  }

  /**
   * Unlock a badge for a user if not already unlocked
   */
  async unlockBadge(userId: string, badgeId: string, progress: number = 0): Promise<UserBadge | null> {
    try {
      // Check if already unlocked
      const existing = await prisma.$queryRaw<any[]>`
        SELECT * FROM "UserBadge" 
        WHERE "userId" = ${userId} AND "badgeId" = ${badgeId}
        LIMIT 1
      `

      if (existing.length > 0) {
        return null // Already unlocked
      }

      // Unlock badge
      const userBadge = await prisma.$queryRaw<any[]>`
        INSERT INTO "UserBadge" ("id", "userId", "badgeId", "progress", "unlockedAt")
        VALUES (gen_random_uuid()::text, ${userId}, ${badgeId}, ${progress}, NOW())
        RETURNING *
      `

      console.log(`[BadgeService] Unlocked badge ${badgeId} for user ${userId}`)
      
      return userBadge[0] || null
    } catch (error) {
      console.error('[BadgeService] Error unlocking badge:', error)
      return null
    }
  }

  /**
   * Get all badges earned by a user
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const badges = await prisma.$queryRaw<any[]>`
        SELECT 
          ub.*,
          b."name", b."description", b."category", b."icon", b."requiredValue", b."tier"
        FROM "UserBadge" ub
        JOIN "Badge" b ON ub."badgeId" = b."id"
        WHERE ub."userId" = ${userId}
        ORDER BY ub."unlockedAt" DESC
      `

      return badges
    } catch (error) {
      console.error('[BadgeService] Error fetching user badges:', error)
      return []
    }
  }

  /**
   * Get all available badges
   */
  async getAllBadges(): Promise<Badge[]> {
    try {
      const badges = await prisma.$queryRaw<any[]>`
        SELECT * FROM "Badge"
        ORDER BY "category", "requiredValue" ASC
      `

      return badges
    } catch (error) {
      console.error('[BadgeService] Error fetching badges:', error)
      return []
    }
  }

  /**
   * Get badge progress for a user
   */
  async getBadgeProgress(userId: string): Promise<{
    badge: Badge
    unlocked: boolean
    progress: number
    progressPercent: number
  }[]> {
    const allBadges = await this.getAllBadges()
    const userBadges = await this.getUserBadges(userId)
    
    const unlockedBadgeIds = new Set(userBadges.map(ub => ub.badgeId))

    // Get current stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, longestStreak: true }
    })

    const reviewCount = await prisma.flashCardReview.count({
      where: { userId }
    })

    const masteredCount = await prisma.flashCardReview.groupBy({
      by: ['flashCardId'],
      where: {
        userId,
        reviewCount: { gte: 3 }
      }
    })

    return allBadges.map(badge => {
      const unlocked = unlockedBadgeIds.has(badge.id)
      let progress = 0

      // Calculate progress based on category
      if (badge.category === 'flashcard_streak') {
        progress = user?.longestStreak || 0
      } else if (badge.category === 'flashcard_reviews') {
        progress = reviewCount
      } else if (badge.category === 'flashcard_mastery') {
        progress = masteredCount.length
      }
      // TODO: Add quiz_completion and quiz_accuracy tracking

      return {
        badge,
        unlocked,
        progress,
        progressPercent: Math.min(100, (progress / badge.requiredValue) * 100)
      }
    })
  }

  /**
   * Check for quiz completion badges
   * 
   * COMMIT: Tracks MCQ, Blanks, Open-ended, and Code quiz completions
   */
  async checkQuizBadges(userId: string, quizType?: 'mcq' | 'blanks' | 'openended' | 'code'): Promise<UserBadge[]> {
    const newBadges: UserBadge[] = []
    
    try {
      // Get total quiz attempts by type
      const totalAttempts = await prisma.userQuizAttempt.count({
        where: { userId }
      })
      
      // Get attempts by specific quiz type if provided
      if (quizType) {
        const typeAttempts = await prisma.userQuizAttempt.count({
          where: {
            userId,
            userQuiz: { quizType }
          }
        })
        
        // Check type-specific badges
        const typeBadges = {
          mcq: [
            { id: 'mcq-10', value: 10 },
            { id: 'mcq-25', value: 25 },
            { id: 'mcq-50', value: 50 }
          ],
          blanks: [
            { id: 'blanks-10', value: 10 },
            { id: 'blanks-25', value: 25 },
            { id: 'blanks-50', value: 50 }
          ],
          openended: [
            { id: 'openended-10', value: 10 },
            { id: 'openended-25', value: 25 },
            { id: 'openended-50', value: 50 }
          ],
          code: [
            { id: 'code-10', value: 10 },
            { id: 'code-25', value: 25 },
            { id: 'code-50', value: 50 }
          ]
        }
        
        const thresholds = typeBadges[quizType] || []
        for (const threshold of thresholds) {
          if (typeAttempts >= threshold.value) {
            const unlocked = await this.unlockBadge(userId, threshold.id, typeAttempts)
            if (unlocked) newBadges.push(unlocked)
          }
        }
      }
      
      // Check total quiz badges
      const totalThresholds = [
        { id: 'total-quiz-50', value: 50 },
        { id: 'total-quiz-100', value: 100 },
        { id: 'total-quiz-250', value: 250 },
        { id: 'total-quiz-500', value: 500 }
      ]
      
      for (const threshold of totalThresholds) {
        if (totalAttempts >= threshold.value) {
          const unlocked = await this.unlockBadge(userId, threshold.id, totalAttempts)
          if (unlocked) newBadges.push(unlocked)
        }
      }
      
    } catch (error) {
      console.error('[BadgeService] Error checking quiz badges:', error)
    }
    
    return newBadges
  }

  /**
   * Check for perfect score badges
   */
  async checkPerfectScoreBadge(userId: string, quizType: 'mcq' | 'blanks' | 'openended' | 'code', score: number): Promise<UserBadge | null> {
    if (score < 100) return null
    
    const badgeMap = {
      mcq: 'perfect-mcq',
      blanks: 'perfect-blanks',
      openended: 'perfect-openended',
      code: 'perfect-code'
    }
    
    const badgeId = badgeMap[quizType]
    return await this.unlockBadge(userId, badgeId, 1)
  }

  /**
   * Check for special achievement badges
   */
  async checkSpecialBadges(userId: string, event: 'perfect_day' | 'early_bird' | 'night_owl' | 'comeback'): Promise<UserBadge | null> {
    const badgeMap = {
      perfect_day: 'perfect-day',
      early_bird: 'early-bird',
      night_owl: 'night-owl',
      comeback: 'comeback'
    }

    const badgeId = badgeMap[event]
    return await this.unlockBadge(userId, badgeId, 1)
  }
}

export const badgeService = new BadgeService()
