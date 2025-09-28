/**
 * Worker Thread for Processing Progress Batches
 * Handles the actual database operations for progress updates
 */

import { parentPort, workerData } from 'worker_threads'
import { PrismaClient } from '@prisma/client'

interface Task {
  id: string
  type: 'process_batch' | 'flush_queue' | 'cleanup'
  payload: any
}

interface Event {
  userId: string
  courseId?: string | number
  chapterId?: string | number
  quizId?: string | number
  eventType: string
  progress: number
  timeSpent?: number
  timestamp: string | number | Date
  metadata?: Record<string, any>
}

interface Batch {
  id: string
  events: Event[]
}

class ProgressWorker {
  private workerId: string
  private prisma: PrismaClient
  private processedCount = 0
  private failedCount = 0

  constructor(workerId: string) {
    this.workerId = workerId
    this.prisma = new PrismaClient()

    if (parentPort) {
      parentPort.on('message', this.handleMessage.bind(this))
    }
  }

  private async handleMessage(task: Task) {
    try {
      let result: any

      switch (task.type) {
        case 'process_batch':
          result = await this.processBatch(task.payload as Batch)
          break
        case 'flush_queue':
          result = await this.flushQueue(task.payload)
          break
        case 'cleanup':
          result = await this.cleanup(task.payload)
          break
        default:
          throw new Error(`Unknown task type: ${task.type}`)
      }

      parentPort?.postMessage({
        success: true,
        data: result,
        taskId: task.id
      })
    } catch (error: any) {
      console.error(`Worker ${this.workerId} error processing task ${task.id}:`, error)

      parentPort?.postMessage({
        success: false,
        error: error.message,
        taskId: task.id
      })
    }
  }

  private async processBatch(batch: Batch) {
    const results = {
      batchId: batch.id,
      processed: 0,
      failed: 0,
      errors: [] as string[]
    }

    console.log(
      `Worker ${this.workerId} processing batch ${batch.id} with ${batch.events.length} events`
    )

    const eventGroups = this.groupEventsByType(batch.events)

    for (const [eventType, events] of eventGroups.entries()) {
      try {
        await this.processEventGroup(eventType, events)
        results.processed += events.length
      } catch (error: any) {
        console.error(`Failed to process ${eventType} events:`, error)
        results.failed += events.length
        results.errors.push(`${eventType}: ${error.message}`)
      }
    }

    this.processedCount += results.processed
    this.failedCount += results.failed

    return results
  }

  private groupEventsByType(events: Event[]) {
    const groups = new Map<string, Event[]>()
    for (const event of events) {
      if (!groups.has(event.eventType)) {
        groups.set(event.eventType, [])
      }
      groups.get(event.eventType)!.push(event)
    }
    return groups
  }

  private async processEventGroup(eventType: string, events: Event[]) {
    switch (eventType) {
      case 'chapter_start':
      case 'chapter_progress':
      case 'chapter_complete':
        await this.processChapterEvents(events)
        break
      case 'quiz_start':
      case 'quiz_progress':
      case 'quiz_complete':
        await this.processQuizEvents(events)
        break
      default:
        console.warn(`Unknown event type: ${eventType}`)
    }
  }

  private async processChapterEvents(events: Event[]) {
    // Merge events for the same user/course/chapter to avoid repeated upserts
    const merged = new Map<string, {
      userId: string
      courseId: number
      chapterId: number
      progress: number
      timeSpent: number
      completed: boolean
      lastWatchedAt: Date
      metadata: Record<string, any>
    }>()

    for (const ev of events) {
      const key = `${ev.userId}:${ev.courseId}:${ev.chapterId}`
      const progress = Math.min(100, Math.max(0, ev.progress || 0))
      const timeSpent = Math.max(0, ev.timeSpent || 0)
      const completed = ev.eventType === 'chapter_complete' || progress >= 100
      const lastWatchedAt = new Date(ev.timestamp)

      if (!merged.has(key)) {
        merged.set(key, {
          userId: ev.userId,
          courseId: Number(ev.courseId),
          chapterId: Number(ev.chapterId),
          progress,
          timeSpent,
          completed,
          lastWatchedAt,
          metadata: ev.metadata || {}
        })
        continue
      }

      const existing = merged.get(key)!

      // Keep the highest progress, sum timeSpent, mark completed if any event completed
      existing.progress = Math.max(existing.progress, progress)
      existing.timeSpent = existing.timeSpent + timeSpent
      existing.completed = existing.completed || completed
      if (lastWatchedAt.getTime() > existing.lastWatchedAt.getTime()) {
        existing.lastWatchedAt = lastWatchedAt
      }
      existing.metadata = { ...(existing.metadata || {}), ...(ev.metadata || {}) }
    }

    const chapterUpdates = Array.from(merged.values())

    // Thresholds: only persist if progress changes by >= 2% or timeSpent increases by >= 10s
    const PROGRESS_DELTA_THRESHOLD = 0.02 // fraction
    const TIME_DELTA_SECONDS = 10

    const toUpdate = [] as any[]

    for (const update of chapterUpdates) {
      try {
        const where = {
          userId_courseId_chapterId: {
            userId: update.userId,
            courseId: update.courseId,
            chapterId: update.chapterId
          }
        }

        const existing = await this.prisma.chapterProgress.findUnique({ where })

        const newLastProgress = Math.min(1, Math.max(0, update.progress / 100))
        const newTimeSpent = Math.max(0, update.timeSpent)
        const newCompleted = Boolean(update.completed)

        let shouldUpsert = true

        if (existing) {
          const existingProgress = existing.lastProgress || 0
          const progressDelta = Math.abs(newLastProgress - existingProgress)
          const existingTime = existing.timeSpent || 0
          const timeDelta = Math.max(0, newTimeSpent - existingTime)

          // If progress delta is tiny, added time is small, and completion state didn't change, skip
          const completionChanged = Boolean(newCompleted) !== Boolean(existing.isCompleted)
          if (progressDelta < PROGRESS_DELTA_THRESHOLD && timeDelta < TIME_DELTA_SECONDS && !completionChanged) {
            shouldUpsert = false
          }
        }

        if (!shouldUpsert) {
          console.log(`Skipping no-op upsert for chapterProgress ${update.userId}:${update.courseId}:${update.chapterId} (progress ${update.progress}%, time ${update.timeSpent}s)`) 
          continue
        }

        // Perform upsert
        await this.prisma.chapterProgress.upsert({
          where,
          update: {
            lastProgress: newLastProgress,
            timeSpent: { increment: newTimeSpent },
            isCompleted: newCompleted,
            lastAccessedAt: update.lastWatchedAt,
          },
          create: {
            userId: update.userId,
            courseId: update.courseId,
            chapterId: update.chapterId,
            lastProgress: newLastProgress,
            timeSpent: newTimeSpent,
            isCompleted: newCompleted,
            lastAccessedAt: update.lastWatchedAt,
          }
        })

        toUpdate.push(update)
      } catch (error: any) {
        console.error('Failed to persist chapter update:', error)
      }
    }

    if (toUpdate.length > 0) {
      await this.updateCourseProgress(toUpdate)
    }
  }

  private async processQuizEvents(events: Event[]) {
    const quizGroups = new Map<string, Event[]>()

    for (const event of events) {
      // Build grouping key including course and chapter when available to keep context
      const coursePart = event.courseId ? String(event.courseId) : '0'
      const chapterPart = event.chapterId ? String(event.chapterId) : '0'
      const key = `${event.userId}:${coursePart}:${chapterPart}:${event.quizId || '0'}`
      if (!quizGroups.has(key)) quizGroups.set(key, [])
      quizGroups.get(key)!.push(event)
    }

    for (const [key, quizEvents] of quizGroups.entries()) {
      const [userId, courseIdStr, chapterIdStr] = key.split(':')
      const courseId = Number(courseIdStr || 0)
      const chapterId = Number(chapterIdStr || 0)
      await this.processQuizGroup(userId, courseId, chapterId, quizEvents)
    }
  }

  private async processQuizGroup(userId: string, courseId: number, chapterId: number, events: Event[]) {
    const latestEvent = events.reduce((latest, current) =>
      new Date(current.timestamp).getTime() > new Date(latest.timestamp).getTime()
        ? current
        : latest
    )

    const totalTimeSpent = events.reduce((sum, e) => sum + (e.timeSpent || 0), 0)
    // Upsert into QuizProgress: schema uses userId + courseId + chapterId unique key
    await this.prisma.quizProgress.upsert({
      where: { userId_courseId_chapterId: { userId, courseId, chapterId } },
      update: {
        // map event.progress to currentQuestionIndex (index or percentage depending on producer)
        currentQuestionIndex: typeof latestEvent.progress === 'number' ? latestEvent.progress : undefined,
        timeSpent: { increment: totalTimeSpent },
        isCompleted: latestEvent.eventType === 'quiz_complete',
        lastUpdated: new Date(latestEvent.timestamp),
      },
      create: {
        userId,
        courseId,
        chapterId,
        currentQuestionIndex: typeof latestEvent.progress === 'number' ? latestEvent.progress : 0,
        timeSpent: totalTimeSpent,
        isCompleted: latestEvent.eventType === 'quiz_complete',
        lastUpdated: new Date(latestEvent.timestamp),
      }
    })
  }

  private async updateCourseProgress(chapterUpdates: any[]) {
    const courseGroups = new Map<string, any[]>()
    for (const update of chapterUpdates) {
      const key = `${update.userId}:${update.courseId}`
      if (!courseGroups.has(key)) courseGroups.set(key, [])
      courseGroups.get(key)!.push(update)
    }

    for (const [key] of courseGroups.entries()) {
      const [userId, courseIdStr] = key.split(':')
      const courseId = Number(courseIdStr)

      const allChapterProgress = await this.prisma.chapterProgress.findMany({
        where: { userId, courseId }
      })

      const totalChapters = await this.prisma.chapter.count({
        where: { unit: { courseId } }
      })

      const completedChapters = allChapterProgress.filter(cp => cp.isCompleted).length
      const totalTimeSpent = allChapterProgress.reduce((sum, cp) => sum + cp.timeSpent, 0)
      const avgProgress =
        totalChapters > 0
          ? allChapterProgress.reduce((sum, cp) => sum + (cp.lastProgress || 0), 0) / totalChapters
          : 0

      await this.prisma.courseProgress.upsert({
        where: { unique_user_course_progress: { userId, courseId } },
        update: {
          // progress: store as fraction 0..1
          progress: avgProgress,
          // total time in seconds
          timeSpent: totalTimeSpent,
          // embed completed chapter ids in chapterProgress JSON
          chapterProgress: { completedChapters: allChapterProgress.filter(cp => cp.isCompleted).map(cp => cp.chapterId) },
          lastAccessedAt: new Date(),
          // isCompleted boolean flag
          isCompleted: completedChapters === totalChapters && totalChapters > 0
        },
        create: {
          userId,
          courseId,
          progress: avgProgress,
          timeSpent: totalTimeSpent,
          chapterProgress: { completedChapters: allChapterProgress.filter(cp => cp.isCompleted).map(cp => cp.chapterId) },
          currentChapterId: allChapterProgress[0]?.chapterId || 1,
          lastAccessedAt: new Date(),
          isCompleted: completedChapters === totalChapters && totalChapters > 0
        }
      })
    }
  }

  private async flushQueue(_: any) {
    return { success: true, message: 'Queue flushed' }
  }

  private async cleanup(_: any) {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const deletedCount = await this.prisma.chapterProgress.deleteMany({
      where: {
        lastAccessedAt: { lt: cutoffDate },
        isCompleted: false,
        lastProgress: 0
      }
    })

    return { deletedRecords: deletedCount.count }
  }

  async shutdown() {
    await this.prisma.$disconnect()
  }
}

// Initialize worker
const worker = new ProgressWorker(workerData?.workerId || 'unknown')

// Handle shutdown
process.on('SIGTERM', async () => {
  await worker.shutdown()
  process.exit(0)
})
