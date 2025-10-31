/**
 * CourseQuiz Service Unit Tests
 * Tests the optimized transcript → summary → quiz generation flow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock all dependencies before imports
vi.mock('@/app/repositories/course-quiz.repository', () => ({
  courseQuizRepository: {
    getChapterSummary: vi.fn(),
    getChapterTranscript: vi.fn(),
    getQuestionsByChapterId: vi.fn(),
    hasQuestionsForChapter: vi.fn(),
    saveQuestionsForChapter: vi.fn()
  }
}))

vi.mock('@/services/youtubeService', () => ({
  default: {
    getTranscript: vi.fn()
  }
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    chapter: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}))

vi.mock('@/services/videoProcessor', () => ({
  getQuestionsFromTranscript: vi.fn()
}))

vi.mock('node-cache')

// Import after mocks
import { CourseQuizServiceClass as CourseQuizService } from '@/app/services/course-quiz.service'
import { courseQuizRepository } from '@/app/repositories/course-quiz.repository'
import YoutubeService from '@/services/youtubeService'
import { prisma } from '@/lib/db'
import { getQuestionsFromTranscript } from '@/services/videoProcessor'

describe('CourseQuiz Service - Optimized Flow', () => {
  let service: CourseQuizService
  const mockChapterId = 123
  const mockVideoId = 'test-video-id'
  const mockChapterName = 'Test Chapter'

  const mockTranscript = 'This is a long transcript text...'
  const mockSummary = 'This is a shorter summary.'
  const mockQuestions = [
    { id: 1, question: 'Test question?', answer: 'Test answer', options: 'A,B,C,D' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    service = new CourseQuizService()

    // Default mocks
    vi.mocked(courseQuizRepository.getChapterSummary).mockResolvedValue(null)
    vi.mocked(courseQuizRepository.getChapterTranscript).mockResolvedValue(null)
    vi.mocked(courseQuizRepository.getQuestionsByChapterId).mockResolvedValue([])
    vi.mocked(courseQuizRepository.hasQuestionsForChapter).mockResolvedValue(false)
    vi.mocked(YoutubeService.getTranscript).mockResolvedValue({
      transcript: mockTranscript,
      success: true
    })
    vi.mocked(prisma.chapter.findUnique).mockResolvedValue({
      id: mockChapterId,
      videoStatus: 'PENDING'
    })
    vi.mocked(prisma.chapter.update).mockResolvedValue({} as any)
    vi.mocked(getQuestionsFromTranscript).mockResolvedValue(mockQuestions)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Lazy Summary Generation', () => {
    it('should generate summary when quiz is requested and no summary exists', async () => {
      // Mock no existing summary
      vi.mocked(courseQuizRepository.getChapterSummary).mockResolvedValue(null)
      vi.mocked(courseQuizRepository.getChapterTranscript).mockResolvedValue(mockTranscript)
      vi.mocked(courseQuizRepository.getQuestionsByChapterId).mockResolvedValue([])

      // Mock prisma calls
      vi.mocked(prisma.chapter.findUnique).mockResolvedValue({
        id: mockChapterId,
        summaryStatus: 'PENDING'
      })

      const result = await service.getOrGenerateQuizQuestions({
        videoId: mockVideoId,
        chapterId: mockChapterId,
        chapterName: mockChapterName
      })

      expect(result).toEqual(mockQuestions)
      expect(prisma.chapter.update).toHaveBeenCalledWith({
        where: { id: mockChapterId },
        data: { summary: expect.any(String), summaryStatus: 'COMPLETED' }
      })
    })
  })

  describe('Content Preference for Quiz Generation', () => {
    it('should use summary over transcript for quiz generation', async () => {
      vi.mocked(courseQuizRepository.getChapterSummary).mockResolvedValue(mockSummary)
      vi.mocked(courseQuizRepository.getQuestionsByChapterId).mockResolvedValue([])

      await service.getOrGenerateQuizQuestions({
        videoId: mockVideoId,
        chapterId: mockChapterId,
        chapterName: mockChapterName
      })

      // Verify summary was used (would be passed to AI service)
      expect(courseQuizRepository.getChapterSummary).toHaveBeenCalledWith(mockChapterId)
    })
  })

  describe('Status Checks and Concurrency Prevention', () => {
    it('should prevent concurrent quiz generation', async () => {
      vi.mocked(prisma.chapter.findUnique).mockResolvedValue({
        id: mockChapterId,
        videoStatus: 'PROCESSING'
      })

      await expect(service.getOrGenerateQuizQuestions({
        videoId: mockVideoId,
        chapterId: mockChapterId,
        chapterName: mockChapterName
      })).rejects.toThrow('Quiz generation already in progress for this chapter')
    })

    it('should return existing questions if already completed', async () => {
      vi.mocked(prisma.chapter.findUnique).mockResolvedValue({
        id: mockChapterId,
        videoStatus: 'COMPLETED'
      })
      vi.mocked(courseQuizRepository.getQuestionsByChapterId).mockResolvedValue(mockQuestions)

      const result = await service.getOrGenerateQuizQuestions({
        videoId: mockVideoId,
        chapterId: mockChapterId,
        chapterName: mockChapterName
      })

      expect(result).toEqual(mockQuestions)
    })
  })
})