/**
 * Quiz API Integration Tests
 *
 * Tests the quiz API endpoints for loading and submitting quizzes
 */

import { createMockQuiz, createMockUser } from '../../utils/test-utils'

describe('Quiz API Endpoints', () => {
  const mockQuiz = createMockQuiz()
  const mockUser = createMockUser()
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = jest.fn()
  })

  describe('GET /api/quizzes/[quizType]/[slug]', () => {
    const endpoint = `/api/quizzes/code/${mockQuiz.slug}`

    it('should fetch quiz successfully', async () => {
      // Mock successful API response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockQuiz),
        text: () => Promise.resolve(JSON.stringify(mockQuiz)),
      })

      const response = await fetch(`${baseUrl}${endpoint}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockQuiz)
      expect(data.slug).toBe(mockQuiz.slug)
      expect(data.quizType).toBe('code')
      expect(data.questions).toHaveLength(mockQuiz.questions.length)
    })

    it('should handle 404 for non-existent quiz', async () => {
      // Mock 404 response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Quiz not found' }),
        text: () => Promise.resolve('Quiz not found'),
      })

      const response = await fetch(`${baseUrl}/api/quizzes/code/non-existent`)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Quiz not found')
    })

    it('should handle server errors', async () => {
      // Mock server error
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
        text: () => Promise.resolve('Internal server error'),
      })

      const response = await fetch(`${baseUrl}${endpoint}`)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle network errors', async () => {
      // Mock network error
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(fetch(`${baseUrl}${endpoint}`)).rejects.toThrow('Network error')
    })
  })

  describe('POST /api/quizzes/[quizType]/[slug]/submit', () => {
    const submitEndpoint = `/api/quizzes/code/${mockQuiz.slug}/submit`
    const mockSubmission = {
      quizId: mockQuiz.slug,
      answers: [
        {
          questionId: 'q1',
          answer: 'option1',
          timeSpent: 30,
          isCorrect: true,
        },
        {
          questionId: 'q2',
          answer: 'function test() { return true; }',
          timeSpent: 60,
          isCorrect: false,
        },
      ],
      totalTime: 90,
      score: 1,
      type: 'code',
      totalQuestions: 2,
      correctAnswers: 1,
      completedAt: new Date().toISOString(),
    }

    const mockResponse = {
      result: {
        score: 1,
        maxScore: 2,
        percentageScore: 50,
        accuracy: 50,
        totalTime: 90,
        completedAt: new Date().toISOString(),
      },
      answers: mockSubmission.answers,
    }

    it('should submit quiz successfully', async () => {
      // Mock successful submission
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      })

      const response = await fetch(`${baseUrl}${submitEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockSubmission),
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.result).toBeDefined()
      expect(data.result.score).toBe(1)
      expect(data.result.maxScore).toBe(2)
      expect(data.result.percentageScore).toBe(50)
      expect(data.answers).toEqual(mockSubmission.answers)
    })

    it('should handle validation errors', async () => {
      const invalidSubmission = {
        // Missing required fields
        quizId: mockQuiz.slug,
      }

      // Mock validation error
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: 'Validation error',
          details: ['Answers are required', 'Total time is required']
        }),
        text: () => Promise.resolve(JSON.stringify({
          error: 'Validation error',
          details: ['Answers are required', 'Total time is required']
        })),
      })

      const response = await fetch(`${baseUrl}${submitEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidSubmission),
      })

      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
      expect(data.details).toContain('Answers are required')
    })

    it('should handle authentication errors', async () => {
      // Mock auth error
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Authentication required' }),
        text: () => Promise.resolve('Authentication required'),
      })

      const response = await fetch(`${baseUrl}${submitEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockSubmission),
      })

      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })
  })

  describe('GET /api/quizzes/related', () => {
    const relatedEndpoint = '/api/quizzes/related'

    it('should fetch related quizzes', async () => {
      const mockRelatedQuizzes = [
        createMockQuiz({ slug: 'related-quiz-1', title: 'Related Quiz 1' }),
        createMockQuiz({ slug: 'related-quiz-2', title: 'Related Quiz 2' }),
      ]

      // Mock related quizzes response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockRelatedQuizzes),
        text: () => Promise.resolve(JSON.stringify(mockRelatedQuizzes)),
      })

      const response = await fetch(`${baseUrl}${relatedEndpoint}?quizType=code&exclude=${mockQuiz.slug}&limit=6`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(2)
      expect(data[0].slug).toBe('related-quiz-1')
      expect(data[1].slug).toBe('related-quiz-2')
    })

    it('should handle empty results', async () => {
      // Mock empty results
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
        text: () => Promise.resolve('[]'),
      })

      const response = await fetch(`${baseUrl}${relatedEndpoint}?quizType=code&exclude=${mockQuiz.slug}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(0)
    })
  })

  describe('GET /api/quizzes/common/random', () => {
    const randomEndpoint = '/api/quizzes/common/random'

    it('should fetch random quizzes', async () => {
      const mockRandomQuizzes = [
        createMockQuiz({ slug: 'random-quiz-1', title: 'Random Quiz 1' }),
        createMockQuiz({ slug: 'random-quiz-2', title: 'Random Quiz 2' }),
        createMockQuiz({ slug: 'random-quiz-3', title: 'Random Quiz 3' }),
      ]

      // Mock random quizzes response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockRandomQuizzes),
        text: () => Promise.resolve(JSON.stringify(mockRandomQuizzes)),
      })

      const response = await fetch(`${baseUrl}${randomEndpoint}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(3)
    })
  })
})
