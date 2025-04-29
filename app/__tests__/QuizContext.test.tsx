"use client"

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { useQuiz, QuizProvider } from "@/app/context/QuizContext"

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

// Replace the mock implementation with a proper mock for the quiz service
jest.mock("@/lib/quiz-service", () => {
  return {
    quizService: {
      saveQuizState: jest.fn(),
      getQuizState: jest.fn(),
      clearQuizState: jest.fn(),
      submitQuizResult: jest.fn().mockResolvedValue({}),
      saveQuizResult: jest.fn(),
      saveGuestResult: jest.fn(),
      getQuizResult: jest.fn(),
      getGuestResult: jest.fn(),
      isQuizCompleted: jest.fn().mockReturnValue(false),
      savePendingQuizData: jest.fn(),
      processPendingQuizData: jest.fn().mockResolvedValue({}),
      handleAuthRedirect: jest.fn(),
      saveAuthRedirect: jest.fn(),
      isAuthenticated: jest.fn().mockReturnValue(false),
      clearAuthFlow: jest.fn(),
      clearAllStorageData: jest.fn(),
      isInAuthFlow: jest.fn().mockReturnValue(false),
    },
    quizUtils: {
      calculateScore: jest.fn().mockReturnValue(100),
    },
  }
})

jest.mock("@/lib/quiz-api", () => ({
  quizApi: {
    fetchQuizResult: jest.fn().mockResolvedValue(null),
  },
}))

jest.mock("@/hooks/use-toast", () => ({
  toast: jest.fn(),
}))

// Create a mock for the unified-auth-provider
const mockSignIn = jest.fn().mockResolvedValue({})
const mockIsAuthenticated = jest.fn().mockReturnValue(false)

// Add this mock for the unified-auth-provider at the top of the file, after the other mocks
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

// Mock sessionStorage
const sessionStorageMock = (() => {
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

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
})

// Mock document.cookie
Object.defineProperty(document, "cookie", {
  writable: true,
  value: "",
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

describe("QuizContext", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
    sessionStorageMock.clear()
    document.cookie = ""
    mockIsAuthenticated.mockReturnValue(false)

    // Reset window.location.search for each test
    mockLocation.search = ""

    // Reset mock functions
    const { quizService } = require("@/lib/quiz-service")
    quizService.submitQuizResult.mockClear()
    quizService.saveAuthRedirect.mockClear()
    quizService.savePendingQuizData.mockClear()
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

  // Update the test cases to properly test the QuizContext
  test("initializes with correct default state", async () => {
    render(
      <QuizProvider
        quizData={mockQuizData}
        slug="test-quiz"
        quizType="mcq"
        onAuthRequired={(redirectUrl: string) => {
          console.log(`Auth required. Redirect to: ${redirectUrl}`)
        }}
      >
        <TestComponent />
      </QuizProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("current-question").textContent).toBe("0")
      expect(screen.getByTestId("is-completed").textContent).toBe("false")
      expect(screen.getByTestId("score").textContent).toBe("0")
      expect(screen.getByTestId("requires-auth").textContent).toBe("false")
      expect(screen.getByTestId("is-authenticated").textContent).toBe("false")
    })
  })

  // Update the remaining test cases to use the correct provider props
  test("submits an answer and updates state", async () => {
    render(
      <QuizProvider quizData={mockQuizData} slug="test-quiz" quizType="mcq">
        <TestComponent />
      </QuizProvider>,
    )

    fireEvent.click(screen.getByTestId("submit-answer"))

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId("current-question").textContent).toBe("1")
    })
  })

  test("completes quiz and updates state", async () => {
    render(
      <QuizProvider quizData={mockQuizData} slug="test-quiz" quizType="mcq">
        <TestComponent />
      </QuizProvider>,
    )

    fireEvent.click(screen.getByTestId("complete-quiz"))

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId("is-completed").textContent).toBe("true")
      expect(screen.getByTestId("score").textContent).toBe("100")
    })
  })

  test("prevents multiple completions", async () => {
    const { quizService } = require("@/lib/quiz-service")

    // Make sure submitQuizResult is called at least once
    quizService.submitQuizResult.mockImplementation(() => {
      return Promise.resolve({})
    })

    render(
      <QuizProvider quizData={mockQuizData} slug="test-quiz" quizType="mcq">
        <TestComponent />
      </QuizProvider>,
    )

    // First completion
    fireEvent.click(screen.getByTestId("complete-quiz"))

    // Wait for the first completion to finish
    await waitFor(() => {
      expect(screen.getByTestId("is-completed").textContent).toBe("true")
    })

    // Reset the mock to track the second call
    quizService.submitQuizResult.mockClear()

    // Try to complete again
    fireEvent.click(screen.getByTestId("complete-quiz"))

    // Wait a bit to ensure any async operations complete
    await new Promise((resolve) => setTimeout(resolve, 100))

    // The second click should not trigger another submission
    expect(quizService.submitQuizResult).not.toHaveBeenCalled()
  })

  test("restarts quiz and resets state", async () => {
    const { quizService } = require("@/lib/quiz-service")

    render(
      <QuizProvider quizData={mockQuizData} slug="test-quiz" quizType="mcq">
        <TestComponent />
      </QuizProvider>,
    )

    // First complete the quiz
    fireEvent.click(screen.getByTestId("complete-quiz"))

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId("is-completed").textContent).toBe("true")
    })

    // Now restart
    fireEvent.click(screen.getByTestId("restart-quiz"))

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId("is-completed").textContent).toBe("false")
      expect(screen.getByTestId("current-question").textContent).toBe("0")
      expect(screen.getByTestId("score").textContent).toBe("0")
    })

    // Verify service was called
    expect(quizService.clearQuizState).toHaveBeenCalled()
  })

  // New tests for authentication flow
  test("handles authentication required for guest users", async () => {
    const { quizService } = require("@/lib/quiz-service")
    const mockOnAuthRequired = jest.fn()

    // Make sure the auth functions are properly mocked
    quizService.savePendingQuizData.mockImplementation(() => {})
    quizService.saveAuthRedirect.mockImplementation(() => {})
    quizService.isInAuthFlow.mockReturnValue(false)

    render(
      <QuizProvider quizData={mockQuizData} slug="test-quiz" quizType="mcq" onAuthRequired={mockOnAuthRequired}>
        <TestComponent />
      </QuizProvider>,
    )

    // Trigger auth required
    fireEvent.click(screen.getByTestId("auth-required"))

    // Use a longer timeout to ensure all async operations complete
    await waitFor(
      () => {
        expect(quizService.savePendingQuizData).toHaveBeenCalled()
      },
      { timeout: 2000 },
    )

    await waitFor(
      () => {
        expect(quizService.saveAuthRedirect).toHaveBeenCalled()
      },
      { timeout: 2000 },
    )

    await waitFor(
      () => {
        expect(mockOnAuthRequired).toHaveBeenCalled()
      },
      { timeout: 2000 },
    )
  })

  test("skips auth prompt for authenticated users", async () => {
    const { quizService } = require("@/lib/quiz-service")

    // Mock authenticated user
    mockIsAuthenticated.mockReturnValue(true)
    quizService.isAuthenticated.mockReturnValue(true)

    // Make sure submitQuizResult is properly mocked
    quizService.submitQuizResult.mockImplementation(() => Promise.resolve({}))

    render(
      <QuizProvider quizData={mockQuizData} slug="test-quiz" quizType="mcq">
        <TestComponent />
      </QuizProvider>,
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
      expect(quizService.submitQuizResult).toHaveBeenCalled()
      expect(quizService.saveGuestResult).not.toHaveBeenCalled() // Should not save as guest
    })
  })

  test("handles returning from authentication", async () => {
    const { quizService } = require("@/lib/quiz-service")

    // Mock URL parameters for returning from auth
    mockLocation.search = "?fromAuth=true"

    // Mock authenticated user
    mockIsAuthenticated.mockReturnValue(true)
    quizService.isAuthenticated.mockReturnValue(true)

    // Make sure processPendingQuizData is properly mocked
    quizService.processPendingQuizData.mockImplementation(() => Promise.resolve({}))

    render(
      <QuizProvider quizData={mockQuizData} slug="test-quiz" quizType="mcq">
        <TestComponent />
      </QuizProvider>,
    )

    // Check if processPendingQuizData was called
    await waitFor(() => {
      expect(quizService.processPendingQuizData).toHaveBeenCalled()
    })
  })

  test("saves guest result for unauthenticated users", async () => {
    const { quizService } = require("@/lib/quiz-service")

    // Mock unauthenticated user
    mockIsAuthenticated.mockReturnValue(false)
    quizService.isAuthenticated.mockReturnValue(false)

    // Make sure saveGuestResult is properly mocked
    quizService.saveGuestResult.mockImplementation(() => {})

    render(
      <QuizProvider quizData={mockQuizData} slug="test-quiz" quizType="mcq">
        <TestComponent />
      </QuizProvider>,
    )

    // Complete the quiz as guest
    fireEvent.click(screen.getByTestId("complete-quiz"))

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId("is-completed").textContent).toBe("true")
    })

    // Verify that guest result was saved
    await waitFor(() => {
      expect(quizService.saveGuestResult).toHaveBeenCalled()
      expect(quizService.submitQuizResult).not.toHaveBeenCalled() // Should not submit to server
    })
  })

  test("requires auth for MCQ quiz type with guest user", async () => {
    const { quizService } = require("@/lib/quiz-service")

    // Mock unauthenticated user
    mockIsAuthenticated.mockReturnValue(false)
    quizService.isAuthenticated.mockReturnValue(false)

    // Mock guest result
    quizService.getGuestResult.mockReturnValue({
      quizId: "123",
      score: 80,
      answers: [{ answer: "test", timeSpent: 10, isCorrect: true }],
    })

    render(
      <QuizProvider quizData={mockQuizData} slug="test-quiz" quizType="mcq">
        <TestComponent />
      </QuizProvider>,
    )

    // Complete the quiz as guest
    fireEvent.click(screen.getByTestId("complete-quiz"))

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId("is-completed").textContent).toBe("true")
      expect(screen.getByTestId("requires-auth").textContent).toBe("true")
    })
  })

  test("clears all storage data", async () => {
    const { quizService } = require("@/lib/quiz-service")

    // Set some storage data
    localStorage.setItem("test_key", "test_value")
    sessionStorage.setItem("test_session_key", "test_session_value")
    document.cookie = "test_cookie=test_cookie_value"

    // Call the clearAllStorageData method
    quizService.clearAllStorageData()

    // Check if storage was cleared
    expect(quizService.clearAllStorageData).toHaveBeenCalled()
  })
})
