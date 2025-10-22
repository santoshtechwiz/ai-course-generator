import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { ProgressEvent } from '@/services/enhanced-progress/types'

interface ProgressUpdateRequest {
  events: ProgressEvent[]
}

// Handle unsupported HTTP methods
export async function GET() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. This endpoint only supports POST requests.',
      allowedMethods: ['POST']
    },
    { status: 405, headers: { 'Allow': 'POST' } }
  )
}

export async function PUT() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use POST instead.',
      allowedMethods: ['POST']
    },
    { status: 405, headers: { 'Allow': 'POST' } }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. This endpoint only supports POST requests.',
      allowedMethods: ['POST']
    },
    { status: 405, headers: { 'Allow': 'POST' } }
  )
}

export async function POST(request: NextRequest) {
  try {
    // Debug: Log request details
    const contentType = request.headers.get('content-type')
    const contentLength = request.headers.get('content-length')
    console.log('Enhanced progress update request:', {
      contentType,
      contentLength,
      method: request.method,
      url: request.url
    })

    // Try to get the raw body first
    let rawBody: string
    try {
      rawBody = await request.text()
      console.log('Raw request body:', rawBody)
    } catch (textError) {
      console.error('Failed to read request as text:', textError)
      return NextResponse.json(
        { error: 'Failed to read request body' },
        { status: 400 }
      )
    }

    if (!rawBody || rawBody.trim() === '') {
      console.error('Empty request body received')
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      )
    }

    let body: ProgressUpdateRequest
    try {
      body = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw body:', rawBody)
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: parseError.message },
        { status: 400 }
      )
    }
    
    if (!body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: 'Invalid request format. Expected events array.' },
        { status: 400 }
      )
    }

    console.log(`Processing ${body.events.length} progress events`)

    const results = []

    for (const event of body.events) {
      try {
        // Validate required fields
        if (!event.userId || !event.courseId || !event.chapterId || !event.eventType) {
          console.error('Missing required fields:', event)
          results.push({
            eventId: event.id,
            success: false,
            error: 'Missing required fields'
          })
          continue
        }

        const courseId = parseInt(String(event.courseId))
        const chapterId = parseInt(String(event.chapterId))

        if (isNaN(courseId) || isNaN(chapterId)) {
          console.error('Invalid ID format:', { courseId: event.courseId, chapterId: event.chapterId })
          results.push({
            eventId: event.id,
            success: false,
            error: 'Invalid Course ID or Chapter ID format'
          })
          continue
        }

        // Process based on event type
        switch (event.eventType) {
          case 'chapter_start':
          case 'chapter_progress':
            await handleChapterProgress(event, courseId, chapterId)
            break
          case 'chapter_complete':
            await handleChapterCompletion(event, courseId, chapterId)
            break
          case 'quiz_start':
          case 'quiz_progress':
          case 'quiz_complete':
            await handleQuizProgress(event, courseId, chapterId)
            break
          default:
            console.warn(`Unknown event type: ${event.eventType}`)
        }

        results.push({
          eventId: event.id,
          success: true,
          timestamp: Date.now()
        })

        console.log(`Processed event: ${event.eventType} for course ${courseId}, chapter ${chapterId}`)

      } catch (eventError) {
        console.error('Error processing event:', eventError)
        results.push({
          eventId: event.id,
          success: false,
          error: eventError instanceof Error ? eventError.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const errorCount = results.length - successCount

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful: successCount,
      errors: errorCount,
      results
    })

  } catch (error) {
    console.error('Enhanced progress update error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function handleChapterProgress(event: ProgressEvent, courseId: number, chapterId: number) {
  // Upsert chapter progress
  await prisma.chapterProgress.upsert({
    where: {
      userId_courseId_chapterId: {
        userId: event.userId,
        courseId: courseId,
        chapterId: chapterId
      }
    },
    update: {
      lastProgress: event.progress,
      timeSpent: event.timeSpent,
      lastAccessedAt: new Date(event.timestamp),
      isCompleted: event.eventType === 'chapter_complete'
    },
    create: {
      userId: event.userId,
      courseId: courseId,
      chapterId: chapterId,
      lastProgress: event.progress,
      timeSpent: event.timeSpent,
      lastAccessedAt: new Date(event.timestamp),
      isCompleted: event.eventType === 'chapter_complete'
    }
  })
  
  // Also persist last played position into CourseProgress.quizProgress.lastPositions
  try {
    // Determine seconds to save: prefer metadata.playedSeconds or metadata.watchedSeconds, fallback to timeSpent
    const meta = (event as any).metadata || {}
    const playedSeconds = typeof meta.playedSeconds === 'number'
      ? meta.playedSeconds
      : (typeof meta.watchedSeconds === 'number' ? meta.watchedSeconds : (typeof event.timeSpent === 'number' ? event.timeSpent : undefined))

    if (typeof playedSeconds === 'number') {
      // Load existing course progress record
      const existing = await prisma.courseProgress.findUnique({
        where: {
          unique_user_course_progress: {
            userId: event.userId,
            courseId: courseId
          }
        }
      })

      // Safely parse existing quizProgress
      let existingQuizProgress: any = {}
      try {
        existingQuizProgress = existing?.quizProgress && typeof existing.quizProgress === 'string'
          ? JSON.parse(existing.quizProgress as string)
          : existing?.quizProgress || {}
      } catch (e) {
        existingQuizProgress = existing?.quizProgress || {}
      }

      if (!existingQuizProgress.lastPositions || typeof existingQuizProgress.lastPositions !== 'object') {
        existingQuizProgress.lastPositions = {}
      }

      // Merge and persist
      existingQuizProgress.lastPositions[String(chapterId)] = Math.max(existingQuizProgress.lastPositions[String(chapterId)] || 0, playedSeconds)

      await prisma.courseProgress.upsert({
        where: {
          unique_user_course_progress: {
            userId: event.userId,
            courseId: courseId
          }
        },
        update: {
          quizProgress: existingQuizProgress,
          lastAccessedAt: new Date()
        },
        create: {
          userId: event.userId,
          courseId: courseId,
          currentChapterId: chapterId,
          progress: 0,
          timeSpent: event.timeSpent || 0,
          quizProgress: existingQuizProgress,
          lastAccessedAt: new Date()
        }
      })
    }
  } catch (err) {
    console.error('Failed to persist lastPositions for chapter progress:', err)
  }
}

async function handleChapterCompletion(event: ProgressEvent, courseId: number, chapterId: number) {
  // Mark chapter as completed
  await prisma.chapterProgress.upsert({
    where: {
      userId_courseId_chapterId: {
        userId: event.userId,
        courseId: courseId,
        chapterId: chapterId
      }
    },
    update: {
      lastProgress: 100,
      timeSpent: event.timeSpent,
      lastAccessedAt: new Date(event.timestamp),
      isCompleted: true
    },
    create: {
      userId: event.userId,
      courseId: courseId,
      chapterId: chapterId,
      lastProgress: 100,
      timeSpent: event.timeSpent,
      lastAccessedAt: new Date(event.timestamp),
      isCompleted: true
    }
  })

  // Update course progress
  await updateCourseProgress(event.userId, courseId)
}

async function handleQuizProgress(event: ProgressEvent, courseId: number, chapterId: number) {
  // Upsert quiz progress
  await prisma.quizProgress.upsert({
    where: {
      userId_courseId_chapterId: {
        userId: event.userId,
        courseId: courseId,
        chapterId: chapterId
      }
    },
    update: {
      currentQuestionIndex: event.progress,
      timeSpent: event.timeSpent,
      isCompleted: event.eventType === 'quiz_complete',
      lastUpdated: new Date(event.timestamp)
    },
    create: {
      userId: event.userId,
      courseId: courseId,
      chapterId: chapterId,
      currentQuestionIndex: event.progress,
      timeSpent: event.timeSpent,
      isCompleted: event.eventType === 'quiz_complete',
      lastUpdated: new Date(event.timestamp)
    }
  })
}

async function updateCourseProgress(userId: string, courseId: number) {
  // Get all chapter progress for this course
  const chapterProgress = await prisma.chapterProgress.findMany({
    where: {
      userId,
      courseId
    }
  })

  const totalChapters = chapterProgress.length
  const completedChapters = chapterProgress.filter(cp => cp.isCompleted).length
  const totalTimeSpent = chapterProgress.reduce((sum, cp) => sum + cp.timeSpent, 0)
  // Prisma CourseProgress.progress stores a fraction between 0 and 1
  const overallProgress = totalChapters > 0 ? (completedChapters / totalChapters) : 0

  // Update course progress
  await prisma.courseProgress.upsert({
    where: {
      unique_user_course_progress: {
        userId,
        courseId
      }
    },
    update: {
      progress: overallProgress,
      timeSpent: totalTimeSpent,
      isCompleted: completedChapters === totalChapters && totalChapters > 0,
      lastAccessedAt: new Date()
    },
    create: {
      userId,
      courseId,
      progress: overallProgress,
      timeSpent: totalTimeSpent,
      currentChapterId: chapterProgress[0]?.chapterId || 1,
      isCompleted: completedChapters === totalChapters && totalChapters > 0,
      lastAccessedAt: new Date()
    }
  })
}