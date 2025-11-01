
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/db";

// Helper to safely parse JSON fields
function safeParse(value, fallback) {
  if (typeof value !== "string") return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// Extract completed chapters from chapterProgress JSON field
function extractCompletedChapters(chapterProgress) {
  let parsed;
  if (typeof chapterProgress === 'object' && chapterProgress !== null) {
    parsed = chapterProgress;
    if (Array.isArray(parsed.completedChapters)) {
      return parsed.completedChapters;
    }
  }
  if (typeof chapterProgress === 'string') {
    try {
      parsed = JSON.parse(chapterProgress);
      if (Array.isArray(parsed.completedChapters)) {
        return parsed.completedChapters;
      }
    } catch (e) {
      // ignore
    }
  }
  return [];
}

export async function POST(req: NextRequest) {
  try {
    // Check if request has content
    const contentLength = req.headers.get('content-length');
    if (!contentLength || contentLength === '0') {
      return NextResponse.json({ 
        success: false,
        error: "Empty request body",
        message: "No events provided" 
      }, { status: 400 });
    }

    let body;
    try {
      const text = await req.text();
      if (!text || text.trim() === '') {
        return NextResponse.json({ 
          success: false,
          error: "Empty request body",
          message: "No events provided" 
        }, { status: 400 });
      }
      body = JSON.parse(text);
    } catch (parseError) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid JSON format",
        message: parseError instanceof Error ? parseError.message : "Failed to parse request body" 
      }, { status: 400 });
    }

    // Validate the body structure
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ 
        success: false,
        error: "Invalid request format",
        message: "Request body must be a valid JSON object" 
      }, { status: 400 });
    }

    const events = body.events || [];
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid events format",
        message: "Events must be a non-empty array" 
      }, { status: 400 });
    }

    // Authenticate user
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // Group events by courseId (entityId for course events, metadata.courseId for chapter events)
    const courseEvents = events.filter(e => e.entityType === 'course');
    const chapterEvents = events.filter(e => e.entityType === 'chapter');

    // For each course, aggregate progress and completedChapters
    const courseProgressMap = new Map();
    for (const event of courseEvents) {
      if (event.type === 'COURSE_PROGRESS_UPDATED') {
        const courseId = event.entityId;
        if (!courseProgressMap.has(courseId)) {
          courseProgressMap.set(courseId, {
            progress: 0,
            completedChapters: [],
            currentChapterId: undefined,
            timeSpent: 0
          });
        }
        const entry = courseProgressMap.get(courseId);
        entry.progress = Math.max(entry.progress, event.metadata.progress ?? 0);
        if (Array.isArray(event.metadata.completedChapters)) {
          entry.completedChapters = Array.from(new Set([...(entry.completedChapters || []), ...event.metadata.completedChapters]));
        }
        if (typeof event.metadata.currentChapterId === 'number') {
          entry.currentChapterId = event.metadata.currentChapterId;
        }
        if (typeof event.metadata.timeSpent === 'number') {
          entry.timeSpent = Math.max(entry.timeSpent, event.metadata.timeSpent);
        }
      }
    }

    // For each chapter, aggregate playedSeconds and progress
    const chapterProgressMap = new Map();
    for (const event of chapterEvents) {
      if (event.type === 'VIDEO_WATCHED') {
        const courseId = event.metadata.courseId;
        const chapterId = event.entityId;
        if (!chapterProgressMap.has(courseId)) chapterProgressMap.set(courseId, {});
        const courseChapters = chapterProgressMap.get(courseId);
        if (!courseChapters[chapterId]) courseChapters[chapterId] = { playedSeconds: 0, progress: 0 };
        courseChapters[chapterId].playedSeconds = Math.max(courseChapters[chapterId].playedSeconds, event.metadata.playedSeconds ?? 0);
        courseChapters[chapterId].progress = Math.max(courseChapters[chapterId].progress, event.metadata.progress ?? 0);
      }
      if (event.type === 'CHAPTER_COMPLETED') {
        const courseId = event.metadata.courseId;
        const chapterId = event.entityId;
        if (!chapterProgressMap.has(courseId)) chapterProgressMap.set(courseId, {});
        const courseChapters = chapterProgressMap.get(courseId);
        if (!courseChapters[chapterId]) courseChapters[chapterId] = { playedSeconds: 0, progress: 0 };
        courseChapters[chapterId].isCompleted = true;
        courseChapters[chapterId].completedAt = event.metadata.completedAt;
      }
    }

    // Persist progress for each course
    const results = [];
    const completedChaptersMap: Record<string, number[]> = {}; // ✅ Build map for response
    
    for (const [courseId, progressData] of courseProgressMap.entries()) {
      // Get existing progress
      const existingProgress = await prisma.courseProgress.findUnique({
        where: {
          unique_user_course_progress: {
            userId,
            courseId: Number(courseId),
          },
        },
      });

      // Merge completedChapters
      const existingCompletedChapters = extractCompletedChapters(existingProgress?.chapterProgress);
      const updatedCompletedChapters = Array.from(new Set([...(existingCompletedChapters || []), ...(progressData.completedChapters || [])]));
      
      // ✅ CRITICAL: Also query database for any chapters that may have been marked complete
      // This ensures we catch ALL completed chapters, not just those in events
      const dbCompletedChapters = await prisma.chapterProgress.findMany({
        where: {
          userId,
          courseId: Number(courseId),
          isCompleted: true,
        },
        select: {
          chapterId: true,
        },
      });
      
      const dbCompletedIds = dbCompletedChapters.map(c => c.chapterId);
      const allCompletedChapters = Array.from(new Set([...updatedCompletedChapters, ...dbCompletedIds]));
      
      // ✅ Store final list in map for response
      completedChaptersMap[`${userId}:${courseId}`] = allCompletedChapters;

      // Prepare updated chapterProgress JSON
      const existingQuizProgress = existingProgress?.quizProgress ? safeParse(existingProgress.quizProgress, {}) : {};
      const existingLastPositions = existingQuizProgress.lastPositions || {};
      // Merge playedSeconds from chapterProgressMap
      const chapterMap = chapterProgressMap.get(courseId) || {};
      for (const [chapterId, ch] of Object.entries(chapterMap)) {
        if (typeof ch.playedSeconds === 'number' && ch.playedSeconds > 0) {
          existingLastPositions[chapterId] = ch.playedSeconds;
        }
      }
      existingQuizProgress.lastPositions = existingLastPositions;

      // Update or create the progress record
      const updatedChapterProgress = {
        completedChapters: allCompletedChapters,
        lastPositions: existingQuizProgress.lastPositions || {}
      };

      // Calculate overall course progress based on completed chapters
      const totalChapters = await prisma.chapter.count({
        where: {
          unit: {
            courseId: Number(courseId)
          }
        }
      })
      
      const completedCount = allCompletedChapters.length
      const calculatedProgress = totalChapters > 0 ? (completedCount / totalChapters) * 100 : 0

      // Use the higher of existing progress or calculated progress
      const finalProgress = Math.max(progressData.progress || 0, calculatedProgress)

      const updatedProgress = await prisma.courseProgress.upsert({
        where: {
          unique_user_course_progress: {
            userId,
            courseId: Number(courseId),
          },
        },
        update: {
          currentChapterId: progressData.currentChapterId,
          chapterProgress: updatedChapterProgress,
          progress: finalProgress,
          lastAccessedAt: new Date(),
          isCompleted: finalProgress >= 99,
          timeSpent: progressData.timeSpent,
          quizProgress: existingQuizProgress,
        },
        create: {
          userId,
          courseId: Number(courseId),
          currentChapterId: progressData.currentChapterId,
          chapterProgress: updatedChapterProgress,
          progress: finalProgress,
          isCompleted: finalProgress >= 99,
          timeSpent: progressData.timeSpent,
          quizProgress: existingQuizProgress,
        },
      });

      results.push({ courseId, updatedProgress });
    }

    return NextResponse.json({ 
      success: true,
      message: "Events processed and progress updated",
      updatedCourses: results.map(r => r.courseId),
      count: events.length,
      timestamp: body.timestamp || Date.now(),
      // ✅ Return completedChapters map for client-side cache invalidation
      completedChaptersMap
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to process events",
      message: error instanceof Error ? error.message : "Unknown server error" 
    }, { status: 500 });
  }
}
