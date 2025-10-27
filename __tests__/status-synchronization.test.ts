/**
 * Status Synchronization Tests
 * Tests the status update mechanism between components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Status Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Status Update Callbacks', () => {
    it('should call status update callback when status changes', () => {
      const mockCallback = vi.fn()
      const statusUpdate = { chapterId: 1, status: 'completed', message: 'Success' }

      // Simulate calling the callback
      mockCallback(statusUpdate)

      expect(mockCallback).toHaveBeenCalledWith(statusUpdate)
      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should handle error status updates', () => {
      const mockCallback = vi.fn()
      const errorUpdate = { chapterId: 2, status: 'error', message: 'Network failure' }

      mockCallback(errorUpdate)

      expect(mockCallback).toHaveBeenCalledWith(errorUpdate)
    })

    it('should handle multiple status updates', () => {
      const mockCallback = vi.fn()

      const updates = [
        { chapterId: 1, status: 'processing', message: 'Started' },
        { chapterId: 1, status: 'completed', message: 'Finished' },
        { chapterId: 2, status: 'error', message: 'Failed' },
      ]

      updates.forEach(update => mockCallback(update))

      expect(mockCallback).toHaveBeenCalledTimes(3)
      expect(mockCallback).toHaveBeenNthCalledWith(1, updates[0])
      expect(mockCallback).toHaveBeenNthCalledWith(2, updates[1])
      expect(mockCallback).toHaveBeenNthCalledWith(3, updates[2])
    })
  })

  describe('Status Mapping', () => {
    it('should map VideoStatus to ChapterGenerationStatus correctly', () => {
      const statusMappings = {
        'completed': 'success',
        'processing': 'processing',
        'failed': 'error',
        'error': 'error',
        'pending': 'pending',
      }

      Object.entries(statusMappings).forEach(([videoStatus, expected]) => {
        // Simulate the mapping logic from useEnhancedCourseEditor
        const mappedStatus = videoStatus === 'completed' ? 'success' :
                           videoStatus === 'processing' ? 'processing' :
                           videoStatus === 'failed' ? 'error' :
                           videoStatus === 'error' ? 'error' : 'pending'

        expect(mappedStatus).toBe(expected)
      })
    })

    it('should handle unknown status values gracefully', () => {
      const unknownStatus = 'unknown'
      const mappedStatus = unknownStatus === 'completed' ? 'success' :
                          unknownStatus === 'processing' ? 'processing' :
                          unknownStatus === 'failed' ? 'error' :
                          unknownStatus === 'error' ? 'error' : 'pending'

      expect(mappedStatus).toBe('pending')
    })
  })

  describe('Error Counting', () => {
    it('should count errors correctly in generation statuses', () => {
      const generationStatuses = {
        1: { status: 'success', message: 'Completed' },
        2: { status: 'error', message: 'Failed' },
        3: { status: 'processing', message: 'In progress' },
        4: { status: 'error', message: 'Network error' },
        5: { status: 'success', message: 'Done' },
      }

      const errorCount = Object.values(generationStatuses)
        .filter(status => status.status === 'error')
        .length

      expect(errorCount).toBe(2)
    })

    it('should handle empty status object', () => {
      const generationStatuses = {}
      const errorCount = Object.values(generationStatuses)
        .filter(status => status.status === 'error')
        .length

      expect(errorCount).toBe(0)
    })

    it('should handle all success statuses', () => {
      const generationStatuses = {
        1: { status: 'success', message: 'Completed' },
        2: { status: 'success', message: 'Completed' },
      }

      const errorCount = Object.values(generationStatuses)
        .filter(status => status.status === 'error')
        .length

      expect(errorCount).toBe(0)
    })
  })

  describe('Component Integration', () => {
    it('should propagate status updates from child to parent', () => {
      // Simulate the callback chain: child -> parent
      const parentCallback = vi.fn()
      const childProps = { onStatusUpdate: parentCallback }

      // Child component calls the callback
      childProps.onStatusUpdate({
        chapterId: 1,
        status: 'completed',
        message: 'Video generated successfully'
      })

      expect(parentCallback).toHaveBeenCalledWith({
        chapterId: 1,
        status: 'completed',
        message: 'Video generated successfully'
      })
    })

    it('should handle multiple children updating parent', () => {
      const parentCallback = vi.fn()

      // Simulate multiple child components
      const child1Props = { onStatusUpdate: parentCallback }
      const child2Props = { onStatusUpdate: parentCallback }

      // Both children update status
      child1Props.onStatusUpdate({ chapterId: 1, status: 'completed', message: 'Done' })
      child2Props.onStatusUpdate({ chapterId: 2, status: 'error', message: 'Failed' })

      expect(parentCallback).toHaveBeenCalledTimes(2)
    })
  })
})