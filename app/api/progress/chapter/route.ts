import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import prisma from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { 
      userId, 
      courseId, 
      chapterId, 
      progress, 
      timeSpent, 
      completed, 
      lastWatchedAt 
    } = await req.json()

    // Validate required fields
    if (!userId || !courseId || !chapterId) {
      return NextResponse.json({ 
        error: "Missing required fields: userId, courseId, chapterId" 
      }, { status: 400 })
    }

    // Security: Ensure user can only update their own progress
    if (userId !== session.user.id) {
      return NextResponse.json({ 
        error: "Unauthorized: Cannot update progress for different user" 
      }, { status: 403 })
    }

    console.log(`Updating ChapterProgress: userId=${userId}, courseId=${courseId}, chapterId=${chapterId}, progress=${progress}%`)

    // Check if chapter progress already exists
    const existingProgress = await prisma.chapterProgress.findFirst({
      where: {
        userId: userId,
        courseId: Number(courseId),
        chapterId: Number(chapterId)
      }
    })

    let chapterProgress

    if (existingProgress) {
      // Update existing progress
      chapterProgress = await prisma.chapterProgress.update({
        where: { id: existingProgress.id },
        data: {
          lastProgress: Number(progress) / 100 || existingProgress.lastProgress, // Convert percentage to fraction
          timeSpent: Number(timeSpent) || existingProgress.timeSpent,
          isCompleted: completed !== undefined ? Boolean(completed) : existingProgress.isCompleted,
          lastAccessedAt: lastWatchedAt ? new Date(lastWatchedAt) : new Date()
        }
      })
      console.log(`Updated existing ChapterProgress with id ${existingProgress.id}`)
    } else {
      // Create new progress entry
      chapterProgress = await prisma.chapterProgress.create({
        data: {
          userId: userId,
          courseId: Number(courseId),
          chapterId: Number(chapterId),
          lastProgress: Number(progress) / 100 || 0, // Convert percentage to fraction
          timeSpent: Number(timeSpent) || 0,
          isCompleted: Boolean(completed) || false,
          lastAccessedAt: lastWatchedAt ? new Date(lastWatchedAt) : new Date()
        }
      })
      console.log(`Created new ChapterProgress with id ${chapterProgress.id}`)
    }

    return NextResponse.json({
      success: true,
      chapterProgress,
      message: existingProgress ? "Chapter progress updated" : "Chapter progress created"
    })

  } catch (error) {
    console.error("Chapter progress update error:", error)
    return NextResponse.json(
      { error: "Failed to update chapter progress" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const courseId = searchParams.get('courseId')
    const chapterId = searchParams.get('chapterId')

    if (!userId || !courseId) {
      return NextResponse.json({ 
        error: "Missing required parameters: userId, courseId" 
      }, { status: 400 })
    }

    // Security: Ensure user can only get their own progress
    if (userId !== session.user.id) {
      return NextResponse.json({ 
        error: "Unauthorized: Cannot get progress for different user" 
      }, { status: 403 })
    }

    let whereClause: any = {
      userId: userId,
      courseId: Number(courseId)
    }

    if (chapterId) {
      whereClause.chapterId = Number(chapterId)
    }

    const chapterProgress = await prisma.chapterProgress.findMany({
      where: whereClause,
      orderBy: { chapterId: 'asc' },
      select: {
        id: true,
        userId: true,
        courseId: true,
        chapterId: true,
        isCompleted: true,
        timeSpent: true,
        lastProgress: true,
        lastAccessedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      chapterProgress
    })

  } catch (error) {
    console.error("Chapter progress fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch chapter progress" },
      { status: 500 }
    )
  }
}
