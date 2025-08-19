import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { courseProgressSchema, validateCourseProgress } from "@/schema/progress-schema"

export async function GET(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const session = await getAuthSession()

  if (!session?.user?.id) {
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
    const rawData = await req.json()

    // Validate the request data using the centralized schema
    let data
    try {
      data = validateCourseProgress(rawData)
    } catch (validationError) {
      return NextResponse.json(
        { 
          error: "Invalid request data", 
          details: validationError instanceof Error ? validationError.message : "Validation failed",
          receivedData: rawData
        },
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
        existingCompletedChapters = []
      }
    } else if (existingProgress && Array.isArray(existingProgress.completedChapters)) {
      existingCompletedChapters = existingProgress.completedChapters
    }

    // Merge and deduplicate the completed chapters
    const newCompletedChapters = data.completedChapters || []
    const updatedCompletedChapters = [...new Set([...existingCompletedChapters, ...newCompletedChapters])]

    // Calculate progress if not provided
    let calculatedProgress = data.progress
    if (calculatedProgress === undefined && existingProgress) {
      calculatedProgress = existingProgress.progress
    } else if (calculatedProgress === undefined) {
      calculatedProgress = 0
    }

    // Update or create the progress record
    const updatedProgress = await prisma.courseProgress.upsert({
      where: {
        unique_user_course_progress: {
          userId: userId,
          courseId: Number.parseInt(courseId),
        },
      },
      update: {
        currentChapterId: data.currentChapterId,
        completedChapters: JSON.stringify(updatedCompletedChapters),
        progress: calculatedProgress,
        lastAccessedAt: new Date(),
        isCompleted: data.isCompleted || false,
        // Update time spent if provided
        ...(data.playedSeconds && { timeSpent: Math.floor(data.playedSeconds) }),
      },
      create: {
        userId: userId,
        courseId: Number.parseInt(courseId),
        currentChapterId: data.currentChapterId,
        completedChapters: JSON.stringify(updatedCompletedChapters),
        progress: calculatedProgress,
        isCompleted: data.isCompleted || false,
        timeSpent: data.playedSeconds ? Math.floor(data.playedSeconds) : 0,
      },
    })

    // Parse completedChapters from JSON string to array before sending the response
    if (updatedProgress && typeof updatedProgress.completedChapters === "string") {
      try {
        updatedProgress.completedChapters = JSON.parse(updatedProgress.completedChapters)
      } catch (e) {
        console.error(`Error parsing updated completedChapters: ${e}`)
        updatedProgress.completedChapters = []
      }
    }

    return NextResponse.json({ 
      progress: updatedProgress,
      message: "Progress updated successfully"
    })
  } catch (error) {
    console.error(`Error updating progress: ${error}`)
    return NextResponse.json({ 
      error: "Failed to update progress",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
