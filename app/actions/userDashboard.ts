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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
          take: 5,
        },
        courseProgress: {
          select: {
            id: true,
            progress: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          take: 5,
        },
        userQuizzes: {
          select: {
            id: true,
            title: true,
            slug: true,
            quizType: true,
          },
          take: 5,
        },
      },
    })

    if (!user) return null

    return {
      id: user.id,
      name: user.name,
      courses: user.courses as Course[],
      courseProgress: user.courseProgress as CourseProgress[],
      userQuizzes: user.userQuizzes as UserQuiz[],
    }
  } catch (error) {
    console.error("Error fetching user data:", error)
    return null
  }
}

export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    const stats = await prisma.$transaction(async (tx) => {
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
          totalQuestions: attempt.userQuiz.questions.length,
          percentageCorrect: parseFloat((attempt.score ?? 0).toFixed(2)),
          title: attempt.userQuiz.title,
          timeSpent,
        }
      })

      const scoresLength = scores.length
      const averageScore =
        scoresLength > 0 ? parseFloat((scores.reduce((acc, quiz) => acc + quiz.percentageCorrect, 0) / scoresLength).toFixed(2)) : 0

      const highestScore = scoresLength > 0 ? parseFloat(Math.max(...scores.map((quiz) => quiz.percentageCorrect)).toFixed(2)) : 0

      const topicPerformance = calculateTopicPerformance(scores)
      const topPerformingTopics = getTopPerformingTopics(topicPerformance)

      const recentAttempts = quizAttempts.slice(-10)
      const recentImprovement = parseFloat(calculateRecentImprovement(recentAttempts).toFixed(2))

      const monthsSinceFirstQuiz =
        quizAttempts.length > 0
          ? (Date.now() - new Date(quizAttempts[0].createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)
          : 1

      const quizzesPerMonth = parseFloat((totalQuizzes / Math.max(monthsSinceFirstQuiz, 0.1)).toFixed(2))

      return {
        totalQuizzes,
        totalAttempts,
        averageScore,
        highestScore,
        completedCourses,
        totalTimeSpent,
        averageTimePerQuiz: totalAttempts > 0 ? parseFloat((totalTimeSpent / totalAttempts).toFixed(2)) : 0,
        topPerformingTopics,
        recentImprovement,
        quizzesPerMonth,
        courseCompletionRate: totalCourses > 0 ? parseFloat(((completedCourses / totalCourses) * 100).toFixed(2)) : 0,
        consistencyScore: parseFloat(calculateConsistencyScore(quizAttempts).toFixed(2)),
        learningEfficiency: parseFloat(calculateLearningEfficiency(scores).toFixed(2)),
        difficultyProgression: parseFloat(calculateDifficultyProgression(scores).toFixed(2)),
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

    return recommendedCourses as Course[]
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


