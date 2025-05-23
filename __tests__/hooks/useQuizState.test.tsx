import { renderHook, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { useQuiz } from '@/hooks/useQuizState'
import quizReducer from '@/store/slices/quizSlice'
import authReducer from '@/store/slices/authSlice'
import type { QuizType, QuizResult } from '@/app/types/quiz-types'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn()
  })
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn()
}))

// Add mock for quiz submission state actions
const mockSubmissionState = {
  saveQuizSubmissionState: jest.fn().mockResolvedValue({ success: true }),
  clearQuizSubmissionState: jest.fn().mockResolvedValue({ success: true }),
  getQuizSubmissionState: jest.fn().mockResolvedValue({ state: 'active' })
}

const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      quiz: quizReducer,
      auth: authReducer
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        thunk: {
          extraArgument: mockSubmissionState
        }
      })
  })
}

const createWrapper = (initialState = {}) => {
  const store = createTestStore(initialState)
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  )
}

describe('useQuizState', () => {
  const mockQuizData = {
    id: 'test-quiz',
    slug: 'test-quiz',
    title: 'Test Quiz',
    type: 'mcq' as const,
    questions: [
      {
        id: 'q1',
        question: 'Test question 1',
        answer: 'Test answer 1'
      }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSubmissionState.saveQuizSubmissionState.mockClear()
    mockSubmissionState.clearQuizSubmissionState.mockClear()
  })

  describe('Core Quiz State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper()
      })

      expect(result.current.quiz.data).toBeNull()
      expect(result.current.quiz.currentQuestion).toBe(0)
      expect(result.current.quiz.userAnswers).toEqual([])
      expect(result.current.status.isLoading).toBe(false)
      expect(result.current.results).toBeNull()
    })

    it('should load quiz data correctly', async () => {
      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        // Mock the API call
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockQuizData)
        })

        await result.current.actions.loadQuiz('test-quiz', 'mcq')
      })

      expect(result.current.quiz.data).toEqual(mockQuizData)
    })
  })

  describe('Quiz Interactions', () => {
    it('should handle answers correctly', async () => {
      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper({
          quiz: {
            quizData: mockQuizData,
            currentQuestion: 0,
            userAnswers: []
          }
        })
      })

      await act(async () => {
        result.current.actions.saveAnswer('q1', 'Test answer')
      })

      expect(result.current.quiz.userAnswers).toHaveLength(1)
      expect(result.current.quiz.userAnswers[0]).toEqual({
        questionId: 'q1',
        answer: 'Test answer'
      })
    })

    it('should handle quiz submission with submission state', async () => {
      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper({
          quiz: {
            quizData: mockQuizData,
            currentQuestion: 0,
            userAnswers: [{ questionId: 'q1', answer: 'Test answer' }]
          }
        })
      })

      const submitPayload = {
        slug: 'test-quiz',
        type: 'mcq' as QuizType,
        answers: [{ questionId: 'q1', answer: 'Test answer', isCorrect: true }]
      }

      await act(async () => {
        // Mock the submit API call
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            result: { isCompleted: true }
          })
        })

        await result.current.actions.submitQuiz(submitPayload)
      })

      expect(mockSubmissionState.saveQuizSubmissionState).toHaveBeenCalled()
      expect(mockSubmissionState.clearQuizSubmissionState).toHaveBeenCalled()
    })
  })

  describe('Quiz Navigation', () => {
    it('should handle navigation between questions', () => {
      const mockQuizWithMultipleQuestions = {
        ...mockQuizData,
        questions: [
          { id: 'q1', question: 'Q1', answer: 'A1', type: 'mcq' as const },
          { id: 'q2', question: 'Q2', answer: 'A2', type: 'mcq' as const }
        ]
      }

      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper({
          quiz: {
            quizData: mockQuizWithMultipleQuestions,
            currentQuestion: 0,
            userAnswers: []
          }
        })
      })

      act(() => {
        result.current.navigation.next()
      })
      expect(result.current.quiz.currentQuestion).toBe(1)

      act(() => {
        result.current.navigation.previous()
      })
      expect(result.current.quiz.currentQuestion).toBe(0)
    })
  })

  describe('Results Management', () => {
    const mockResults: QuizResult = {
      quizId: 'test-quiz',
      slug: 'test-quiz',
      score: 1,
      maxScore: 1,
      questions: []
    }

    it('should handle temporary results', () => {
      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.saveTempResults(mockResults)
      })

      expect(result.current.tempResults).toEqual(mockResults)

      act(() => {
        result.current.actions.clearTempResults()
      })

      expect(result.current.tempResults).toBeNull()
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain old API format in test environment', () => {
      const { result } = renderHook(() => useQuiz(), {
        wrapper: createWrapper()
      })

      expect(result.current).toHaveProperty('quizData')
      expect(result.current).toHaveProperty('currentQuestion')
      expect(result.current).toHaveProperty('userAnswers')
      expect(result.current).toHaveProperty('saveQuizState')
      expect(result.current).toHaveProperty('saveSubmissionState')
    })
  })
})
