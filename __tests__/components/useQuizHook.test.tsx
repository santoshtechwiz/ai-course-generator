import type React from "react"
import { renderHook, act } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { useQuiz } from "@/hooks/useQuizState"
import quizReducer from "@/store/slices/quizSlice"
import { useRouter } from "next/navigation"
import type { QuizType } from "@/app/types/quiz-types"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}))

// Mock fetch for async thunks
global.fetch = jest.fn()

// Add basic auth reducer for tests
const authReducer = (state = { userRedirectState: null, hasRedirectState: false }, action: any) => {
  if (action.type === 'auth/setUserRedirectState') {
    return { ...state, userRedirectState: action.payload, hasRedirectState: true };
  }
  if (action.type === 'auth/clearUserRedirectState') {
    return { ...state, userRedirectState: null, hasRedirectState: false };
  }
  return state;
};

// Create a wrapper with store
const createWrapper = (initialState = {}) => {
  // Create store with both reducers
  const store = configureStore({
    reducer: {
      quiz: quizReducer,
      auth: authReducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
    preloadedState: {
      quiz: {
        quizData: null,
        currentQuestion: 0,
        userAnswers: [],
        isLoading: false,
        isSubmitting: false,
        error: null,
        results: null,
        isCompleted: false,
        quizHistory: [],
        quizError: null,
        submissionError: null,
        resultsError: null, 
        historyError: null,
        currentQuizId: null,
        timeRemaining: null,
        timerActive: false,
        submissionStateInProgress: false,
        errors: {
          quiz: null,
          submission: null, 
          results: null,
          history: null
        },
        ...initialState,
      },
      auth: {
        userRedirectState: null,
        hasRedirectState: false
      }
    },
  })

  return ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>
}

describe("useQuiz Hook", () => {
  // Setup mock router
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(global.fetch as jest.Mock).mockClear()
    
    // Add this to prevent localStorage errors in tests
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(() => null),
        removeItem: jest.fn(() => null),
      },
      writable: true
    });
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(() => null),
        removeItem: jest.fn(() => null),
      },
      writable: true
    });
  })

  test("should return initial state", () => {
    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper() })

    // Test if the basic properties are available from the old API
    expect(result.current.quizData).toBeNull()
    expect(result.current.currentQuestion).toBe(0)
    expect(result.current.userAnswers).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.results).toBeNull()
    expect(result.current.isCompleted).toBe(false)
    expect(result.current.quizHistory).toEqual([])
    expect(result.current.currentQuizId).toBeNull()
    expect(result.current.timeRemaining).toBeNull()
    expect(result.current.timerActive).toBe(false)
    
    // In test mode, both new and legacy APIs should be available
    expect(result.current.quiz).toBeDefined()
    expect(result.current.status).toBeDefined()
    expect(result.current.actions).toBeDefined()
    expect(result.current.navigation).toBeDefined()
  })

  test("should reset quiz state", () => {
    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper() })

    act(() => {
      result.current.resetQuizState()
    })

    expect(result.current.quizData).toBeNull()
    expect(result.current.currentQuestion).toBe(0)
  })

  test("should navigate to next question", () => {
    const initialState = {
      quizData: {
        id: "test",
        title: "Test Quiz",
        description: "Test",
        type: "mcq" as const,
        difficulty: "medium" as const,
        questions: [{ id: "q1" }, { id: "q2" }, { id: "q3" }],
        slug: "test",
      },
      currentQuestion: 0,
    }

    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper(initialState) })

    act(() => {
      const success = result.current.nextQuestion()
      expect(success).toBe(true)
    })

    expect(result.current.currentQuestion).toBe(1)
  })

  test("should navigate to previous question", () => {
    const initialState = {
      quizData: {
        id: "test",
        title: "Test Quiz",
        description: "Test",
        type: "mcq" as const,
        difficulty: "medium" as const,
        questions: [{ id: "q1" }, { id: "q2" }, { id: "q3" }],
        slug: "test",
      },
      currentQuestion: 1,
    }

    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper(initialState) })

    act(() => {
      const success = result.current.previousQuestion()
      expect(success).toBe(true)
    })

    expect(result.current.currentQuestion).toBe(0)
  })

  test("should save user answer", () => {
    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper() })

    act(() => {
      result.current.saveAnswer("q1", "test answer")
    })

    expect(result.current.userAnswers).toHaveLength(1)
    expect(result.current.userAnswers[0]).toEqual({ questionId: "q1", answer: "test answer" })
  })

  test("should format remaining time correctly", () => {
    const initialState = {
      timeRemaining: 65, // 1 minute and 5 seconds
    }

    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper(initialState) })

    expect(result.current.formatRemainingTime()).toBe("01:05")
  })

  test("should get current question", () => {
    const initialState = {
      quizData: {
        id: "test",
        title: "Test Quiz",
        description: "Test",
        type: "mcq" as const,
        difficulty: "medium" as const,
        questions: [
          { id: "q1", question: "Question 1", type: "mcq" },
          { id: "q2", question: "Question 2", type: "mcq" },
        ],
        slug: "test",
      },
      currentQuestion: 1,
    }

    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper(initialState) })

    expect(result.current.getCurrentQuestion()).toEqual({ id: "q2", question: "Question 2", type: "mcq" })
  })

  test("should check if current question is last", () => {
    const initialState = {
      quizData: {
        id: "test",
        title: "Test Quiz",
        description: "Test",
        type: "mcq" as const,
        difficulty: "medium" as const,
        questions: [
          { id: "q1", question: "Question 1", type: "mcq" },
          { id: "q2", question: "Question 2", type: "mcq" },
        ],
        slug: "test",
      },
      currentQuestion: 1, // Second question (index 1) is the last one
    }

    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper(initialState) })

    expect(result.current.isLastQuestion()).toBe(true)
  })

  test("should handle authentication requirement", () => {
    const signIn = require("next-auth/react").signIn as jest.Mock
    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper() })

    act(() => {
      result.current.requireAuthentication("/dashboard/quiz/test-quiz")
    })

    expect(signIn).toHaveBeenCalledWith(undefined, { callbackUrl: "/dashboard/quiz/test-quiz" })
  })

  test("should handle undefined quiz data", () => {
    const initialState = {
      quizData: undefined,
    }

    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper(initialState) })

    expect(result.current.quizData).toBeUndefined()
    expect(result.current.getCurrentQuestion()).toBeNull()
  })

  test("should handle missing question id", () => {
    const initialState = {
      quizData: {
        id: "test",
        title: "Test Quiz",
        description: "Test",
        type: "mcq" as const,
        difficulty: "medium" as const,
        questions: [{ question: "Question without ID", type: "mcq" }],
        slug: "test",
      },
      currentQuestion: 0,
    }

    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper(initialState) })

    act(() => {
      // This should not throw an error even though the question has no ID
      result.current.saveAnswer("generated-id", "test answer")
    })

    expect(result.current.userAnswers).toHaveLength(1)
  })

  test("should handle quiz submission", async () => {
    // Mock fetch response for quiz submission
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        score: 80,
        maxScore: 100,
        percentage: 80,
        submittedAt: new Date().toISOString(),
        questions: []
      })
    })

    const initialState = {
      quizData: {
        id: "test-quiz",
        title: "Test Quiz",
        description: "Test",
        type: "code" as QuizType,
        difficulty: "medium" as const,
        questions: [{ id: "q1", type: "code" as const }],
        slug: "test-slug",
      },
      currentQuestion: 0,
      userAnswers: [{ questionId: "q1", answer: "test answer" }],
      timeRemaining: 300,
      timerActive: true,
    }

    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper(initialState) })

    // Create a payload that matches the expected structure including isCorrect property
    const payload = {
      slug: "test-slug",
      quizId: "test-quiz",
      type: "code" as QuizType,
      answers: [{ 
        questionId: "q1", 
        answer: "test answer", 
        isCorrect: true, 
        timeSpent: 60 
      }],
      timeTaken: 60 // Include timeTaken for testing
    }

    await act(async () => {
      await result.current.submitQuiz(payload)
    })

    // Verify fetch was called with the correct arguments
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/quizzes/common/test-slug/complete"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ 
          "Content-Type": "application/json"
        }),
        body: expect.any(String),
      })
    )

    const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(requestBody).toHaveProperty("quizId", "test-quiz")
    expect(requestBody).toHaveProperty("type", "code")
    
    // Check that answers have the expected structure
    expect(requestBody.answers).toHaveLength(1)
    expect(requestBody.answers[0]).toHaveProperty("questionId", "q1")
    expect(requestBody.answers[0]).toHaveProperty("answer", "test answer")
    
    // Verify that our new required fields are present
    expect(requestBody.answers[0]).toHaveProperty("isCorrect")
    expect(typeof requestBody.answers[0].isCorrect).toBe("boolean")
    expect(requestBody.answers[0]).toHaveProperty("timeSpent")
    expect(typeof requestBody.answers[0].timeSpent).toBe("number")
    
    // Check that the score is calculated and included
    expect(requestBody).toHaveProperty("score")
    expect(typeof requestBody.score).toBe("number")
    
    // Check that we have the correct time field
    // In test mode, we might have either totalTime or timeTaken
    expect(
      requestBody.hasOwnProperty("totalTime") || 
      requestBody.hasOwnProperty("timeTaken")
    ).toBe(true)
  })
})
