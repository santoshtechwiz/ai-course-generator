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

import { renderHook, act } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import quizReducer, { submitQuiz } from "@/store/slices/quizSlice"
import { useQuiz } from "@/hooks/useQuizState"
import React from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn((url, options) => {
  if (url.includes("/api/quizzes/common/test-slug/complete")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        score: 2,
        maxScore: 3,
        questions: [
          { id: "1", question: "Q1", userAnswer: "A", correctAnswer: "A", isCorrect: true },
          { id: "2", question: "Q2", userAnswer: "B", correctAnswer: "B", isCorrect: true },
          { id: "3", question: "Q3", userAnswer: "C", correctAnswer: "D", isCorrect: false },
        ],
      }),
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

// Create a wrapper with store
const createWrapper = (initialState = {}) => {
  const store = configureStore({
    reducer: {
      quiz: quizReducer,
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
        ...initialState,
      },
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

    expect(result.current.quizData).toBeNull()
    expect(result.current.currentQuestion).toBe(0)
    expect(result.current.userAnswers).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.results).toBeNull()
    expect(typeof result.current.loadQuiz).toBe("function")
    expect(typeof result.current.nextQuestion).toBe("function")
    expect(typeof result.current.previousQuestion).toBe("function")
    expect(typeof result.current.saveAnswer).toBe("function")
    expect(typeof result.current.submitQuiz).toBe("function")
  })

  test("should reset quiz state", () => {
    const initialState = {
      quizData: { id: "test", questions: [] },
      currentQuestion: 2,
      userAnswers: [{ questionId: "1", answer: "test" }],
    }

    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper(initialState) })

    act(() => {
      result.current.resetQuizState()
    })

    expect(result.current.quizData).toBeNull()
    expect(result.current.currentQuestion).toBe(0)
    expect(result.current.userAnswers).toEqual([])
  })

  test("should navigate to next question", () => {
    const initialState = {
      quizData: {
        questions: [
          { id: "1", question: "Question 1" },
          { id: "2", question: "Question 2" },
          { id: "3", question: "Question 3" },
        ],
      },
      currentQuestion: 0,
    }

    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper(initialState) })

    act(() => {
      result.current.nextQuestion()
    })

    expect(result.current.currentQuestion).toBe(1)
  })

  test("should navigate to previous question", () => {
    const initialState = {
      quizData: {
        questions: [
          { id: "1", question: "Question 1" },
          { id: "2", question: "Question 2" },
          { id: "3", question: "Question 3" },
        ],
      },
      currentQuestion: 2,
    }

    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper(initialState) })

    act(() => {
      result.current.previousQuestion()
    })

    expect(result.current.currentQuestion).toBe(1)
  })

  test("should save user answer", () => {
    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper() })

    act(() => {
      result.current.saveAnswer("test-id", "test-answer")
    })

    expect(result.current.userAnswers).toContainEqual({
      questionId: "test-id",
      answer: "test-answer",
    })
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
        questions: [
          { id: "1", question: "Question 1" },
          { id: "2", question: "Question 2" },
        ],
      },
      currentQuestion: 1,
    }

    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper(initialState) })

    expect(result.current.getCurrentQuestion()).toEqual({ id: "2", question: "Question 2" })
  })

  test("should check if current question is last", () => {
    const initialState = {
      quizData: {
        questions: [
          { id: "1", question: "Question 1" },
          { id: "2", question: "Question 2" },
        ],
      },
      currentQuestion: 1,
    }

    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper(initialState) })

    expect(result.current.isLastQuestion()).toBe(true)
  })

  test("should handle authentication requirement", () => {
    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper() })

    act(() => {
      result.current.requireAuthentication("/callback/path")
    })

    expect(signIn).toHaveBeenCalledWith(undefined, {
      callbackUrl: "/callback/path",
    })
  })

  test("should handle undefined quiz data", () => {
    const initialState = {
      quizData: null,
    }

    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper(initialState) })

    expect(result.current.getCurrentQuestion()).toBeNull()
    expect(result.current.isLastQuestion()).toBe(false)  // Make sure this returns a boolean
    expect(result.current.getQuizProgress()).toBe(0)
    expect(result.current.areAllQuestionsAnswered()).toBe(false)
  })

  test("should handle missing question id", () => {
    const initialState = {
      quizData: {
        questions: [{ question: "No ID" }],
      },
      currentQuestion: 0,
    }

    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper(initialState) })

    expect(result.current.getCurrentQuestion()).toEqual({ question: "No ID" })
  })

  test("should handle quiz submission", async () => {
    // Setup mock for submitQuiz API
    const mockResult = {
      score: 2,
      maxScore: 3,
      questions: [
        { id: "1", question: "Q1", userAnswer: "A", correctAnswer: "A", isCorrect: true },
        { id: "2", question: "Q2", userAnswer: "B", correctAnswer: "B", isCorrect: true },
        { id: "3", question: "Q3", userAnswer: "C", correctAnswer: "D", isCorrect: false },
      ]
    };

    const initialState = {
      quizData: {
        id: "test-quiz",
        slug: "test-slug",
        type: "mcq",
        questions: [
          { id: "1", question: "Q1" },
          { id: "2", question: "Q2" },
          { id: "3", question: "Q3" },
        ],
      },
      userAnswers: [
        { questionId: "1", answer: "A" },
        { questionId: "2", answer: "B" },
        { questionId: "3", answer: "C" },
      ],
    };

    // Setup specific fetch mock for this test
    const customFetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    });
    
    global.fetch = customFetchMock;

    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper(initialState) });

    let submissionResult;
    await act(async () => {
      submissionResult = await result.current.submitQuiz({
        slug: "test-slug",
        quizId: "test-quiz",
        type: "mcq",
        answers: initialState.userAnswers,
      });
    });

    // Check that fetch was called with the correct URL and options
    expect(customFetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/quizzes/common/test-slug/complete"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: expect.any(String),
      })
    );

    // Verify the result matches the expected structure
    expect(submissionResult).toEqual(mockResult);
  });
})
