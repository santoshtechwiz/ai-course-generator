import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { ProgressEvent, ProgressEventType } from "@/store/slices/progress-events-slice"

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { events }: { events: ProgressEvent[] } = await req.json()
    
    console.log(`Progress sync received ${events?.length || 0} events`)

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "No events provided" }, { status: 400 })
    }
    
    // Log event types for debugging
    const eventTypes = events.map(e => e.type)
    console.log(`Event types: ${JSON.stringify(eventTypes)}`)
    

    // Security: Ensure user can only sync their own events
    const invalidEvents = events.filter(event => event.userId !== session.user.id)
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: "Unauthorized: Cannot sync events for different users" },
        { status: 403 }
      )
    }

    // Limit the number of events to prevent abuse
    const MAX_EVENTS = 100
    if (events.length > MAX_EVENTS) {
      return NextResponse.json(
        { error: `Too many events. Maximum ${MAX_EVENTS} allowed per request` },
        { status: 400 }
      )
    }

    const syncedEvents: string[] = []
    const failedEvents: string[] = []

    // Process events in batches to avoid overwhelming the database
    const batchSize = 10
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (event) => {
          try {
            console.log(`Processing event: ${event.type} for ${event.entityType} ${event.entityId}`)
            
            // Convert event to database format
            const dbEvent = {
              userId: event.userId,
              courseId: event.entityType === 'course' ? parseInt(event.entityId) : 
                      (event.entityType === 'chapter' && event.metadata?.courseId ? 
                        parseInt(event.metadata.courseId) : null),
              chapterId: event.entityType === 'chapter' ? parseInt(event.entityId) : null,
              type: mapEventTypeToDbType(event.type),
              entityId: event.entityId,
              progress: extractProgressFromEvent(event),
              timeSpent: extractTimeSpentFromEvent(event),
              metadata: event.metadata || {},
            }

            // Check if event already exists (idempotent)
            const existingEvent = await prisma.learningEvent.findFirst({
              where: {
                userId: event.userId,
                type: dbEvent.type,
                entityId: event.entityId,
                createdAt: {
                  gte: new Date(event.timestamp - 1000), // Within 1 second
                  lte: new Date(event.timestamp + 1000),
                },
              },
            })

            if (!existingEvent) {
              await prisma.learningEvent.create({
                data: dbEvent,
              })
            }

            syncedEvents.push(event.id)
          } catch (error) {
            console.error(`Failed to sync event ${event.id}:`, error)
            failedEvents.push(event.id)
          }
        })
      )
    }

    return NextResponse.json({
      message: `Events sync completed. Synced: ${syncedEvents.length}, Failed: ${failedEvents.length}`,
      syncedEvents,
      failedEvents,
    })
  } catch (error) {
    console.error("Events sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync events" },
      { status: 500 }
    )
  }
}

function mapEventTypeToDbType(eventType: ProgressEventType): string {
  switch (eventType) {
    case ProgressEventType.COURSE_STARTED:
      return 'COURSE_STARTED'
    case ProgressEventType.COURSE_PROGRESS_UPDATED:
      return 'COURSE_PROGRESS_UPDATED'
    case ProgressEventType.QUIZ_STARTED:
      return 'QUIZ_STARTED'
    case ProgressEventType.QUESTION_ANSWERED:
      return 'QUESTION_ANSWERED'
    case ProgressEventType.QUIZ_COMPLETED:
      return 'QUIZ_COMPLETED'
    case ProgressEventType.COURSE_COMPLETED:
      return 'COURSE_COMPLETED'
    case ProgressEventType.VIDEO_WATCHED:
      return 'VIDEO_WATCHED'
    case ProgressEventType.CHAPTER_COMPLETED:
      return 'CHAPTER_COMPLETED'
    default:
      return 'UNKNOWN_EVENT'
  }
}

function extractProgressFromEvent(event: ProgressEvent): number | null {
  switch (event.type) {
    case ProgressEventType.COURSE_PROGRESS_UPDATED:
      return event.metadata.progress || null
    case ProgressEventType.VIDEO_WATCHED:
      return event.metadata.progress || null
    case ProgressEventType.QUIZ_COMPLETED:
      // Support both percentage and score for backward compatibility
      return event.metadata.percentage || event.metadata.score || null
    default:
      return null
  }
}

function extractTimeSpentFromEvent(event: ProgressEvent): number | null {
  switch (event.type) {
    case ProgressEventType.COURSE_PROGRESS_UPDATED:
      return event.metadata.timeSpent || null
    case ProgressEventType.QUESTION_ANSWERED:
      return event.metadata.timeSpent || null
    case ProgressEventType.QUIZ_COMPLETED:
      return event.metadata.timeSpent || null
    case ProgressEventType.CHAPTER_COMPLETED:
      return event.metadata.timeSpent || null
    default:
      return null
  }
}
