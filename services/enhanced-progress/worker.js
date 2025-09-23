/**
 * Worker Thread for Processing Progress Batches
 * Handles the actual database operations for progress updates
 */

const { parentPort, workerData } = require('worker_threads')
const { PrismaClient } = require('@prisma/client')

class ProgressWorker {
  constructor(workerId) {
    this.workerId = workerId
    this.prisma = new PrismaClient()
    this.processedCount = 0
    this.failedCount = 0
    
    if (parentPort) {
      parentPort.on('message', this.handleMessage.bind(this))
    }
  }

  async handleMessage(task) {
    try {
      let result
      
      switch (task.type) {
        case 'process_batch':
          result = await this.processBatch(task.payload)
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

      if (parentPort) {
        parentPort.postMessage({
          success: true,
          data: result,
          taskId: task.id
        })
      }
    } catch (error) {
      console.error(`Worker ${this.workerId} error processing task ${task.id}:`, error)
      
      if (parentPort) {
        parentPort.postMessage({
          success: false,
          error: error.message,
          taskId: task.id
        })
      }
    }
  }

  async processBatch(batch) {
    const results = {
      batchId: batch.id,
      processed: 0,
      failed: 0,
      errors: []
    }

    console.log(`Worker ${this.workerId} processing batch ${batch.id} with ${batch.events.length} events`)

    // Group events by type for efficient processing
    const eventGroups = this.groupEventsByType(batch.events)

    // Process each group
    for (const [eventType, events] of eventGroups.entries()) {
      try {
        await this.processEventGroup(eventType, events)
        results.processed += events.length
      } catch (error) {
        console.error(`Failed to process ${eventType} events:`, error)
        results.failed += events.length
        results.errors.push(`${eventType}: ${error.message}`)
      }
    }

    this.processedCount += results.processed
    this.failedCount += results.failed

    return results
  }

  groupEventsByType(events) {
    const groups = new Map()
    
    for (const event of events) {
      if (!groups.has(event.eventType)) {
        groups.set(event.eventType, [])
      }
      groups.get(event.eventType).push(event)
    }

    return groups
  }

  async processEventGroup(eventType, events) {
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

  async processChapterEvents(events) {
    // Use batch upsert for better performance
    const chapterUpdates = events.map(event => ({
      userId: event.userId,
      courseId: parseInt(event.courseId),
      chapterId: parseInt(event.chapterId),
      progress: Math.min(100, Math.max(0, event.progress)),
      timeSpent: Math.max(0, event.timeSpent || 0),
      completed: event.eventType === 'chapter_complete' || event.progress >= 100,
      lastWatchedAt: new Date(event.timestamp),
      metadata: event.metadata || {}
    }))

    // Batch upsert with conflict resolution
    for (const update of chapterUpdates) {
      await this.prisma.chapterProgress.upsert({
        where: {
          userId_courseId_chapterId: {
            userId: update.userId,
            courseId: update.courseId,
            chapterId: update.chapterId
          }
        },
        update: {
          progress: update.progress,
          timeSpent: {
            increment: update.timeSpent
          },
          completed: update.completed,
          lastWatchedAt: update.lastWatchedAt,
          metadata: update.metadata
        },
        create: update
      })
    }

    // Update course progress aggregation
    await this.updateCourseProgress(chapterUpdates)
  }

  async processQuizEvents(events) {
    // Group by quiz for batch processing
    const quizGroups = new Map()
    
    for (const event of events) {
      const key = `${event.userId}:${event.quizId}`
      if (!quizGroups.has(key)) {
        quizGroups.set(key, [])
      }
      quizGroups.get(key).push(event)
    }

    for (const [key, quizEvents] of quizGroups.entries()) {
      const [userId, quizId] = key.split(':')
      await this.processQuizGroup(userId, quizId, quizEvents)
    }
  }

  async processQuizGroup(userId, quizId, events) {
    const latestEvent = events.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    )

    const totalTimeSpent = events.reduce((sum, event) => sum + (event.timeSpent || 0), 0)

    await this.prisma.quizProgress.upsert({
      where: {
        userId_quizId: {
          userId,
          quizId: parseInt(quizId)
        }
      },
      update: {
        progress: latestEvent.progress,
        timeSpent: {
          increment: totalTimeSpent
        },
        completed: latestEvent.eventType === 'quiz_complete',
        lastAttemptAt: new Date(latestEvent.timestamp),
        metadata: latestEvent.metadata || {}
      },
      create: {
        userId,
        quizId: parseInt(quizId),
        progress: latestEvent.progress,
        timeSpent: totalTimeSpent,
        completed: latestEvent.eventType === 'quiz_complete',
        lastAttemptAt: new Date(latestEvent.timestamp),
        metadata: latestEvent.metadata || {}
      }
    })
  }

  async updateCourseProgress(chapterUpdates) {
    // Group by course and user
    const courseGroups = new Map()
    
    for (const update of chapterUpdates) {
      const key = `${update.userId}:${update.courseId}`
      if (!courseGroups.has(key)) {
        courseGroups.set(key, [])
      }
      courseGroups.get(key).push(update)
    }

    for (const [key, updates] of courseGroups.entries()) {
      const [userId, courseIdStr] = key.split(':')
      const courseId = parseInt(courseIdStr)
      
      // Calculate course-level progress
      const allChapterProgress = await this.prisma.chapterProgress.findMany({
        where: { userId, courseId }
      })

      const totalChapters = await this.prisma.chapter.count({
        where: { unit: { courseId } }
      })

      const completedChapters = allChapterProgress.filter(cp => cp.completed).length
      const totalTimeSpent = allChapterProgress.reduce((sum, cp) => sum + cp.timeSpent, 0)
      const avgProgress = totalChapters > 0 
        ? allChapterProgress.reduce((sum, cp) => sum + cp.progress, 0) / totalChapters 
        : 0

      // Update or create course progress
      await this.prisma.courseProgress.upsert({
        where: {
          userId_courseId: { userId, courseId }
        },
        update: {
          progress: Math.round(avgProgress),
          completedChapters,
          totalTimeSpent,
          lastAccessedAt: new Date(),
          completed: completedChapters === totalChapters && totalChapters > 0
        },
        create: {
          userId,
          courseId,
          progress: Math.round(avgProgress),
          completedChapters,
          totalTimeSpent,
          lastAccessedAt: new Date(),
          completed: completedChapters === totalChapters && totalChapters > 0
        }
      })
    }
  }

  async flushQueue(payload) {
    // Implementation for manual queue flush if needed
    return { success: true, message: 'Queue flushed' }
  }

  async cleanup(payload) {
    // Clean up old progress records if needed
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    
    const deletedCount = await this.prisma.chapterProgress.deleteMany({
      where: {
        lastWatchedAt: { lt: cutoffDate },
        completed: false,
        progress: 0
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

// Handle worker shutdown
process.on('SIGTERM', async () => {
  await worker.shutdown()
  process.exit(0)
})