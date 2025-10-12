/**
 * Adaptive Learning Tracking System - In-Memory Version
 * 
 * Tracks user performance across topics and adjusts difficulty dynamically
 * to maintain optimal learning engagement (Flow State Theory - 70-85% success rate)
 * 
 * NOTE: This is a simplified in-memory version. For production persistence,
 * uncomment the Prisma code in adaptive-learning.ts after running:
 * npx prisma generate
 */

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

// In-memory storage (will reset on page refresh)
const topicProgressMap = new Map<string, TopicProgress>()

/**
 * Calculate mastery score (0-100) based on performance metrics
 */
export function calculateMasteryScore(
  correctAnswers: number,
  totalAttempts: number,
  currentStreak: number,
  averageTime: number,
  difficultyLevel: string
): number {
  if (totalAttempts === 0) return 0

  const successRate = correctAnswers / totalAttempts
  const successScore = successRate * 50

  const streakScore = Math.min((currentStreak / 10) * 20, 20)

  const idealTime = 30
  const timeScore = averageTime > 0 
    ? Math.max(0, 15 * (1 - Math.abs(averageTime - idealTime) / idealTime))
    : 0

  const difficultyMultiplier = {
    'EASY': 0.8,
    'MEDIUM': 1.0,
    'HARD': 1.2
  }[difficultyLevel] || 1.0

  const difficultyScore = 15 * difficultyMultiplier

  return Math.round(Math.min(100, successScore + streakScore + timeScore + difficultyScore))
}

/**
 * Track performance for a topic (in-memory version)
 */
export async function trackPerformance(
  userId: string,
  metrics: PerformanceMetrics
): Promise<TopicProgress> {
  const key = `${userId}-${metrics.topic}`
  const existing = topicProgressMap.get(key) || {
    topic: metrics.topic,
    correctAnswers: 0,
    totalAttempts: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageTime: 0,
    difficultyLevel: metrics.difficulty,
    masteryScore: 0,
    successRate: 0,
    recommendedDifficulty: 'MEDIUM' as const
  }

  const newCorrectAnswers = existing.correctAnswers + (metrics.isCorrect ? 1 : 0)
  const newTotalAttempts = existing.totalAttempts + 1
  const newCurrentStreak = metrics.isCorrect ? existing.currentStreak + 1 : 0
  const newLongestStreak = Math.max(existing.longestStreak, newCurrentStreak)
  
  const newAverageTime = existing.totalAttempts > 0
    ? (existing.averageTime * existing.totalAttempts + metrics.timeSpent) / newTotalAttempts
    : metrics.timeSpent

  const successRate = newCorrectAnswers / newTotalAttempts
  const masteryScore = calculateMasteryScore(
    newCorrectAnswers,
    newTotalAttempts,
    newCurrentStreak,
    newAverageTime,
    metrics.difficulty
  )

  let recommendedDifficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM'
  if (successRate >= 0.85 && newCurrentStreak >= 3) {
    recommendedDifficulty = metrics.difficulty === 'EASY' ? 'MEDIUM' : 'HARD'
  } else if (successRate < 0.6) {
    recommendedDifficulty = metrics.difficulty === 'HARD' ? 'MEDIUM' : 'EASY'
  } else {
    recommendedDifficulty = metrics.difficulty
  }

  const updated: TopicProgress = {
    topic: metrics.topic,
    correctAnswers: newCorrectAnswers,
    totalAttempts: newTotalAttempts,
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    averageTime: newAverageTime,
    difficultyLevel: metrics.difficulty,
    masteryScore,
    successRate,
    recommendedDifficulty
  }

  topicProgressMap.set(key, updated)
  return updated
}

/**
 * Get progress for a specific topic
 */
export async function getTopicProgress(
  userId: string,
  topic: string
): Promise<TopicProgress | null> {
  const key = `${userId}-${topic}`
  return topicProgressMap.get(key) || null
}

/**
 * Get all topics for a user
 */
export async function getAllTopicsForUser(userId: string): Promise<TopicProgress[]> {
  const results: TopicProgress[] = []
  topicProgressMap.forEach((value, key) => {
    if (key.startsWith(`${userId}-`)) {
      results.push(value)
    }
  })
  return results.sort((a, b) => b.masteryScore - a.masteryScore)
}

/**
 * Get struggling topics (success rate < 60%)
 */
export async function getStrugglingTopics(
  userId: string,
  threshold = 0.6
): Promise<TopicProgress[]> {
  const allTopics = await getAllTopicsForUser(userId)
  return allTopics
    .filter(topic => topic.successRate < threshold && topic.totalAttempts >= 3)
    .sort((a, b) => a.successRate - b.successRate)
}

/**
 * Reset progress for a topic
 */
export async function resetTopicProgress(userId: string, topic: string): Promise<void> {
  const key = `${userId}-${topic}`
  topicProgressMap.delete(key)
}

export default {
  trackPerformance,
  getTopicProgress,
  getAllTopicsForUser,
  getStrugglingTopics,
  resetTopicProgress,
  calculateMasteryScore
}
