"use client"

import React from "react"

import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { SessionProvider } from "next-auth/react"
import CodeQuizWrapper from "../dashboard/(quiz)/code/components/CodeQuizWrapper"
import quizReducer from "@/store/slices/quizSlice"
import authReducer from "@/store/slices/authSlice"

// Mock next/navigation
jest.mock("next/navigation", () => {
  const mockSearchParams = new URLSearchParams()

  return {
    useRouter: jest.fn(() => ({
      push: jest.fn(),
    })),
    usePathname: jest.fn(() => "/test-path"),
    useSearchParams: jest.fn(() => mockSearchParams),
  }
})

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  signIn: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock hooks/use-toast
jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}))

// Update the CodingQuiz mock to explicitly check isLastQuestion
jest.mock("../dashboard/(quiz)/code/components/CodingQuiz", () => ({
  __esModule: true,
  default: ({ question, onAnswer, questionNumber, totalQuestions, isLastQuestion }: any) => {
    // For debugging - log the props in the test environment
    if (process.env.NODE_ENV === "test") {
      console.log("CodingQuiz props:", {
        questionNumber,
        totalQuestions,
        isLastQuestion,
        currentQuestion: question?.question,
      })
    }

    return (
      <div data-testid="coding-quiz">
        <h2>{question?.question || "Test Coding Question"}</h2>
        <p>
          Question {questionNumber}/{totalQuestions}
        </p>
        <div>
          <textarea
            data-testid="code-editor"
            defaultValue={question?.codeSnippet || "// Write your code here"}
          ></textarea>
        </div>
        <button data-testid="submit-answer" onClick={() => onAnswer("console.log('test')", 10, true)}>
          {isLastQuestion ? "Submit Quiz" : "Next"}
        </button>
      </div>
    )
  },
}))

jest.mock("../dashboard/(quiz)/code/components/CodeQuizResult", () => ({
  __esModule: true,
  default: ({ result }: any) => (
    <div data-testid="quiz-results">
      Code Quiz Results
      <div data-testid="quiz-score">{result?.score || 0}</div>
    </div>
  ),
}))

// Update the NonAuthenticatedUserSignInPrompt mock to properly call onSignIn
jest.mock("../dashboard/(quiz)/components/NonAuthenticatedUserSignInPrompt", () => ({
  __esModule: true,
  default: ({ onSignIn }: any) => (
    <div data-testid="guest-sign-in-prompt">
      <p>Sign in required</p>
      <button data-testid="sign-in" onClick={() => onSignIn && onSignIn()}>
        Sign In
      </button>
    </div>
  ),
}))

// Mock quiz utils
jest.mock("@/lib/utils/quiz-index", () => ({
  createQuizError: jest.fn((type, message) => ({ type, message })),
  QuizErrorType: {
    VALIDATION: "VALIDATION",
    UNKNOWN: "UNKNOWN",
  },
  getUserFriendlyErrorMessage: jest.fn((error) => error?.message || "Unknown error"),
  quizUtils: {
    calculateScore: jest.fn(() => 100),
  },
  formatQuizTime: jest.fn(() => "1m 0s"),
  calculateTotalTime: jest.fn(() => 60),
}))

// Mock QuizStateDisplay component
jest.mock("@/app/dashboard/components/QuizStateDisplay", () => ({
  ErrorDisplay: ({ error }: any) => <div data-testid="error-display">{error || "Unknown error"}</div>,
  LoadingDisplay: () => <div data-testid="loading-display">Loading...</div>,
  InitializingDisplay: () => <div data-testid="initializing-display">Initializing...</div>,
  QuizNotFoundDisplay: () => <div data-testid="not-found-display">Quiz not found</div>,
  EmptyQuestionsDisplay: () => <div data-testid="empty-questions-display">No questions available</div>,
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

// Mock useQuiz hook with saveState function
const mockRequireAuthentication = jest.fn()
const mockRestoreState = jest.fn()
const mockSaveState = jest.fn()

jest.mock("@/hooks/useQuizState", () => ({
  useQuiz: jest.fn(() => ({
    quizState: {
      quizId: "test-code-quiz-id",
      slug: "test-code-quiz",
      title: "Test Code Quiz",
      quizType: "code",
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
      timeSpent: [],
      isCompleted: false,
      score: 0,
      requiresAuth: false,
      pendingAuthRequired: false,
      error: null,
      animationState: "idle",
      isSavingResults: false,
      resultsSaved: false,
      completedAt: null,
      savedState: null,
    },
    authState: {
      isAuthenticated: false,
      isProcessingAuth: false,
      redirectUrl: null,
      user: null,
    },
    isAuthenticated: false,
    initialize: jest.fn(),
    submitAnswer: jest.fn(),
    nextQuestion: jest.fn(),
    completeQuiz: jest.fn(),
    restartQuiz: jest.fn(),
    submitResults: jest.fn(),
    requireAuthentication: mockRequireAuthentication,
    restoreState: mockRestoreState,
    saveState: mockSaveState,
  })),
}))

// Mock window.history.replaceState
if (typeof window !== "undefined") {
  window.history.replaceState = jest.fn()
}

// Mock process.env.NODE_ENV
Object.defineProperty(process.env, "NODE_ENV", {
  value: "test",
  writable: true,
})

// Sample quiz data
const mockCodeQuizData = {
  id: "test-code-quiz-id",
  slug: "test-code-quiz",
  title: "Test Code Quiz",
  quizType: "code",
  questions: [
    {
      id: "q1",
      question: "Write a function that adds two numbers",
      codeSnippet: "function add(a, b) {\n  // Your code here\n}",
      answer: "return a + b",
      language: "javascript",
    },
    {
      id: "q2",
      question: "Write a function that multiplies two numbers",
      codeSnippet: "function multiply(a, b) {\n  // Your code here\n}",
      answer: "return a * b",
      language: "javascript",
    },
  ],
}

// Initial state to prevent undefined errors
const initialState = {
  quiz: {
    quizId: "test-code-quiz-id",
    slug: "test-code-quiz",
    title: "Test Code Quiz",
    quizType: "code",
    questions: mockCodeQuizData.questions,
    currentQuestionIndex: 0,
    answers: [],
    timeSpent: [],
    isCompleted: false,
    score: 0,
    requiresAuth: false,
    pendingAuthRequired: false,
    authCheckComplete: true,
    error: null,
    animationState: "idle",
    isSavingResults: false,
    resultsSaved: false,
    completedAt: null,
    startTime: Date.now(),
    savedState: null,
  },
  auth: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    redirectUrl: null,
    isProcessingAuth: false,
  },
}

// Create a custom render function with providers
const renderWithProviders = (
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        quiz: quizReducer,
        auth: authReducer,
      },
      preloadedState: {
        quiz: { ...initialState.quiz, ...preloadedState.quiz },
        auth: { ...initialState.auth, ...preloadedState.auth },
      },
    }),
    ...renderOptions
  } = {},
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <SessionProvider>{children}</SessionProvider>
    </Provider>
  )
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

describe("CodeQuizWrapper", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset URL
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "location", {
        value: {
          search: "",
          pathname: "/dashboard/code/test-code-quiz",
          href: "http://localhost/dashboard/code/test-code-quiz",
        },
        writable: true,
      })
      window.history.replaceState = jest.fn()
    }

    // Reset session mock
    require("next-auth/react").useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    })

    // Reset the useSearchParams mock
    require("next/navigation").useSearchParams.mockReturnValue(new URLSearchParams())

    // Reset useQuiz mock
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
      },
      authState: {
        ...initialState.auth,
      },
      isAuthenticated: false,
      initialize: jest.fn(),
      submitAnswer: jest.fn(),
      nextQuestion: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
      saveState: mockSaveState,
    })

    // Clear localStorage
    localStorage.clear()
  })

  test("initializes with loading state", async () => {
    // Skip the initialization delay by setting isInitializing to true
    jest.spyOn(React, "useState").mockImplementationOnce(() => [true, jest.fn()])

    renderWithProviders(
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId="user-123"
        quizId={mockCodeQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    expect(screen.getByTestId("initializing-display")).toBeInTheDocument()
  })

  test("shows quiz content when data is loaded", async () => {
    // Mock useQuiz to return loaded quiz state
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        questions: mockCodeQuizData.questions,
      },
      authState: {
        ...initialState.auth,
      },
      isAuthenticated: false,
      initialize: jest.fn(),
      submitAnswer: jest.fn(),
      nextQuestion: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
      saveState: mockSaveState,
    })

    // Skip initialization delay in test environment
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "test",
      writable: true,
    })

    renderWithProviders(
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId="user-123"
        quizId={mockCodeQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Wait for initialization to complete
    await waitFor(() => {
      expect(screen.getByTestId("coding-quiz")).toBeInTheDocument()
    })
  })

  test("shows auth prompt when quiz is completed and user is not authenticated", async () => {
    // Mock useQuiz to return completed quiz state but not authenticated
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        isCompleted: true,
        requiresAuth: true,
        questions: mockCodeQuizData.questions,
      },
      authState: {
        ...initialState.auth,
        isAuthenticated: false,
      },
      isAuthenticated: false,
      initialize: jest.fn(),
      submitAnswer: jest.fn(),
      nextQuestion: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
      saveState: mockSaveState,
    })

    renderWithProviders(
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId=""
        quizId={mockCodeQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Wait for the auth prompt to appear
    await waitFor(() => {
      expect(screen.getByTestId("guest-sign-in-prompt")).toBeInTheDocument()
    })
  })

  test("shows results when quiz is completed and user is authenticated", async () => {
    // Mock useQuiz to return completed quiz state and authenticated
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        isCompleted: true,
        score: 90,
        questions: mockCodeQuizData.questions,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "return a + b" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "return a * b" },
        ],
      },
      authState: {
        ...initialState.auth,
        isAuthenticated: true,
        user: { id: "user-123", name: "Test User" },
      },
      isAuthenticated: true,
      initialize: jest.fn(),
      submitAnswer: jest.fn(),
      nextQuestion: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
      saveState: mockSaveState,
    })

    renderWithProviders(
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId="user-123"
        quizId={mockCodeQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Wait for the results to appear
    await waitFor(() => {
      expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
      expect(screen.getByTestId("quiz-score")).toHaveTextContent("90")
    })
  })

  test("handles sign-in flow when user clicks sign in button", async () => {
    // Reset mockRequireAuthentication before the test
    mockRequireAuthentication.mockClear()
    mockSaveState.mockClear()

    // Create a local mock function that we can verify
    const localMockRequireAuth = jest.fn()
    const localMockSaveState = jest.fn()

    // Mock useQuiz to return completed quiz state but not authenticated
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        isCompleted: true,
        requiresAuth: true,
        questions: mockCodeQuizData.questions,
        score: 85,
      },
      authState: {
        ...initialState.auth,
        isAuthenticated: false,
      },
      isAuthenticated: false,
      initialize: jest.fn(),
      submitAnswer: jest.fn(),
      nextQuestion: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: localMockRequireAuth,
      restoreState: mockRestoreState,
      saveState: localMockSaveState,
    })

    renderWithProviders(
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId=""
        quizId={mockCodeQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Wait for the auth prompt to appear
    await waitFor(() => {
      expect(screen.getByTestId("guest-sign-in-prompt")).toBeInTheDocument()
    })

    // Click the sign in button
    fireEvent.click(screen.getByTestId("sign-in"))

    // Check that requireAuthentication was called with the correct redirect URL
    expect(localMockRequireAuth).toHaveBeenCalledWith(`/dashboard/code/${mockCodeQuizData.slug}?fromAuth=true`)
  })

  test("restores state after authentication when returning from sign-in", async () => {
    // Mock URL with fromAuth=true
    const mockSearchParams = new URLSearchParams()
    mockSearchParams.set("fromAuth", "true")
    require("next/navigation").useSearchParams.mockReturnValue(mockSearchParams)

    // Mock restoreState function
    mockRestoreState.mockClear()

    // Mock useQuiz to return authenticated state with saved state
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        savedState: {
          quizId: "test-code-quiz-id",
          slug: "test-code-quiz",
          isCompleted: true,
          score: 85,
          answers: [
            { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "return a + b" },
            { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "return a * b" },
          ],
          completedAt: new Date().toISOString(),
        },
      },
      authState: {
        ...initialState.auth,
        isAuthenticated: true,
        user: { id: "user-123", name: "Test User" },
      },
      isAuthenticated: true,
      initialize: jest.fn(),
      submitAnswer: jest.fn(),
      nextQuestion: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
      saveState: mockSaveState,
    })

    renderWithProviders(
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId="user-123"
        quizId={mockCodeQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Check that restoreState was called
    await waitFor(() => {
      expect(mockRestoreState).toHaveBeenCalled()
    })
  })

  test("shows results after authentication when quiz was completed before sign-in", async () => {
    // Mock URL with fromAuth=true
    const mockSearchParams = new URLSearchParams()
    mockSearchParams.set("fromAuth", "true")
    require("next/navigation").useSearchParams.mockReturnValue(mockSearchParams)

    // Mock useQuiz to return authenticated state with completed quiz
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        isCompleted: true,
        score: 85,
        questions: mockCodeQuizData.questions,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "return a + b" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "return a * b" },
        ],
      },
      authState: {
        ...initialState.auth,
        isAuthenticated: true,
        user: { id: "user-123", name: "Test User" },
      },
      isAuthenticated: true,
      initialize: jest.fn(),
      submitAnswer: jest.fn(),
      nextQuestion: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
      saveState: mockSaveState,
    })

    renderWithProviders(
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId="user-123"
        quizId={mockCodeQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Wait for the results to appear
    await waitFor(() => {
      expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
      expect(screen.getByTestId("quiz-score")).toHaveTextContent("85")
    })
  })

  test("handles error states correctly", async () => {
    // Mock useQuiz to return error state
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        error: "Test error message",
      },
      authState: {
        ...initialState.auth,
      },
      isAuthenticated: false,
      initialize: jest.fn(),
      submitAnswer: jest.fn(),
      nextQuestion: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
      saveState: mockSaveState,
    })

    renderWithProviders(
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId="user-123"
        quizId={mockCodeQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Wait for the error display to appear
    await waitFor(() => {
      expect(screen.getByTestId("error-display")).toBeInTheDocument()
      expect(screen.getByTestId("error-display")).toHaveTextContent("Test error message")
    })
  })

  test("handles empty questions correctly", async () => {
    renderWithProviders(
      <CodeQuizWrapper
        quizData={{ ...mockCodeQuizData, questions: [] }}
        slug={mockCodeQuizData.slug}
        userId="user-123"
        quizId={mockCodeQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Wait for the empty questions display to appear
    await waitFor(() => {
      expect(screen.getByTestId("empty-questions-display")).toBeInTheDocument()
    })
  })

  test("handles invalid quiz ID correctly", async () => {
    renderWithProviders(
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug=""
        userId="user-123"
        quizId=""
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Wait for the not found display to appear
    await waitFor(() => {
      expect(screen.getByTestId("not-found-display")).toBeInTheDocument()
    })
  })
})

describe("Code Quiz Auth Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset URL
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "location", {
        value: {
          search: "",
          pathname: "/dashboard/code/test-code-quiz",
          href: "http://localhost/dashboard/code/test-code-quiz",
        },
        writable: true,
      })
      window.history.replaceState = jest.fn()
    }

    // Reset session mock
    require("next-auth/react").useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    })

    // Reset the useSearchParams mock
    require("next/navigation").useSearchParams.mockReturnValue(new URLSearchParams())

    // Reset useQuiz mock
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
      },
      authState: {
        ...initialState.auth,
      },
      isAuthenticated: false,
      initialize: jest.fn(),
      submitAnswer: jest.fn(),
      nextQuestion: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
      saveState: mockSaveState,
    })

    // Clear localStorage
    localStorage.clear()
  })

  test("non-signed-in user is prompted to sign in after completing quiz", async () => {
    // Mock useQuiz to return completed quiz state but not authenticated
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        isCompleted: true,
        requiresAuth: true,
        questions: mockCodeQuizData.questions,
        score: 75,
      },
      authState: {
        ...initialState.auth,
        isAuthenticated: false,
      },
      isAuthenticated: false,
      initialize: jest.fn(),
      submitAnswer: jest.fn(),
      nextQuestion: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
      saveState: mockSaveState,
    })

    renderWithProviders(
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId=""
        quizId={mockCodeQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Wait for the auth prompt to appear
    await waitFor(() => {
      expect(screen.getByTestId("guest-sign-in-prompt")).toBeInTheDocument()
    })
  })

  test("signed-in user sees results immediately after completing quiz", async () => {
    // Mock useQuiz to return completed quiz state and authenticated
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        isCompleted: true,
        score: 90,
        questions: mockCodeQuizData.questions,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "return a + b" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "return a * b" },
        ],
      },
      authState: {
        ...initialState.auth,
        isAuthenticated: true,
        user: { id: "user-123", name: "Test User" },
      },
      isAuthenticated: true,
      initialize: jest.fn(),
      submitAnswer: jest.fn(),
      nextQuestion: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
      saveState: mockSaveState,
    })

    renderWithProviders(
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId="user-123"
        quizId={mockCodeQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Wait for the results to appear
    await waitFor(() => {
      expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
      expect(screen.getByTestId("quiz-score")).toHaveTextContent("90")
    })
  })

  test("user sees results after signing in when returning from auth flow", async () => {
    // Mock URL with fromAuth=true
    const mockSearchParams = new URLSearchParams()
    mockSearchParams.set("fromAuth", "true")
    require("next/navigation").useSearchParams.mockReturnValue(mockSearchParams)

    // Mock useQuiz to return authenticated state with completed quiz
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        isCompleted: true,
        score: 85,
        questions: mockCodeQuizData.questions,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "return a + b" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "return a * b" },
        ],
        savedState: null, // State has been restored already
      },
      authState: {
        ...initialState.auth,
        isAuthenticated: true,
        user: { id: "user-123", name: "Test User" },
      },
      isAuthenticated: true,
      initialize: jest.fn(),
      submitAnswer: jest.fn(),
      nextQuestion: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
      saveState: mockSaveState,
    })

    renderWithProviders(
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId="user-123"
        quizId={mockCodeQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Wait for the results to appear
    await waitFor(() => {
      expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
      expect(screen.getByTestId("quiz-score")).toHaveTextContent("85")
    })
  })

  test("authentication flow is triggered when user clicks sign in button", async () => {
    // Create a local mock function that we can verify
    const localMockRequireAuth = jest.fn()
    const localMockSaveState = jest.fn()

    // Mock useQuiz to return completed quiz state but not authenticated
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        isCompleted: true,
        requiresAuth: true,
        questions: mockCodeQuizData.questions,
      },
      authState: {
        ...initialState.auth,
        isAuthenticated: false,
      },
      isAuthenticated: false,
      initialize: jest.fn(),
      submitAnswer: jest.fn(),
      nextQuestion: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: localMockRequireAuth,
      restoreState: mockRestoreState,
      saveState: localMockSaveState,
    })

    renderWithProviders(
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId=""
        quizId={mockCodeQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Wait for the auth prompt to appear
    await waitFor(() => {
      expect(screen.getByTestId("guest-sign-in-prompt")).toBeInTheDocument()
    })

    // Click the sign in button
    fireEvent.click(screen.getByTestId("sign-in"))

    // Check that requireAuthentication was called with the correct redirect URL
    expect(localMockRequireAuth).toHaveBeenCalledWith(`/dashboard/code/${mockCodeQuizData.slug}?fromAuth=true`)
  })

  test("complete auth flow from quiz completion to sign in to viewing results", async () => {
    // Create a local mock function that we can verify
    const localMockRequireAuth = jest.fn()
    const localMockSaveState = jest.fn()

    // Step 1: Setup initial state - quiz completed, user not authenticated
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        isCompleted: true,
        requiresAuth: true,
        questions: mockCodeQuizData.questions,
        score: 80,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "return a + b" },
          { questionId: "q2", isCorrect: false, timeSpent: 5, answer: "return a - b" },
        ],
      },
      authState: {
        ...initialState.auth,
        isAuthenticated: false,
      },
      isAuthenticated: false,
      initialize: jest.fn(),
      submitAnswer: jest.fn(),
      nextQuestion: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: localMockRequireAuth,
      restoreState: mockRestoreState,
      saveState: localMockSaveState,
    })

    const { unmount } = renderWithProviders(
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId=""
        quizId={mockCodeQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Verify auth prompt is shown
    await waitFor(() => {
      expect(screen.getByTestId("guest-sign-in-prompt")).toBeInTheDocument()
    })

    // Step 2: Simulate user clicking sign in
    fireEvent.click(screen.getByTestId("sign-in"))
    expect(localMockRequireAuth).toHaveBeenCalledWith(`/dashboard/code/${mockCodeQuizData.slug}?fromAuth=true`)

    // Clean up the first render
    unmount()

    // Step 3: Simulate returning from auth flow
    // Update URL params
    const mockSearchParams = new URLSearchParams()
    mockSearchParams.set("fromAuth", "true")
    require("next/navigation").useSearchParams.mockReturnValue(mockSearchParams)

    // Update useQuiz mock to simulate authenticated state
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        isCompleted: true,
        score: 80,
        questions: mockCodeQuizData.questions,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "return a + b" },
          { questionId: "q2", isCorrect: false, timeSpent: 5, answer: "return a - b" },
        ],
      },
      authState: {
        ...initialState.auth,
        isAuthenticated: true,
        user: { id: "user-123", name: "Test User" },
      },
      isAuthenticated: true,
      initialize: jest.fn(),
      submitAnswer: jest.fn(),
      nextQuestion: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: localMockRequireAuth,
      restoreState: mockRestoreState,
      saveState: localMockSaveState,
    })

    // Re-render with updated state
    renderWithProviders(
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId="user-123"
        quizId={mockCodeQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Verify results are shown
    await waitFor(() => {
      expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
      expect(screen.getByTestId("quiz-score")).toHaveTextContent("80")
    })
  })
})
