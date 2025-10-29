import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import CodeQuizWrapper from '@/app/dashboard/(quiz)/code/components/CodeQuizWrapper'
import quizReducer from '@/store/slices/quiz/quiz-slice'
import type { RootState } from '@/store'

// Mock next/navigation
const mockPush = vi.fn()
const mockBack = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack
  }),
  useSearchParams: () => new URLSearchParams()
}))

// Mock toast
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  toast: {
    success: mockToast,
    error: mockToast,
    info: mockToast
  }
}))

// Mock AppLoader
vi.mock('@/components/loaders/UnifiedLoader', () => ({
  default: ({ message }: any) => <div data-testid="app-loader">{message}</div>
}))

// Mock CodeQuiz component
vi.mock('@/components/quiz/CodeQuiz', () => ({
  default: (props: any) => (
    <div data-testid="code-quiz">
      <div>Question: {props.question?.text}</div>
      <div>Number: {props.questionNumber}</div>
      <button onClick={props.onSubmit} data-testid="submit-quiz">Submit</button>
    </div>
  )
}))

// Mock QuizError component
vi.mock('@/components/quiz/QuizError', () => ({
  QuizError: ({ errorType, message, onRetry, onGoBack, onReportIssue, onGoHome }: any) => (
    <div data-testid="quiz-error">
      <div>Error Type: {errorType}</div>
      <div>Message: {message}</div>
      {onRetry && <button onClick={onRetry} data-testid="retry-button">Retry</button>}
      {onGoBack && <button onClick={onGoBack} data-testid="back-button">Go Back</button>}
      {onReportIssue && <button onClick={onReportIssue} data-testid="report-button">Report Issue</button>}
      {onGoHome && <button onClick={onGoHome} data-testid="home-button">Go Home</button>}
    </div>
  )
}))

describe('CodeQuizWrapper Error Handling Integration', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        quiz: quizReducer
      }
    })
    vi.clearAllMocks()

    // Mock window.open for report issue functionality
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    )
  }

  describe('Error State Rendering', () => {
    it('renders QuizError component when quiz status is "failed"', () => {
      // Set up error state
      store = configureStore({
        reducer: {
          quiz: quizReducer
        },
        preloadedState: {
          quiz: {
            slug: 'test-quiz',
            quizType: 'code',
            title: '',
            questions: [],
            currentQuestionIndex: 0,
            answers: {},
            results: null,
            isCompleted: false,
            status: 'failed',
            error: {
              code: 'SERVER_ERROR',
              message: 'Server error occurred',
              status: 500,
              timestamp: Date.now()
            },
            requiresAuth: false,
            redirectAfterLogin: null,
            userId: null,
            questionStartTimes: {},
            lastUpdated: null,
            isInitialized: true,
            pendingRedirect: false
          }
        } as any
      })

      renderWithProvider(<CodeQuizWrapper params={{ slug: 'test-quiz' }} />)

      expect(screen.getByTestId('quiz-error')).toBeInTheDocument()
      expect(screen.getByText('Error Type: SERVER_ERROR')).toBeInTheDocument()
      expect(screen.getByText('Message: Server error occurred')).toBeInTheDocument()
    })

    it('renders QuizError component when quiz status is "not-found"', () => {
      store = configureStore({
        reducer: {
          quiz: quizReducer
        },
        preloadedState: {
          quiz: {
            slug: 'not-found-quiz',
            quizType: 'code',
            title: '',
            questions: [],
            currentQuestionIndex: 0,
            answers: {},
            results: null,
            isCompleted: false,
            status: 'not-found',
            error: {
              code: 'NOT_FOUND',
              message: 'Quiz not found',
              status: 404,
              timestamp: Date.now()
            },
            requiresAuth: false,
            redirectAfterLogin: null,
            userId: null,
            questionStartTimes: {},
            lastUpdated: null,
            isInitialized: true,
            pendingRedirect: false
          }
        } as any
      })

      renderWithProvider(<CodeQuizWrapper params={{ slug: 'not-found-quiz' }} />)

      expect(screen.getByTestId('quiz-error')).toBeInTheDocument()
      expect(screen.getByText('Error Type: NOT_FOUND')).toBeInTheDocument()
    })

    it('renders QuizError component when quiz status is "requires-auth"', () => {
      store = configureStore({
        reducer: {
          quiz: quizReducer
        },
        preloadedState: {
          quiz: {
            slug: 'private-quiz',
            quizType: 'code',
            title: '',
            questions: [],
            currentQuestionIndex: 0,
            answers: {},
            results: null,
            isCompleted: false,
            status: 'requires-auth',
            error: {
              code: 'PRIVATE_QUIZ',
              message: 'Access denied',
              status: 403,
              timestamp: Date.now()
            },
            requiresAuth: false,
            redirectAfterLogin: null,
            userId: null,
            questionStartTimes: {},
            lastUpdated: null,
            isInitialized: true,
            pendingRedirect: false
          }
        } as any
      })

      renderWithProvider(<CodeQuizWrapper params={{ slug: 'private-quiz' }} />)

      expect(screen.getByTestId('quiz-error')).toBeInTheDocument()
      expect(screen.getByText('Error Type: PRIVATE_QUIZ')).toBeInTheDocument()
    })

    it('does not render QuizError when there is no error', () => {
      store = configureStore({
        reducer: {
          quiz: quizReducer
        },
        preloadedState: {
          quiz: {
            slug: 'test-quiz',
            quizType: 'code',
            title: 'Test Quiz',
            questions: [{ id: '1', question: 'Test?' }],
            currentQuestionIndex: 0,
            answers: {},
            results: null,
            isCompleted: false,
            status: 'succeeded',
            error: null,
            requiresAuth: false,
            redirectAfterLogin: null,
            userId: null,
            questionStartTimes: {},
            lastUpdated: null,
            isInitialized: true,
            pendingRedirect: false
          }
        } as any
      })

      renderWithProvider(<CodeQuizWrapper params={{ slug: 'test-quiz' }} />)

      expect(screen.queryByTestId('quiz-error')).not.toBeInTheDocument()
      expect(screen.getByTestId('code-quiz')).toBeInTheDocument()
    })
  })

  describe('Error Action Handlers', () => {
    beforeEach(() => {
      store = configureStore({
        reducer: {
          quiz: quizReducer
        },
        preloadedState: {
          quiz: {
            slug: 'error-quiz',
            quizType: 'code',
            title: '',
            questions: [],
            currentQuestionIndex: 0,
            answers: {},
            results: null,
            isCompleted: false,
            status: 'failed',
            error: {
              code: 'SERVER_ERROR',
              message: 'Server error',
              status: 500,
              timestamp: Date.now()
            },
            requiresAuth: false,
            redirectAfterLogin: null,
            userId: null,
            questionStartTimes: {},
            lastUpdated: null,
            isInitialized: true,
            pendingRedirect: false
          }
        } as any
      })
    })

    it('handles retry action correctly', async () => {
      renderWithProvider(<CodeQuizWrapper params={{ slug: 'error-quiz' }} />)

      const retryButton = screen.getByTestId('retry-button')
      fireEvent.click(retryButton)

      // Should dispatch resetQuiz and fetchQuiz actions
      await waitFor(() => {
        const actions = store.getState().quiz
        // The retry should trigger a reset and refetch
        expect(actions.status).toBe('idle') // After reset
      })
    })

    it('handles go back action correctly', () => {
      renderWithProvider(<CodeQuizWrapper params={{ slug: 'error-quiz' }} />)

      const backButton = screen.getByTestId('back-button')
      fireEvent.click(backButton)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('handles go home action correctly', () => {
      renderWithProvider(<CodeQuizWrapper params={{ slug: 'error-quiz' }} />)

      const homeButton = screen.getByTestId('home-button')
      fireEvent.click(homeButton)

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('handles report issue action correctly', () => {
      renderWithProvider(<CodeQuizWrapper params={{ slug: 'error-quiz' }} />)

      const reportButton = screen.getByTestId('report-button')
      fireEvent.click(reportButton)

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('mailto:support@courseai.io'),
        '_blank'
      )
    })
  })

  describe('Loading States', () => {
    it('renders loading state when status is "loading"', () => {
      store = configureStore({
        reducer: {
          quiz: quizReducer
        },
        preloadedState: {
          quiz: {
            slug: null,
            quizType: null,
            title: '',
            questions: [],
            currentQuestionIndex: 0,
            answers: {},
            results: null,
            isCompleted: false,
            status: 'loading',
            error: null,
            requiresAuth: false,
            redirectAfterLogin: null,
            userId: null,
            questionStartTimes: {},
            lastUpdated: null,
            isInitialized: false,
            pendingRedirect: false
          }
        } as any
      })

      renderWithProvider(<CodeQuizWrapper params={{ slug: 'test-quiz' }} />)

      expect(screen.getByTestId('app-loader')).toBeInTheDocument()
      expect(screen.getByText('Loading code quiz...')).toBeInTheDocument()
    })

    it('renders loading state when status is "idle"', () => {
      store = configureStore({
        reducer: {
          quiz: quizReducer
        },
        preloadedState: {
          quiz: {
            slug: null,
            quizType: null,
            title: '',
            questions: [],
            currentQuestionIndex: 0,
            answers: {},
            results: null,
            isCompleted: false,
            status: 'idle',
            error: null,
            requiresAuth: false,
            redirectAfterLogin: null,
            userId: null,
            questionStartTimes: {},
            lastUpdated: null,
            isInitialized: false,
            pendingRedirect: false
          }
        } as any
      })

      renderWithProvider(<CodeQuizWrapper params={{ slug: 'test-quiz' }} />)

      expect(screen.getByTestId('app-loader')).toBeInTheDocument()
    })
  })

  describe('Successful Quiz Rendering', () => {
    it('renders CodeQuiz component when quiz is successfully loaded', () => {
      store = configureStore({
        reducer: {
          quiz: quizReducer
        },
        preloadedState: {
          quiz: {
            slug: 'success-quiz',
            quizType: 'code',
            title: 'Test Code Quiz',
            questions: [{
              id: '1',
              question: 'What is 2+2?',
              options: ['3', '4', '5'],
              answer: '4'
            }],
            currentQuestionIndex: 0,
            answers: {},
            results: null,
            isCompleted: false,
            status: 'succeeded',
            error: null,
            requiresAuth: false,
            redirectAfterLogin: null,
            userId: null,
            questionStartTimes: {},
            lastUpdated: Date.now(),
            isInitialized: true,
            pendingRedirect: false
          }
        } as any
      })

      renderWithProvider(<CodeQuizWrapper params={{ slug: 'success-quiz' }} />)

      expect(screen.getByTestId('code-quiz')).toBeInTheDocument()
      expect(screen.getByText('Question: What is 2+2?')).toBeInTheDocument()
      expect(screen.getByText('Number: 1')).toBeInTheDocument()
    })
  })

  describe('Error Boundary Integration', () => {
    it('passes correct props to QuizError component', () => {
      store = configureStore({
        reducer: {
          quiz: quizReducer
        },
        preloadedState: {
          quiz: {
            slug: 'error-quiz',
            quizType: 'code',
            title: '',
            questions: [],
            currentQuestionIndex: 0,
            answers: {},
            results: null,
            isCompleted: false,
            status: 'failed',
            error: {
              code: 'NETWORK_ERROR',
              message: 'Connection failed',
              status: 0,
              timestamp: Date.now()
            },
            requiresAuth: false,
            redirectAfterLogin: null,
            userId: null,
            questionStartTimes: {},
            lastUpdated: null,
            isInitialized: true,
            pendingRedirect: false
          }
        } as any
      })

      renderWithProvider(<CodeQuizWrapper params={{ slug: 'error-quiz' }} />)

      expect(screen.getByText('Error Type: NETWORK_ERROR')).toBeInTheDocument()
      expect(screen.getByText('Message: Connection failed')).toBeInTheDocument()
    })
  })
})