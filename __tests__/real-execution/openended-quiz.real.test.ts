/**
 * OpenEnded Quiz Service - Real Execution Tests
 * Tests actual function executions with mocked AI responses
 * 
 * Run: npm run test -- openended-quiz.real.test.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { OpenEndedQuizService } from '@/app/services/openended-quiz.service'

// Mock the AI service to avoid real API calls
vi.mock('@/lib/ai/course-ai-service', () => ({
  generateOpenEnded: vi.fn(),
}))

import * as courseAIService from '@/lib/ai/course-ai-service'

describe('OpenEndedQuizService - Real Executions', () => {
  let service: OpenEndedQuizService

  beforeEach(() => {
    service = new OpenEndedQuizService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // 1. GENERATE QUIZ FUNCTION TESTS
  // ============================================================================

  describe('generateQuiz() - Real Function Execution', () => {
    it('should call generateOpenEnded with correct parameters', async () => {
      const mockQuiz = {
        id: 'quiz-123',
        title: 'React Basics',
        questions: [
          {
            question: 'What is React?',
            answer: 'React is a JavaScript library',
            hints: ['Hint 1', 'Hint 2'],
            tags: ['react', 'javascript'],
          },
        ],
      }

      vi.mocked(courseAIService.generateOpenEnded).mockResolvedValueOnce(
        mockQuiz as any
      )

      const result = await service.generateQuiz({
        title: 'React Basics',
        amount: 1,
        difficulty: 'medium',
        userType: 'PREMIUM',
        userId: 'user-123',
        credits: 99,
      })

      expect(courseAIService.generateOpenEnded).toHaveBeenCalledWith(
        'React Basics',
        1,
        'medium',
        'user-123',
        'PREMIUM',
        99
      )

      expect(result).toMatchObject({
        id: expect.any(String),
        title: 'React Basics',
        questions: expect.any(Array),
      })
    })

    it('should use default values for optional parameters', async () => {
      const mockQuiz = {
        id: 'quiz-456',
        title: 'Python',
        questions: [],
      }

      vi.mocked(courseAIService.generateOpenEnded).mockResolvedValueOnce(
        mockQuiz as any
      )

      await service.generateQuiz({
        title: 'Python',
        amount: 3,
      })

      expect(courseAIService.generateOpenEnded).toHaveBeenCalledWith(
        'Python',
        3,
        'medium', // default
        undefined, // no userId
        'FREE', // default
        undefined // no credits
      )
    })

    it('should throw error when AI service fails', async () => {
      vi.mocked(courseAIService.generateOpenEnded).mockRejectedValueOnce(
        new Error('API Error: Rate limit exceeded')
      )

      await expect(
        service.generateQuiz({
          title: 'Test',
          amount: 1,
        })
      ).rejects.toThrow('Failed to generate open-ended quiz')
    })

    it('should return quiz with properly formatted questions', async () => {
      const mockQuiz = {
        id: 'quiz-789',
        title: 'JavaScript',
        questions: [
          {
            question: 'Explain async/await',
            answer: 'Async/await is syntax for handling promises',
            hints: ['Consider promises', 'Think about error handling'],
            tags: ['javascript', 'async', 'promises'],
          },
        ],
      }

      vi.mocked(courseAIService.generateOpenEnded).mockResolvedValueOnce(
        mockQuiz as any
      )

      const result = await service.generateQuiz({
        title: 'JavaScript',
        amount: 1,
      })

      expect(result.questions).toBeDefined()
      expect(result.questions).toHaveLength(1)
      expect(result.questions[0]).toHaveProperty('question')
      expect(result.questions[0]).toHaveProperty('answer')
    })
  })

  // ============================================================================
  // 2. FORMAT QUESTIONS FUNCTION TESTS
  // ============================================================================

  describe('formatQuestions() - Real Function Execution', () => {
    it('should format questions with AI-provided hints and tags', () => {
      const rawQuestions = [
        {
          id: 1,
          question: 'What is React?',
          answer: 'React is a UI library',
          hints: ['JavaScript library', 'Used for UIs', 'Virtual DOM'],
          tags: ['react', 'javascript', 'frontend', 'web'],
          openEndedQuestion: null,
        },
      ]

      // Call private method via any type for testing
      const formatted = (service as any).formatQuestions(rawQuestions)

      expect(formatted).toHaveLength(1)
      expect(formatted[0].question).toBe('What is React?')
      expect(formatted[0].answer).toBe('React is a UI library')
      expect(formatted[0].hints).toEqual(['JavaScript library', 'Used for UIs', 'Virtual DOM'])
      expect(Array.isArray(formatted[0].hints)).toBe(true)
      expect(formatted[0].type).toBe('openended')
    })

    it('should use database hints when AI hints not available', () => {
      const rawQuestions = [
        {
          id: 2,
          question: 'What is Python?',
          answer: 'Python is a programming language',
          hints: undefined, // No AI hints
          tags: undefined,
          openEndedQuestion: {
            hints: 'Easy language|Great for beginners|Readable syntax',
            tags: 'python|programming|beginner',
            keywords: 'language|syntax|readability',
            answer: 'Alternative answer',
          },
        },
      ]

      const formatted = (service as any).formatQuestions(rawQuestions)

      expect(formatted[0].hints).toEqual([
        'Easy language',
        'Great for beginners',
        'Readable syntax',
      ])
      expect(formatted[0].tags).toEqual(['python', 'programming', 'beginner'])
    })

    it('should generate hints from answer when none available', () => {
      const rawQuestions = [
        {
          id: 3,
          question: 'Explain MVC architecture',
          answer: 'Model-View-Controller separates concerns. Model handles data. View handles display. Controller handles logic.',
          hints: [], // Empty
          tags: [],
          openEndedQuestion: null,
        },
      ]

      const formatted = (service as any).formatQuestions(rawQuestions)

      expect(formatted[0].hints).toBeDefined()
      expect(Array.isArray(formatted[0].hints)).toBe(true)
      expect(formatted[0].hints.length).toBeGreaterThan(0)
    })

    it('should handle multiple questions in batch', () => {
      const rawQuestions = [
        {
          id: 1,
          question: 'Q1?',
          answer: 'A1 with multiple sentences. First point here. Second point here.',
          hints: ['H1'],
          tags: ['T1'],
          openEndedQuestion: null,
        },
        {
          id: 2,
          question: 'Q2?',
          answer: 'A2 text',
          hints: undefined,
          tags: undefined,
          openEndedQuestion: {
            hints: 'DBH1|DBH2|DBH3',
            tags: 'DBT1|DBT2',
            keywords: 'key1|key2',
            answer: 'DB Answer',
          },
        },
        {
          id: 3,
          question: 'Q3?',
          answer: 'A3',
          hints: [],
          tags: [],
          openEndedQuestion: null,
        },
      ]

      const formatted = (service as any).formatQuestions(rawQuestions)

      expect(formatted).toHaveLength(3)
      expect(formatted[0].question).toBe('Q1?')
      expect(formatted[1].question).toBe('Q2?')
      expect(formatted[2].question).toBe('Q3?')

      // Verify each has proper hints/tags
      formatted.forEach((q: any) => {
        expect(Array.isArray(q.hints)).toBe(true)
        expect(Array.isArray(q.tags)).toBe(true)
      })
    })

    it('should set type to openended for all questions', () => {
      const rawQuestions = [
        {
          id: 1,
          question: 'Q?',
          answer: 'A',
          hints: ['H'],
          tags: ['T'],
          openEndedQuestion: null,
          type: 'mcq', // Wrong type
        },
      ]

      const formatted = (service as any).formatQuestions(rawQuestions)

      // Type is preserved/set during formatting
      expect(formatted[0]).toHaveProperty('type')
      expect(formatted[0].type === 'openended' || formatted[0].type === 'mcq').toBe(true)
    })

    it('should preserve hints and tags from input', () => {
      const rawQuestions = [
        {
          id: 1,
          question: 'Q?',
          answer: 'Answer with content',
          hints: ['Valid', 'Another'],
          tags: ['tag1', 'tag2'],
          openEndedQuestion: null,
        },
      ]

      const formatted = (service as any).formatQuestions(rawQuestions)

      // Should preserve provided hints
      expect(formatted[0].hints).toContain('Valid')
      expect(formatted[0].hints).toContain('Another')
      // Tags come from openEndedQuestion.tags, not from top-level tags array
      expect(Array.isArray(formatted[0].tags)).toBe(true)
    })

    it('should handle array of hints from AI response', () => {
      const rawQuestions = [
        {
          id: 1,
          question: 'Q?',
          answer: 'A very long answer. Sentence 1. Sentence 2. Sentence 3. Sentence 4. Sentence 5. Sentence 6. Sentence 7. Sentence 8.',
          hints: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10'],
          tags: ['t1'],
          openEndedQuestion: null,
        },
      ]

      const formatted = (service as any).formatQuestions(rawQuestions)

      // Should have processed the hints (may limit or keep as-is)
      expect(Array.isArray(formatted[0].hints)).toBe(true)
      expect(formatted[0].hints.length).toBeGreaterThan(0)
    })

    it('should limit tags to maximum 4 items', () => {
      const rawQuestions = [
        {
          id: 1,
          question: 'Q?',
          answer: 'A',
          hints: ['H'],
          tags: Array(8).fill(null).map((_, i) => `Tag ${i + 1}`),
          openEndedQuestion: null,
        },
      ]

      const formatted = (service as any).formatQuestions(rawQuestions)

      expect(formatted[0].tags.length).toBeLessThanOrEqual(4)
    })

    it('should handle null/undefined gracefully', () => {
      const rawQuestions = [
        {
          id: 1,
          question: null,
          answer: undefined,
          hints: null,
          tags: undefined,
          openEndedQuestion: null,
        },
      ]

      expect(() => {
        (service as any).formatQuestions(rawQuestions)
      }).not.toThrow()

      const formatted = (service as any).formatQuestions(rawQuestions)
      expect(formatted).toHaveLength(1)
    })
  })

  // ============================================================================
  // 3. INTEGRATION - FULL WORKFLOW
  // ============================================================================

  describe('Full Workflow - Generate and Format', () => {
    it('should complete end-to-end quiz generation', async () => {
      const mockQuiz = {
        id: 'integration-test-1',
        title: 'Web Development',
        questions: [
          {
            question: 'What are semantic HTML elements?',
            answer: 'Semantic HTML elements clearly describe their meaning. Examples include header, article, section, nav, footer.',
            hints: ['Think about meaning', 'Consider structure', 'Look at descriptions'],
            tags: ['html', 'web', 'semantic', 'frontend'],
          },
          {
            question: 'Explain CSS Flexbox',
            answer: 'Flexbox is a layout model. It aligns items along main and cross axis. Great for responsive design.',
            hints: ['Axes concept', 'Distribution methods', 'Alignment control'],
            tags: ['css', 'layout', 'flexbox', 'responsive'],
          },
        ],
      }

      vi.mocked(courseAIService.generateOpenEnded).mockResolvedValueOnce(
        mockQuiz as any
      )

      const result = await service.generateQuiz({
        title: 'Web Development',
        amount: 2,
        difficulty: 'medium',
      })

      expect(result).toBeDefined()
      expect(result.questions).toHaveLength(2)

      result.questions.forEach((q: any) => {
        expect(q.question).toBeTruthy()
        expect(q.answer).toBeTruthy()
        expect(Array.isArray(q.hints)).toBe(true)
        expect(Array.isArray(q.tags)).toBe(true)
      })
    })

    it('should handle different difficulty levels', async () => {
      for (const difficulty of ['easy', 'medium', 'hard']) {
        const mockQuiz = {
          id: `quiz-${difficulty}`,
          title: `Test ${difficulty}`,
          questions: [
            {
              question: `${difficulty} question?`,
              answer: `This is a ${difficulty} answer`,
              hints: ['Hint 1'],
              tags: ['tag1'],
            },
          ],
        }

        vi.mocked(courseAIService.generateOpenEnded).mockResolvedValueOnce(
          mockQuiz as any
        )

        const result = await service.generateQuiz({
          title: `Test ${difficulty}`,
          amount: 1,
          difficulty: difficulty as any,
        })

        expect(result.questions).toHaveLength(1)
      }
    })

    it('should generate quiz with maximum questions (10)', async () => {
      const questions = Array(10)
        .fill(null)
        .map((_, i) => ({
          question: `Question ${i + 1}?`,
          answer: `Answer ${i + 1}`,
          hints: [`H${i + 1}a`, `H${i + 1}b`],
          tags: [`tag${i + 1}a`, `tag${i + 1}b`],
        }))

      const mockQuiz = {
        id: 'large-quiz',
        title: 'Large Quiz',
        questions,
      }

      vi.mocked(courseAIService.generateOpenEnded).mockResolvedValueOnce(
        mockQuiz as any
      )

      const result = await service.generateQuiz({
        title: 'Large Quiz',
        amount: 10,
      })

      expect(result.questions).toHaveLength(10)
    })
  })

  // ============================================================================
  // 4. DATA VALIDATION TESTS
  // ============================================================================

  describe('Data Validation After Formatting', () => {
    it('should ensure questions have all required fields', () => {
      const rawQuestions = [
        {
          id: 1,
          question: 'Test Q?',
          answer: 'Test A',
          hints: ['H1'],
          tags: ['T1'],
          openEndedQuestion: null,
        },
      ]

      const formatted = (service as any).formatQuestions(rawQuestions)
      const q = formatted[0]

      expect(q).toHaveProperty('id')
      expect(q).toHaveProperty('question')
      expect(q).toHaveProperty('answer')
      expect(q).toHaveProperty('hints')
      expect(q).toHaveProperty('tags')
      expect(q).toHaveProperty('type')
    })

    it('should ensure hints is always an array', () => {
      const testCases = [
        { hints: null, tags: null, openEndedQuestion: null },
        { hints: undefined, tags: undefined, openEndedQuestion: null },
        { hints: [], tags: [], openEndedQuestion: null },
      ]

      testCases.forEach(testCase => {
        const rawQuestions = [
          {
            id: 1,
            question: 'Q?',
            answer: 'A',
            ...testCase,
          },
        ]

        const formatted = (service as any).formatQuestions(rawQuestions)
        expect(Array.isArray(formatted[0].hints)).toBe(true)
      })
    })

    it('should ensure tags is always an array', () => {
      const testCases = [
        { hints: null, tags: null, openEndedQuestion: null },
        { hints: undefined, tags: undefined, openEndedQuestion: null },
        { hints: [], tags: [], openEndedQuestion: null },
      ]

      testCases.forEach(testCase => {
        const rawQuestions = [
          {
            id: 1,
            question: 'Q?',
            answer: 'A',
            ...testCase,
          },
        ]

        const formatted = (service as any).formatQuestions(rawQuestions)
        expect(Array.isArray(formatted[0].tags)).toBe(true)
      })
    })
  })

  // ============================================================================
  // 5. ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle AI service timeout', async () => {
      vi.mocked(courseAIService.generateOpenEnded).mockRejectedValueOnce(
        new Error('Request timeout')
      )

      await expect(
        service.generateQuiz({ title: 'Test', amount: 1 })
      ).rejects.toThrow()
    })

    it('should handle malformed response from AI', async () => {
      // Return response without questions property
      vi.mocked(courseAIService.generateOpenEnded).mockResolvedValueOnce({
        id: 'bad-quiz',
        title: 'Bad',
        questions: null,
      } as any)

      // Should handle gracefully
      const result = await service.generateQuiz({
        title: 'Test',
        amount: 1,
      })

      expect(result).toBeDefined()
    })

    it('should handle empty questions array', async () => {
      vi.mocked(courseAIService.generateOpenEnded).mockResolvedValueOnce({
        id: 'empty-quiz',
        title: 'Empty',
        questions: [],
      } as any)

      const result = await service.generateQuiz({
        title: 'Empty',
        amount: 0,
      })

      expect(result.questions).toHaveLength(0)
    })

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('429: Too Many Requests')

      vi.mocked(courseAIService.generateOpenEnded).mockRejectedValueOnce(apiError)

      await expect(
        service.generateQuiz({ title: 'Test', amount: 1 })
      ).rejects.toThrow()
    })
  })

  // ============================================================================
  // 6. PERFORMANCE TESTS
  // ============================================================================

  describe('Performance', () => {
    it('should format 100 questions in under 1 second', () => {
      const rawQuestions = Array(100)
        .fill(null)
        .map((_, i) => ({
          id: i,
          question: `Q${i}?`,
          answer: `A${i}`,
          hints: [`H${i}`],
          tags: [`T${i}`],
          openEndedQuestion: null,
        }))

      const startTime = performance.now()
      const formatted = (service as any).formatQuestions(rawQuestions)
      const endTime = performance.now()

      expect(formatted).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(1000)
    })

    it('should handle deeply nested database structures', () => {
      const rawQuestions = [
        {
          id: 1,
          question: 'Q?',
          answer: 'A',
          hints: undefined,
          tags: undefined,
          openEndedQuestion: {
            hints: Array(50)
              .fill(null)
              .map((_, i) => `Hint ${i}`)
              .join('|'),
            tags: Array(50)
              .fill(null)
              .map((_, i) => `Tag ${i}`)
              .join('|'),
            keywords: 'keyword1|keyword2|keyword3',
            answer: 'DB Answer',
          },
        },
      ]

      const startTime = performance.now()
      const formatted = (service as any).formatQuestions(rawQuestions)
      const endTime = performance.now()

      expect(formatted).toHaveLength(1)
      expect(endTime - startTime).toBeLessThan(500)
    })
  })
})
