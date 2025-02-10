'use server'
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        courses: {
          select: {
            id: true,
            name: true,
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
          orderBy: {
            createdAt: "desc",
          },
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
                name: true,
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
                        name: true,
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
          orderBy: {
            lastAccessedAt: "desc",
          },
          take: 5,
        },
        userQuizzes: {
          orderBy: { timeStarted: "desc" },
          take: 5,
          select: {
            id: true,
            topic: true,
            slug: true,
            timeStarted: true,
            timeEnded: true,
            quizType: true,
            questions: {
              select: {
                id: true,
              },
            },
            bestScore: true,
            attempts: {
              select: {
                score: true,
              },
              orderBy: {
                createdAt: "desc",
              },
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
          },
        },
        favorites: {
          select: {
            id: true,
            course: {
              select: {
                id: true,
                name: true,
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
        },
        userQuizAttempts: {
          select: {
            id: true,
            userQuizId: true,
            score: true,
            timeSpent: true,
            createdAt: true,
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
                topic: true,
                
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
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    })

    if (!user) {
      return null
    }

    const dashboardUser: DashboardUser = {
      ...user,
      courses: user.courses as Course[],
      subscriptions: user.subscription as unknown as UserSubscription,
      userQuizzes: user.userQuizzes.map((quiz) => ({
        ...quiz,
        percentageCorrect: quiz.bestScore ?? 0,
        totalAttempts: quiz.attempts.length,
      })) as unknown as UserQuiz[],
      courseProgress: user.courseProgress as unknown as CourseProgress[],
      favorites: user.favorites as Favorite[],
      quizAttempts: user.userQuizAttempts as UserQuizAttempt[],
      engagementScore: 0,
      streakDays: 0,
      lastStreakDate: null,
    }
  
    return dashboardUser
  } catch (error) {
    console.error("Error fetching user data:", error)
    return null;
  }
}

export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    const stats = await prisma.$transaction(async (tx) => {
      const quizAttempts = await tx.userQuizAttempt.findMany({
        where: { userId },
        include: {
          userQuiz: {
            select: {
              id: true,
              topic: true,
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
      })

      const totalQuizzes = new Set(quizAttempts.map((a) => a.userQuizId)).size
      const totalAttempts = quizAttempts.length
      const totalTimeSpent = quizAttempts.reduce((sum, a) => sum + (a.timeSpent ?? 0), 0)

      const scores = quizAttempts.map((attempt) => ({
        score: attempt.score ?? 0,
        totalQuestions: attempt.userQuiz.questions.length,
        percentageCorrect: attempt.score ?? 0,
        topic: attempt.userQuiz.topic,
        timeSpent: attempt.timeSpent ?? 0,
      }))

      const averageScore = scores.length > 0 ? scores.reduce((acc, quiz) => acc + quiz.percentageCorrect, 0) / scores.length : 0
      const highestScore = scores.length > 0 ? Math.max(...scores.map((quiz) => quiz.percentageCorrect)) : 0

      const topicPerformance = scores.reduce((acc, score) => {
        if (!acc[score.topic]) {
          acc[score.topic] = { totalScore: 0, attempts: 0, totalTimeSpent: 0 }
        }
        acc[score.topic].totalScore += score.percentageCorrect
        acc[score.topic].attempts += 1
        acc[score.topic].totalTimeSpent += score.timeSpent
        return acc
      }, {} as Record<string, { totalScore: number; attempts: number; totalTimeSpent: number }>)

      const topPerformingTopics: TopicPerformance[] = Object.entries(topicPerformance)
        .map(([topic, data]) => ({
          topic,
          averageScore: data.attempts > 0 ? data.totalScore / data.attempts : 0,
          attempts: data.attempts,
          averageTimeSpent: data.attempts > 0 ? data.totalTimeSpent / data.attempts : 0,
        }))
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, 5)

      const recentAttempts = quizAttempts.slice(-10)
      const recentImprovement = recentAttempts.length >= 10
        ? (recentAttempts.slice(5).reduce((sum, a) => sum + (a.score ?? 0), 0) / 5) -
          (recentAttempts.slice(0, 5).reduce((sum, a) => sum + (a.score ?? 0), 0) / 5)
        : 0

      const monthsSinceFirstQuiz = quizAttempts.length > 0
        ? (new Date().getTime() - new Date(quizAttempts[0].createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)
        : 1
      const quizzesPerMonth = totalQuizzes / monthsSinceFirstQuiz

      const [completedCourses, totalCourses] = await Promise.all([
        tx.courseProgress.count({
          where: {
            userId,
            isCompleted: true,
          },
        }),
        tx.courseProgress.count({
          where: {
            userId,
          },
        }),
      ])

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

function calculateConsistencyScore(attempts: UserQuizAttempt[]): number {
  const daysBetweenAttempts = attempts
    .slice(1)
    .map((attempt, index) => {
      const daysDiff = (attempt.createdAt.getTime() - attempts[index].createdAt.getTime()) / (1000 * 3600 * 24)
      return Math.min(daysDiff, 7) // Cap at 7 days
    })

  const averageDaysBetweenAttempts = daysBetweenAttempts.length > 0
    ? daysBetweenAttempts.reduce((sum, days) => sum + days, 0) / daysBetweenAttempts.length
    : 7 // Default to 7 if no attempts

  return Math.max(0, 100 - (averageDaysBetweenAttempts / 7) * 100)
}

function calculateLearningEfficiency(scores: { score: number; timeSpent: number }[]): number {
  if (scores.length === 0) return 0

  const totalScore = scores.reduce((sum, score) => sum + score.score, 0)
  const totalTime = scores.reduce((sum, score) => sum + score.timeSpent, 0)
  const averageScorePerMinute = (totalScore / scores.length) / (totalTime / 60)

  // Normalize to a 0-100 scale (assuming a "good" score per minute is 1)
  return Math.min(averageScorePerMinute * 100, 100)
}

function calculateDifficultyProgression(scores: { score: number }[]): number {
  if (scores.length < 2) return 0

  const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
  const secondHalf = scores.slice(Math.floor(scores.length / 2))
  const firstHalfAvg = firstHalf.reduce((sum, score) => sum + score.score, 0) / firstHalf.length
  const secondHalfAvg = secondHalf.reduce((sum, score) => sum + score.score, 0) / secondHalf.length

  // Calculate the percentage change, capped at ±100%
  return Math.max(-100, Math.min(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100, 100))
}


// main()