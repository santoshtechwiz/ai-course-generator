/**
 * Universal Streak Tracking Service
 * 
 * Manages daily quiz completion streaks across ALL quiz types
 * (MCQ, Flashcard, Blanks, Open-Ended)
 * 
 * Uses EXISTING database fields - NO schema changes required:
 * - User.streak (global quiz streak)
 * - User.longestStreak (personal best)
 * - User.lastReviewDate (last quiz completion date)
 */

import { prisma } from '@/lib/db'

interface StreakResult {
  streakContinued: boolean
  currentStreak: number
  longestStreak: number
  isNewRecord: boolean
}

interface StreakStats {
  currentStreak: number
  longestStreak: number
  lastActivity: Date | null
  isActiveToday: boolean
  needsQuizToday: boolean
  daysUntilBreak: number
}

interface PerQuizStreak {
  currentStreak: number
  longestStreak: number
  totalAttempts: number
  lastAttempt: Date | null
}

/**
 * Update user's global quiz streak after completing ANY quiz type
 * 
 * Streak Logic:
 * - Complete quiz today = maintain or start streak
 * - Complete yesterday + today = continue streak (+1)
 * - Skip a day = streak breaks (reset to 1)
 * - Multiple completions same day = no change
 * 
 * @param userId - User ID
 * @param completedAt - Quiz completion timestamp (defaults to now)
 * @returns Streak result with continuation status
 */
export async function updateUniversalStreak(
  userId: string,
  completedAt: Date = new Date()
): Promise<StreakResult> {
  const now = completedAt
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Get current user streak data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      streak: true,
      longestStreak: true,
      lastReviewDate: true
    }
  })

  if (!user) {
    throw new Error('User not found')
  }

  let newStreak = 1
  let streakContinued = false
  const lastReview = user.lastReviewDate

  if (lastReview) {
    const lastReviewDay = new Date(lastReview)
    lastReviewDay.setHours(0, 0, 0, 0)

    // Same day - no change to streak (already completed today)
    if (lastReviewDay.getTime() === today.getTime()) {
      console.log(`[UniversalStreak] User ${userId} already completed quiz today - no streak change`)
      return {
        streakContinued: false,
        currentStreak: user.streak,
        longestStreak: user.longestStreak,
        isNewRecord: false
      }
    }

    // Yesterday - continue streak
    if (lastReviewDay.getTime() === yesterday.getTime()) {
      newStreak = user.streak + 1
      streakContinued = true
      console.log(`[UniversalStreak] User ${userId} continued streak: ${user.streak} → ${newStreak}`)
    } else {
      // Earlier than yesterday - streak broken, restart at 1
      console.log(`[UniversalStreak] User ${userId} streak broken, restarting: ${user.streak} → 1`)
    }
  } else {
    console.log(`[UniversalStreak] User ${userId} starting new streak`)
  }

  const newLongestStreak = Math.max(newStreak, user.longestStreak)
  const isNewRecord = newStreak === newLongestStreak && newStreak > (user.longestStreak || 0)

  // Update user's streak using EXISTING fields
  await prisma.user.update({
    where: { id: userId },
    data: {
      streak: newStreak,
      longestStreak: newLongestStreak,
      lastReviewDate: now
    }
  })

  if (isNewRecord) {
    console.log(`[UniversalStreak] 🎉 User ${userId} set new personal record: ${newStreak} days!`)
  }

  return {
    streakContinued,
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    isNewRecord
  }
}

/**
 * Calculate per-quiz streak using UserQuizAttempt history
 * NO NEW DATABASE FIELDS - computed on the fly from existing data
 * 
 * @param userId - User ID
 * @param userQuizId - Quiz ID
 * @returns Current and longest streak for this specific quiz
 */
async function calculatePerQuizStreak(
  userId: string,
  userQuizId: number
): Promise<PerQuizStreak> {
  // Get all attempts for this quiz, ordered by date (newest first)
  const attempts = await prisma.userQuizAttempt.findMany({
    where: {
      userId,
      userQuizId
    },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true }
  })

  if (attempts.length === 0) {
    return { 
      currentStreak: 0, 
      longestStreak: 0,
      totalAttempts: 0,
      lastAttempt: null
    }
  }

  // Calculate streaks from attempt dates
  let currentStreak = 1
  let longestStreak = 1
  let tempStreak = 1

  for (let i = 0; i < attempts.length - 1; i++) {
    const current = new Date(attempts[i].createdAt)
    current.setHours(0, 0, 0, 0)
    
    const next = new Date(attempts[i + 1].createdAt)
    next.setHours(0, 0, 0, 0)

    const daysDiff = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === 1) {
      // Consecutive days
      if (i === 0) currentStreak++
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else if (daysDiff === 0) {
      // Same day - continue counting temp streak
      continue
    } else {
      // Streak broken
      tempStreak = 1
    }
  }

  return { 
    currentStreak, 
    longestStreak,
    totalAttempts: attempts.length,
    lastAttempt: attempts[0].createdAt
  }
}

/**
 * Get user's current streak statistics
 * Uses EXISTING database fields
 * 
 * @param userId - User ID
 * @returns Complete streak statistics
 */
export async function getUserStreakStats(userId: string): Promise<StreakStats> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      streak: true,
      longestStreak: true,
      lastReviewDate: true
    }
  })

  if (!user) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivity: null,
      isActiveToday: false,
      needsQuizToday: false,
      daysUntilBreak: 0
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastReview = user.lastReviewDate
  let isActiveToday = false
  let needsQuizToday = false
  let daysUntilBreak = 0

  if (lastReview) {
    const lastReviewDay = new Date(lastReview)
    lastReviewDay.setHours(0, 0, 0, 0)

    // Check if completed today
    isActiveToday = lastReviewDay.getTime() === today.getTime()

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Need quiz today if haven't completed and had active streak yesterday
    if (!isActiveToday) {
      const hasActiveStreak = user.streak > 0
      const completedYesterday = lastReviewDay.getTime() === yesterday.getTime()
      needsQuizToday = hasActiveStreak && completedYesterday
      
      // Days until streak breaks (if have active streak)
      if (hasActiveStreak) {
        const daysSinceLastReview = Math.floor((today.getTime() - lastReviewDay.getTime()) / (1000 * 60 * 60 * 24))
        daysUntilBreak = Math.max(0, 1 - daysSinceLastReview)
      }
    } else {
      daysUntilBreak = 1 // Safe for today, come back tomorrow
    }
  } else {
    // No activity yet
    needsQuizToday = false
  }

  return {
    currentStreak: user.streak,
    longestStreak: user.longestStreak,
    lastActivity: user.lastReviewDate,
    isActiveToday,
    needsQuizToday,
    daysUntilBreak
  }
}

/**
 * Check and break expired streaks (call this in daily cron job)
 * Finds users who haven't completed a quiz in 2+ days and resets their streak
 * 
 * @returns Number of users whose streaks were broken
 */
async function checkAndBreakExpiredStreaks(): Promise<number> {
  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
  twoDaysAgo.setHours(0, 0, 0, 0)

  // Find users with active streaks who haven't completed quiz since 2 days ago
  const usersWithExpiredStreaks = await prisma.user.findMany({
    where: {
      streak: { gt: 0 },
      OR: [
        { lastReviewDate: { lt: twoDaysAgo } },
        { lastReviewDate: null }
      ]
    },
    select: { id: true, streak: true, email: true }
  })

  if (usersWithExpiredStreaks.length === 0) {
    console.log('[UniversalStreak] No expired streaks found')
    return 0
  }

  // Reset their streaks
  await prisma.user.updateMany({
    where: {
      id: { in: usersWithExpiredStreaks.map(u => u.id) }
    },
    data: { streak: 0 }
  })

  console.log(`[UniversalStreak] Broke ${usersWithExpiredStreaks.length} expired streaks`)
  
  // Log details for monitoring
  usersWithExpiredStreaks.forEach(user => {
    console.log(`  - User ${user.email || user.id}: ${user.streak} day streak ended`)
  })

  return usersWithExpiredStreaks.length
}

/**
 * Get streak statistics for multiple users (for leaderboards)
 * 
 * @param userIds - Array of user IDs
 * @returns Array of streak stats
 */
async function getBulkStreakStats(userIds: string[]) {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      image: true,
      streak: true,
      longestStreak: true,
      lastReviewDate: true
    },
    orderBy: { streak: 'desc' }
  })

  return users.map(user => ({
    userId: user.id,
    name: user.name,
    image: user.image,
    currentStreak: user.streak,
    longestStreak: user.longestStreak,
    lastActivity: user.lastReviewDate
  }))
}

/**
 * Get top streaks globally (for leaderboards)
 * 
 * @param limit - Number of top users to return
 * @returns Top users by current streak
 */
async function getTopStreaks(limit: number = 10) {
  const topUsers = await prisma.user.findMany({
    where: { 
      streak: { gt: 0 },
      isActive: true
    },
    select: {
      id: true,
      name: true,
      image: true,
      streak: true,
      longestStreak: true
    },
    orderBy: { streak: 'desc' },
    take: limit
  })

  return topUsers.map((user, index) => ({
    rank: index + 1,
    userId: user.id,
    name: user.name || 'Anonymous',
    image: user.image,
    currentStreak: user.streak,
    longestStreak: user.longestStreak
  }))
}

/**
 * Check if user should receive streak milestone reward
 * 
 * @param streak - Current streak
 * @returns Milestone info if reached, null otherwise
 */
function getStreakMilestone(streak: number) {
  const MILESTONES = {
    3: { credits: 10, badge: 'bronze-streak', title: '3-Day Warrior' },
    7: { credits: 25, badge: 'silver-streak', title: 'Week Warrior' },
    14: { credits: 50, badge: 'gold-streak', title: 'Two-Week Champion' },
    30: { credits: 100, badge: 'diamond-streak', title: 'Monthly Master' },
    50: { credits: 200, badge: 'platinum-streak', title: 'Unstoppable' },
    100: { credits: 500, badge: 'legend-streak', title: 'Legendary Learner' },
    365: { credits: 2000, badge: 'year-streak', title: 'Year-Long Legend' }
  }

  return MILESTONES[streak as keyof typeof MILESTONES] || null
}
