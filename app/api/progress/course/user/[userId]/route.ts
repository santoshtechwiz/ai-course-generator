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

    // Fetch course progress data
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

    // Fetch chapter progress for each course to calculate detailed progress
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
      
      // Get completed chapters
      const chapterProgress = await prisma.chapterProgress.findMany({
        where: {
          userId: userId,
          courseId: courseProgress.courseId,
          isCompleted: true,
        },
        select: {
          chapterId: true,
          lastProgress: true,
          lastAccessedAt: true,
        }
      })

      const completedChapterIds = chapterProgress.map(cp => cp.chapterId)
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
        completedChapters: completedChapterIds, // Send the actual chapter IDs instead of just the count
        completedCount: completedChapterIds.length, // Keep the count as a separate field
        totalChapters: allChapters.length,
        currentChapterId: courseProgress.currentChapterId,
        currentChapterTitle: currentChapter?.title,
        lastAccessedAt: courseProgress.lastAccessedAt?.toISOString(),
        timeSpent: courseProgress.timeSpent || 0,
        isCompleted: progressPercentage === 100,
        lastPositions: Object.fromEntries(
          chapterProgress.map(cp => [cp.chapterId, cp.lastProgress])
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
