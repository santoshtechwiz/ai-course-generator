import prisma from "@/lib/db"
import { LearningEventService } from "./learning-event.service"

interface ProgressUpdate {
  userId: string
  courseId: number
  currentChapterId?: number
  progress?: number
  playedSeconds?: number
  isCompleted?: boolean
  completedChapters?: number[]
}

interface ChapterProgressData {
  completedChapters: number[]
  lastPositions: Record<number, number>
  [key: string]: any // Add index signature for Prisma JsonValue compatibility
}

interface CourseProgressResponse {
  id: number
  userId: string
  courseId: number
  currentChapterId: number | null
  chapterProgress: ChapterProgressData
  progress: number
  lastAccessedAt: Date
  isCompleted: boolean
  timeSpent: number
  quizProgress: any
}

interface UserStatsResponse {
  totalCourses: number
  completedCourses: number
  totalQuizzes: number
  averageScore: number
  totalCoursesWatched: number
  totalTimeSpent: number
  streakDays: number
  lastStreakDate: Date | null
}

interface UserCourseResponse {
  id: number
  title: string
  description: string | null
  image: string | null
  difficulty: string
  estimatedHours: number
  progress: number
  isCompleted: boolean
  lastAccessedAt: string
}

class ProgressService {
  /**
   * Get course progress for a user
   */
  async getCourseProgress(userId: string, courseId: number): Promise<CourseProgressResponse | null> {
    const progress = await prisma.courseProgress.findUnique({
      where: {
        unique_user_course_progress: {
          userId,
          courseId,
        },
      },
    })

    return progress as CourseProgressResponse | null
  }

  /**
   * Update course progress for a user
   */
  async updateCourseProgress(data: ProgressUpdate): Promise<CourseProgressResponse> {
    const { userId, courseId, currentChapterId, progress = 0, playedSeconds = 0, isCompleted = false, completedChapters = [] } = data

    // Get existing progress to merge data
    const existingProgress = await this.getCourseProgress(userId, courseId)
    
    // Merge completed chapters
    const existingCompletedChapters = (existingProgress?.chapterProgress?.completedChapters || []) as number[]
    const updatedCompletedChapters = Array.from(new Set([...existingCompletedChapters, ...completedChapters]))

    // Handle last positions
    const existingLastPositions = (existingProgress?.chapterProgress?.lastPositions || {}) as Record<number, number>
    if (currentChapterId && playedSeconds > 0) {
      existingLastPositions[currentChapterId] = playedSeconds
    }

    // Calculate time spent
    const existingTimeSpent = existingProgress?.timeSpent || 0
    const playedMinutes = Math.floor(playedSeconds / 60)
    
    // Only add time if this is a new session (simple heuristic to avoid double-counting)
    const isNewSession = !existingProgress ||
      (new Date().getTime() - existingProgress.lastAccessedAt.getTime()) > 5 * 60 * 1000 // 5 minutes

    const newTimeSpent = isNewSession ? existingTimeSpent + playedMinutes : existingTimeSpent

    const chapterProgressData: ChapterProgressData = {
      completedChapters: updatedCompletedChapters,
      lastPositions: existingLastPositions
    }

    // Update or create progress record
    const updatedProgress = await prisma.courseProgress.upsert({
      where: {
        unique_user_course_progress: {
          userId,
          courseId,
        },
      },
      update: {
        currentChapterId: currentChapterId || existingProgress?.currentChapterId || null,
        chapterProgress: chapterProgressData,
        progress,
        lastAccessedAt: new Date(),
        isCompleted,
        timeSpent: newTimeSpent,
      },
      create: {
        userId,
        courseId,
        currentChapterId: currentChapterId || null,
        chapterProgress: chapterProgressData,
        progress,
        isCompleted,
        timeSpent: Math.max(0, playedMinutes),
        quizProgress: { lastPositions: currentChapterId ? { [currentChapterId]: playedSeconds } : {} },
      },
    })

    // Create learning event for tracking
    try {
      const learningEventService = new LearningEventService()
      await learningEventService.createEvent({
        userId,
        courseId,
        chapterId: currentChapterId,
        eventType: isCompleted ? 'course_completed' : 'video_progress',
        eventData: {
          progress,
          playedSeconds,
          currentChapterId,
        },
      })
    } catch (error) {
      console.warn('Failed to create learning event:', error)
    }

    return updatedProgress as unknown as CourseProgressResponse
  }

  /**
   * Bulk update progress for multiple courses/chapters
   */
  async bulkUpdateProgress(updates: ProgressUpdate[]): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0
    let failed = 0
    const errors: string[] = []

    await prisma.$transaction(async (tx) => {
      for (const update of updates) {
        try {
          await this.updateCourseProgress(update)
          success++
        } catch (error) {
          failed++
          errors.push(`Course ${update.courseId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          console.warn(`Failed to update progress for user ${update.userId}, course ${update.courseId}:`, error)
        }
      }
    })

    return { success, failed, errors }
  }

  /**
   * Get user statistics including progress data
   */
  async getUserStats(userId: string): Promise<UserStatsResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        courseProgress: true,
        userQuizzes: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const totalCourses = user.courseProgress?.length || 0
    const completedCourses = user.courseProgress?.filter((progress: any) => progress.isCompleted).length || 0
  const totalQuizzes = await prisma.userQuizAttempt.count({ where: { userId } })
  const avgScoreAgg = await prisma.userQuizAttempt.aggregate({ _avg: { score: true }, where: { userId } })
  const averageScore = Math.round((avgScoreAgg._avg.score || 0) as number)

    return {
      totalCourses,
      completedCourses,
      totalQuizzes,
      averageScore,
      totalCoursesWatched: (user as any).totalCoursesWatched || 0,
      totalTimeSpent: (user as any).totalTimeSpent || 0,
      streakDays: (user as any).streakDays || 0,
      lastStreakDate: (user as any).lastStreakDate,
    }
  }

  /**
   * Get all user courses with progress data
   */
  async getUserCourses(userId: string): Promise<UserCourseResponse[]> {
    const courseProgress = await prisma.courseProgress.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            image: true,
            difficulty: true,
            estimatedHours: true,
          },
        },
      },
    })

    return courseProgress.map((progress) => ({
      id: progress.courseId,
      title: progress.course.title,
      description: progress.course.description,
      image: progress.course.image || '',
      difficulty: progress.course.difficulty || 'beginner',
      estimatedHours: progress.course.estimatedHours || 0,
      progress: progress.progress,
      isCompleted: progress.isCompleted,
      lastAccessedAt: progress.lastAccessedAt.toISOString(),
    }))
  }

  /**
   * Calculate course progress based on video completion status
   */
  async calculateCourseProgress(courseId: number): Promise<{ status: "pending" | "processing" | "completed" | "error", progress: number } | null> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        courseUnits: {
          include: {
            chapters: true,
          },
        },
      },
    })

    if (!course) {
      return null
    }

    let totalChapters = 0
    let completedChapters = 0
    let hasError = false

    course.courseUnits.forEach((unit) => {
      totalChapters += unit.chapters.length
      completedChapters += unit.chapters.filter((chapter) => chapter.videoStatus === "completed").length
      if (unit.chapters.some((chapter) => chapter.videoStatus === "error")) {
        hasError = true
      }
    })

    const progress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0

    let status: "pending" | "processing" | "completed" | "error" = "processing"

    if (progress === 0) {
      status = "pending"
    } else if (progress === 100) {
      status = "completed"
    } else if (hasError) {
      status = "error"
    }

    return { status, progress }
  }

  /**
   * Mark chapter as completed for a user
   */
  async markChapterCompleted(userId: string, courseId: number, chapterId: number): Promise<CourseProgressResponse> {
    const existingProgress = await this.getCourseProgress(userId, courseId)
    const completedChapters = existingProgress?.chapterProgress?.completedChapters || []
    
    if (!completedChapters.includes(chapterId)) {
      completedChapters.push(chapterId)
    }

    // Calculate new progress percentage based on completed chapters
    const courseProgressData = await this.calculateCourseProgress(courseId)
    const newProgress = courseProgressData?.progress || 0

    return this.updateCourseProgress({
      userId,
      courseId,
      currentChapterId: chapterId,
      progress: newProgress,
      completedChapters,
      isCompleted: newProgress === 100,
    })
  }
}

export const progressService = new ProgressService()
