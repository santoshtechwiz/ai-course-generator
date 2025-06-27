import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import prisma from "@/lib/db"


export async function GET(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ data: [] }, { status: 200 })
  }

  const { courseId } = await params
  if (!courseId) {
    return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
  }

  const userId = session.user.id

  try {
    const progress = await prisma.courseProgress.findUnique({
      where: {
        unique_user_course_progress: {
          userId: userId,
          courseId: Number.parseInt(courseId),
        },
      },
    })

    // Parse completedChapters from JSON string to array
    if (progress && typeof progress.completedChapters === "string") {
      try {
        progress.completedChapters = JSON.parse(progress.completedChapters)
      } catch (e) {
        console.error(`Error parsing completedChapters: ${e}`)
        progress.completedChapters = "[]"
      }
    }

    return NextResponse.json({ progress })
  } catch (error) {
    console.error(`Error fetching progress: ${error}`)
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { courseId } = await params
  if (!courseId) {
    return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
  }

  try {
    const userId = session.user.id
    const data = await req.json()

    // Validate required fields
    if (!data.currentChapterId) {
      return NextResponse.json(
        { error: "Current Chapter ID is required", details: data },
        { status: 400 }
      )
    }

    // Ensure completedChapters is an array
    const completedChapters = Array.isArray(data.completedChapters) ? data.completedChapters : [];

    // Convert currentChapterId to number
    const currentChapterId = Number(data.currentChapterId);
    if (isNaN(currentChapterId)) {
      return NextResponse.json(
        { error: "Invalid Chapter ID format", details: { providedId: data.currentChapterId } },
        { status: 400 }
      )
    }

    // Get existing progress to merge completed chapters
    const existingProgress = await prisma.courseProgress.findUnique({
      where: {
        unique_user_course_progress: {
          userId: userId,
          courseId: Number.parseInt(courseId),
        },
      },
    })

    let existingCompletedChapters: number[] = []
    if (existingProgress && typeof existingProgress.completedChapters === "string") {
      try {
        existingCompletedChapters = JSON.parse(existingProgress.completedChapters)
      } catch (error) {
        console.error("Error parsing existing completedChapters:", error)
      }
    } else if (existingProgress && Array.isArray(existingProgress.completedChapters)) {
      existingCompletedChapters = existingProgress.completedChapters
    }

    // Merge and deduplicate the completed chapters
    const updatedCompletedChapters = [...new Set([...existingCompletedChapters, ...completedChapters])]

    // Update or create the progress record
    const updatedProgress = await prisma.courseProgress.upsert({
      where: {
        unique_user_course_progress: {
          userId: userId,
          courseId: Number.parseInt(courseId),
        },
      },
      update: {
        currentChapterId: currentChapterId,
        completedChapters: JSON.stringify(updatedCompletedChapters),
        progress: data.progress || (existingProgress?.progress || 0),
        lastAccessedAt: new Date(),
        isCompleted: data.isCompleted || false,
      },
      create: {
        userId: userId,
        courseId: Number.parseInt(courseId),
        currentChapterId: currentChapterId,
        completedChapters: JSON.stringify(updatedCompletedChapters),
        progress: data.progress || 0,
        isCompleted: data.isCompleted || false,
      },
    })

    // Parse completedChapters from JSON string to array before sending the response
    if (updatedProgress && typeof updatedProgress.completedChapters === "string") {
      try {
        updatedProgress.completedChapters = JSON.parse(updatedProgress.completedChapters)
      } catch (e) {
        console.error(`Error parsing updated completedChapters: ${e}`)
        updatedProgress.completedChapters = JSON.stringify([])
      }
    }

    return NextResponse.json({ progress: updatedProgress })
  } catch (error) {
    console.error(`Error updating progress: ${error}`)
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 })
  }
}
