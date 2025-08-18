"use server"
import { prisma } from "@/lib/db"
import type {
  DashboardUser,
  UserStats,
  Course,
  CourseProgress,
  UserQuiz,
  Favorite,
  UserQuizAttempt,
} from "../types/types"

// Add missing type
interface TopicPerformance {
  topic: string
  averageScore: number
  attempts: number
  averageTimeSpent: number
}

export async function getUserData(userId: string): Promise<DashboardUser | null> {
  try {
    console.log('getUserData: Fetching data for userId:', userId)
    
    // Use parallel queries for better performance
    const [user, userQuizAttempts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          courses: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
            take: 3, // Reduced for faster loading
            orderBy: { createdAt: 'desc' },
          },
          courseProgress: {
            select: {
              id: true,
              progress: true,
              course: {
                select: {
                  slug: true,
                  id: true,
                  title: true,
                },
              },
            },
            take: 3, // Reduced for faster loading
            orderBy: { updatedAt: 'desc' },
          },
          userQuizzes: {
            select: {
              id: true,
              title: true,
              slug: true,
              quizType: true,
              timeEnded: true,
              timeStarted: true,
              _count: {
                select: {
                  questions: true,
                },
              },
            },
            take: 3, // Reduced for faster loading
            orderBy: { createdAt: 'desc' },
          },
          favorites: {
            select: {
              id: true,
              course: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                },
              },
            },
            take: 3, // Reduced for faster loading
          },
        },
      }),
      // Separate query for quiz attempts with optimized selection
      prisma.userQuizAttempt.findMany({
        where: { userId },
        select: {
          id: true,
          score: true,
          accuracy: true,
          timeSpent: true,
          createdAt: true,
          userQuiz: {
            select: {
              id: true,
              title: true,
              quizType: true,
              difficulty: true,
            },
          },
          // Remove attemptQuestions for faster loading - load on demand
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5, // Reduced for faster loading
      })
    ])

    if (!user) {
      console.log('getUserData: No user found in database for userId:', userId)
      return null
    }

    console.log('getUserData: Found user:', user.name, 'with id:', user.id)
    console.log('getUserData: Quiz attempts count:', userQuizAttempts.length)
    
    // Log recent quiz attempts for debugging
    if (userQuizAttempts.length > 0) {
      const recentAttempts = userQuizAttempts.slice(0, 3).map((attempt: any) => ({
        id: attempt.id,
        score: attempt.score,
        quizTitle: attempt.userQuiz?.title,
        createdAt: attempt.createdAt
      }))
      console.log('getUserData: Recent quiz attempts:', JSON.stringify(recentAttempts, null, 2))
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email ?? "",
      image: user.image ?? "",
      credits: user.credits ?? 0,
      isAdmin: user.isAdmin ?? false,
      courses: user.courses as unknown as Course[],
      courseProgress: user.courseProgress as unknown as CourseProgress[],
      userQuizzes: user.userQuizzes as unknown as UserQuiz[],
      quizAttempts: userQuizAttempts.map((attempt: any) => ({
        ...attempt,
        id: attempt.id.toString(), // Convert number to string
        userQuiz: attempt.userQuiz ? {
          ...attempt.userQuiz,
          id: attempt.userQuiz.id,
          title: attempt.userQuiz.title,
          quizType: attempt.userQuiz.quizType,
          difficulty: attempt.userQuiz.difficulty,
        } : undefined,
        attemptQuestions: [], // Empty array for performance, load on demand
      })) as unknown as UserQuizAttempt[],
      favorites: user.favorites as unknown as Favorite[],
      streakDays: user.streakDays ?? 0,
    }
  } catch (error) {
    console.error("Error fetching user data:", error)
    return null
  }
}

export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    // Remove the complex transaction and use separate, optimized queries
    const [quizAttempts, completedCourses, totalCourses] = await Promise.all([
      // Simplified quiz attempts query - only get essential data
      prisma.userQuizAttempt.findMany({
        where: { userId },
        select: {
          id: true,
          score: true,
          timeSpent: true,
          createdAt: true,
          userQuizId: true,
          userQuiz: {
            select: {
              id: true,
              title: true,
              _count: {
                select: { questions: true } // Count questions instead of loading them
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 100, // Limit to recent attempts for performance
      }),
      
      // Separate, fast course progress queries
      prisma.courseProgress.count({
        where: { userId, isCompleted: true },
      }),
      
      prisma.courseProgress.count({
        where: { userId },
      }),
    ])

    const userQuizIds = new Set<number>()
    quizAttempts.forEach((a) => userQuizIds.add(a.userQuizId))
    const totalQuizzes = userQuizIds.size
    const totalAttempts = quizAttempts.length

    let totalTimeSpent = 0
    const scores = quizAttempts.map((attempt) => {
      const timeSpent = attempt.timeSpent ?? 0
      totalTimeSpent += timeSpent
      return {
        score: parseFloat((attempt.score ?? 0).toFixed(2)),
        totalQuestions: attempt.userQuiz._count.questions || 1, // Use question count
        percentageCorrect: parseFloat((attempt.score ?? 0).toFixed(2)),
        title: attempt.userQuiz.title,
        timeSpent,
      }
    })

    const scoresLength = scores.length
    const averageScore =
      scoresLength > 0 ? parseFloat((scores.reduce((acc, quiz) => acc + quiz.percentageCorrect, 0) / scoresLength).toFixed(2)) : 0

    const highestScore = scoresLength > 0 ? parseFloat(Math.max(...scores.map((quiz) => quiz.percentageCorrect)).toFixed(2)) : 0

    // Simplified calculations for better performance
    const topicPerformance = calculateTopicPerformance(scores)
    const topPerformingTopics = getTopPerformingTopics(topicPerformance)

    const recentAttempts = quizAttempts.slice(-10)
    const recentImprovement = recentAttempts.length >= 10 ? 
      parseFloat(calculateRecentImprovementSimple(recentAttempts).toFixed(2)) : 0

    const monthsSinceFirstQuiz =
      quizAttempts.length > 0
        ? (Date.now() - new Date(quizAttempts[0].createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)
        : 1

    const quizzesPerMonth = parseFloat((totalQuizzes / Math.max(monthsSinceFirstQuiz, 0.1)).toFixed(2))

    // Convert quizAttempts to proper format for consistency calculation
    const formattedAttempts = quizAttempts.map(attempt => ({
      ...attempt,
      id: attempt.id.toString(),
    }))

    return {
      totalQuizzes,
      averageScore,
      highestScore,
      totalTimeSpent,
      quizzesPerMonth,
      recentImprovement,
      topPerformingTopics: topPerformingTopics.map(topic => ({
        topic: topic.topic,
        title: topic.topic, // Map topic to title for compatibility
        averageScore: topic.averageScore,
        attempts: topic.attempts,
        averageTimeSpent: topic.averageTimeSpent,
      })),
    }
  } catch (error) {
    console.error("Error fetching user stats:", error)
    throw new Error("Failed to fetch user stats")
  }
}

export async function getRecommendedCourses(userId: string): Promise<Course[]> {
  try {
    const userStats = await getUserStats(userId)
    const userTopics = userStats.topPerformingTopics.map((topic) => topic.topic)

    const completedCourseIds = await prisma.courseProgress
      .findMany({
        where: { userId, isCompleted: true },
        select: { courseId: true },
      })
      .then((courses) => courses.map((cp) => cp.courseId))

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

    return recommendedCourses.map(course => ({
      ...course,
      id: course.id.toString(),
      category: course.category ? {
        ...course.category,
        id: course.category.id.toString()
      } : undefined
    })) as unknown as Course[]
  } catch (error) {
    console.error("Error fetching recommended courses:", error)
    return []
  }
}

function calculateEngagementScore(user: any): number {
  const quizAttempts = user.userQuizAttempts.length
  const totalProgress = user.courseProgress.reduce((acc: number, course: any) => acc + (course.progress ?? 0), 0)
  const favorites = user.favorites.length

  return parseFloat(Math.min((quizAttempts * 2 + totalProgress + favorites) / 10, 100).toFixed(2))
}

function calculateStreakDays(attempts: Array<Partial<UserQuizAttempt> & { createdAt: Date }>): number {
  if (attempts.length === 0) return 0

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

  return attempts.reduce((latest, attempt) => {
    const attemptDate = new Date(attempt.createdAt)
    return latest > attemptDate ? latest : attemptDate
  }, new Date(0))
}

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
      averageScore: parseFloat((data.attempts > 0 ? data.totalScore / data.attempts : 0).toFixed(2)),
      attempts: data.attempts,
      averageTimeSpent: parseFloat((data.attempts > 0 ? data.totalTimeSpent / data.attempts : 0).toFixed(2)),
    }))
    .sort((a, b) => parseFloat(b.averageScore.toFixed(2)) - parseFloat(a.averageScore.toFixed(2)))
    .slice(0, 5)
}

function calculateRecentImprovementSimple(recentAttempts: any[]): number {
  if (recentAttempts.length < 10) return 0

  const firstHalf = recentAttempts.slice(5, 10)
  const secondHalf = recentAttempts.slice(0, 5)

  const firstHalfAvg = firstHalf.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) / 5
  const secondHalfAvg = secondHalf.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) / 5

  return parseFloat((secondHalfAvg - firstHalfAvg).toFixed(2))
}

function calculateRecentImprovement(recentAttempts: UserQuizAttempt[]): number {
  if (recentAttempts.length < 10) return 0

  const firstHalf = recentAttempts.slice(5, 10)
  const secondHalf = recentAttempts.slice(0, 5)

  const firstHalfAvg = firstHalf.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) / 5
  const secondHalfAvg = secondHalf.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) / 5

  return parseFloat((secondHalfAvg - firstHalfAvg).toFixed(2))
}

function calculateConsistencyScore(attempts: Array<Partial<UserQuizAttempt> & { createdAt: Date }>): number {
  if (!attempts.length) return 0

  if (attempts.length === 1) return 50

  let totalDaysDiff = 0
  const oneDayMs = 24 * 60 * 60 * 1000

  const sortedAttempts = [...attempts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  for (let i = 1; i < sortedAttempts.length; i++) {
    const currentDate = new Date(sortedAttempts[i].createdAt)
    const previousDate = new Date(sortedAttempts[i - 1].createdAt)
    const daysDiff = Math.min(
      Math.abs(Math.round((currentDate.getTime() - previousDate.getTime()) / oneDayMs)),
      7,
    )
    totalDaysDiff += daysDiff
  }

  const averageDaysBetweenAttempts = totalDaysDiff / (sortedAttempts.length - 1)
  return parseFloat(Math.max(0, 100 - (averageDaysBetweenAttempts / 7) * 100).toFixed(2))
}

function calculateLearningEfficiency(scores: { score: number; timeSpent: number }[]): number {
  if (scores.length === 0) return 0

  let totalScore = 0
  let totalTime = 0

  for (const score of scores) {
    totalScore += score.score
    totalTime += score.timeSpent
  }

  if (totalTime === 0) return 0

  const averageScorePerMinute = totalScore / scores.length / (totalTime / 60)
  return parseFloat(Math.min(averageScorePerMinute * 100, 100).toFixed(2))
}

function calculateDifficultyProgression(scores: { score: number }[]): number {
  if (scores.length < 2) return 0

  const halfIndex = Math.floor(scores.length / 2)
  const firstHalfAvg = scores.slice(0, halfIndex).reduce((sum, s) => sum + s.score, 0) / halfIndex
  const secondHalfAvg = scores.slice(halfIndex).reduce((sum, s) => sum + s.score, 0) / (scores.length - halfIndex)

  return parseFloat((secondHalfAvg - firstHalfAvg).toFixed(2))
}


