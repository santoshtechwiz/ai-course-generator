/**
 * Subscription Limits Utility
 * 
 * Handles subscription plan limits for course/quiz creation
 * Provides upgrade prompts when limits are exceeded
 */

import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise'

export interface SubscriptionLimits {
  coursesPerMonth: number
  quizzesPerMonth: number
  chaptersPerCourse: number
  questionsPerQuiz: number
  aiMessagesPerHour: number
}

export interface SubscriptionStatus {
  tier: SubscriptionTier
  isActive: boolean
  limits: SubscriptionLimits
  currentUsage: {
    coursesThisMonth: number
    quizzesThisMonth: number
  }
  canCreate: {
    course: boolean
    quiz: boolean
  }
  upgradeRequired: boolean
}

// Define limits for each subscription tier
const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    coursesPerMonth: 2,
    quizzesPerMonth: 5,
    chaptersPerCourse: 5,
    questionsPerQuiz: 10,
    aiMessagesPerHour: 10
  },
  basic: {
    coursesPerMonth: 10,
    quizzesPerMonth: 20,
    chaptersPerCourse: 15,
    questionsPerQuiz: 20,
    aiMessagesPerHour: 50
  },
  pro: {
    coursesPerMonth: 50,
    quizzesPerMonth: 100,
    chaptersPerCourse: 50,
    questionsPerQuiz: 50,
    aiMessagesPerHour: 100
  },
  enterprise: {
    coursesPerMonth: -1, // Unlimited
    quizzesPerMonth: -1,
    chaptersPerCourse: -1,
    questionsPerQuiz: -1,
    aiMessagesPerHour: -1
  }
}

/**
 * Get user's subscription tier
 */
export async function getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          where: {
            status: 'active',
            currentPeriodEnd: {
              gt: new Date()
            }
          }
        }
      }
    })

    if (!user) {
      return 'free'
    }

    // Check if user has active subscription
    if (user.subscription && user.subscription.status === 'active') {
      const planId = user.subscription.planId?.toLowerCase() || ''
      
      if (planId.includes('enterprise')) return 'enterprise'
      if (planId.includes('pro') || planId.includes('premium')) return 'pro'
      if (planId.includes('basic') || planId.includes('standard')) return 'basic'
    }

    return 'free'
  } catch (error) {
    logger.error('[SubscriptionLimits] Failed to get user tier:', error)
    return 'free'
  }
}

/**
 * Get current month's usage for a user
 */
async function getMonthlyUsage(userId: string): Promise<{
  coursesThisMonth: number
  quizzesThisMonth: number
}> {
  try {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Count user-created courses and quizzes only
    const [coursesCount, quizzesCount] = await Promise.all([
      prisma.course.count({
        where: {
          userId,
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      prisma.userQuiz.count({
        where: {
          userId,
          createdAt: {
            gte: startOfMonth
          }
        }
      })
    ])

    return {
      coursesThisMonth: coursesCount,
      quizzesThisMonth: quizzesCount
    }
  } catch (error) {
    logger.error('[SubscriptionLimits] Failed to get monthly usage:', error)
    return {
      coursesThisMonth: 0,
      quizzesThisMonth: 0
    }
  }
}

/**
 * Check if user can create courses/quizzes
 */
export async function checkSubscriptionLimits(userId: string): Promise<SubscriptionStatus> {
  try {
    const tier = await getUserSubscriptionTier(userId)
    const limits = TIER_LIMITS[tier]
    const usage = await getMonthlyUsage(userId)

    const canCreateCourse = limits.coursesPerMonth === -1 || 
                           usage.coursesThisMonth < limits.coursesPerMonth
    
    const canCreateQuiz = limits.quizzesPerMonth === -1 || 
                         usage.quizzesThisMonth < limits.quizzesPerMonth

    return {
      tier,
      isActive: tier !== 'free',
      limits,
      currentUsage: usage,
      canCreate: {
        course: canCreateCourse,
        quiz: canCreateQuiz
      },
      upgradeRequired: !canCreateCourse || !canCreateQuiz
    }
  } catch (error) {
    logger.error('[SubscriptionLimits] Failed to check limits:', error)
    // Return restrictive defaults on error
    return {
      tier: 'free',
      isActive: false,
      limits: TIER_LIMITS.free,
      currentUsage: { coursesThisMonth: 0, quizzesThisMonth: 0 },
      canCreate: { course: false, quiz: false },
      upgradeRequired: true
    }
  }
}

/**
 * Get upgrade message based on current tier
 */
export function getUpgradeMessage(currentTier: SubscriptionTier, action: 'course' | 'quiz'): string {
  const actionText = action === 'course' ? 'courses' : 'quizzes'
  
  switch (currentTier) {
    case 'free':
      return `You've reached your monthly limit for ${actionText}. Upgrade to Basic for ${TIER_LIMITS.basic.coursesPerMonth} courses and ${TIER_LIMITS.basic.quizzesPerMonth} quizzes per month!`
    case 'basic':
      return `You've reached your monthly limit. Upgrade to Pro for ${TIER_LIMITS.pro.coursesPerMonth} courses and ${TIER_LIMITS.pro.quizzesPerMonth} quizzes per month!`
    case 'pro':
      return `You've reached your monthly limit. Upgrade to Enterprise for unlimited courses and quizzes!`
    default:
      return `Upgrade your plan to create more ${actionText}.`
  }
}

/**
 * Get remaining quota for display
 */
export function getRemainingQuota(status: SubscriptionStatus): {
  courses: string
  quizzes: string
} {
  const { limits, currentUsage } = status
  
  const coursesRemaining = limits.coursesPerMonth === -1 
    ? 'Unlimited' 
    : `${Math.max(0, limits.coursesPerMonth - currentUsage.coursesThisMonth)} / ${limits.coursesPerMonth}`
  
  const quizzesRemaining = limits.quizzesPerMonth === -1 
    ? 'Unlimited' 
    : `${Math.max(0, limits.quizzesPerMonth - currentUsage.quizzesThisMonth)} / ${limits.quizzesPerMonth}`

  return {
    courses: coursesRemaining,
    quizzes: quizzesRemaining
  }
}
