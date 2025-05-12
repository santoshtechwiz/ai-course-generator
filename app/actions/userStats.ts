"use server"
import { prisma } from "@/lib/db"
import type { UserStats } from "../types/types"

// Add this helper function at the top of the file
function safeAverage(total: number, count: number): number {
  return count > 0 ? total / count : 0
}

// Replace the entire getUserStats function with this improved implementation
export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    // Get user quiz attempts with related data
    const quizAttempts = await prisma.userQuizAttempt.findMany({
      where: { userId },
      include: {
        userQuiz: {
          select: {
            id: true,
            title: true,
            quizType: true,
            difficulty: true,
            questions: {
              select: {
                id: true,
                question: true,
                answer: true,
                questionType: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Get course progress data
    const courseProgress = await prisma.courseProgress.findMany({
      where: { userId },
      select: {
        progress: true,
        timeSpent: true,
        isCompleted: true,
        course: {
          select: {
            title: true,
            category: { select: { name: true } },
          },
        },
      },
    })

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        streakDays: true,
        lastActiveAt: true,
      },
    })

    if (!user) {
      throw new Error("User not found")
    }

    // Calculate basic stats
    const totalQuizzes = await prisma.userQuiz.count({ where: { userId } })
    const totalAttempts = quizAttempts.length

    // Calculate scores
    let totalScore = 0
    let highestScore = 0
    let totalTimeSpent = 0

    // Topic performance tracking
    const topicPerformance: Record<string, { totalScore: number; attempts: number; timeSpent: number }> = {}

    // Process each attempt
    quizAttempts.forEach((attempt) => {
      const score = attempt.score || 0
      totalScore += score
      totalTimeSpent += attempt.timeSpent || 0

      if (score > highestScore) {
        highestScore = score
      }

      // Track topic performance
      const topic = attempt.userQuiz?.title || "Unknown"
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = { totalScore: 0, attempts: 0, timeSpent: 0 }
      }

      topicPerformance[topic].totalScore += score
      topicPerformance[topic].attempts += 1
      topicPerformance[topic].timeSpent += attempt.timeSpent || 0
    })

    // Calculate averages
    const averageScore = totalAttempts > 0 ? totalScore / totalAttempts : 0

    // Calculate course stats
    const completedCourses = courseProgress.filter((course) => course.isCompleted).length
    const totalCourses = courseProgress.length
    const courseCompletionRate = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0

    // Calculate course time spent
    const totalCourseTimeSpent = courseProgress.reduce((sum, course) => sum + (course.timeSpent || 0), 0)

    // Format topic performance for display
    const topPerformingTopics = Object.entries(topicPerformance)
      .map(([topic, data]) => ({
        topic,
        title: topic,
        averageScore: data.attempts > 0 ? data.totalScore / data.attempts : 0,
        attempts: data.attempts,
        averageTimeSpent: data.attempts > 0 ? data.timeSpent / data.attempts : 0,
        difficulty: "medium", // Default difficulty if not available
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5)

    // Calculate improvement (comparing last 5 attempts with previous 5)
    let recentImprovement = 0
    if (quizAttempts.length >= 10) {
      const firstHalf = quizAttempts.slice(5, 10)
      const secondHalf = quizAttempts.slice(0, 5)

      const firstHalfAvg = firstHalf.reduce((sum, a) => sum + (a.score || 0), 0) / 5
      const secondHalfAvg = secondHalf.reduce((sum, a) => sum + (a.score || 0), 0) / 5

      recentImprovement = secondHalfAvg - firstHalfAvg
    }

    // Calculate quizzes per month
    const firstQuizDate =
      quizAttempts.length > 0 ? new Date(quizAttempts[quizAttempts.length - 1].createdAt) : new Date()

    const monthsSinceFirstQuiz = Math.max(
      (Date.now() - firstQuizDate.getTime()) / (30 * 24 * 60 * 60 * 1000),
      0.1, // Avoid division by zero
    )

    const quizzesPerMonth = totalQuizzes / monthsSinceFirstQuiz

    // Calculate quiz type distribution
    const quizTypeDistribution: Record<string, number> = {}
    quizAttempts.forEach((attempt) => {
      const quizType = attempt.userQuiz?.quizType || "unknown"
      quizTypeDistribution[quizType] = (quizTypeDistribution[quizType] || 0) + 1
    })

    // Return comprehensive stats
    return {
      totalQuizzes,
      totalAttempts,
      averageScore,
      highestScore,
      completedCourses,
      totalCourses,
      totalTimeSpent: totalTimeSpent + totalCourseTimeSpent,
      averageTimePerQuiz: totalAttempts > 0 ? totalTimeSpent / totalAttempts : 0,
      topPerformingTopics,
      recentImprovement,
      quizzesPerMonth,
      courseCompletionRate,
      consistencyScore: calculateConsistencyScore(quizAttempts, user),
      learningEfficiency: calculateLearningEfficiency(quizAttempts),
      difficultyProgression: calculateDifficultyProgression(quizAttempts),
      averageAccuracy: calculateAverageAccuracy(quizAttempts),
      streakDays: user.streakDays || 0,
      engagementScore: calculateEngagementScore(quizAttempts, user),
      quizTypeDistribution,
      learningPatterns: {
        morningQuizzes: countQuizzesByTimeOfDay(quizAttempts, 5, 12),
        afternoonQuizzes: countQuizzesByTimeOfDay(quizAttempts, 12, 18),
        eveningQuizzes: countQuizzesByTimeOfDay(quizAttempts, 18, 22),
        nightQuizzes: countQuizzesByTimeOfDay(quizAttempts, 22, 5),
      },
      strengthAreas: identifyStrengthAreas(topicPerformance),
      improvementAreas: identifyImprovementAreas(topicPerformance),
    }
  } catch (error) {
    console.error("Error fetching user stats:", error)
    // Return default stats to prevent UI errors
    return getDefaultUserStats()
  }
}

// Optimize the calculateConsistencyScore function
function calculateConsistencyScore(attempts: any[], user?: { lastActiveAt: Date } | null): number {
  if (!attempts.length) return 0
  if (attempts.length === 1) return 50

  // Sort attempts by date
  const sortedAttempts = [...attempts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const oneDayMs = 24 * 60 * 60 * 1000

  // Calculate average days between attempts
  let totalDaysDiff = 0

  for (let i = 1; i < sortedAttempts.length; i++) {
    const currentDate = new Date(sortedAttempts[i].createdAt)
    const previousDate = new Date(sortedAttempts[i - 1].createdAt)
    const daysDiff = Math.min(
      Math.abs(Math.round((currentDate.getTime() - previousDate.getTime()) / oneDayMs)),
      7, // Cap at 7 days
    )
    totalDaysDiff += daysDiff
  }

  // Calculate recency factor
  let recencyFactor = 1
  if (user?.lastActiveAt) {
    const daysSinceLastActive = Math.round((Date.now() - new Date(user.lastActiveAt).getTime()) / oneDayMs)
    recencyFactor = Math.max(0.5, 1 - daysSinceLastActive / 14)
  }

  const averageDaysBetweenAttempts = sortedAttempts.length > 1 ? totalDaysDiff / (sortedAttempts.length - 1) : 7
  const baseConsistencyScore = Math.max(0, 100 - (averageDaysBetweenAttempts / 7) * 100)
  const frequencyBonus = Math.min(20, attempts.length / 2)

  return Math.min(100, (baseConsistencyScore + frequencyBonus) * recencyFactor)
}

// Helper function to calculate learning efficiency
function calculateLearningEfficiency(attempts: any[]): number {
  if (attempts.length === 0) return 0

  let totalScore = 0
  let totalTime = 0

  attempts.forEach((attempt) => {
    totalScore += attempt.score || 0
    totalTime += attempt.timeSpent || 0
  })

  if (totalTime === 0) return 0

  // Convert to minutes and scale to 0-100
  const averageScorePerMinute = totalScore / attempts.length / (totalTime / 60)
  return Math.min(averageScorePerMinute * 10, 100)
}

// Helper function to calculate difficulty progression
function calculateDifficultyProgression(attempts: any[]): number {
  if (attempts.length < 4) return 0

  // Sort by date
  const sortedAttempts = [...attempts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  // Split into quarters
  const quarterSize = Math.floor(sortedAttempts.length / 4)
  const firstQuarter = sortedAttempts.slice(0, quarterSize)
  const lastQuarter = sortedAttempts.slice(-quarterSize)

  // Calculate average scores
  const firstQuarterScore = firstQuarter.reduce((sum, a) => sum + (a.score || 0), 0) / firstQuarter.length
  const lastQuarterScore = lastQuarter.reduce((sum, a) => sum + (a.score || 0), 0) / lastQuarter.length

  // Simple improvement score
  return lastQuarterScore - firstQuarterScore
}

// Helper function to calculate average accuracy
function calculateAverageAccuracy(attempts: any[]): number {
  if (attempts.length === 0) return 0

  const totalAccuracy = attempts.reduce((sum, attempt) => sum + (attempt.accuracy || 0), 0)
  return totalAccuracy / attempts.length
}

// Helper function to calculate engagement score
function calculateEngagementScore(attempts: any[], user?: { lastActiveAt: Date } | null): number {
  if (attempts.length === 0) return 0

  // Factors: frequency, recency, completion rate
  const frequencyScore = Math.min(100, attempts.length * 5)

  // Recency score
  let recencyScore = 0
  if (user?.lastActiveAt) {
    const daysSinceLastActive = Math.round((Date.now() - new Date(user.lastActiveAt).getTime()) / (24 * 60 * 60 * 1000))
    recencyScore = Math.max(0, 100 - daysSinceLastActive * 10)
  }

  // Completion rate
  const completedAttempts = attempts.filter((a) => a.score !== null).length
  const completionRate = (completedAttempts / attempts.length) * 100

  // Weighted average
  return frequencyScore * 0.4 + recencyScore * 0.3 + completionRate * 0.3
}

// Optimize the countQuizzesByTimeOfDay function
function countQuizzesByTimeOfDay(attempts: any[], startHour: number, endHour: number): number {
  return attempts.filter((attempt) => {
    const hour = new Date(attempt.createdAt).getHours()
    return startHour < endHour ? hour >= startHour && hour < endHour : hour >= startHour || hour < endHour // Handle overnight periods
  }).length
}

// Helper function to identify strength areas
function identifyStrengthAreas(
  topicPerformance: Record<string, { totalScore: number; attempts: number; timeSpent?: number }>,
): string[] {
  return Object.entries(topicPerformance)
    .filter(([_, data]) => data.attempts >= 2 && data.totalScore / data.attempts >= 80)
    .sort((a, b) => b[1].totalScore / b[1].attempts - a[1].totalScore / a[1].attempts)
    .slice(0, 3)
    .map(([topic]) => topic)
}

// Helper function to identify improvement areas
function identifyImprovementAreas(
  topicPerformance: Record<string, { totalScore: number; attempts: number; timeSpent?: number }>,
): string[] {
  return Object.entries(topicPerformance)
    .filter(([_, data]) => data.attempts >= 2 && data.totalScore / data.attempts < 70)
    .sort((a, b) => a[1].totalScore / a[1].attempts - b[1].totalScore / a[1].attempts)
    .slice(0, 3)
    .map(([topic]) => topic)
}

// Provide default stats to prevent UI errors
function getDefaultUserStats(): UserStats {
  return {
    totalQuizzes: 0,
    totalAttempts: 0,
    averageScore: 0,
    highestScore: 0,
    completedCourses: 0,
    totalCourses: 0,
    totalTimeSpent: 0,
    averageTimePerQuiz: 0,
    topPerformingTopics: [],
    recentImprovement: 0,
    quizzesPerMonth: 0,
    courseCompletionRate: 0,
    consistencyScore: 0,
    learningEfficiency: 0,
    difficultyProgression: 0,
    averageAccuracy: 0,
    streakDays: 0,
    engagementScore: 0,
    quizTypeDistribution: {},
    learningPatterns: {
      morningQuizzes: 0,
      afternoonQuizzes: 0,
      eveningQuizzes: 0,
      nightQuizzes: 0,
    },
    strengthAreas: [],
    improvementAreas: [],
  }
}
