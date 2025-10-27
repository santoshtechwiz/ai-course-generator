/**
 * Video Processing Hook Tests
 * Tests the core video processing logic and API response handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useVideoProcessing } from '@/app/dashboard/create/hooks/useVideoProcessing'

// Mock dependencies
vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

vi.mock('@/hooks', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

// Mock video service
vi.mock('@/app/services/video.service', () => ({
  videoService: {
    processVideo: vi.fn(),
    getChapterVideoStatus: vi.fn(),
  },
}))

describe('Video Processing Integration', () => {
  const mockChapter = {
    id: 1,
    title: 'Test Chapter',
    videoId: null,
    youtubeSearchQuery: 'test query',
    createdAt: new Date(),
    updatedAt: new Date(),
    generatedBy: 'ai',
    version: 1,
    parentId: null,
    summary: null,
    order: 1,
    unitId: 1,
    videoStatus: 'pending',
  }

  const mockCourse = {
    id: 1,
    name: 'Test Course',
    slug: 'test-course',
    units: [{
      id: 1,
      name: 'Unit 1',
      chapters: [mockChapter],
    }],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('API Response Handling', () => {
    it('should handle already completed videos correctly', async () => {
      const mockApi = require('@/lib/api').api
      mockApi.post.mockResolvedValue({
        data: {
          success: true,
          message: 'Video already processed.',
          videoId: 'test-video-id',
          queueStatus: 'completed',
          jobId: 'test-job-id',
        },
      })

      const { result } = renderHook(() => useVideoProcessing())

      await act(async () => {
        await result.current.processVideo(1)
      })

      expect(result.current.status).toBe('completed')
      expect(result.current.videoId).toBe('test-video-id')
      expect(result.current.isProcessing).toBe(false)
    })

    it('should handle processing videos with polling', async () => {
      const mockApi = require('@/lib/api').api
      mockApi.post.mockResolvedValue({
        data: {
          success: true,
          queueStatus: 'queued',
          jobId: 'test-job-id',
        },
      })

      mockApi.get.mockResolvedValue({
        videoId: 'test-video-id',
        videoStatus: 'completed',
        isReady: true,
        jobId: 'test-job-id',
      })

      const { result } = renderHook(() => useVideoProcessing())

      await act(async () => {
        await result.current.processVideo(1)
      })

      // Should start polling and eventually complete
      await waitFor(() => {
        expect(result.current.status).toBe('completed')
      }, { timeout: 3000 })
    })

    it('should handle API errors gracefully', async () => {
      const mockApi = require('@/lib/api').api
      mockApi.post.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useVideoProcessing())

      await act(async () => {
        await result.current.processVideo(1)
      })

      expect(result.current.status).toBe('failed')
      expect(result.current.error).toBe('Network error')
      expect(result.current.isProcessing).toBe(false)
    })
  })

  describe('Status Synchronization', () => {
    it('should synchronize status between parent and child components', async () => {
      const mockUpdateStatus = vi.fn()
      const mockUseEnhancedCourseEditor = require('@/app/dashboard/create/hooks/useEnhancedCourseEditor').useEnhancedCourseEditor

      mockUseEnhancedCourseEditor.mockReturnValue({
        course: mockCourse,
        generationStatuses: {},
        updateChapterStatus: mockUpdateStatus,
        // ... other required props
      })

      render(
        <EnhancedChapterCard
          chapter={mockChapter}
          chapterIndex={0}
          onChapterComplete={() => {}}
          isCompleted={false}
          isGenerating={false}
          onStatusUpdate={mockUpdateStatus}
        />
      )

      // Trigger video generation
      const generateButton = screen.getByRole('button', { name: /generate/i })
      fireEvent.click(generateButton)

      // Should call the status update callback
      await waitFor(() => {
        expect(mockUpdateStatus).toHaveBeenCalled()
      })
    })

    it('should update parent error count when child reports error', async () => {
      const mockUseEnhancedCourseEditor = require('@/app/dashboard/create/hooks/useEnhancedCourseEditor').useEnhancedCourseEditor

      const mockUpdateStatus = vi.fn()
      const mockGenerationStatuses = {}

      mockUseEnhancedCourseEditor.mockReturnValue({
        course: mockCourse,
        generationStatuses: mockGenerationStatuses,
        updateChapterStatus: mockUpdateStatus,
        // ... other required props
      })

      render(<EnhancedConfirmChapters course={mockCourse} />)

      // Simulate child component reporting an error
      act(() => {
        mockUpdateStatus(1, { chapterId: 1, status: 'error', message: 'Test error' })
      })

      // Should update the generation statuses
      expect(mockGenerationStatuses[1]).toEqual({
        status: 'error',
        message: 'Test error',
      })
    })
  })

  describe('Error Recovery', () => {
    it('should show retry options for failed videos', async () => {
      const mockApi = require('@/lib/api').api
      mockApi.post.mockResolvedValue({
        data: {
          success: true,
          queueStatus: 'queued',
          jobId: 'test-job-id',
        },
      })

      mockApi.get.mockResolvedValue({
        videoId: null,
        videoStatus: 'error',
        isReady: false,
        jobId: 'test-job-id',
      })

      render(
        <EnhancedChapterCard
          chapter={mockChapter}
          chapterIndex={0}
          onChapterComplete={() => {}}
          isCompleted={false}
          isGenerating={false}
        />
      )

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument()
      })

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry/i })
      fireEvent.click(retryButton)

      // Should attempt to process again
      expect(mockApi.post).toHaveBeenCalledTimes(2)
    })

    it('should handle timeout scenarios', async () => {
      const mockApi = require('@/lib/api').api
      mockApi.post.mockResolvedValue({
        data: {
          success: true,
          queueStatus: 'queued',
          jobId: 'test-job-id',
        },
      })

      // Never resolve the status check
      mockApi.get.mockResolvedValue({
        videoId: null,
        videoStatus: 'processing',
        isReady: false,
        jobId: 'test-job-id',
      })

      const { result } = renderHook(() => useVideoProcessing())

      await act(async () => {
        await result.current.processVideo(1)
      })

      // Should timeout after 5 minutes
      await waitFor(() => {
        expect(result.current.status).toBe('failed')
        expect(result.current.error).toContain('timeout')
      }, { timeout: 310000 }) // 5 minutes + buffer
    })
  })

  describe('Progress Tracking', () => {
    it('should show detailed progress steps', async () => {
      const mockApi = require('@/lib/api').api
      mockApi.post.mockResolvedValue({
        data: {
          success: true,
          queueStatus: 'queued',
          jobId: 'test-job-id',
        },
      })

      render(
        <EnhancedChapterCard
          chapter={mockChapter}
          chapterIndex={0}
          onChapterComplete={() => {}}
          isCompleted={false}
          isGenerating={false}
        />
      )

      // Trigger video generation
      const generateButton = screen.getByRole('button', { name: /generate/i })
      fireEvent.click(generateButton)

      // Should show progress stepper
      await waitFor(() => {
        expect(screen.getByText('Queue Video')).toBeInTheDocument()
        expect(screen.getByText('Generate Script')).toBeInTheDocument()
        expect(screen.getByText('Create Video')).toBeInTheDocument()
        expect(screen.getByText('Upload & Finalize')).toBeInTheDocument()
      })
    })

    it('should update progress steps based on processing status', async () => {
      const mockApi = require('@/lib/api').api
      mockApi.post.mockResolvedValue({
        data: {
          success: true,
          queueStatus: 'queued',
          jobId: 'test-job-id',
        },
      })

      mockApi.get.mockResolvedValue({
        videoId: null,
        videoStatus: 'processing',
        isReady: false,
        jobId: 'test-job-id',
      })

      render(
        <EnhancedChapterCard
          chapter={mockChapter}
          chapterIndex={0}
          onChapterComplete={() => {}}
          isCompleted={false}
          isGenerating={false}
        />
      )

      // Trigger video generation
      const generateButton = screen.getByRole('button', { name: /generate/i })
      fireEvent.click(generateButton)

      // Should update step statuses
      await waitFor(() => {
        // Queue step should be completed, script step processing
        const queueStep = screen.getByText('Queue Video').closest('[data-status]')
        const scriptStep = screen.getByRole('button', { name: /generate script/i }).closest('[data-status]')

        expect(queueStep).toHaveAttribute('data-status', 'completed')
        expect(scriptStep).toHaveAttribute('data-status', 'processing')
      })
    })
  })

  describe('Bulk Operations', () => {
    it('should handle multiple video generation correctly', async () => {
      const mockApi = require('@/lib/api').api
      const mockUseEnhancedCourseEditor = require('@/app/dashboard/create/hooks/useEnhancedCourseEditor').useEnhancedCourseEditor

      const mockUpdateStatus = vi.fn()
      mockUseEnhancedCourseEditor.mockReturnValue({
        course: mockCourse,
        generationStatuses: {},
        updateChapterStatus: mockUpdateStatus,
        handleGenerateAll: vi.fn(),
        // ... other required props
      })

      // Mock successful responses for all videos
      mockApi.post.mockResolvedValue({
        data: {
          success: true,
          message: 'Video already processed.',
          videoId: 'test-video-id',
          queueStatus: 'completed',
        },
      })

      render(<EnhancedConfirmChapters course={mockCourse} />)

      // Click "Regenerate All Videos"
      const regenerateButton = screen.getByRole('button', { name: /regenerate all/i })
      fireEvent.click(regenerateButton)

      // Should process all videos
      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledTimes(1) // One call per chapter
      })
    })

    it('should show correct error count for failed videos', async () => {
      const mockUseEnhancedCourseEditor = require('@/app/dashboard/create/hooks/useEnhancedCourseEditor').useEnhancedCourseEditor

      const mockGenerationStatuses = {
        1: { status: 'error', message: 'Failed to process' },
        2: { status: 'success', message: 'Completed' },
        3: { status: 'error', message: 'Network error' },
      }

      mockUseEnhancedCourseEditor.mockReturnValue({
        course: mockCourse,
        generationStatuses: mockGenerationStatuses,
        updateChapterStatus: vi.fn(),
        // ... other required props
      })

      render(<EnhancedConfirmChapters course={mockCourse} />)

      // Should show 2 chapters with errors
      expect(screen.getByText('2 chapters had errors during video generation.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry failed videos/i })).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle chapters without search queries', async () => {
      const chapterWithoutQuery = { ...mockChapter, youtubeSearchQuery: '' }
      const mockApi = require('@/lib/api').api

      mockApi.post.mockRejectedValue(new Error('Chapter has no search query'))

      render(
        <EnhancedChapterCard
          chapter={chapterWithoutQuery}
          chapterIndex={0}
          onChapterComplete={() => {}}
          isCompleted={false}
          isGenerating={false}
        />
      )

      const generateButton = screen.getByRole('button', { name: /generate/i })
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })

    it('should prevent duplicate processing of same chapter', async () => {
      const mockApi = require('@/lib/api').api
      mockApi.post.mockResolvedValue({
        data: {
          success: true,
          queueStatus: 'queued',
          jobId: 'test-job-id',
        },
      })

      render(
        <EnhancedChapterCard
          chapter={mockChapter}
          chapterIndex={0}
          onChapterComplete={() => {}}
          isCompleted={false}
          isGenerating={false}
        />
      )

      const generateButton = screen.getByRole('button', { name: /generate/i })

      // Click multiple times rapidly
      fireEvent.click(generateButton)
      fireEvent.click(generateButton)
      fireEvent.click(generateButton)

      // Should only process once
      expect(mockApi.post).toHaveBeenCalledTimes(1)
    })

    it('should handle network failures during polling', async () => {
      const mockApi = require('@/lib/api').api
      mockApi.post.mockResolvedValue({
        data: {
          success: true,
          queueStatus: 'queued',
          jobId: 'test-job-id',
        },
      })

      // First call succeeds, subsequent calls fail
      mockApi.get
        .mockResolvedValueOnce({
          videoId: null,
          videoStatus: 'processing',
          isReady: false,
          jobId: 'test-job-id',
        })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          videoId: 'test-video-id',
          videoStatus: 'completed',
          isReady: true,
          jobId: 'test-job-id',
        })

      const { result } = renderHook(() => useVideoProcessing())

      await act(async () => {
        await result.current.processVideo(1)
      })

      // Should eventually complete despite network error
      await waitFor(() => {
        expect(result.current.status).toBe('completed')
        expect(result.current.videoId).toBe('test-video-id')
      }, { timeout: 10000 })
    })
  })
})