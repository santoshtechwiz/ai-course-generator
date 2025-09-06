"use server"

import prisma from "@/lib/db"

export interface LearningEventData {
  id: string
  type: 'VIDEO_PLAY' | 'VIDEO_PAUSE' | 'VIDEO_COMPLETE' | 'QUIZ_START' | 'QUIZ_SUBMIT' | 'CHAPTER_COMPLETE'
  entityId?: string
  progress?: number
  timeSpent?: number
  createdAt: string
  course: {
    title: string
    slug: string
  }
  chapter?: {
    title: string
    id: number
  }
}

export interface TodayStats {
  timeSpent: number
  coursesStudied: number
  chaptersCompleted: number
  quizzesCompleted: number
}

export interface WeeklyStats {
  timeSpent: number
  coursesStarted: number
  coursesCompleted: number
  averageScore: number
}

export interface LearningActivityResponse {
  recentEvents: LearningEventData[]
  todayStats: TodayStats
  weeklyStats: WeeklyStats
}

export async function getUserLearningActivity(userId: string): Promise<LearningActivityResponse> {
  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get recent learning events with proper joins
    const recentEvents = await prisma.learningEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        course: {
          select: {
            title: true,
            slug: true,
          }
        },
        chapter: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    })

    // Get today's stats using aggregation
    const todayStats = await prisma.learningEvent.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfToday }
      },
      _sum: {
        timeSpent: true
      },
      _count: {
        id: true,
        _all: true
      }
    })

    // Get today's specific counts
    const todayChaptersCompleted = await prisma.learningEvent.count({
      where: {
        userId,
        type: 'CHAPTER_COMPLETE',
        createdAt: { gte: startOfToday }
      }
    })

    const todayQuizzesCompleted = await prisma.learningEvent.count({
      where: {
        userId,
        type: 'QUIZ_SUBMIT',
        createdAt: { gte: startOfToday }
      }
    })

    const todayCoursesStudied = new Set(
      recentEvents
        .filter(e => new Date(e.createdAt) >= startOfToday)
        .map(e => e.courseId)
    ).size

    // Get weekly stats
    const weeklyStats = await prisma.learningEvent.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfWeek }
      },
      _sum: {
        timeSpent: true
      }
    })

    const weeklyCoursesStarted = new Set(
      recentEvents
        .filter(e => new Date(e.createdAt) >= startOfWeek)
        .map(e => e.courseId)
    ).size

    // Get weekly completed courses from course progress
    const weeklyCompletedCourses = await prisma.courseProgress.count({
      where: {
        userId,
        isCompleted: true,
        lastAccessedAt: { gte: startOfWeek }
      }
    })

    // Calculate average score from recent quiz attempts with proper join
    const recentQuizAttempts = await prisma.userQuizAttempt.findMany({
      where: {
        userId,
        createdAt: { gte: startOfWeek }
      },
      select: {
        score: true,
        accuracy: true
      }
    })

    const averageScore = recentQuizAttempts.length > 0
      ? recentQuizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / recentQuizAttempts.length
      : 0

    return {
      recentEvents: recentEvents.map(event => ({
        id: event.id.toString(),
        type: event.type as any,
        entityId: event.entityId || undefined,
        progress: event.progress || undefined,
        timeSpent: event.timeSpent || undefined,
        createdAt: event.createdAt.toISOString(),
        course: {
          title: event.course.title,
          slug: event.course.slug
        },
        chapter: event.chapter ? {
          title: event.chapter.title,
          id: event.chapter.id
        } : undefined
      })),
      todayStats: {
        timeSpent: todayStats._sum.timeSpent || 0,
        coursesStudied: todayCoursesStudied,
        chaptersCompleted: todayChaptersCompleted,
        quizzesCompleted: todayQuizzesCompleted
      },
      weeklyStats: {
        timeSpent: weeklyStats._sum.timeSpent || 0,
        coursesStarted: weeklyCoursesStarted,
        coursesCompleted: weeklyCompletedCourses,
        averageScore: Math.round(averageScore)
      }
    }
  } catch (error) {
    console.error('Error fetching learning activity:', error)
    return {
      recentEvents: [],
      todayStats: {
        timeSpent: 0,
        coursesStudied: 0,
        chaptersCompleted: 0,
        quizzesCompleted: 0
      },
      weeklyStats: {
        timeSpent: 0,
        coursesStarted: 0,
        coursesCompleted: 0,
        averageScore: 0
      }
    }
  }
}
