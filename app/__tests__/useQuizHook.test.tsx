import type React from "react"
import { renderHook, act } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { useQuiz } from "@/hooks/useQuizState"
import quizReducer from "@/store/slices/quizSlice"
import { useRouter } from "next/navigation"

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

// Wrapper component for the hook
const wrapper = ({ children }: { children: React.ReactNode }) => {
  const store = configureStore({
    reducer: {
      quiz: quizReducer,
    },
  })

  return <Provider store={store}>{children}</Provider>
}

describe("useQuiz Hook", () => {
  // Setup common mocks
  const mockRouter = {
    push: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })
  })

  test("should return initial state", () => {
    const { result } = renderHook(() => useQuiz(), { wrapper })

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
  })

  test("should reset quiz state", () => {
    const { result } = renderHook(() => useQuiz(), { wrapper })

    act(() => {
      result.current.resetQuizState()
    })

    expect(result.current.quizData).toBeNull()
    expect(result.current.currentQuestion).toBe(0)
  })

  test("should navigate to next question", () => {
    const mockStore = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      preloadedState: {
        quiz: {
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
          userAnswers: [],
          isLoading: false,
          isSubmitting: false,
          error: null,
          results: null,
          isCompleted: false,
          quizHistory: [],
          currentQuizId: "test",
          timeRemaining: null,
          timerActive: false,
        },
      },
    })

    const customWrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={mockStore}>{children}</Provider>
    )

    const { result } = renderHook(() => useQuiz(), { wrapper: customWrapper })

    act(() => {
      const success = result.current.nextQuestion()
      expect(success).toBe(true)
    })

    expect(result.current.currentQuestion).toBe(1)
  })

  test("should navigate to previous question", () => {
    const mockStore = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      preloadedState: {
        quiz: {
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
          userAnswers: [],
          isLoading: false,
          isSubmitting: false,
          error: null,
          results: null,
          isCompleted: false,
          quizHistory: [],
          currentQuizId: "test",
          timeRemaining: null,
          timerActive: false,
        },
      },
    })

    const customWrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={mockStore}>{children}</Provider>
    )

    const { result } = renderHook(() => useQuiz(), { wrapper: customWrapper })

    act(() => {
      const success = result.current.previousQuestion()
      expect(success).toBe(true)
    })

    expect(result.current.currentQuestion).toBe(0)
  })

  test("should save user answer", () => {
    const { result } = renderHook(() => useQuiz(), { wrapper })

    act(() => {
      result.current.saveAnswer("q1", "test answer")
    })

    expect(result.current.userAnswers).toHaveLength(1)
    expect(result.current.userAnswers[0]).toEqual({ questionId: "q1", answer: "test answer" })
  })

  test("should format remaining time correctly", () => {
    const mockStore = configureStore({
      reducer: {
        quiz: quizReducer,
      },
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
          currentQuizId: null,
          timeRemaining: 65, // 1 minute and 5 seconds
          timerActive: false,
        },
      },
    })

    const customWrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={mockStore}>{children}</Provider>
    )

    const { result } = renderHook(() => useQuiz(), { wrapper: customWrapper })

    expect(result.current.formatRemainingTime()).toBe("01:05")
  })

  test("should get current question", () => {
    const mockStore = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      preloadedState: {
        quiz: {
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
          userAnswers: [],
          isLoading: false,
          isSubmitting: false,
          error: null,
          results: null,
          isCompleted: false,
          quizHistory: [],
          currentQuizId: null,
          timeRemaining: null,
          timerActive: false,
        },
      },
    })

    const customWrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={mockStore}>{children}</Provider>
    )

    const { result } = renderHook(() => useQuiz(), { wrapper: customWrapper })

    expect(result.current.getCurrentQuestion()).toEqual({ id: "q2", question: "Question 2", type: "mcq" })
  })

  test("should check if current question is last", () => {
    const mockStore = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      preloadedState: {
        quiz: {
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
          userAnswers: [],
          isLoading: false,
          isSubmitting: false,
          error: null,
          results: null,
          isCompleted: false,
          quizHistory: [],
          currentQuizId: null,
          timeRemaining: null,
          timerActive: false,
        },
      },
    })

    const customWrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={mockStore}>{children}</Provider>
    )

    const { result } = renderHook(() => useQuiz(), { wrapper: customWrapper })

    expect(result.current.isLastQuestion()).toBe(true)
  })

  test("should handle authentication requirement", () => {
    const signIn = require("next-auth/react").signIn as jest.Mock
    const { result } = renderHook(() => useQuiz(), { wrapper })

    act(() => {
      result.current.requireAuthentication("/dashboard/quiz/test-quiz")
    })

    expect(signIn).toHaveBeenCalledWith(undefined, { callbackUrl: "/dashboard/quiz/test-quiz" })
  })

  test("should handle undefined quiz data", () => {
    const mockStore = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      preloadedState: {
        quiz: {
          quizData: undefined,
          currentQuestion: 0,
          userAnswers: [],
          isLoading: false,
          isSubmitting: false,
          error: null,
          results: null,
          isCompleted: false,
          quizHistory: [],
          currentQuizId: null,
          timeRemaining: null,
          timerActive: false,
        },
      },
    })

    const customWrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={mockStore}>{children}</Provider>
    )

    const { result } = renderHook(() => useQuiz(), { wrapper: customWrapper })

    expect(result.current.quizData).toBeUndefined()
    expect(result.current.getCurrentQuestion()).toBeNull()
  })

  test("should handle missing question id", () => {
    const mockStore = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      preloadedState: {
        quiz: {
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
          userAnswers: [],
          isLoading: false,
          isSubmitting: false,
          error: null,
          results: null,
          isCompleted: false,
          quizHistory: [],
          currentQuizId: "test",
          timeRemaining: null,
          timerActive: false,
        },
      },
    })

    const customWrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={mockStore}>{children}</Provider>
    )

    const { result } = renderHook(() => useQuiz(), { wrapper: customWrapper })

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
      text: async () => JSON.stringify({
        score: 80,
        maxScore: 100,
        percentage: 80,
        submittedAt: new Date().toISOString(),
      })
    })

    const mockStore = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      preloadedState: {
        quiz: {
          quizData: {
            id: "test-quiz",
            title: "Test Quiz",
            description: "Test",
            type: "code" as const,
            difficulty: "medium" as const,
            questions: [{ id: "q1" }],
            slug: "test-slug",
          },
          currentQuestion: 0,
          userAnswers: [{ questionId: "q1", answer: "test answer" }],
          isLoading: false,
          isSubmitting: false,
          error: null,
          results: null,
          isCompleted: false,
          quizHistory: [],
          currentQuizId: "test-quiz",
          timeRemaining: 300,
          timerActive: true,
        },
      },
    })

    const customWrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={mockStore}>{children}</Provider>
    )

    const { result } = renderHook(() => useQuiz(), { wrapper: customWrapper })

    await act(async () => {
      await result.current.submitQuiz("test-slug")
    })

    // Updated expectations to match the current implementation
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/quizzes/common/test-slug/complete"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache" 
        }),
        credentials: "include",
        body: expect.any(String),
      })
    )

    const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(requestBody).toHaveProperty("quizId", "test-quiz")
    expect(requestBody).toHaveProperty("type", "code")
    expect(requestBody.answers).toHaveLength(1)
    expect(requestBody.answers[0]).toEqual({ questionId: "q1", answer: "test answer" })
  })
})
