import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import prisma from "@/lib/db"

// Robust POST handler for chapter progress update
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;
    const body = await req.json();
    const { courseId, chapterId, progress, timeSpent, isCompleted, completed, lastWatchedAt } = body;

    // Support both 'isCompleted' and 'completed' field names for backwards compatibility
    const completionStatus = isCompleted !== undefined ? isCompleted : completed;

    console.log(`[POST /api/progress/chapter] Received data:`, {
      courseId,
      chapterId,
      progress,
      timeSpent,
      isCompleted,
      completed,
      completionStatus,
      finalBoolean: !!completionStatus,
      lastWatchedAt
    })

    if (!courseId || !chapterId) {
      return NextResponse.json({ error: "Missing courseId or chapterId" }, { status: 400 });
    }

    // Upsert ChapterProgress
    const chapterProgress = await prisma.chapterProgress.upsert({
      where: {
        userId_courseId_chapterId: {
          userId,
          courseId: Number(courseId),
          chapterId: Number(chapterId),
        },
      },
      update: {
        lastProgress: typeof progress === "number" ? progress / 100 : undefined,
        timeSpent: typeof timeSpent === "number" ? timeSpent : undefined,
        isCompleted: !!completionStatus,
        lastAccessedAt: lastWatchedAt ? new Date(lastWatchedAt) : new Date(),
      },
      create: {
        userId,
        courseId: Number(courseId),
        chapterId: Number(chapterId),
        lastProgress: typeof progress === "number" ? progress / 100 : 0,
        timeSpent: typeof timeSpent === "number" ? timeSpent : 0,
        isCompleted: !!completionStatus,
        lastAccessedAt: lastWatchedAt ? new Date(lastWatchedAt) : new Date(),
      },
    });

    console.log(`[POST /api/progress/chapter] Saved ChapterProgress:`, {
      id: chapterProgress.id,
      userId: chapterProgress.userId,
      courseId: chapterProgress.courseId,
      chapterId: chapterProgress.chapterId,
      isCompleted: chapterProgress.isCompleted,
      lastProgress: chapterProgress.lastProgress,
      timeSpent: chapterProgress.timeSpent
    })

    // If chapter is completed, update CourseProgress as well
    if (completionStatus) {
      // Get all completed chapters for this user/course
      const completedChapters = await prisma.chapterProgress.findMany({
        where: {
          userId,
          courseId: Number(courseId),
          isCompleted: true,
        },
        select: { chapterId: true },
      });

      await prisma.courseProgress.upsert({
        where: {
          unique_user_course_progress: {
            userId,
            courseId: Number(courseId),
          },
        },
        update: {
          currentChapterId: Number(chapterId),
          progress: completedChapters.length, // Optionally, calculate percentage here
          isCompleted: false, // Set to true only if all chapters are completed
          lastAccessedAt: new Date(),
          chapterProgress: {
            completedChapters: completedChapters.map((c) => c.chapterId),
          },
        },
        create: {
          userId,
          courseId: Number(courseId),
          currentChapterId: Number(chapterId),
          progress: completedChapters.length,
          isCompleted: false,
          lastAccessedAt: new Date(),
          chapterProgress: {
            completedChapters: completedChapters.map((c) => c.chapterId),
          },
        },
      });
    }

    return NextResponse.json({ success: true, chapterProgress });
  } catch (error) {
    console.error("Chapter progress update error:", error);
    return NextResponse.json({ error: "Failed to update chapter progress" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: "Missing required query parameters: userId, courseId" },
        { status: 400 }
      );
    }

    // Security: Ensure user can only view their own progress
    // Use trim and exact comparison to handle potential string formatting issues
    const requestUserId = String(userId).trim();
    const sessionUserId = String(session.user.id).trim();
    
    if (requestUserId !== sessionUserId) {
      return NextResponse.json(
        { error: "Unauthorized: Cannot view progress for different user" },
        { status: 403 }
      );
    }

    const parsedCourseId = Number(courseId);
    if (isNaN(parsedCourseId)) {
      return NextResponse.json(
        { error: "Invalid courseId. Must be a number." },
        { status: 400 }
      );
    }

    // Get all chapter progress for this user/course
    const chapterProgress = await prisma.chapterProgress.findMany({
      where: {
        userId: userId,
        courseId: parsedCourseId,
      },
      orderBy: {
        lastAccessedAt: 'desc',
      },
    });

    // Get course progress for this user/course
    const courseProgress = await prisma.courseProgress.findUnique({
      where: {
        unique_user_course_progress: {
          userId,
          courseId: parsedCourseId,
        },
      },
    });

    // Aggregate completed chapters and last watched time
    const completedChapters = chapterProgress.filter(cp => cp.isCompleted).map(cp => cp.chapterId);
    // Find the most recently accessed chapter (or use courseProgress.currentChapterId)
    let currentChapterId = courseProgress?.currentChapterId;
    let resumeTime = 0;
    if (currentChapterId) {
      const currentChapter = chapterProgress.find(cp => cp.chapterId === currentChapterId);
      resumeTime = currentChapter ? Math.round((currentChapter.lastProgress || 0) * 100) : 0;
    }

    return NextResponse.json({
      success: true,
      completedChapters,
      currentChapterId,
      resumeTime, // percent (0-100)
      chapterProgress,
      courseProgress,
    });
  } catch (error) {
    console.error("Error fetching chapter progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapter progress" },
      { status: 500 }
    );
  }
}