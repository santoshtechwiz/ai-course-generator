"use client"

import type React from "react"

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { useQuiz, QuizProvider } from "@/app/context/QuizContext"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import quizReducer from "@/app/store/quizSlice" // Adjust the path as needed
import { QuizType } from "../types/quiz-types"

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

// Mock quizApi
jest.mock("@/lib/quiz-api", () => ({
  quizApi: {
    fetchQuizResult: jest.fn().mockResolvedValue(null),
    submitQuizResult: jest.fn().mockResolvedValue({}),
  },
}))

jest.mock("@/hooks/use-toast", () => ({
  toast: jest.fn(),
}))

// Create a mock for the unified-auth-provider
const mockSignIn = jest.fn().mockResolvedValue({})
const mockIsAuthenticated = jest.fn().mockReturnValue(false)

jest.mock("@/providers/unified-auth-provider", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: mockIsAuthenticated(),
    isAdmin: false,
    credits: 0,
    isLoading: false,
    signIn: mockSignIn,
    signOut: jest.fn().mockResolvedValue({}),
    requireAuth: jest.fn(),
    refreshSession: jest.fn(),
  }),
}))

// Mock window.performance.getEntriesByType
Object.defineProperty(window, "performance", {
  value: {
    getEntriesByType: jest.fn().mockReturnValue([]),
    navigation: { type: 0 },
  },
  writable: true,
})

// Mock window.location and window.history
const mockLocation = {
  href: "http://localhost:3000/test",
  search: "",
  pathname: "/test",
  replace: jest.fn(),
}

const mockHistory = {
  replaceState: jest.fn(),
  pushState: jest.fn(),
}

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
})

Object.defineProperty(window, "history", {
  value: mockHistory,
  writable: true,
})

// Mock document.title
Object.defineProperty(document, "title", {
  value: "Test Title",
  writable: true,
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    // Add a method to get the entire store for testing
    getStore: () => ({ ...store }),
  }
})()

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

// Mock document.cookie
Object.defineProperty(document, "cookie", {
  writable: true,
  value: "",
})

// Create a test Redux store
const createTestStore = () =>
  configureStore({
    reducer: {
      quiz: quizReducer,
    },
  })

// Update the TestComponent to properly use the context
const TestComponent = () => {
  const quiz = useQuiz()
  const { state, submitAnswer, completeQuiz, restartQuiz, handleAuthenticationRequired } = quiz

  return (
    <div>
      <div data-testid="current-question">{state.currentQuestionIndex}</div>
      <div data-testid="is-completed">{state.isCompleted ? "true" : "false"}</div>
      <div data-testid="score">{state.score}</div>
      <div data-testid="requires-auth">{state.requiresAuth ? "true" : "false"}</div>
      <div data-testid="is-authenticated">{quiz.isAuthenticated ? "true" : "false"}</div>
      <button data-testid="submit-answer" onClick={() => submitAnswer("test answer", 10, true)}>
        Submit Answer
      </button>
      <button
        data-testid="complete-quiz"
        onClick={() => completeQuiz([{ answer: "test", timeSpent: 10, isCorrect: true }])}
      >
        Complete Quiz
      </button>
      <button data-testid="restart-quiz" onClick={restartQuiz}>
        Restart Quiz
      </button>
      <button data-testid="auth-required" onClick={handleAuthenticationRequired}>
        Handle Auth Required
      </button>
    </div>
  )
}

// Wrapper component that provides Redux store
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const store = createTestStore()
  return <Provider store={store}>{children}</Provider>
}

describe("QuizContext", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
    document.cookie = ""
    mockIsAuthenticated.mockReturnValue(false)

    // Reset window.location.search for each test
    mockLocation.search = ""

    // Reset mock functions
    jest.clearAllMocks()
  })

  const mockQuizData = {
    id: "123",
    title: "Test Quiz",
    questions: [
      {
        id: 1,
        question: "Question 1",
        answer: "Answer 1",
        option1: "Option 1",
        option2: "Option 2",
        option3: "Option 3",
      },
      {
        id: 2,
        question: "Question 2",
        answer: "Answer 2",
        option1: "Option 1",
        option2: "Option 2",
        option3: "Option 3",
      },
    ],
  }

  test("initializes with correct default state", async () => {
    render(
      <TestWrapper>
        <QuizProvider
          quizData={mockQuizData}
          slug="test-quiz"
          quizType="mcq"
          onAuthRequired={(redirectUrl: string) => {
            console.log(`Auth required. Redirect to: ${redirectUrl}`)
          }}
        >
          <TestComponent />
        </QuizProvider>
      </TestWrapper>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("current-question").textContent).toBe("0")
      expect(screen.getByTestId("is-completed").textContent).toBe("false")
      expect(screen.getByTestId("score").textContent).toBe("0")
      expect(screen.getByTestId("requires-auth").textContent).toBe("false")
      expect(screen.getByTestId("is-authenticated").textContent).toBe("false")
    })
  })

  test("submits an answer and updates state", async () => {
    render(
      <TestWrapper>
        <QuizProvider quizData={mockQuizData} slug="test-quiz" quizType="mcq">
          <TestComponent />
        </QuizProvider>
      </TestWrapper>,
    )

    fireEvent.click(screen.getByTestId("submit-answer"))

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId("current-question").textContent).toBe("1")
    })
  })

  test("completes quiz and updates state", async () => {
    render(
      <TestWrapper>
        <QuizProvider quizData={mockQuizData} slug="test-quiz" quizType="mcq">
          <TestComponent />
        </QuizProvider>
      </TestWrapper>,
    )

    fireEvent.click(screen.getByTestId("complete-quiz"))

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId("is-completed").textContent).toBe("true")
      expect(screen.getByTestId("score").textContent).not.toBe("0")
    })
  })

  test("prevents multiple completions", async () => {
    const submitQuizResultMock = jest.fn().mockResolvedValue({})
    jest.spyOn(require("@/lib/quiz-api").quizApi, "submitQuizResult").mockImplementation(submitQuizResultMock)

    render(
      <TestWrapper>
        <QuizProvider quizData={mockQuizData} slug="test-quiz" quizType="mcq">
          <TestComponent />
        </QuizProvider>
      </TestWrapper>,
    )

    // First completion
    fireEvent.click(screen.getByTestId("complete-quiz"))

    // Wait for the first completion to finish
    await waitFor(() => {
      expect(screen.getByTestId("is-completed").textContent).toBe("true")
    })

    // Reset the mock to track the second call
    submitQuizResultMock.mockClear()

    // Try to complete again
    fireEvent.click(screen.getByTestId("complete-quiz"))

    // Wait a bit to ensure any async operations complete
    await new Promise((resolve) => setTimeout(resolve, 100))

    // The second click should not trigger another submission
    expect(submitQuizResultMock).not.toHaveBeenCalled()
  })

  test("restarts quiz and resets state", async () => {
    render(
      <TestWrapper>
        <QuizProvider quizData={mockQuizData} slug="test-quiz" quizType="mcq">
          <TestComponent />
        </QuizProvider>
      </TestWrapper>,
    )

    // Complete the quiz first to set the completed state
    fireEvent.click(screen.getByTestId("complete-quiz"))

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId("is-completed").textContent).toBe("true")
    })

    // Now restart the quiz
    fireEvent.click(screen.getByTestId("restart-quiz"))

    // Verify that the state was reset
    await waitFor(() => {
      expect(screen.getByTestId("is-completed").textContent).toBe("false")
      expect(screen.getByTestId("current-question").textContent).toBe("0")
      expect(screen.getByTestId("score").textContent).toBe("0")
    })
  })

  test("handles authentication required for guest users", async () => {
    const mockOnAuthRequired = jest.fn()

    render(
      <TestWrapper>
        <QuizProvider quizData={mockQuizData} slug="test-quiz" quizType="mcq" onAuthRequired={mockOnAuthRequired}>
          <TestComponent />
        </QuizProvider>
      </TestWrapper>,
    )

    // Trigger auth required
    fireEvent.click(screen.getByTestId("auth-required"))

    // Verify localStorage was updated with pending data
    await waitFor(() => {
      expect(localStorage.getItem("pendingQuizData")).not.toBeNull()
      expect(localStorage.getItem("quizAuthRedirect")).not.toBeNull()
    })

    // Verify onAuthRequired was called
    await waitFor(() => {
      expect(mockOnAuthRequired).toHaveBeenCalled()
    })
  })

  test("skips auth prompt for authenticated users", async () => {
    // Mock authenticated user
    mockIsAuthenticated.mockReturnValue(true)

    const submitQuizResultMock = jest.fn().mockResolvedValue({})
    jest.spyOn(require("@/lib/quiz-api").quizApi, "submitQuizResult").mockImplementation(submitQuizResultMock)

    render(
      <TestWrapper>
        <QuizProvider quizData={mockQuizData} slug="test-quiz" quizType="mcq">
          <TestComponent />
        </QuizProvider>
      </TestWrapper>,
    )

    // Complete the quiz as authenticated user
    fireEvent.click(screen.getByTestId("complete-quiz"))

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId("is-completed").textContent).toBe("true")
      expect(screen.getByTestId("requires-auth").textContent).toBe("false")
      expect(screen.getByTestId("is-authenticated").textContent).toBe("true")
    })

    // Verify that submitQuizResult was called directly without auth prompt
    await waitFor(() => {
      expect(submitQuizResultMock).toHaveBeenCalled()
    })
  })

  test("handles returning from authentication", async () => {
    // Mock URL parameters for returning from auth
    mockLocation.search = "?fromAuth=true"

    // Mock authenticated user
    mockIsAuthenticated.mockReturnValue(true)

    // Mock localStorage with pending data
    localStorage.setItem(
      "pendingQuizData",
      JSON.stringify({
        quizId: "123",
        slug: "test-quiz",
        type: "mcq",
        answers: [],
        score: 0,
      }),
    )

    render(
      <TestWrapper>
        <QuizProvider quizData={mockQuizData} slug="test-quiz" quizType="mcq">
          <TestComponent />
        </QuizProvider>
      </TestWrapper>,
    )

    // Verify that localStorage was accessed and cleared
    await waitFor(() => {
      expect(localStorage.getItem("pendingQuizData")).toBeNull()
    })
  })

  test("saves guest result for unauthenticated users", async () => {
    // Mock unauthenticated user
    mockIsAuthenticated.mockReturnValue(false)

    render(
      <TestWrapper>
        <QuizProvider quizData={mockQuizData} slug="test-quiz" quizType="mcq">
          <TestComponent />
        </QuizProvider>
      </TestWrapper>,
    )

    // Complete the quiz as guest
    fireEvent.click(screen.getByTestId("complete-quiz"))

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId("is-completed").textContent).toBe("true")
    })

    // Verify that guest result was saved to localStorage
    await waitFor(() => {
      expect(localStorage.getItem(`guest_quiz_123`)).not.toBeNull()
    })
  })

  test("requires auth for MCQ quiz type with guest user", async () => {
    // Mock unauthenticated user
    mockIsAuthenticated.mockReturnValue(false)

    // Mock guest result
    localStorage.setItem(
      `guest_quiz_123`,
      JSON.stringify({
        quizId: "123",
        score: 80,
        answers: [{ answer: "test", timeSpent: 10, isCorrect: true }],
      }),
    )

    render(
      <TestWrapper>
        <QuizProvider quizData={mockQuizData} slug="test-quiz" quizType={QuizType.MCQ}>
          <TestComponent />
        </QuizProvider>
      </TestWrapper>,
    )

    // Complete the quiz as guest
    fireEvent.click(screen.getByTestId("complete-quiz"))

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId("is-completed").textContent).toBe("true")
      expect(screen.getByTestId("requires-auth").textContent).toBe("true")
    })
  })
})
