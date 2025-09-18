/**
 * Quiz Flow Integration Tests
 *
 * Tests the complete quiz user journey including:
 * - Quiz loading and initialization
 * - Question navigation and answering
 * - Quiz submission and results
 * - Authentication flows
 * - Error handling
 */

import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, createMockQuiz, createMockUser, createMockSession, mockFetch, mockFetchError, waitForState, cleanup } from '../utils/test-utils'
import { CodeQuizWrapper } from '@/app/dashboard/(quiz)/code/components/CodeQuizWrapper'
import { store } from '@/store'
import { fetchQuiz, submitQuiz, resetQuiz } from '@/store/slices/quiz/quiz-slice'

describe('Quiz Flow Integration', () => {
  const mockQuiz = createMockQuiz()
  const mockUser = createMockUser()

  beforeEach(() => {
    cleanup()
  })

  describe('Quiz Loading Flow', () => {
    it('should load quiz successfully', async () => {
      // Mock successful API response
      mockFetch(mockQuiz)

      const { store } = renderWithProviders(
        <CodeQuizWrapper slug={mockQuiz.slug} title={mockQuiz.title} />
      )

      // Should show loading state initially
      expect(screen.getByText(/loading/i)).toBeInTheDocument()

      // Wait for quiz to load
      await waitFor(() => {
        expect(screen.getByText(mockQuiz.title)).toBeInTheDocument()
      })

      // Verify Redux state was updated
      const state = store.getState()
      expect(state.quiz.title).toBe(mockQuiz.title)
      expect(state.quiz.questions).toHaveLength(mockQuiz.questions.length)
      expect(state.quiz.status).toBe('succeeded')
    })

    it('should handle quiz loading error', async () => {
      // Mock API error
      mockFetchError('Failed to load quiz')

      const { store } = renderWithProviders(
        <CodeQuizWrapper slug="invalid-slug" />
      )

      // Wait for error state
      await waitFor(() => {
        expect(store.getState().quiz.status).toBe('failed')
      })

      // Should show error message
      expect(screen.getByText(/failed to load quiz/i)).toBeInTheDocument()
    })

    it('should handle 404 quiz not found', async () => {
      // Mock 404 response
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Quiz not found' }),
          text: () => Promise.resolve('Quiz not found'),
        })
      ) as jest.MockedFunction<typeof fetch>

      const { store } = renderWithProviders(
        <CodeQuizWrapper slug="nonexistent-quiz" />
      )

      // Wait for error state
      await waitFor(() => {
        expect(store.getState().quiz.status).toBe('failed')
      })

      // Should show not found message
      expect(screen.getByText(/quiz not found/i)).toBeInTheDocument()
    })
  })

  describe('Question Navigation Flow', () => {
    it('should navigate between questions', async () => {
      mockFetch(mockQuiz)

      const { store } = renderWithProviders(
        <CodeQuizWrapper slug={mockQuiz.slug} title={mockQuiz.title} />
      )

      // Wait for quiz to load
      await waitFor(() => {
        expect(screen.getByText(mockQuiz.title)).toBeInTheDocument()
      })

      // Should start with first question
      expect(screen.getByText(mockQuiz.questions[0].question)).toBeInTheDocument()

      // Navigate to next question
      const nextButton = screen.getByRole('button', { name: /next/i })
      await userEvent.click(nextButton)

      // Should show second question
      await waitFor(() => {
        expect(screen.getByText(mockQuiz.questions[1].question)).toBeInTheDocument()
      })

      // Verify Redux state
      const state = store.getState()
      expect(state.quiz.currentQuestionIndex).toBe(1)
    })

    it('should handle question navigation boundaries', async () => {
      mockFetch(mockQuiz)

      const { store } = renderWithProviders(
        <CodeQuizWrapper slug={mockQuiz.slug} title={mockQuiz.title} />
      )

      // Wait for quiz to load
      await waitFor(() => {
        expect(screen.getByText(mockQuiz.title)).toBeInTheDocument()
      })

      // Try to go to previous question from first question
      const prevButton = screen.queryByRole('button', { name: /previous/i })
      expect(prevButton).toBeDisabled()

      // Go to last question
      for (let i = 0; i < mockQuiz.questions.length - 1; i++) {
        const nextButton = screen.getByRole('button', { name: /next/i })
        await userEvent.click(nextButton)
      }

      // Next button should be disabled or show submit
      await waitFor(() => {
        const nextButton = screen.queryByRole('button', { name: /next/i })
        const submitButton = screen.getByRole('button', { name: /submit/i })
        expect(submitButton).toBeInTheDocument()
      })
    })
  })

  describe('Answer Submission Flow', () => {
    it('should save answers as user progresses', async () => {
      mockFetch(mockQuiz)

      const { store } = renderWithProviders(
        <CodeQuizWrapper slug={mockQuiz.slug} title={mockQuiz.title} />
      )

      // Wait for quiz to load
      await waitFor(() => {
        expect(screen.getByText(mockQuiz.title)).toBeInTheDocument()
      })

      // Answer first question (MCQ)
      const firstOption = screen.getByRole('radio', { name: mockQuiz.questions[0].options[0] })
      await userEvent.click(firstOption)

      // Navigate to next question
      const nextButton = screen.getByRole('button', { name: /next/i })
      await userEvent.click(nextButton)

      // Answer second question (code)
      const codeInput = screen.getByRole('textbox')
      await userEvent.type(codeInput, 'function reverseString(str) { return str.split("").reverse().join(""); }')

      // Verify answers are saved in Redux state
      const state = store.getState()
      expect(state.quiz.answers[mockQuiz.questions[0].id]).toBeDefined()
      expect(state.quiz.answers[mockQuiz.questions[1].id]).toBeDefined()
    })

    it('should validate required answers before submission', async () => {
      mockFetch(mockQuiz)

      const { store } = renderWithProviders(
        <CodeQuizWrapper slug={mockQuiz.slug} title={mockQuiz.title} />
      )

      // Wait for quiz to load
      await waitFor(() => {
        expect(screen.getByText(mockQuiz.title)).toBeInTheDocument()
      })

      // Try to submit without answering questions
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await userEvent.click(submitButton)

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/please answer all questions/i)).toBeInTheDocument()
      })

      // Verify quiz is not submitted
      const state = store.getState()
      expect(state.quiz.status).not.toBe('succeeded')
    })
  })

  describe('Quiz Submission Flow', () => {
    it('should submit quiz successfully for authenticated user', async () => {
      // Mock successful quiz load
      mockFetch(mockQuiz)

      // Mock successful submission
      const mockResults = {
        slug: mockQuiz.slug,
        quizType: mockQuiz.quizType,
        score: 8,
        maxScore: 10,
        percentage: 80,
        submittedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        answers: [],
        results: [],
        totalTime: 300,
      }

      // Mock the submission API call
      let submissionCallCount = 0
      global.fetch = jest.fn((input: RequestInfo, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        if (url.includes('/submit')) {
          submissionCallCount++;
          return Promise.resolve(
            new Response(JSON.stringify(mockResults), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify(mockQuiz), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }) as jest.MockedFunction<typeof fetch>;

      const { store } = renderWithProviders(
        <CodeQuizWrapper slug={mockQuiz.slug} title={mockQuiz.title} />,
        {
          preloadedState: {
            auth: {
              user: mockUser,
              session: createMockSession(mockUser),
              status: 'authenticated',
            },
          },
        }
      )

      // Wait for quiz to load
      await waitFor(() => {
        expect(screen.getByText(mockQuiz.title)).toBeInTheDocument()
      })

      // Answer all questions quickly
      for (let i = 0; i < mockQuiz.questions.length; i++) {
        if (i > 0) {
          const nextButton = screen.getByRole('button', { name: /next/i })
          await userEvent.click(nextButton)
        }

        // Answer current question
        if (mockQuiz.questions[i].type === 'code') {
          const codeInput = screen.getByRole('textbox')
          await userEvent.type(codeInput, 'test answer')
        } else {
          const firstOption = screen.getAllByRole('radio')[0]
          await userEvent.click(firstOption)
        }
      }

      // Submit quiz
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await userEvent.click(submitButton)

      // Wait for submission to complete
      await waitFor(() => {
        expect(submissionCallCount).toBe(1)
      })

      // Verify results are shown
      await waitFor(() => {
        expect(screen.getByText(/quiz completed/i)).toBeInTheDocument()
      })

      // Verify Redux state
      const state = store.getState()
      expect(state.quiz.isCompleted).toBe(true)
      expect(state.quiz.results).toEqual(mockResults)
    })

    it('should handle submission errors gracefully', async () => {
      mockFetch(mockQuiz)

      // Mock submission failure
      let submissionCallCount = 0
      global.fetch = jest.fn((url) => {
        if (url.includes('/submit')) {
          submissionCallCount++
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'Server error' }),
            text: () => Promise.resolve('Server error'),
          })
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockQuiz),
          text: () => Promise.resolve(JSON.stringify(mockQuiz)),
        })
      }) as jest.MockedFunction<typeof fetch>

      const { store } = renderWithProviders(
        <CodeQuizWrapper slug={mockQuiz.slug} title={mockQuiz.title} />
      )

      // Wait for quiz to load and complete answering
      await waitFor(() => {
        expect(screen.getByText(mockQuiz.title)).toBeInTheDocument()
      })

      // Answer questions and submit
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await userEvent.click(submitButton)

      // Wait for submission attempt
      await waitFor(() => {
        expect(submissionCallCount).toBe(1)
      })

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to submit quiz/i)).toBeInTheDocument()
      })

      // Verify quiz is not marked as completed
      const state = store.getState()
      expect(state.quiz.isCompleted).toBe(false)
      expect(state.quiz.status).toBe('failed')
    })
  })

  describe('Authentication Flow', () => {
    it('should redirect unauthenticated users for protected quiz', async () => {
      const protectedQuiz = createMockQuiz({ isPublic: false })
      mockFetch(protectedQuiz)

      const mockRouter = { push: jest.fn() }
      jest.mock('next/navigation', () => ({
        useRouter: () => mockRouter,
      }))

      renderWithProviders(
        <CodeQuizWrapper slug={protectedQuiz.slug} title={protectedQuiz.title} />
      )

      // Wait for quiz to load
      await waitFor(() => {
        expect(screen.getByText(protectedQuiz.title)).toBeInTheDocument()
      })

      // Try to submit quiz
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await userEvent.click(submitButton)

      // Should redirect to login
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/signin')
      })
    })

    it('should save temp results for unauthenticated users', async () => {
      mockFetch(mockQuiz)

      const { store } = renderWithProviders(
        <CodeQuizWrapper slug={mockQuiz.slug} title={mockQuiz.title} />
      )

      // Wait for quiz to load
      await waitFor(() => {
        expect(screen.getByText(mockQuiz.title)).toBeInTheDocument()
      })

      // Answer questions
      const firstOption = screen.getByRole('radio', { name: mockQuiz.questions[0].options[0] })
      await userEvent.click(firstOption)

      // Submit quiz (should trigger auth requirement)
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await userEvent.click(submitButton)

      // Should show auth required message
      await waitFor(() => {
        expect(screen.getByText(/authentication required/i)).toBeInTheDocument()
      })

      // Verify temp results are saved
      const state = store.getState()
      expect(state.quiz.requiresAuth).toBe(true)
      expect(state.quiz.answers).toBeDefined()
    })
  })

  describe('Quiz Reset Flow', () => {
    it('should reset quiz state correctly', async () => {
      mockFetch(mockQuiz)

      const { store } = renderWithProviders(
        <CodeQuizWrapper slug={mockQuiz.slug} title={mockQuiz.title} />
      )

      // Wait for quiz to load
      await waitFor(() => {
        expect(screen.getByText(mockQuiz.title)).toBeInTheDocument()
      })

      // Answer some questions
      const firstOption = screen.getByRole('radio', { name: mockQuiz.questions[0].options[0] })
      await userEvent.click(firstOption)

      // Verify answers are saved
      expect(store.getState().quiz.answers).not.toEqual({})

      // Reset quiz
      store.dispatch(resetQuiz())

      // Verify quiz is reset
      const state = store.getState()
      expect(state.quiz.answers).toEqual({})
      expect(state.quiz.currentQuestionIndex).toBe(0)
      expect(state.quiz.isCompleted).toBe(false)
      expect(state.quiz.results).toBeNull()
    })
  })
})
