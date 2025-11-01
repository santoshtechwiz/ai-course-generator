import { describe, it, expect, vi, beforeEach } from 'vitest'
import { summarizeTranscript, sampleTranscript } from '@/lib/ai/services/video-summary.service'

// Mock the AI services
vi.mock('@/lib/ai/services/video-summary.service', async () => {
  const actual = await vi.importActual('@/lib/ai/services/video-summary.service')
  return {
    ...actual,
    summarizeWithOpenAI: vi.fn(),
    summarizeWithGemini: vi.fn(),
  }
})

describe('Video Summary Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sampleTranscript', () => {
    it('should sample transcript intelligently', () => {
      const transcript = `
        This is an introduction to the course.
        Today we'll learn about important concepts like machine learning.
        Machine learning is a key technology that powers many applications.
        Let's start with the basics and build up to advanced topics.
        Remember that practice is essential for understanding these concepts.
        In conclusion, machine learning is transforming our world.
      `.repeat(10) // Make it long enough to trigger sampling

      const sampled = sampleTranscript(transcript)

      // Should be shorter than original
      expect(sampled.length).toBeLessThan(transcript.length)

      // Should contain important keywords
      expect(sampled.toLowerCase()).toMatch(/important|key|machine learning|practice|conclusion/)

      // Should maintain some structure
      expect(sampled).toContain('.')
    })

    it('should return full text if short', () => {
      const shortTranscript = "This is a short transcript about machine learning basics."
      const sampled = sampleTranscript(shortTranscript)
      expect(sampled).toBe(shortTranscript)
    })
  })

  describe('summarizeTranscript', () => {
    it('should throw error for empty transcript', async () => {
      await expect(summarizeTranscript('')).rejects.toThrow('Transcript is required')
      await expect(summarizeTranscript('   ')).rejects.toThrow('Transcript is required')
    })

    it('should use cache when available', async () => {
      const transcript = "Test transcript"
      const expectedSummary = "# Test Summary\n\nThis is a cached summary."

      // First call should generate and cache
      const { summarizeWithOpenAI } = await import('@/lib/ai/services/video-summary.service')
      vi.mocked(summarizeWithOpenAI).mockResolvedValue(expectedSummary)

      const result1 = await summarizeTranscript(transcript)
      expect(result1).toBe(expectedSummary)

      // Second call should use cache
      vi.mocked(summarizeWithOpenAI).mockClear()
      const result2 = await summarizeTranscript(transcript)
      expect(result2).toBe(expectedSummary)
      expect(summarizeWithOpenAI).not.toHaveBeenCalled()
    })

    it('should fallback to Gemini if OpenAI fails', async () => {
      const transcript = "Test transcript about machine learning"
      const expectedSummary = "# Machine Learning Summary\n\nKey concepts covered."

      const { summarizeWithOpenAI, summarizeWithGemini } = await import('@/lib/ai/services/video-summary.service')
      vi.mocked(summarizeWithOpenAI).mockRejectedValue(new Error('OpenAI failed'))
      vi.mocked(summarizeWithGemini).mockResolvedValue(expectedSummary)

      const result = await summarizeTranscript(transcript, { useCache: false })
      expect(result).toBe(expectedSummary)
      expect(summarizeWithGemini).toHaveBeenCalled()
    })

    it('should throw error if both services fail', async () => {
      const transcript = "Test transcript"

      const { summarizeWithOpenAI, summarizeWithGemini } = await import('@/lib/ai/services/video-summary.service')
      vi.mocked(summarizeWithOpenAI).mockRejectedValue(new Error('OpenAI failed'))
      vi.mocked(summarizeWithGemini).mockRejectedValue(new Error('Gemini failed'))

      await expect(summarizeTranscript(transcript, { useCache: false }))
        .rejects.toThrow('both AI services failed')
    })
  })
})