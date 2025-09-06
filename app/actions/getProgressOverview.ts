"use server"

import prisma from "@/lib/db"

export interface CourseProgressData {
  id: string
  courseId: number
  progress: number
  isCompleted: boolean
  timeSpent: number
  lastAccessedAt: string
  course: {
    id: number
    title: string
    slug: string
    image?: string
    difficulty?: string
    estimatedHours?: number
  }
}

export interface ChapterProgressData {
  id: string
  chapterId: number
  courseId: number
  progress: number
  isCompleted: boolean
  timeSpent: number
  lastAccessedAt: string
  chapter: {
    id: number
    title: string
    order: number
  }
  course: {
    title: string
    slug: string
  }
}

export interface OverallStats {
  totalCourses: number
  completedCourses: number
  totalChapters: number
  completedChapters: number
  totalTimeSpent: number
  averageProgress: number
  streak: number
}

export interface ProgressOverviewResponse {
  courseProgresses: CourseProgressData[]
  chapterProgresses: ChapterProgressData[]
  overallStats: OverallStats
}

export async function getUserProgressOverview(userId: string): Promise<ProgressOverviewResponse> {
  try {
    // Get course progress with course details using proper join
    const courseProgresses = await prisma.courseProgress.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            image: true,
            difficulty: true,
            estimatedHours: true,
            courseUnits: {
              select: {
                chapters: {
                  select: {
                    id: true,
                    title: true,
                    order: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { lastAccessedAt: 'desc' }
    })

    // Get user's enrolled courses count using aggregation
    const userCoursesStats = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        courses: {
          select: {
            id: true,
            courseUnits: {
              select: {
                chapters: {
                  select: { id: true }
                }
              }
            }
          }
        },
        courseProgress: {
          select: {
            isCompleted: true,
            timeSpent: true,
            progress: true
          }
        },
      }
    })

    // Calculate totals using the fetched data
    const totalCourses = userCoursesStats?.courses.length || 0
    const completedCourses = courseProgresses.filter(cp => cp.isCompleted).length

    const allChapters = userCoursesStats?.courses.flatMap(course =>
      course.courseUnits.flatMap(unit => unit.chapters)
    ) || []
    const totalChapters = allChapters.length

    // Calculate completed chapters from chapter progress data
    let completedChapters = 0
    courseProgresses.forEach(cp => {
      if (cp.chapterProgress && typeof cp.chapterProgress === 'object') {
        const chapterProgressData = cp.chapterProgress as any
        if (chapterProgressData.completedChapters) {
          completedChapters += chapterProgressData.completedChapters.length || 0
        }
      }
    })

    const totalTimeSpent = courseProgresses.reduce((sum, cp) => sum + (cp.timeSpent || 0), 0)
    const averageProgress = courseProgresses.length > 0
      ? courseProgresses.reduce((sum, cp) => sum + cp.progress, 0) / courseProgresses.length
      : 0

    // Transform course progress data
    const courseProgressData: CourseProgressData[] = courseProgresses.map(cp => ({
      id: cp.id.toString(),
      courseId: cp.courseId,
      progress: cp.progress,
      isCompleted: cp.isCompleted,
      timeSpent: cp.timeSpent || 0,
      lastAccessedAt: cp.lastAccessedAt.toISOString(),
      course: {
        id: cp.course.id,
        title: cp.course.title,
        slug: cp.course.slug,
        image: cp.course.image || undefined,
        difficulty: cp.course.difficulty || undefined,
        estimatedHours: cp.course.estimatedHours || undefined
      }
    }))

    // For now, chapter progresses will be empty since we need to implement individual chapter tracking
    const chapterProgressData: ChapterProgressData[] = []

    return {
      courseProgresses: courseProgressData,
      chapterProgresses: chapterProgressData,
      overallStats: {
        totalCourses,
        completedCourses,
        totalChapters,
        completedChapters,
        totalTimeSpent,
        averageProgress: Math.round(averageProgress * 100) / 100,
        streak: 0, // Temporarily set to 0 since streakDays field doesn't exist
      }
    }
  } catch (error) {
    console.error('Error fetching progress overview:', error)
    return {
      courseProgresses: [],
      chapterProgresses: [],
      overallStats: {
        totalCourses: 0,
        completedCourses: 0,
        totalChapters: 0,
        completedChapters: 0,
        totalTimeSpent: 0,
        averageProgress: 0,
        streak: 0
      }
    }
  }
}
