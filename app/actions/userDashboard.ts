"use server"
import { prisma } from "@/lib/db"
import type {
  DashboardUser,
  UserStats,
  Course,
  CourseProgress,
  UserQuiz,
  UserSubscription,
  Favorite,
  UserQuizAttempt,
  TopicPerformance,
} from "../types/types"

export async function getUserData(userId: string): Promise<DashboardUser | null> {
  try {
    // Optimized query - removed duplicate fields and fixed field naming
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            description: true,
            image: true,
            slug: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        courseProgress: {
          select: {
            id: true,
            progress: true,
            currentChapterId: true,
            completedChapters: true,
            timeSpent: true,
            isCompleted: true,
            lastAccessedAt: true,
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                image: true,
                slug: true,
                createdAt: true,
                updatedAt: true,
                courseUnits: {
                  select: {
                    id: true,
                    name: true,
                    chapters: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                },
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { lastAccessedAt: "desc" },
          take: 5,
        },
        userQuizzes: {
          orderBy: { timeStarted: "desc" },
          take: 5,
          select: {
            id: true,
            title: true,
            slug: true,
            timeStarted: true,
            timeEnded: true,
            quizType: true,
            questions: { select: { id: true, question: true, answer: true } },
            bestScore: true,
            attempts: {
              select: { score: true },
              orderBy: { createdAt: "desc" },
            },
          },
        },
        subscription: {
          select: {
            id: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            planId: true,
            cancelAtPeriodEnd: true,
            stripeSubscriptionId: true,
            stripeCustomerId: true,
          },
        },
        favorites: {
          select: {
            id: true,
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                image: true,
                slug: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        userQuizAttempts: {
          select: {
            id: true,
            userQuizId: true,
            score: true,
            timeSpent: true,
            createdAt: true,
            updatedAt: true,
            improvement: true,
            accuracy: true,
            attemptQuestions: {
              select: {
                id: true,
                questionId: true,
                userAnswer: true,
                isCorrect: true,
                timeSpent: true,
              },
            },
            userQuiz: {
              select: {
                id: true,
                title: true,
                questions: {
                  select: {
                    id: true,
                    question: true,
                    answer: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!user) return null

    // Fixed object structure and type casting
    const dashboardUser: DashboardUser = {
      ...user,
      courses: user.courses as Course[],
      subscriptions: user.subscription as UserSubscription | null,
      userQuizzes: user.userQuizzes.map((quiz) => ({
        ...quiz,
        percentageCorrect: quiz.bestScore ?? 0,
        totalAttempts: quiz.attempts.length,
      })) as UserQuiz[],
      courseProgress: user.courseProgress.map((progress) => ({
        ...progress,
        course: progress.course
          ? {
              ...progress.course,
              courseUnits: progress.course.courseUnits?.map((unit) => ({
                ...unit,
                title: unit.name, // Map name to title for consistency
              })),
            }
          : undefined,
      })) as CourseProgress[],
      favorites: user.favorites as Favorite[],
      quizAttempts: user.userQuizAttempts.map((attempt) => ({
        ...attempt,
        userId: user.id, // Add the userId from the parent user object
      })) as UserQuizAttempt[],
      engagementScore: calculateEngagementScore(user),
      streakDays: calculateStreakDays(
        user.userQuizAttempts.map((attempt) => ({
          ...attempt,
          userId: user.id,
        })),
      ),
      lastStreakDate: getLastStreakDate(
        user.userQuizAttempts.map((attempt) => ({
          ...attempt,
          userId: user.id,
        })),
      ),
      credits: user.credits || 0,
    }

    return dashboardUser
  } catch (error) {
    console.error("Error fetching user data:", error)
    return null
  }
}

export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    // Performance optimization: Use a single transaction for all database operations
    const stats = await prisma.$transaction(async (tx) => {
      // Parallel database queries for better performance
      const [quizAttempts, completedCourses, totalCourses] = await Promise.all([
        tx.userQuizAttempt.findMany({
          where: { userId },
          include: {
            userQuiz: {
              select: {
                id: true,
                title: true,
                questions: { select: { id: true, question: true, answer: true } },
              },
            },
            attemptQuestions: {
              select: {
                id: true,
                questionId: true,
                userAnswer: true,
                isCorrect: true,
                timeSpent: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        }),
        tx.courseProgress.count({
          where: { userId, isCompleted: true },
        }),
        tx.courseProgress.count({
          where: { userId },
        }),
      ])

      // Optimize data processing with memoization
      const userQuizIds = new Set<number>()
      quizAttempts.forEach((a) => userQuizIds.add(a.userQuizId))
      const totalQuizzes = userQuizIds.size
      const totalAttempts = quizAttempts.length

      // Use reduce once instead of multiple iterations
      let totalTimeSpent = 0
      const scores = quizAttempts.map((attempt) => {
        const timeSpent = attempt.timeSpent ?? 0
        totalTimeSpent += timeSpent
        return {
          score: attempt.score ?? 0,
          totalQuestions: attempt.userQuiz.questions.length,
          percentageCorrect: attempt.score ?? 0,
          title: attempt.userQuiz.title,
          timeSpent,
        }
      })

      // Optimize calculations
      const scoresLength = scores.length
      const averageScore =
        scoresLength > 0 ? scores.reduce((acc, quiz) => acc + quiz.percentageCorrect, 0) / scoresLength : 0

      const highestScore = scoresLength > 0 ? Math.max(...scores.map((quiz) => quiz.percentageCorrect)) : 0

      const topicPerformance = calculateTopicPerformance(scores)
      const topPerformingTopics = getTopPerformingTopics(topicPerformance)

      // Optimize slice operations
      const recentAttempts = quizAttempts.slice(-10)
      const recentImprovement = calculateRecentImprovement(recentAttempts)

      const monthsSinceFirstQuiz =
        quizAttempts.length > 0
          ? (Date.now() - new Date(quizAttempts[0].createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)
          : 1

      const quizzesPerMonth = totalQuizzes / Math.max(monthsSinceFirstQuiz, 0.1) // Avoid division by very small numbers

      return {
        totalQuizzes,
        totalAttempts,
        averageScore,
        highestScore,
        completedCourses,
        totalTimeSpent,
        averageTimePerQuiz: totalAttempts > 0 ? totalTimeSpent / totalAttempts : 0,
        topPerformingTopics,
        recentImprovement,
        quizzesPerMonth,
        courseCompletionRate: totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0,
        consistencyScore: calculateConsistencyScore(quizAttempts),
        learningEfficiency: calculateLearningEfficiency(scores),
        difficultyProgression: calculateDifficultyProgression(scores),
      }
    })

    return stats
  } catch (error) {
    console.error("Error fetching user stats:", error)
    throw new Error("Failed to fetch user stats")
  }
}

export async function getRecommendedCourses(userId: string): Promise<Course[]> {
  try {
    const userStats = await getUserStats(userId)
    const userTopics = userStats.topPerformingTopics.map((topic) => topic.topic)

    // Performance optimization: Get completed course IDs first to avoid nested query
    const completedCourseIds = await prisma.courseProgress
      .findMany({
        where: { userId, isCompleted: true },
        select: { courseId: true },
      })
      .then((courses) => courses.map((cp) => cp.courseId))

    // Now use the IDs in the main query
    const recommendedCourses = await prisma.course.findMany({
      where: {
        OR: [
          { category: { name: { in: userTopics } } },
          { difficulty: { lte: Math.ceil(userStats.averageScore / 20).toString() } },
        ],
        NOT: {
          id: { in: completedCourseIds },
        },
      },
      orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        slug: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return recommendedCourses as Course[]
  } catch (error) {
    console.error("Error fetching recommended courses:", error)
    return []
  }
}

// Optimize the helper functions at the bottom of the file to avoid duplication

// Replace the existing helper functions with these optimized versions:

function calculateEngagementScore(user: any): number {
  const quizAttempts = user.userQuizAttempts.length
  const totalProgress = user.courseProgress.reduce((acc: number, course: any) => acc + (course.progress ?? 0), 0)
  const favorites = user.favorites.length

  return Math.min((quizAttempts * 2 + totalProgress + favorites) / 10, 100)
}

function calculateStreakDays(attempts: Array<Partial<UserQuizAttempt> & { createdAt: Date }>): number {
  if (attempts.length === 0) return 0

  // Sort attempts by date for accurate streak calculation
  const sortedAttempts = [...attempts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const oneDayMs = 24 * 60 * 60 * 1000
  let streakDays = 1
  let currentDate = new Date(sortedAttempts[0].createdAt)

  for (let i = 1; i < sortedAttempts.length; i++) {
    const attemptDate = new Date(sortedAttempts[i].createdAt)
    const dayDifference = Math.round((currentDate.getTime() - attemptDate.getTime()) / oneDayMs)

    if (dayDifference === 1) {
      streakDays++
      currentDate = attemptDate
    } else if (dayDifference > 1) {
      break
    }
  }

  return streakDays
}

function getLastStreakDate(attempts: Array<Partial<UserQuizAttempt> & { createdAt: Date }>): Date | null {
  if (attempts.length === 0) return null

  // Find the most recent attempt date
  return attempts.reduce((latest, attempt) => {
    const attemptDate = new Date(attempt.createdAt)
    return latest > attemptDate ? latest : attemptDate
  }, new Date(0))
}

// Optimize the performance calculation functions
function calculateTopicPerformance(
  scores: { title: string; percentageCorrect: number; timeSpent: number }[],
): Record<string, { totalScore: number; attempts: number; totalTimeSpent: number }> {
  return scores.reduce(
    (acc, score) => {
      if (!acc[score.title]) {
        acc[score.title] = { totalScore: 0, attempts: 0, totalTimeSpent: 0 }
      }

      acc[score.title].totalScore += score.percentageCorrect
      acc[score.title].attempts += 1
      acc[score.title].totalTimeSpent += score.timeSpent

      return acc
    },
    {} as Record<string, { totalScore: number; attempts: number; totalTimeSpent: number }>,
  )
}

function getTopPerformingTopics(
  topicPerformance: Record<string, { totalScore: number; attempts: number; totalTimeSpent: number }>,
): TopicPerformance[] {
  return Object.entries(topicPerformance)
    .map(([topic, data]) => ({
      topic,
      averageScore: data.attempts > 0 ? data.totalScore / data.attempts : 0,
      attempts: data.attempts,
      averageTimeSpent: data.attempts > 0 ? data.totalTimeSpent / data.attempts : 0,
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 5)
}

function calculateRecentImprovement(recentAttempts: UserQuizAttempt[]): number {
  if (recentAttempts.length < 10) return 0

  const firstHalf = recentAttempts.slice(5, 10)
  const secondHalf = recentAttempts.slice(0, 5)

  const firstHalfAvg = firstHalf.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) / 5
  const secondHalfAvg = secondHalf.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) / 5

  return secondHalfAvg - firstHalfAvg
}

// Keep the remaining helper functions as they are
function calculateConsistencyScore(attempts: Array<Partial<UserQuizAttempt> & { createdAt: Date }>): number {
  if (!attempts.length) return 0

  if (attempts.length === 1) return 50 // Default value for single attempt

  let totalDaysDiff = 0
  const oneDayMs = 24 * 60 * 60 * 1000

  // Sort attempts by date for accurate calculations
  const sortedAttempts = [...attempts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  for (let i = 1; i < sortedAttempts.length; i++) {
    const currentDate = new Date(sortedAttempts[i].createdAt)
    const previousDate = new Date(sortedAttempts[i - 1].createdAt)
    const daysDiff = Math.min(
      Math.abs(Math.round((currentDate.getTime() - previousDate.getTime()) / oneDayMs)),
      7, // Cap at 7 days
    )
    totalDaysDiff += daysDiff
  }

  const averageDaysBetweenAttempts = totalDaysDiff / (sortedAttempts.length - 1)
  return Math.max(0, 100 - (averageDaysBetweenAttempts / 7) * 100)
}

function calculateLearningEfficiency(scores: { score: number; timeSpent: number }[]): number {
  if (scores.length === 0) return 0

  // Optimize by calculating in a single pass
  let totalScore = 0
  let totalTime = 0

  for (const score of scores) {
    totalScore += score.score
    totalTime += score.timeSpent
  }

  if (totalTime === 0) return 0

  const averageScorePerMinute = totalScore / scores.length / (totalTime / 60)
  return Math.min(averageScorePerMinute * 100, 100)
}

function calculateDifficultyProgression(scores: { score: number }[]): number {
  if (scores.length < 2) return 0

  const halfIndex = Math.floor(scores.length / 2)

  // Calculate sums in a single pass
  let firstHalfSum = 0
  let secondHalfSum = 0

  for (let i = 0; i < halfIndex; i++) {
    firstHalfSum += scores[i].score
  }

  for (let i = halfIndex; i < scores.length; i++) {
    secondHalfSum += scores[i].score
  }

  const firstHalfAvg = firstHalfSum / halfIndex
  const secondHalfAvg = secondHalfSum / (scores.length - halfIndex)

  if (firstHalfAvg === 0) return 0

  return Math.max(-100, Math.min(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100, 100))
}
