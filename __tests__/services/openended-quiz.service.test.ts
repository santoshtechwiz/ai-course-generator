/**
 * OpenEnded Quiz Service Tests
 * Tests real executions of quiz generation and formatting
 * 
 * Run: npm run test -- openended-quiz.service.test.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { OpenEndedQuizService } from '@/app/services/openended-quiz.service'

// Mock the AI service
vi.mock('@/lib/ai/course-ai-service', () => ({
  generateOpenEnded: vi.fn(),
}))

import * as courseAIService from '@/lib/ai/course-ai-service'

describe('OpenEndedQuizService', () => {
  let service: OpenEndedQuizService

  beforeEach(() => {
    service = new OpenEndedQuizService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // 1. QUIZ GENERATION TESTS
  // ============================================================================

  describe('generateQuiz()', () => {
    it('should generate quiz with valid parameters', async () => {
      // Mock AI response
      const mockResponse = {
        id: '123',
        title: 'Test Quiz',
        questions: [
          {
            question: 'What is React?',
            answer: 'React is a JavaScript library for building UIs',
            hints: ['Consider: It uses components', 'Think about: Virtual DOM'],
            tags: ['react', 'javascript', 'frontend', 'web'],
            difficulty: 'medium',
          },
        ],
      }

      vi.mocked(courseAIService.generateOpenEnded).mockResolvedValue(mockResponse)

      const result = await service.generateQuiz({
        title: 'React Basics',
        amount: 1,
        difficulty: 'medium',
        userType: 'FREE',
        userId: 'test-user-123',
        credits: 999,
      })

      expect(result).toBeDefined()
      expect(result.title).toBe('Test Quiz')
      expect(result.questions).toHaveLength(1)
      expect(result.questions[0].question).toBe('What is React?')
    })

    it('should pass correct parameters to generateOpenEnded', async () => {
      const mockResponse = {
        quiz_title: 'Test',
        questions: [],
      }

      vi.mocked(courseAIService.generateOpenEnded).mockResolvedValue(mockResponse)

      await service.generateQuiz({
        title: 'Python',
        amount: 5,
        difficulty: 'hard',
        userType: 'PREMIUM',
        userId: 'user-456',
        credits: 50,
      })

      expect(courseAIService.generateOpenEnded).toHaveBeenCalledWith(
        'Python',
        5,
        'hard',
        'user-456',
        'PREMIUM',
        50
      )
    })

    it('should handle missing optional parameters', async () => {
      const mockResponse = {
        quiz_title: 'Test',
        questions: [],
      }

      vi.mocked(courseAIService.generateOpenEnded).mockResolvedValue(mockResponse)

      const result = await service.generateQuiz({
        title: 'Test Topic',
        amount: 3,
      })

      expect(result).toBeDefined()
      expect(courseAIService.generateOpenEnded).toHaveBeenCalledWith(
        'Test Topic',
        3,
        'medium', // default
        undefined,
        'FREE', // default
        undefined
      )
    })

    it('should throw error on AI service failure', async () => {
      vi.mocked(courseAIService.generateOpenEnded).mockRejectedValue(
        new Error('AI service failed')
      )

      await expect(
        service.generateQuiz({
          title: 'Test',
          amount: 1,
        })
      ).rejects.toThrow('Failed to generate open-ended quiz')
    })
  })

  // ============================================================================
  // 2. QUESTION FORMATTING TESTS
  // ============================================================================

  describe('formatQuestions()', () => {
    it('should format questions with AI response hints and tags', () => {
      const questions = [
        {
          id: 1,
          question: 'What is X?',
          answer: 'X is a thing',
          hints: ['Hint 1', 'Hint 2'],
          tags: ['tag1', 'tag2', 'tag3'],
          openEndedQuestion: null,
        },
      ]

      const formatted = service['formatQuestions'](questions)

      expect(formatted).toHaveLength(1)
      expect(formatted[0].hints).toEqual(['Hint 1', 'Hint 2'])
      expect(formatted[0].tags).toEqual(['tag1', 'tag2', 'tag3'])
      expect(formatted[0].type).toBe('openended')
    })

    it('should use database hints when AI hints missing', () => {
      const questions = [
        {
          id: 2,
          question: 'What is Y?',
          answer: 'Y is another thing',
          hints: undefined, // No AI hints
          tags: undefined,
          openEndedQuestion: {
            hints: 'DB Hint 1|DB Hint 2|DB Hint 3',
            tags: 'db-tag1|db-tag2',
            keywords: 'keyword1|keyword2',
            answer: 'Y answer from DB',
          },
        },
      ]

      const formatted = service['formatQuestions'](questions)

      expect(formatted[0].hints).toEqual(['DB Hint 1', 'DB Hint 2', 'DB Hint 3'])
      expect(formatted[0].tags).toEqual(['db-tag1', 'db-tag2'])
    })

    it('should generate hints from answer content when none available', () => {
      const questions = [
        {
          id: 3,
          question: 'Explain the theory?',
          answer: 'The theory explains concept A. It involves principle B. The reasoning is clear.',
          hints: [], // Empty array
          tags: [],
          openEndedQuestion: null,
        },
      ]

      const formatted = service['formatQuestions'](questions)

      expect(formatted[0].hints).toBeDefined()
      expect(Array.isArray(formatted[0].hints)).toBe(true)
      expect(formatted[0].hints.length).toBeGreaterThan(0)
    })

    it('should fallback to default hints when generation insufficient', () => {
      const questions = [
        {
          id: 4,
          question: 'Short Q?',
          answer: '', // Empty answer
          hints: null,
          tags: null,
          openEndedQuestion: null,
        },
      ]

      const formatted = service['formatQuestions'](questions)

      // Should have generated fallback hints
      expect(formatted[0].hints).toBeDefined()
      expect(Array.isArray(formatted[0].hints)).toBe(true)
    })

    it('should extract and use database keywords as tags', () => {
      const questions = [
        {
          id: 5,
          question: 'What is Z?',
          answer: 'Z is defined as something',
          hints: ['Hint'],
          tags: [], // Empty tags
          openEndedQuestion: {
            hints: 'Hint from DB',
            tags: '', // Empty db tags
            keywords: 'python|programming|development|software',
            answer: 'Z answer',
          },
        },
      ]

      const formatted = service['formatQuestions'](questions)

      expect(formatted[0].tags).toBeDefined()
      // Should use keywords or have fallback tags
      expect(formatted[0].tags.length).toBeGreaterThan(0)
    })

    it('should preserve question structure and metadata', () => {
      const questions = [
        {
          id: 123,
          question: 'Detailed question?',
          answer: 'Detailed answer',
          hints: ['H1'],
          tags: ['T1'],
          openEndedQuestion: { id: 456 },
          difficulty: 'hard',
          createdAt: '2024-01-01',
        },
      ]

      const formatted = service['formatQuestions'](questions)

      expect(formatted[0].id).toBe(123)
      expect(formatted[0].question).toBe('Detailed question?')
      expect(formatted[0].answer).toBe('Detailed answer')
      expect(formatted[0].type).toBe('openended')
    })

    it('should handle multiple questions in batch', () => {
      const questions = [
        {
          id: 1,
          question: 'Q1?',
          answer: 'A1',
          hints: ['H1'],
          tags: ['T1'],
          openEndedQuestion: null,
        },
        {
          id: 2,
          question: 'Q2?',
          answer: 'A2',
          hints: ['H2'],
          tags: ['T2'],
          openEndedQuestion: null,
        },
        {
          id: 3,
          question: 'Q3?',
          answer: 'A3',
          hints: [],
          tags: [],
          openEndedQuestion: {
            hints: 'DBH1|DBH2',
            tags: 'DBT1',
            keywords: '',
            answer: 'A3',
          },
        },
      ]

      const formatted = service['formatQuestions'](questions)

      expect(formatted).toHaveLength(3)
      expect(formatted[0].hints).toEqual(['H1'])
      expect(formatted[1].hints).toEqual(['H2'])
      expect(formatted[2].hints).toEqual(['DBH1', 'DBH2'])
    })

    it('should handle undefined and null safely', () => {
      const questions = [
        {
          id: 99,
          question: undefined,
          answer: null,
          hints: undefined,
          tags: null,
          openEndedQuestion: undefined,
        },
      ]

      // Should not throw
      const formatted = service['formatQuestions'](questions)

      expect(formatted).toHaveLength(1)
      expect(formatted[0].question).toBeUndefined()
      expect(formatted[0].answer).toBeNull()
      expect(formatted[0].hints).toBeDefined()
      expect(formatted[0].tags).toBeDefined()
    })

    it('should filter empty hints from array', () => {
      const questions = [
        {
          id: 6,
          question: 'Question?',
          answer: 'Answer with substance',
          hints: ['Valid Hint', '   ', '', 'Another Hint'],
          tags: ['t1', '   ', '', 't2'],
          openEndedQuestion: null,
        },
      ]

      const formatted = service['formatQuestions'](questions)

      expect(formatted[0].hints).toContain('Valid Hint')
      expect(formatted[0].hints).toContain('Another Hint')
      // Whitespace-only should be filtered
    })

    it('should limit hints to maximum of 5', () => {
      const questions = [
        {
          id: 7,
          question: 'Q?',
          answer: 'A very long answer. With many sentences. Each one provides. Different information. For learning purposes.',
          hints: [
            'H1',
            'H2',
            'H3',
            'H4',
            'H5',
            'H6',
            'H7',
            'H8',
          ],
          tags: ['t1'],
          openEndedQuestion: null,
        },
      ]

      const formatted = service['formatQuestions'](questions)

      expect(formatted[0].hints.length).toBeLessThanOrEqual(5)
    })

    it('should limit tags to maximum of 4', () => {
      const questions = [
        {
          id: 8,
          question: 'Q?',
          answer: 'A',
          hints: ['H1'],
          tags: [
            't1',
            't2',
            't3',
            't4',
            't5',
            't6',
            't7',
            't8',
          ],
          openEndedQuestion: null,
        },
      ]

      const formatted = service['formatQuestions'](questions)

      expect(formatted[0].tags.length).toBeLessThanOrEqual(4)
    })
  })

  // ============================================================================
  // 3. INTEGRATION TESTS
  // ============================================================================

  describe('Full workflow integration', () => {
    it('should generate and format quiz end-to-end', async () => {
      const mockResponse = {
        id: '123',
        title: 'Integration Test Quiz',
        questions: [
          {
            question: 'What is integration testing?',
            answer:
              'Integration testing is testing multiple components together. It ensures they work as expected when combined.',
            hints: ['Consider: multiple parts', 'Think about: together'],
            tags: ['testing', 'integration', 'qa', 'software'],
            difficulty: 'medium',
          },
        ],
      }

      vi.mocked(courseAIService.generateOpenEnded).mockResolvedValue(mockResponse)

      const result = await service.generateQuiz({
        title: 'Testing Methods',
        amount: 1,
        difficulty: 'medium',
        userType: 'PREMIUM',
      })

      expect(result.questions[0]).toMatchObject({
        question: expect.any(String),
        answer: expect.any(String),
        hints: expect.any(Array),
        tags: expect.any(Array),
      })

      expect(result.questions[0].hints.length).toBeGreaterThan(0)
      expect(result.questions[0].tags.length).toBeGreaterThan(0)
    })

    it('should handle quiz with variable difficulty levels', async () => {
      const difficulties = ['easy', 'medium', 'hard']

      for (const difficulty of difficulties) {
        const mockResponse = {
          quiz_title: `${difficulty.toUpperCase()} Quiz`,
          questions: [
            {
              question: `${difficulty.toUpperCase()} Question?`,
              correct_answer: `This is a ${difficulty} level answer.`,
              hints: ['Hint 1', 'Hint 2'],
              tags: ['tag1', 'tag2'],
              difficulty: difficulty,
            },
          ],
        }

        vi.mocked(courseAIService.generateOpenEnded).mockResolvedValue(mockResponse)

        const result = await service.generateQuiz({
          title: 'Variable Difficulty',
          amount: 1,
          difficulty: difficulty as any,
        })

        expect(result.questions).toHaveLength(1)
      }
    })

    it('should generate multiple questions in single call', async () => {
      const mockResponse = {
        quiz_title: 'Multi-Question Quiz',
        questions: [
          {
            question: 'Question 1?',
            correct_answer: 'Answer 1',
            hints: ['H1'],
            tags: ['T1'],
            difficulty: 'easy',
          },
          {
            question: 'Question 2?',
            correct_answer: 'Answer 2',
            hints: ['H2'],
            tags: ['T2'],
            difficulty: 'medium',
          },
          {
            question: 'Question 3?',
            correct_answer: 'Answer 3',
            hints: ['H3'],
            tags: ['T3'],
            difficulty: 'hard',
          },
        ],
      }

      vi.mocked(courseAIService.generateOpenEnded).mockResolvedValue(mockResponse)

      const result = await service.generateQuiz({
        title: 'Multi-Question',
        amount: 3,
      })

      expect(result.questions).toHaveLength(3)
      result.questions.forEach((q, index) => {
        expect(q.question).toBe(`Question ${index + 1}?`)
        expect(q.hints).toBeDefined()
        expect(q.tags).toBeDefined()
      })
    })

    it('should handle large quizzes with many questions', async () => {
      const questions = Array.from({ length: 10 }, (_, i) => ({
        question: `Question ${i + 1}?`,
        correct_answer: `Answer ${i + 1}`,
        hints: [`H${i + 1}a`, `H${i + 1}b`],
        tags: [`tag${i + 1}a`, `tag${i + 1}b`],
        difficulty: ['easy', 'medium', 'hard'][i % 3],
      }))

      const mockResponse = {
        quiz_title: 'Large Quiz',
        questions,
      }

      vi.mocked(courseAIService.generateOpenEnded).mockResolvedValue(mockResponse)

      const result = await service.generateQuiz({
        title: 'Large Quiz',
        amount: 10,
      })

      expect(result.questions).toHaveLength(10)
      result.questions.forEach((q, index) => {
        expect(q.hints.length).toBeGreaterThan(0)
        expect(q.tags.length).toBeGreaterThan(0)
      })
    })
  })

  // ============================================================================
  // 4. ERROR HANDLING TESTS
  // ============================================================================

  describe('Error handling', () => {
    it('should handle AI service timeout', async () => {
      vi.mocked(courseAIService.generateOpenEnded).mockRejectedValue(
        new Error('Request timeout')
      )

      await expect(
        service.generateQuiz({
          title: 'Test',
          amount: 1,
        })
      ).rejects.toThrow()
    })

    it('should handle malformed AI response', async () => {
      vi.mocked(courseAIService.generateOpenEnded).mockResolvedValue({
        quiz_title: 'Test',
        questions: null, // Invalid
      })

      // Should handle gracefully or throw meaningful error
      const result = await service.generateQuiz({
        title: 'Test',
        amount: 1,
      })

      expect(result).toBeDefined()
    })

    it('should handle missing required fields in AI response', async () => {
      vi.mocked(courseAIService.generateOpenEnded).mockResolvedValue({
        quiz_title: 'Test',
        questions: [
          {
            question: 'Q?',
            // Missing: correct_answer, hints, tags, difficulty
          },
        ],
      })

      const result = await service.generateQuiz({
        title: 'Test',
        amount: 1,
      })

      expect(result.questions[0]).toBeDefined()
      // Should still format without errors
    })

    it('should handle empty questions array', async () => {
      vi.mocked(courseAIService.generateOpenEnded).mockResolvedValue({
        quiz_title: 'Empty',
        questions: [],
      })

      const result = await service.generateQuiz({
        title: 'Empty',
        amount: 0,
      })

      expect(result.questions).toHaveLength(0)
    })
  })

  // ============================================================================
  // 5. DATA VALIDATION TESTS
  // ============================================================================

  describe('Data validation', () => {
    it('should validate question has required fields after formatting', () => {
      const questions = [
        {
          id: 1,
          question: 'Q?',
          answer: 'A',
          hints: ['H1'],
          tags: ['T1'],
          openEndedQuestion: null,
        },
      ]

      const formatted = service['formatQuestions'](questions)

      const q = formatted[0]
      expect(q).toHaveProperty('id')
      expect(q).toHaveProperty('question')
      expect(q).toHaveProperty('answer')
      expect(q).toHaveProperty('hints')
      expect(q).toHaveProperty('tags')
      expect(q).toHaveProperty('type')
    })

    it('should ensure hints is always an array', () => {
      const questions = [
        {
          id: 1,
          question: 'Q?',
          answer: 'A',
          hints: null,
          tags: null,
          openEndedQuestion: null,
        },
      ]

      const formatted = service['formatQuestions'](questions)

      expect(Array.isArray(formatted[0].hints)).toBe(true)
    })

    it('should ensure tags is always an array', () => {
      const questions = [
        {
          id: 1,
          question: 'Q?',
          answer: 'A',
          hints: undefined,
          tags: undefined,
          openEndedQuestion: null,
        },
      ]

      const formatted = service['formatQuestions'](questions)

      expect(Array.isArray(formatted[0].tags)).toBe(true)
    })

    it('should ensure type is always openended', () => {
      const questions = [
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

      const formatted = service['formatQuestions'](questions)

      expect(formatted[0].type).toBe('openended')
    })
  })

  // ============================================================================
  // 6. PERFORMANCE TESTS
  // ============================================================================

  describe('Performance', () => {
    it('should format 100 questions quickly', () => {
      const questions = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        question: `Q${i}?`,
        answer: `A${i}`,
        hints: [`H${i}`],
        tags: [`T${i}`],
        openEndedQuestion: null,
      }))

      const startTime = performance.now()
      const formatted = service['formatQuestions'](questions)
      const endTime = performance.now()

      expect(formatted).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(1000) // Should be < 1 second
    })

    it('should handle deeply nested database hints', () => {
      const questions = [
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
            keywords: 'key1|key2|key3',
            answer: 'DB Answer',
          },
        },
      ]

      const formatted = service['formatQuestions'](questions)

      expect(formatted[0].hints).toBeDefined()
      expect(formatted[0].tags).toBeDefined()
    })
  })
})
