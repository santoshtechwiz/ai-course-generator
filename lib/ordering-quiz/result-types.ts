/**
 * Type definitions for Ordering Quiz Results and Analytics
 */

import { OrderingQuizMetrics } from "./scoring-service"

/**
 * Single quiz attempt record
 */
export interface QuizAttempt {
  id: string
  quizId: string
  userId: string
  userOrder: number[]
  timeTakenMs: number
  metrics: OrderingQuizMetrics
  createdAt: Date
  updatedAt: Date
}

/**
 * User's overall analytics across all ordering quizzes
 */
export interface OrderingQuizAnalytics {
  userId: string
  totalAttempts: number
  successfulAttempts: number // Perfect score
  partialAttempts: number // Non-zero score
  averageScore: number
  averageAccuracy: number
  averageTimeTaken: number
  bestScore: number
  worstScore: number
  bestTime: number
  worseTime: number
  topicsAttempted: string[]
  totalTimeSaved: number // Sum of speed bonuses
  achievedGrades: Record<"A" | "B" | "C" | "D" | "F", number>
  streak: number // Current success streak
  totalQuizzesGenerated: number
  subscriptionTier: "FREE" | "PREMIUM" | "PRO"
}

/**
 * Quiz generation record
 */
export interface OrderingQuizRecord {
  id: string
  topic: string
  title: string
  description?: string
  steps: QuizStep[]
  correctOrder: number[]
  difficulty: "easy" | "medium" | "hard"
  explanations: string[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Single step in a quiz
 */
export interface QuizStep {
  id: number
  content: string
  explanation: string
}

/**
 * Daily usage tracking
 */
export interface DailyGenerationLog {
  userId: string
  date: Date
  generatedCount: number
  subscriptionTier: "FREE" | "PREMIUM" | "PRO"
}

/**
 * Complete result data for UI display
 */
export interface OrderingQuizResultData {
  attempt: QuizAttempt
  quiz: OrderingQuizRecord
  userStats?: OrderingQuizAnalytics
  comparison?: ComparisonData
}

/**
 * Comparison data for progress tracking
 */
export interface ComparisonData {
  personalBest: number
  userAverage: number
  platformAverage: number
  improvementPercent: number
  rank?: number // User's rank if available
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  userId: string
  userName: string
  avatar?: string
  averageScore: number
  totalAttempts: number
  bestScore: number
  rank: number
}

/**
 * Batch attempt submission
 */
export interface BatchAttemptSubmission {
  quizId: string
  userOrder: number[]
  timeTakenMs: number
  deviceInfo?: {
    browser: string
    platform: string
  }
}

/**
 * Batch result response
 */
export interface BatchAttemptResponse {
  success: boolean
  attemptId: string
  metrics: OrderingQuizMetrics
  message: string
  error?: string
}

/**
 * Skill level based on historical performance
 */
export type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert"

/**
 * Calculate skill level from analytics
 */
export function calculateSkillLevel(analytics: OrderingQuizAnalytics): SkillLevel {
  if (analytics.totalAttempts === 0) return "Beginner"

  const successRate = analytics.successfulAttempts / analytics.totalAttempts
  const avgScore = analytics.averageScore

  if (successRate >= 0.8 && avgScore >= 85) return "Expert"
  if (successRate >= 0.6 && avgScore >= 75) return "Advanced"
  if (successRate >= 0.4 && avgScore >= 65) return "Intermediate"
  return "Beginner"
}

/**
 * Badge achievement system
 */
export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earned: boolean
  earnedAt?: Date
  category: "speed" | "accuracy" | "streak" | "volume" | "special"
}

/**
 * Achievement conditions
 */
export const BADGE_CONDITIONS = {
  // Speed badges
  speed_demon: {
    condition: (analytics: OrderingQuizAnalytics) => analytics.bestTime < 30000,
    badge: {
      name: "Speed Demon",
      description: "Complete a quiz in under 30 seconds",
      icon: "⚡",
      category: "speed" as const,
    },
  },
  // Accuracy badges
  perfect_storm: {
    condition: (analytics: OrderingQuizAnalytics) =>
      analytics.achievedGrades["A"] >= 5,
    badge: {
      name: "Perfect Storm",
      description: "Get 5 perfect scores",
      icon: "🎯",
      category: "accuracy" as const,
    },
  },
  // Streak badges
  hot_streak: {
    condition: (analytics: OrderingQuizAnalytics) => analytics.streak >= 10,
    badge: {
      name: "Hot Streak",
      description: "Maintain a 10-quiz success streak",
      icon: "🔥",
      category: "streak" as const,
    },
  },
  // Volume badges
  quiz_master: {
    condition: (analytics: OrderingQuizAnalytics) =>
      analytics.totalAttempts >= 50,
    badge: {
      name: "Quiz Master",
      description: "Complete 50 quizzes",
      icon: "🏆",
      category: "volume" as const,
    },
  },
}
