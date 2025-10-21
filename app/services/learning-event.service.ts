import prisma from '@/lib/db'

interface LearningEventData {
  userId: string
  courseId: number
  chapterId?: number
  type: 'VIDEO_PLAY' | 'VIDEO_PAUSE' | 'VIDEO_COMPLETE' | 'QUIZ_START' | 'QUIZ_SUBMIT' | 'CHAPTER_COMPLETE'
  entityId?: string
  progress?: number
  timeSpent?: number
  metadata?: any
}

export class LearningEventService {
  static async trackEvent(eventData: LearningEventData) {
    try {
      await prisma.learningEvent.create({
        data: {
          userId: eventData.userId,
          courseId: eventData.courseId,
          chapterId: eventData.chapterId,
          type: eventData.type,
          entityId: eventData.entityId,
          progress: eventData.progress,
          timeSpent: eventData.timeSpent,
          metadata: eventData.metadata
        }
      })
    } catch (error) {
      console.error('Failed to track learning event:', error)
      // Don't throw error to avoid breaking user flow
    }
  }
}

const trackLearningEvent = LearningEventService.trackEvent
