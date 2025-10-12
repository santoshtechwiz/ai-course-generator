/**
 * Adaptive Learning Tracking System
 * 
 * Tracks user performance across topics and adjusts difficulty dynamically
 * to maintain optimal learning engagement (Flow State Theory - 70-85% success rate)
 */

import { prisma } from '@/lib/db'

export interface PerformanceMetrics {
  topic: string
  isCorrect: boolean
  timeSpent: number // seconds
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  hintsUsed: number
}

export interface TopicProgress {
  topic: string
  correctAnswers: number
  totalAttempts: number
  currentStreak: number
  longestStreak: number
  averageTime: number
  difficultyLevel: string
  masteryScore: number
  successRate: number
  recommendedDifficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

/**
 * Calculate mastery score (0-100) based on performance metrics
 * Factors:
 * - Success rate (50% weight)
 * - Streak performance (20% weight)
 * - Time efficiency (15% weight)
 * - Difficulty level (15% weight)
 */
export function calculateMasteryScore(
  correctAnswers: number,
  totalAttempts: number,
  currentStreak: number,
  averageTime: number,
  difficultyLevel: string
): number {
  if (totalAttempts === 0) return 0

  // Success rate component (0-50 points)
  const successRate = correctAnswers / totalAttempts
  const successScore = successRate * 50

  // Streak component (0-20 points) - rewards consistency
  const streakScore = Math.min(currentStreak / 10, 1) * 20

  // Time efficiency component (0-15 points)
  // Ideal time: 30-60 seconds per question
  const timeEfficiency = averageTime > 0 
    ? Math.max(0, 1 - Math.abs(averageTime - 45) / 100)
    : 0
  const timeScore = timeEfficiency * 15

  // Difficulty bonus (0-15 points)
  const difficultyMultiplier = {
    'EASY': 0.5,
    'MEDIUM': 1.0,
    'HARD': 1.5
  }[difficultyLevel] || 1.0
  const difficultyScore = Math.min(difficultyMultiplier * 10, 15)

  const totalScore = successScore + streakScore + timeScore + difficultyScore

  return Math.min(Math.round(totalScore * 100) / 100, 100)
}

/**
 * Recommend next difficulty level based on performance
 * 
 * Strategy:
 * - 90%+ success → increase difficulty
 * - 70-85% success → maintain difficulty (optimal zone)
 * - 50-70% success → decrease difficulty if struggling for 5+ attempts
 * - <50% success → decrease difficulty immediately
 */
export function recommendDifficulty(
  correctAnswers: number,
  totalAttempts: number,
  currentDifficulty: 'EASY' | 'MEDIUM' | 'HARD'
): 'EASY' | 'MEDIUM' | 'HARD' {
  if (totalAttempts < 3) return currentDifficulty // Need more data

  const successRate = correctAnswers / totalAttempts

  // High success rate - challenge more
  if (successRate >= 0.90) {
    if (currentDifficulty === 'EASY') return 'MEDIUM'
    if (currentDifficulty === 'MEDIUM') return 'HARD'
    return 'HARD'
  }

  // Optimal zone - maintain
  if (successRate >= 0.70 && successRate < 0.90) {
    return currentDifficulty
  }

  // Moderate struggle - decrease if sustained
  if (successRate >= 0.50 && successRate < 0.70) {
    if (totalAttempts >= 5) {
      if (currentDifficulty === 'HARD') return 'MEDIUM'
      if (currentDifficulty === 'MEDIUM') return 'EASY'
    }
    return currentDifficulty
  }

  // Low success rate - decrease immediately
  if (currentDifficulty === 'HARD') return 'MEDIUM'
  if (currentDifficulty === 'MEDIUM') return 'EASY'
  return 'EASY'
}

/**
 * Track performance for a quiz question and update user's topic progress
 */
export async function trackPerformance(
  userId: string,
  metrics: PerformanceMetrics
): Promise<TopicProgress | null> {
  try {
    const { topic, isCorrect, timeSpent, hintsUsed } = metrics

    // Get or create topic progress
    const existing = await prisma.userTopicProgress.findUnique({
      where: {
        userId_topic: {
          userId,
          topic
        }
      }
    })

    const correctAnswers = (existing?.correctAnswers || 0) + (isCorrect ? 1 : 0)
    const totalAttempts = (existing?.totalAttempts || 0) + 1
    const currentStreak = isCorrect 
      ? (existing?.currentStreak || 0) + 1 
      : 0
    const longestStreak = Math.max(
      currentStreak,
      existing?.longestStreak || 0
    )

    // Calculate rolling average time
    const previousAverage = existing?.averageTime || 0
    const previousCount = existing?.totalAttempts || 0
    const averageTime = previousCount > 0
      ? (previousAverage * previousCount + timeSpent) / (previousCount + 1)
      : timeSpent

    // Calculate mastery score
    const difficultyLevel = existing?.difficultyLevel || 'MEDIUM'
    const masteryScore = calculateMasteryScore(
      correctAnswers,
      totalAttempts,
      currentStreak,
      averageTime,
      difficultyLevel
    )

    // Recommend next difficulty
    const recommendedDifficulty = recommendDifficulty(
      correctAnswers,
      totalAttempts,
      difficultyLevel as 'EASY' | 'MEDIUM' | 'HARD'
    )

    // Update database
    const updated = await prisma.userTopicProgress.upsert({
      where: {
        userId_topic: {
          userId,
          topic
        }
      },
      update: {
        correctAnswers,
        totalAttempts,
        currentStreak,
        longestStreak,
        averageTime,
        difficultyLevel: recommendedDifficulty,
        masteryScore,
        lastAttemptAt: new Date()
      },
      create: {
        userId,
        topic,
        correctAnswers,
        totalAttempts,
        currentStreak,
        longestStreak,
        averageTime,
        difficultyLevel: recommendedDifficulty,
        masteryScore,
        lastAttemptAt: new Date()
      }
    })

    return {
      topic: updated.topic,
      correctAnswers: updated.correctAnswers,
      totalAttempts: updated.totalAttempts,
      currentStreak: updated.currentStreak,
      longestStreak: updated.longestStreak,
      averageTime: updated.averageTime,
      difficultyLevel: updated.difficultyLevel,
      masteryScore: updated.masteryScore,
      successRate: updated.correctAnswers / updated.totalAttempts,
      recommendedDifficulty: recommendedDifficulty
    }
  } catch (error) {
    console.error('[AdaptiveLearning] Error tracking performance:', error)
    return null
  }
}

/**
 * Get user's progress for a specific topic
 */
export async function getTopicProgress(
  userId: string,
  topic: string
): Promise<TopicProgress | null> {
  try {
    const progress = await prisma.userTopicProgress.findUnique({
      where: {
        userId_topic: {
          userId,
          topic
        }
      }
    })

    if (!progress) return null

    const recommendedDifficulty = recommendDifficulty(
      progress.correctAnswers,
      progress.totalAttempts,
      progress.difficultyLevel as 'EASY' | 'MEDIUM' | 'HARD'
    )

    return {
      topic: progress.topic,
      correctAnswers: progress.correctAnswers,
      totalAttempts: progress.totalAttempts,
      currentStreak: progress.currentStreak,
      longestStreak: progress.longestStreak,
      averageTime: progress.averageTime,
      difficultyLevel: progress.difficultyLevel,
      masteryScore: progress.masteryScore,
      successRate: progress.totalAttempts > 0 
        ? progress.correctAnswers / progress.totalAttempts 
        : 0,
      recommendedDifficulty
    }
  } catch (error) {
    console.error('[AdaptiveLearning] Error getting topic progress:', error)
    return null
  }
}

/**
 * Get all topics for a user sorted by mastery score
 */
export async function getUserTopicsOverview(
  userId: string
): Promise<TopicProgress[]> {
  try {
    const topics = await prisma.userTopicProgress.findMany({
      where: { userId },
      orderBy: { masteryScore: 'desc' }
    })

    return topics.map(topic => ({
      topic: topic.topic,
      correctAnswers: topic.correctAnswers,
      totalAttempts: topic.totalAttempts,
      currentStreak: topic.currentStreak,
      longestStreak: topic.longestStreak,
      averageTime: topic.averageTime,
      difficultyLevel: topic.difficultyLevel,
      masteryScore: topic.masteryScore,
      successRate: topic.totalAttempts > 0 
        ? topic.correctAnswers / topic.totalAttempts 
        : 0,
      recommendedDifficulty: recommendDifficulty(
        topic.correctAnswers,
        topic.totalAttempts,
        topic.difficultyLevel as 'EASY' | 'MEDIUM' | 'HARD'
      )
    }))
  } catch (error) {
    console.error('[AdaptiveLearning] Error getting topics overview:', error)
    return []
  }
}

/**
 * Get topics where user needs improvement (mastery < 50)
 */
export async function getWeakTopics(userId: string): Promise<TopicProgress[]> {
  try {
    const topics = await prisma.userTopicProgress.findMany({
      where: {
        userId,
        masteryScore: {
          lt: 50
        }
      },
      orderBy: { masteryScore: 'asc' },
      take: 5
    })

    return topics.map(topic => ({
      topic: topic.topic,
      correctAnswers: topic.correctAnswers,
      totalAttempts: topic.totalAttempts,
      currentStreak: topic.currentStreak,
      longestStreak: topic.longestStreak,
      averageTime: topic.averageTime,
      difficultyLevel: topic.difficultyLevel,
      masteryScore: topic.masteryScore,
      successRate: topic.totalAttempts > 0 
        ? topic.correctAnswers / topic.totalAttempts 
        : 0,
      recommendedDifficulty: recommendDifficulty(
        topic.correctAnswers,
        topic.totalAttempts,
        topic.difficultyLevel as 'EASY' | 'MEDIUM' | 'HARD'
      )
    }))
  } catch (error) {
    console.error('[AdaptiveLearning] Error getting weak topics:', error)
    return []
  }
}

/**
 * Reset topic progress (useful for retaking topics from scratch)
 */
export async function resetTopicProgress(
  userId: string,
  topic: string
): Promise<boolean> {
  try {
    await prisma.userTopicProgress.delete({
      where: {
        userId_topic: {
          userId,
          topic
        }
      }
    })
    return true
  } catch (error) {
    console.error('[AdaptiveLearning] Error resetting topic:', error)
    return false
  }
}
