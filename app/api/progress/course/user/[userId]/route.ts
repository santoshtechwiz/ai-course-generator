import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import prisma from "@/lib/db"


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await params

    // Only allow users to fetch their own progress or admins to fetch any user's progress
    if (session.user.id !== userId && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch course progress data with optimized single query
    const courseProgressEntries = await prisma.courseProgress.findMany({
      where: {
        userId: userId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            courseUnits: {
              select: {
                chapters: {
                  select: {
                    id: true,
                    title: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    // Single optimized query to get all chapter progress for user's courses
    const allChapterProgress = await prisma.chapterProgress.findMany({
      where: {
        userId: userId,
        courseId: {
          in: courseProgressEntries.map(cp => cp.courseId)
        },
        isCompleted: true,
      },
      select: {
        courseId: true,
        chapterId: true,
        lastProgress: true,
        lastAccessedAt: true,
      }
    })

    // Group chapter progress by courseId for efficient lookup
    const chapterProgressByCourse = allChapterProgress.reduce((acc, cp) => {
      if (!acc[cp.courseId]) {
        acc[cp.courseId] = []
      }
      acc[cp.courseId].push(cp)
      return acc
    }, {} as Record<string, typeof allChapterProgress>)

    // Process course progress data
    const progressMap: Record<string, any> = {}

    for (const courseProgress of courseProgressEntries) {
      const courseId = courseProgress.courseId.toString()

      // Get all chapters for this course
      const allChapters = courseProgress.course.courseUnits.flatMap(unit =>
        unit.chapters.map(chapter => ({
          id: chapter.id,
          title: chapter.title
        }))
      )

      // Get completed chapters from the grouped data
      const chapterProgress = chapterProgressByCourse[courseProgress.courseId] || []
      const completedChapterIds = chapterProgress.map((cp: any) => cp.chapterId)

      const progressPercentage = allChapters.length > 0
        ? Math.round((completedChapterIds.length / allChapters.length) * 100)
        : 0

      // Find current chapter info
      const currentChapter = courseProgress.currentChapterId
        ? allChapters.find(ch => ch.id === courseProgress.currentChapterId)
        : null

      progressMap[courseId] = {
        courseId: courseId,
        progressPercentage,
        completedChapters: completedChapterIds, // Send the actual chapter IDs
        completedCount: completedChapterIds.length, // Keep the count as a separate field
        totalChapters: allChapters.length,
        currentChapterId: courseProgress.currentChapterId,
        currentChapterTitle: currentChapter?.title,
        lastAccessedAt: courseProgress.lastAccessedAt?.toISOString(),
        timeSpent: courseProgress.timeSpent ?? 0,
        isCompleted: progressPercentage === 100,
        lastPositions: Object.fromEntries(
          chapterProgress.map((cp: any) => [cp.chapterId, cp.lastProgress.toNumber()])
        ), // Add last positions for progress indication
      }

      // Also map by slug for easy lookup
      if (courseProgress.course.slug) {
        progressMap[courseProgress.course.slug] = progressMap[courseId]
      }
    }

    return NextResponse.json(progressMap)
  } catch (error) {
    console.error("Error fetching course progress:", error)
    return NextResponse.json(
      { error: "Failed to fetch course progress" },
      { status: 500 }
    )
  }
}
