import { prisma } from "@/lib/db"
import { DashboardUser } from "../types"



export async function getUserData(userId: string): Promise<DashboardUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        credits: true,
        userType: true,
        totalCoursesWatched: true,
        totalQuizzesAttempted: true,
        totalTimeSpent: true,
        courses: {
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
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
        },
        userQuizzes:{
          select:{
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
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
        },
        courseProgress: {
          select: {
            id: true,
            progress: true,
            currentChapterId: true,
            completedChapters: true,
            timeSpent: true,
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
          orderBy: {
            lastAccessedAt: 'desc',
          },
          take: 5,
        },
        userQuizzes: {
          orderBy: { timeStarted: 'desc' },
          take: 5,
          select: {
            id: true,
            topic: true,
            slug: true,
            timeStarted: true,
            timeEnded: true,
            gameType: true,
            score: true,
            duration: true,
          },
        },
        subscriptions: {
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
      },
    })

    if (!user) {
      return null
    }

    return user as unknown as DashboardUser
  } catch (error) {
    console.error('Error fetching user data:', error)
    throw error
  }
}



export async function getUserStats(userId: string) {
  try {
    const stats = await prisma.$transaction(async (tx) => {
      const totalQuizzes = await tx.userQuiz.count({
        where: { userId },
      })

      const quizScores = await tx.userQuiz.findMany({
        where: { userId, score: { not: null } },
        select: { score: true },
      })

      const averageScore = quizScores.length
        ? quizScores.reduce((acc, quiz) => acc + (quiz.score || 0), 0) / quizScores.length
        : 0

      const highestScore = quizScores.length
        ? Math.max(...quizScores.map((quiz) => quiz.score || 0))
        : 0

      const completedCourses = await tx.course.count({
        where: {
          userId,
          isCompleted: true,
        },
      })

      const totalTimeSpent = await tx.courseProgress.aggregate({
        where: { userId },
        _sum: { timeSpent: true },
      })

      return {
        totalQuizzes,
        averageScore,
        highestScore,
        completedCourses,
        totalTimeSpent: totalTimeSpent._sum.timeSpent || 0,
      }
    })

    return stats
  } catch (error) {
    console.error('Error fetching user stats:', error)
    throw error
  }
}

