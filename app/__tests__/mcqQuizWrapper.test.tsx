"use client"

import React from "react"
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { SessionProvider } from "next-auth/react"
import McqQuizWrapper from "../dashboard/(quiz)/mcq/components/McqQuizWrapper"
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

// Mock McqQuiz component
jest.mock("../dashboard/(quiz)/mcq/components/McqQuiz", () => ({
  __esModule: true,
  default: ({ question, onAnswer, questionNumber, totalQuestions, isLastQuestion }: any) => {
    // For debugging - log the props in the test environment
    if (process.env.NODE_ENV === "test") {
      console.log("McqQuiz props:", {
        questionNumber,
        totalQuestions,
        isLastQuestion,
        currentQuestion: question?.question,
      })
    }

    return (
      <div data-testid="mcq-quiz">
        <h2>{question?.question || "Test MCQ Question"}</h2>
        <p>
          Question {questionNumber}/{totalQuestions}
        </p>
        <div>
          {question?.options?.map((option: string, index: number) => (
            <div key={index} data-testid={`option-${index}`}>
              {option}
            </div>
          ))}
        </div>
        <button
          data-testid="submit-answer"
          onClick={() =>
            onAnswer(question?.options?.[0] || "Option A", 10, question?.options?.[0] === question?.answer)
          }
        >
          {isLastQuestion ? "Finish Quiz" : "Next"}
        </button>
      </div>
    )
  },
}))

// Mock McqQuizResult component
jest.mock("../dashboard/(quiz)/mcq/components/McqQuizResult", () => ({
  __esModule: true,
  default: ({ result }: any) => (
    <div data-testid="quiz-results">
      MCQ Quiz Results
      <div data-testid="quiz-score">{result?.score || 0}%</div>
    </div>
  ),
}))

// Mock NonAuthenticatedUserSignInPrompt component
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

// Mock useQuiz hook with saveState function
const mockRequireAuthentication = jest.fn()
const mockRestoreState = jest.fn()
const mockSubmitAnswer = jest.fn()
const mockCompleteQuiz = jest.fn().mockImplementation(() => Promise.resolve())

jest.mock("@/hooks/useQuizState", () => ({
  useQuiz: jest.fn(() => ({
    quizState: {
      quizId: "test-mcq-quiz-id",
      slug: "test-mcq-quiz",
      title: "Test MCQ Quiz",
      quizType: "mcq",
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
    submitAnswer: mockSubmitAnswer,
    nextQuestion: jest.fn(),
    completeQuiz: mockCompleteQuiz,
    restartQuiz: jest.fn(),
    submitResults: jest.fn(),
    requireAuthentication: mockRequireAuthentication,
    restoreState: mockRestoreState,
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
const mockMcqQuizData = {
  id: "test-mcq-quiz-id",
  slug: "test-mcq-quiz",
  title: "Test MCQ Quiz",
  quizType: "mcq",
  questions: [
    {
      id: "q1",
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      answer: "4",
    },
    {
      id: "q2",
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      answer: "Paris",
    },
  ],
}

// Initial state to prevent undefined errors
const initialState = {
  quiz: {
    quizId: "test-mcq-quiz-id",
    slug: "test-mcq-quiz",
    title: "Test MCQ Quiz",
    quizType: "mcq",
    questions: mockMcqQuizData.questions,
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

// Add sessionStorage mock after the localStorage mock
const sessionStorageMock = (() => {
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

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
})

describe("McqQuizWrapper", () => {
  // Update the beforeEach function to clear sessionStorage as well
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset URL
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "location", {
        value: {
          search: "",
          pathname: "/dashboard/mcq/test-mcq-quiz",
          href: "http://localhost/dashboard/mcq/test-mcq-quiz",
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
      submitAnswer: mockSubmitAnswer,
      nextQuestion: jest.fn(),
      completeQuiz: mockCompleteQuiz,
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
    })

    // Clear localStorage and sessionStorage
    localStorage.clear()
    sessionStorage.clear()
  })

  test("initializes with loading state", async () => {
    // Skip the initialization delay by setting isInitializing to true
    jest.spyOn(React, "useState").mockImplementationOnce(() => [true, jest.fn()])

    renderWithProviders(
      <McqQuizWrapper
        quizData={mockMcqQuizData}
        slug={mockMcqQuizData.slug}
        userId="user-123"
        quizId={mockMcqQuizData.id}
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
        questions: mockMcqQuizData.questions,
      },
      authState: {
        ...initialState.auth,
      },
      isAuthenticated: false,
      initialize: jest.fn(),
      submitAnswer: mockSubmitAnswer,
      nextQuestion: jest.fn(),
      completeQuiz: mockCompleteQuiz,
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
    })

    // Skip initialization delay in test environment
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "test",
      writable: true,
    })

    renderWithProviders(
      <McqQuizWrapper
        quizData={mockMcqQuizData}
        slug={mockMcqQuizData.slug}
        userId="user-123"
        quizId={mockMcqQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Wait for initialization to complete
    await waitFor(() => {
      expect(screen.getByTestId("mcq-quiz")).toBeInTheDocument()
    })
  })

  test("shows auth prompt when quiz is completed and user is not authenticated", async () => {
    // Mock useQuiz to return completed quiz state but not authenticated
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        isCompleted: true,
        requiresAuth: true,
        questions: mockMcqQuizData.questions,
      },
      authState: {
        ...initialState.auth,
        isAuthenticated: false,
      },
      isAuthenticated: false,
      initialize: jest.fn(),
      submitAnswer: mockSubmitAnswer,
      nextQuestion: jest.fn(),
      completeQuiz: mockCompleteQuiz,
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
    })

    renderWithProviders(
      <McqQuizWrapper
        quizData={mockMcqQuizData}
        slug={mockMcqQuizData.slug}
        userId=""
        quizId={mockMcqQuizData.id}
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
        questions: mockMcqQuizData.questions,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, selectedOption: "4", correctOption: "4" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, selectedOption: "Paris", correctOption: "Paris" },
        ],
      },
      authState: {
        ...initialState.auth,
        isAuthenticated: true,
        user: { id: "user-123", name: "Test User" },
      },
      isAuthenticated: true,
      initialize: jest.fn(),
      submitAnswer: mockSubmitAnswer,
      nextQuestion: jest.fn(),
      completeQuiz: mockCompleteQuiz,
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
    })

    renderWithProviders(
      <McqQuizWrapper
        quizData={mockMcqQuizData}
        slug={mockMcqQuizData.slug}
        userId="user-123"
        quizId={mockMcqQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Wait for the results to appear
    await waitFor(() => {
      expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
      expect(screen.getByTestId("quiz-score")).toHaveTextContent("90%")
    })
  })

  // Add a new test for the enhanced sign-in flow with state persistence
  test("saves quiz state to sessionStorage before redirecting to sign in", async () => {
    // Create a local mock function that we can verify
    const localMockRequireAuth = jest.fn()

    // Mock useQuiz to return completed quiz state but not authenticated
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        isCompleted: true,
        requiresAuth: true,
        questions: mockMcqQuizData.questions,
        score: 85,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, selectedOption: "4", correctOption: "4" },
          { questionId: "q2", isCorrect: false, timeSpent: 5, selectedOption: "London", correctOption: "Paris" },
        ],
      },
      authState: {
        ...initialState.auth,
        isAuthenticated: false,
      },
      isAuthenticated: false,
      initialize: jest.fn(),
      submitAnswer: mockSubmitAnswer,
      nextQuestion: jest.fn(),
      completeQuiz: mockCompleteQuiz,
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: localMockRequireAuth,
      restoreState: mockRestoreState,
    })

    renderWithProviders(
      <McqQuizWrapper
        quizData={mockMcqQuizData}
        slug={mockMcqQuizData.slug}
        userId=""
        quizId={mockMcqQuizData.id}
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
    expect(localMockRequireAuth).toHaveBeenCalledWith(`/dashboard/mcq/${mockMcqQuizData.slug}?fromAuth=true`)

    // Check that state was saved to sessionStorage
    expect(sessionStorage.setItem).toHaveBeenCalled()
    const savedStateKey = `mcq_quiz_state_${mockMcqQuizData.slug}`
    expect(sessionStorage.setItem).toHaveBeenCalledWith(savedStateKey, expect.stringContaining('"isCompleted":true'))
  })

  // Fix the test for state restoration from sessionStorage
  test("restores quiz state from sessionStorage when returning from auth", async () => {
    // Mock URL with fromAuth=true
    const mockSearchParams = new URLSearchParams()
    mockSearchParams.set("fromAuth", "true")
    require("next/navigation").useSearchParams.mockReturnValue(mockSearchParams)

    // Mock completeQuiz to resolve immediately
    mockCompleteQuiz.mockImplementation(() => Promise.resolve())

    // Set up saved state in sessionStorage
    const savedState = {
      quizId: "test-mcq-quiz-id",
      slug: "test-mcq-quiz",
      isCompleted: true,
      score: 85,
      answers: [
        { questionId: "q1", isCorrect: true, timeSpent: 10, selectedOption: "4", correctOption: "4" },
        { questionId: "q2", isCorrect: false, timeSpent: 5, selectedOption: "London", correctOption: "Paris" },
      ],
      completedAt: new Date().toISOString(),
    }

    // Pre-populate sessionStorage before the test
    sessionStorage.setItem(`mcq_quiz_state_${mockMcqQuizData.slug}`, JSON.stringify(savedState))

    // Verify sessionStorage was set up correctly
    expect(sessionStorage.getItem(`mcq_quiz_state_${mockMcqQuizData.slug}`)).toBeTruthy()

    // Mock useQuiz to return authenticated state but without savedState in Redux
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        savedState: null, // No saved state in Redux
      },
      authState: {
        ...initialState.auth,
        isAuthenticated: true,
        user: { id: "user-123", name: "Test User" },
      },
      isAuthenticated: true,
      initialize: jest.fn(),
      submitAnswer: mockSubmitAnswer,
      nextQuestion: jest.fn(),
      completeQuiz: mockCompleteQuiz,
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
    })

    // Render the component
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockMcqQuizData}
        slug={mockMcqQuizData.slug}
        userId="user-123"
        quizId={mockMcqQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Force the effect to run
    act(() => {
      jest.runAllTimers()
    })

    // Check that sessionStorage was checked
    await waitFor(() => {
      expect(sessionStorage.getItem).toHaveBeenCalledWith(`mcq_quiz_state_${mockMcqQuizData.slug}`)
    })

    // Check that completeQuiz was called with the saved state
    await waitFor(() => {
      expect(mockCompleteQuiz).toHaveBeenCalledWith({
        answers: savedState.answers,
        score: savedState.score,
        completedAt: expect.any(String),
      })
    })

    // Check that results are shown
    await waitFor(() => {
      expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
    })
  })

  test("handles sign-in flow when user clicks sign in button", async () => {
    // Reset mockRequireAuthentication before the test
    mockRequireAuthentication.mockClear()

    // Create a local mock function that we can verify
    const localMockRequireAuth = jest.fn()

    // Mock useQuiz to return completed quiz state but not authenticated
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        isCompleted: true,
        requiresAuth: true,
        questions: mockMcqQuizData.questions,
        score: 85,
      },
      authState: {
        ...initialState.auth,
        isAuthenticated: false,
      },
      isAuthenticated: false,
      initialize: jest.fn(),
      submitAnswer: mockSubmitAnswer,
      nextQuestion: jest.fn(),
      completeQuiz: mockCompleteQuiz,
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: localMockRequireAuth,
      restoreState: mockRestoreState,
    })

    renderWithProviders(
      <McqQuizWrapper
        quizData={mockMcqQuizData}
        slug={mockMcqQuizData.slug}
        userId=""
        quizId={mockMcqQuizData.id}
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
    expect(localMockRequireAuth).toHaveBeenCalledWith(`/dashboard/mcq/${mockMcqQuizData.slug}?fromAuth=true`)
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
          quizId: "test-mcq-quiz-id",
          slug: "test-mcq-quiz",
          isCompleted: true,
          score: 85,
          answers: [
            { questionId: "q1", isCorrect: true, timeSpent: 10, selectedOption: "4", correctOption: "4" },
            { questionId: "q2", isCorrect: true, timeSpent: 5, selectedOption: "Paris", correctOption: "Paris" },
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
      submitAnswer: mockSubmitAnswer,
      nextQuestion: jest.fn(),
      completeQuiz: mockCompleteQuiz,
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
    })

    renderWithProviders(
      <McqQuizWrapper
        quizData={mockMcqQuizData}
        slug={mockMcqQuizData.slug}
        userId="user-123"
        quizId={mockMcqQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Check that restoreState was called
    await waitFor(() => {
      expect(mockRestoreState).toHaveBeenCalled()
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
      submitAnswer: mockSubmitAnswer,
      nextQuestion: jest.fn(),
      completeQuiz: mockCompleteQuiz,
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
    })

    renderWithProviders(
      <McqQuizWrapper
        quizData={mockMcqQuizData}
        slug={mockMcqQuizData.slug}
        userId="user-123"
        quizId={mockMcqQuizData.id}
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
      <McqQuizWrapper
        quizData={{ ...mockMcqQuizData, questions: [] }}
        slug={mockMcqQuizData.slug}
        userId="user-123"
        quizId={mockMcqQuizData.id}
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
      <McqQuizWrapper
        quizData={mockMcqQuizData}
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

  test("handles answer submission correctly", async () => {
    // Mock useQuiz to return loaded quiz state
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        questions: mockMcqQuizData.questions,
      },
      authState: {
        ...initialState.auth,
      },
      isAuthenticated: false,
      initialize: jest.fn(),
      submitAnswer: mockSubmitAnswer,
      nextQuestion: jest.fn(),
      completeQuiz: mockCompleteQuiz,
      restartQuiz: jest.fn(),
      submitResults: jest.fn(),
      requireAuthentication: mockRequireAuthentication,
      restoreState: mockRestoreState,
    })

    renderWithProviders(
      <McqQuizWrapper
        quizData={mockMcqQuizData}
        slug={mockMcqQuizData.slug}
        userId="user-123"
        quizId={mockMcqQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Wait for the quiz to appear
    await waitFor(() => {
      expect(screen.getByTestId("mcq-quiz")).toBeInTheDocument()
    })

    // Submit an answer
    fireEvent.click(screen.getByTestId("submit-answer"))

    // Check that submitAnswer was called
    expect(mockSubmitAnswer).toHaveBeenCalled()
  })
})
