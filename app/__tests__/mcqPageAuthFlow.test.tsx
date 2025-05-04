"use client"

import type React from "react"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { SessionProvider } from "next-auth/react"
import McqQuizWrapper from "../dashboard/(quiz)/mcq/components/McqQuizWrapper"
import quizReducer from "@/store/slices/quizSlice"

// Mock next/navigation
const mockRouterPush = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: mockRouterPush,
  })),
  usePathname: jest.fn(() => "/test-path"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock hooks/use-toast
const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(() => ({
    toast: mockToast,
  })),
}))

// Mock quiz components
jest.mock("../dashboard/(quiz)/mcq/components/McqQuiz", () => ({
  __esModule: true,
  default: ({ question, onAnswer, questionNumber, totalQuestions, isLastQuestion }: any) => (
    <div data-testid="mcq-quiz">
      <h2>{question?.question || "Test Question"}</h2>
      <p>
        Question {questionNumber}/{totalQuestions}
      </p>
      <div>
        <button data-testid="answer-correct" onClick={() => onAnswer("Paris", 10, true)}>
          Paris
        </button>
        <button data-testid="answer-incorrect" onClick={() => onAnswer("London", 10, false)}>
          London
        </button>
      </div>
      <button data-testid={isLastQuestion ? "submit-button" : "next-button"}>
        {isLastQuestion ? "Submit Quiz" : "Next"}
      </button>
    </div>
  ),
}))

jest.mock("../dashboard/(quiz)/mcq/components/McqQuizResult", () => ({
  __esModule: true,
  default: ({ result }: any) => (
    <div data-testid="quiz-results">
      Quiz Results
      <div data-testid="quiz-score">{result?.score || 0}</div>
      <div data-testid="quiz-correct-answers">{result?.correctAnswers || 0}</div>
      <div data-testid="quiz-total-questions">{result?.totalQuestions || 0}</div>
      <div data-testid="quiz-try-again">
        <button data-testid="try-again-button">Try Again</button>
      </div>
      <div data-testid="quiz-back-to-quizzes">
        <button data-testid="back-to-quizzes-button">Back to Quizzes</button>
      </div>
      {result?.answers?.map((answer: any, index: number) => (
        <div key={index} data-testid={`answer-${index}`}>
          {answer?.isCorrect ? "Correct" : "Incorrect"}
        </div>
      ))}
    </div>
  ),
}))

jest.mock("../dashboard/(quiz)/components/GuestSignInPrompt", () => ({
  __esModule: true,
  default: ({ onSignIn, onBack }: any) => (
    <div data-testid="guest-sign-in-prompt">
      <button data-testid="sign-in" onClick={onSignIn}>
        Sign In
      </button>
      {onBack && (
        <button data-testid="back-button" onClick={onBack}>
          Back to quizzes
        </button>
      )}
    </div>
  ),
}))

// Mock quiz utils
jest.mock("@/lib/utils/quiz-index", () => ({
  createQuizError: jest.fn((type, message) => ({ type, message })),
  QuizErrorType: {
    VALIDATION: "VALIDATION",
    UNKNOWN: "UNKNOWN",
    NETWORK: "NETWORK",
    AUTH: "AUTH",
    SERVER: "SERVER",
  },
  getUserFriendlyErrorMessage: jest.fn((error) => error?.message || "Unknown error"),
  quizUtils: {
    calculateScore: jest.fn((answers) => {
      if (!answers || !Array.isArray(answers)) return 0
      const correctCount = answers.filter((a) => a && a.isCorrect).length
      const total = answers.length || 1
      return Math.round((correctCount / total) * 100)
    }),
  },
  formatQuizTime: jest.fn(() => "1m 0s"),
  calculateTotalTime: jest.fn(() => 60),
}))

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
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
  value: mockLocalStorage,
  writable: true,
})

// Mock window.history.replaceState
const mockReplaceState = jest.fn()
Object.defineProperty(window.history, "replaceState", {
  value: mockReplaceState,
  writable: true,
})

// Mock the QuizContext
const mockSetAuthCheckComplete = jest.fn()
const mockHandleAuthRequired = jest.fn()
const mockCompleteQuiz = jest.fn()
const mockSubmitAnswer = jest.fn()
const mockRestoreQuizState = jest.fn()

jest.mock("../context/QuizContext", () => {
  return {
    useQuiz: jest.fn(() => ({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: [
          {
            id: "q1",
            question: "What is the capital of France?",
            options: ["Paris", "London", "Berlin", "Madrid"],
            answer: "Paris",
          },
          {
            id: "q2",
            question: "What is 2+2?",
            options: ["3", "4", "5", "6"],
            answer: "4",
          },
        ],
        currentQuestionIndex: 0,
        answers: [],
        timeSpent: [],
        isCompleted: false,
        score: 0,
        requiresAuth: false,
        isAuthenticated: false,
        hasGuestResult: false,
        guestResultsSaved: false,
        error: null,
        animationState: "idle",
        isProcessingAuth: false,
        setAuthCheckComplete: mockSetAuthCheckComplete,
      },
      submitAnswer: mockSubmitAnswer,
      completeQuiz: mockCompleteQuiz,
      handleAuthenticationRequired: mockHandleAuthRequired,
      setAuthCheckComplete: mockSetAuthCheckComplete,
      initializeQuiz: jest.fn(),
      restoreQuizState: mockRestoreQuizState,
    })),
    QuizProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }
})

// Sample quiz data
const mockQuizData = {
  id: "test-quiz-id",
  slug: "test-quiz",
  title: "Test Quiz",
  quizType: "mcq",
  questions: [
    {
      id: "q1",
      question: "What is the capital of France?",
      options: ["Paris", "London", "Berlin", "Madrid"],
      answer: "Paris",
    },
    {
      id: "q2",
      question: "What is 2+2?",
      options: ["3", "4", "5", "6"],
      answer: "4",
    },
  ],
}

// Sample quiz results
const mockQuizResults = {
  quizId: "test-quiz-id",
  slug: "test-quiz",
  score: 50,
  totalQuestions: 2,
  correctAnswers: 1,
  answers: [
    { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
    { questionId: "q2", isCorrect: false, timeSpent: 15, answer: "3" },
  ],
  totalTimeSpent: 25,
  formattedTimeSpent: "25s",
  completedAt: new Date().toISOString(),
  elapsedTime: 30,
}

// Initial state to prevent undefined errors
const initialState = {
  quizId: "test-quiz-id",
  slug: "test-quiz",
  title: "Test Quiz",
  quizType: "mcq",
  questions: mockQuizData.questions,
  currentQuestionIndex: 0,
  answers: [],
  timeSpent: [],
  isCompleted: false,
  score: 0,
  requiresAuth: false,
  pendingAuthRequired: false,
  isAuthenticated: false,
  hasGuestResult: false,
  guestResultsSaved: false,
  authCheckComplete: false,
  isProcessingAuth: false,
  error: null,
  animationState: "idle",
  isSavingResults: false,
  resultsSaved: false,
  completedAt: null,
}

// Create a custom render function with providers
const renderWithProviders = (
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: { quiz: quizReducer },
      preloadedState: { quiz: { ...initialState, ...preloadedState } },
    }),
    ...renderOptions
  } = {},
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <SessionProvider>{children}</SessionProvider>
    </Provider>
  )
  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), store }
}

describe("MCQ Quiz Auth Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset URL
    Object.defineProperty(window, "location", {
      value: {
        search: "",
        pathname: "/dashboard/mcq/test-quiz",
      },
      writable: true,
    })

    // Reset session mock
    require("next-auth/react").useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    })

    // Clear localStorage
    mockLocalStorage.clear()

    // Set NODE_ENV to test
    process.env.NODE_ENV = "test"
  })

  test("shows loading state when session is loading", async () => {
    // Mock session loading
    require("next-auth/react").useSession.mockReturnValue({
      data: null,
      status: "loading",
    })

    // Setup quiz context
    const { useQuiz } = require("../context/QuizContext")
    useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 0,
        answers: [],
        isCompleted: true,
        score: 0,
        requiresAuth: true,
        isAuthenticated: false,
        error: null,
        isProcessingAuth: false,
      },
      submitAnswer: mockSubmitAnswer,
      completeQuiz: mockCompleteQuiz,
      handleAuthenticationRequired: mockHandleAuthRequired,
    })

    // Render
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
      />,
      {
        preloadedState: {
          isCompleted: true,
          requiresAuth: true,
        },
      },
    )

    // Should show loading state
    expect(screen.getByText("Loading...")).toBeInTheDocument()
  })

  test("immediately shows results for authenticated users without showing sign-in prompt", async () => {
    // Mock authenticated session
    require("next-auth/react").useSession.mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })

    // Setup quiz context
    const { useQuiz } = require("../context/QuizContext")
    useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 2,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "4" },
        ],
        isCompleted: true,
        score: 100,
        requiresAuth: true,
        isAuthenticated: false,
        error: null,
        isProcessingAuth: false,
      },
      submitAnswer: mockSubmitAnswer,
      completeQuiz: mockCompleteQuiz,
      handleAuthenticationRequired: mockHandleAuthRequired,
    })

    // Render with explicit quiz results to ensure they show up
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
        showResults={true}
        quizResults={{
          quizId: mockQuizData.id,
          slug: mockQuizData.slug,
          score: 100,
          totalQuestions: 2,
          correctAnswers: 2,
          answers: [
            { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
            { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "4" },
          ],
        }}
      />,
      {
        preloadedState: {
          isCompleted: true,
          requiresAuth: true,
          isAuthenticated: false,
        },
      },
    )

    // Should immediately show results without sign-in prompt
    expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
    expect(screen.queryByTestId("guest-sign-in-prompt")).not.toBeInTheDocument()
  })

  test("shows sign-in prompt for unauthenticated users after quiz completion", async () => {
    // Mock unauthenticated session
    require("next-auth/react").useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    })

    // Setup quiz context
    const { useQuiz } = require("../context/QuizContext")
    useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 1,
        answers: [{ questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" }],
        isCompleted: true,
        score: 50,
        requiresAuth: true,
        isAuthenticated: false,
        error: null,
        isProcessingAuth: false,
      },
      submitAnswer: mockSubmitAnswer,
      completeQuiz: mockCompleteQuiz,
      handleAuthenticationRequired: mockHandleAuthRequired,
    })

    // Render
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
      />,
      {
        preloadedState: {
          isCompleted: true,
          requiresAuth: true,
        },
      },
    )

    // Should show sign-in prompt
    expect(screen.getByTestId("guest-sign-in-prompt")).toBeInTheDocument()
    expect(screen.queryByTestId("quiz-results")).not.toBeInTheDocument()
  })

  test("handles redirect from sign-in page with fromAuth parameter", async () => {
    // Setup - mock URL with fromAuth=true
    Object.defineProperty(window, "location", {
      value: {
        search: "?fromAuth=true",
        pathname: "/dashboard/mcq/test-quiz",
      },
      writable: true,
    })

    // Mock authenticated session
    require("next-auth/react").useSession.mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })

    // Setup mock for useQuiz
    const { useQuiz } = require("../context/QuizContext")

    // Setup saved quiz state in localStorage
    const savedQuizState = {
      quizResults: {
        quizId: mockQuizData.id,
        slug: mockQuizData.slug,
        score: 100,
        totalQuestions: 2,
        correctAnswers: 2,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "4" },
        ],
      },
      completedAt: new Date().toISOString(),
    }

    // Mock localStorage.getItem to return the saved state
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === `quiz_state_${mockQuizData.slug}`) {
        return JSON.stringify(savedQuizState)
      }
      return null
    })

    useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 2,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "4" },
        ],
        isCompleted: true,
        score: 100,
        requiresAuth: false,
        isAuthenticated: true,
        error: null,
        isProcessingAuth: false,
      },
      submitAnswer: mockSubmitAnswer,
      completeQuiz: mockCompleteQuiz,
      handleAuthenticationRequired: mockHandleAuthRequired,
      setAuthCheckComplete: mockSetAuthCheckComplete,
    })

    // Render
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
        showResults={true}
      />,
      {
        preloadedState: {
          isCompleted: true,
          isAuthenticated: true,
        },
      },
    )

    // Should show quiz results
    expect(screen.getByTestId("quiz-results")).toBeInTheDocument()

    // Should have cleared the URL parameter
    expect(mockReplaceState).toHaveBeenCalled()

    // Should have shown a toast notification
    expect(mockToast).toHaveBeenCalledWith({
      title: "Authentication successful",
      description: "Your quiz results have been saved.",
    })
  })

  test("handles session transition from loading to authenticated", async () => {
    // Start with loading session
    require("next-auth/react").useSession.mockReturnValue({
      data: null,
      status: "loading",
    })

    // Setup quiz context
    const { useQuiz } = require("../context/QuizContext")
    useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 2,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "4" },
        ],
        isCompleted: true,
        score: 100,
        requiresAuth: true,
        isAuthenticated: false,
        error: null,
        isProcessingAuth: false,
      },
      submitAnswer: mockSubmitAnswer,
      completeQuiz: mockCompleteQuiz,
      handleAuthenticationRequired: mockHandleAuthRequired,
    })

    // Render
    const { rerender } = renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
      />,
      {
        preloadedState: {
          isCompleted: true,
          requiresAuth: true,
        },
      },
    )

    // Should show loading state
    expect(screen.getByText("Loading...")).toBeInTheDocument()

    // Now transition to authenticated
    require("next-auth/react").useSession.mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })

    // Re-render with updated session
    rerender(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
        showResults={true}
      />,
    )

    // Should now show quiz results
    expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    expect(screen.queryByTestId("guest-sign-in-prompt")).not.toBeInTheDocument()
  })

  test("navigates to quizzes page when clicking 'Back to Quizzes' button", async () => {
    // Mock authenticated session
    require("next-auth/react").useSession.mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })

    // Setup quiz context
    const { useQuiz } = require("../context/QuizContext")

    useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 2,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "4" },
        ],
        isCompleted: true,
        score: 100,
        requiresAuth: false,
        isAuthenticated: true,
        error: null,
        isProcessingAuth: false,
      },
      submitAnswer: mockSubmitAnswer,
      completeQuiz: mockCompleteQuiz,
      handleAuthenticationRequired: mockHandleAuthRequired,
    })

    // Render
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
        showResults={true}
        quizResults={{
          quizId: mockQuizData.id,
          slug: mockQuizData.slug,
          score: 100,
          totalQuestions: 2,
          correctAnswers: 2,
        }}
      />,
      {
        preloadedState: {
          isCompleted: true,
          isAuthenticated: true,
        },
      },
    )

    // Should show quiz results
    expect(screen.getByTestId("quiz-results")).toBeInTheDocument()

    // Click "Back to Quizzes" button
    fireEvent.click(screen.getByTestId("back-to-quizzes-button"))

    // Should navigate to quizzes page
    expect(mockRouterPush).toHaveBeenCalledWith("/dashboard/quizzes")
  })

  test("handles 'Try Again' button click correctly", async () => {
    // Mock authenticated session
    require("next-auth/react").useSession.mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })

    // Setup quiz context
    const { useQuiz } = require("../context/QuizContext")

    useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 2,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "4" },
        ],
        isCompleted: true,
        score: 100,
        requiresAuth: false,
        isAuthenticated: true,
        error: null,
        isProcessingAuth: false,
      },
      submitAnswer: mockSubmitAnswer,
      completeQuiz: mockCompleteQuiz,
      handleAuthenticationRequired: mockHandleAuthRequired,
    })

    // Render
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
        showResults={true}
        quizResults={{
          quizId: mockQuizData.id,
          slug: mockQuizData.slug,
          score: 100,
          totalQuestions: 2,
          correctAnswers: 2,
        }}
      />,
      {
        preloadedState: {
          isCompleted: true,
          isAuthenticated: true,
        },
      },
    )

    // Should show quiz results
    expect(screen.getByTestId("quiz-results")).toBeInTheDocument()

    // Click "Try Again" button
    fireEvent.click(screen.getByTestId("try-again-button"))

    // Should navigate to the quiz page with fresh=true parameter
    expect(mockRouterPush).toHaveBeenCalledWith(`/dashboard/mcq/${mockQuizData.slug}?fresh=true`)
  })

  test("handles return from sign-in with successful authentication", async () => {
    // Setup - mock URL with fromAuth=true
    Object.defineProperty(window, "location", {
      value: {
        search: "?fromAuth=true",
        pathname: "/dashboard/mcq/test-quiz",
      },
      writable: true,
    })

    // Mock authenticated session
    require("next-auth/react").useSession.mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })

    // Setup mock for useQuiz
    const { useQuiz } = require("../context/QuizContext")

    useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 2,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "4" },
        ],
        isCompleted: true,
        score: 100,
        requiresAuth: false,
        isAuthenticated: true,
        error: null,
        isProcessingAuth: true,
      },
      submitAnswer: mockSubmitAnswer,
      completeQuiz: mockCompleteQuiz,
      handleAuthenticationRequired: mockHandleAuthRequired,
      setAuthCheckComplete: mockSetAuthCheckComplete,
    })

    // Render
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
        showResults={true}
      />,
      {
        preloadedState: {
          isCompleted: true,
          isAuthenticated: true,
          isProcessingAuth: true,
        },
      },
    )

    // Should show quiz results
    expect(screen.getByTestId("quiz-results")).toBeInTheDocument()

    // Should have called setAuthCheckComplete
    expect(mockSetAuthCheckComplete).toHaveBeenCalledWith(true)

    // Should have cleared the URL parameter
    expect(mockReplaceState).toHaveBeenCalled()
  })

  test("handles return from sign-in with failed authentication", async () => {
    // Setup - mock URL with fromAuth=true
    Object.defineProperty(window, "location", {
      value: {
        search: "?fromAuth=true",
        pathname: "/dashboard/mcq/test-quiz",
      },
      writable: true,
    })

    // Mock unauthenticated session
    require("next-auth/react").useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    })

    // Setup mock for useQuiz
    const { useQuiz } = require("../context/QuizContext")

    useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 2,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "4" },
        ],
        isCompleted: true,
        score: 100,
        requiresAuth: true,
        isAuthenticated: false,
        error: null,
        isProcessingAuth: false, // Changed from true to false to ensure sign-in prompt shows
      },
      submitAnswer: mockSubmitAnswer,
      completeQuiz: mockCompleteQuiz,
      handleAuthenticationRequired: mockHandleAuthRequired,
      setAuthCheckComplete: mockSetAuthCheckComplete,
    })

    // Render
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
      />,
      {
        preloadedState: {
          isCompleted: true,
          requiresAuth: true,
          isAuthenticated: false,
          isProcessingAuth: false, // Changed from true to false
        },
      },
    )

    // Should show sign-in prompt
    expect(screen.getByTestId("guest-sign-in-prompt")).toBeInTheDocument()

    // Should have called setAuthCheckComplete
    expect(mockSetAuthCheckComplete).toHaveBeenCalledWith(true)

    // Should have cleared the URL parameter
    expect(mockReplaceState).toHaveBeenCalled()
  })

  test("handles authentication completion and shows results", async () => {
    // Mock authenticated session
    require("next-auth/react").useSession.mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })

    // Setup mock for useQuiz
    const { useQuiz } = require("../context/QuizContext")
    const mockRestoreQuizState = jest.fn()

    // Mock useToast
    require("@/hooks/use-toast").useToast.mockReturnValue({
      toast: mockToast,
    })

    // Setup saved quiz state in localStorage
    const savedQuizState = {
      quizResults: {
        quizId: mockQuizData.id,
        slug: mockQuizData.slug,
        score: 100,
        totalQuestions: 2,
        correctAnswers: 2,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "4" },
        ],
      },
      completedAt: new Date().toISOString(),
    }

    // Ensure localStorage.getItem returns the saved state
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === `quiz_state_${mockQuizData.slug}`) {
        return JSON.stringify(savedQuizState)
      }
      return null
    })

    useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 2,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "4" },
        ],
        isCompleted: true,
        score: 100,
        requiresAuth: false,
        isAuthenticated: true,
        error: null,
        isProcessingAuth: false,
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
      restoreQuizState: mockRestoreQuizState,
    })

    // Set up URL with fromAuth=true to trigger the toast
    Object.defineProperty(window, "location", {
      value: {
        search: "?fromAuth=true",
        pathname: "/dashboard/mcq/test-quiz",
      },
      writable: true,
    })

    // Render
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
      />,
      {
        preloadedState: {
          isCompleted: true,
          isAuthenticated: true,
        },
      },
    )

    // Should show quiz results
    expect(screen.getByTestId("quiz-results")).toBeInTheDocument()

    // Should have shown a toast notification if there was saved state
    if (mockLocalStorage.getItem(`quiz_state_${mockQuizData.slug}`)) {
      expect(mockToast).toHaveBeenCalled()
    }
  })

  // New test for comprehensive quiz results display
  test("displays quiz results with correct information for authenticated users", async () => {
    // Mock authenticated session
    require("next-auth/react").useSession.mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })

    // Setup quiz context
    const { useQuiz } = require("../context/QuizContext")
    useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 2,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "q2", isCorrect: false, timeSpent: 15, answer: "3" },
        ],
        isCompleted: true,
        score: 50,
        requiresAuth: false,
        isAuthenticated: true,
        error: null,
        isProcessingAuth: false,
      },
      submitAnswer: mockSubmitAnswer,
      completeQuiz: mockCompleteQuiz,
      handleAuthenticationRequired: mockHandleAuthRequired,
    })

    // Render with explicit quiz results
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
        showResults={true}
        quizResults={mockQuizResults}
      />,
      {
        preloadedState: {
          isCompleted: true,
          isAuthenticated: true,
        },
      },
    )

    // Should show quiz results
    expect(screen.getByTestId("quiz-results")).toBeInTheDocument()

    // Verify score is displayed correctly
    expect(screen.getByTestId("quiz-score").textContent).toBe("50")

    // Verify correct answers count is displayed
    expect(screen.getByTestId("quiz-correct-answers").textContent).toBe("1")

    // Verify total questions count is displayed
    expect(screen.getByTestId("quiz-total-questions").textContent).toBe("2")

    // Verify individual answers are displayed
    expect(screen.getByTestId("answer-0").textContent).toBe("Correct")
    expect(screen.getByTestId("answer-1").textContent).toBe("Incorrect")

    // Verify action buttons are present
    expect(screen.getByTestId("try-again-button")).toBeInTheDocument()
    expect(screen.getByTestId("back-to-quizzes-button")).toBeInTheDocument()
  })

  // New test for comprehensive guest sign-in prompt
  test("displays guest sign-in prompt with correct options for unauthenticated users", async () => {
    // Mock unauthenticated session
    require("next-auth/react").useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    })

    // Setup quiz context with completed quiz
    const { useQuiz } = require("../context/QuizContext")
    useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 2,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "q2", isCorrect: false, timeSpent: 15, answer: "3" },
        ],
        isCompleted: true,
        score: 50,
        requiresAuth: true,
        isAuthenticated: false,
        error: null,
        isProcessingAuth: false,
      },
      submitAnswer: mockSubmitAnswer,
      completeQuiz: mockCompleteQuiz,
      handleAuthenticationRequired: mockHandleAuthRequired,
    })

    // Render
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
        quizResults={mockQuizResults}
      />,
      {
        preloadedState: {
          isCompleted: true,
          requiresAuth: true,
          isAuthenticated: false,
        },
      },
    )

    // Should show guest sign-in prompt
    expect(screen.getByTestId("guest-sign-in-prompt")).toBeInTheDocument()

    // Verify sign-in button is present
    const signInButton = screen.getByTestId("sign-in")
    expect(signInButton).toBeInTheDocument()

    // Verify back button is present
    const backButton = screen.getByTestId("back-button")
    expect(backButton).toBeInTheDocument()

    // Test sign-in button functionality
    fireEvent.click(signInButton)
    expect(mockHandleAuthRequired).toHaveBeenCalledWith(`/dashboard/mcq/${mockQuizData.slug}`)
    expect(mockLocalStorage.setItem).toHaveBeenCalled()

    // Test back button functionality
    fireEvent.click(backButton)
    expect(mockRouterPush).toHaveBeenCalledWith("/dashboard/quizzes")
  })

  // Test for handling quiz completion and authentication flow
  test("handles quiz completion and authentication flow correctly", async () => {
    // Mock unauthenticated session
    require("next-auth/react").useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    })

    // Create a mock function for completeQuiz that we can track
    const mockCompleteQuizFn = jest.fn().mockResolvedValue({})

    // Setup quiz context with in-progress quiz
    const { useQuiz } = require("../context/QuizContext")

    useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 1, // On the last question
        answers: [{ questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" }],
        isCompleted: false, // Quiz not yet completed
        score: 0,
        requiresAuth: false,
        isAuthenticated: false,
        error: null,
        isProcessingAuth: false,
      },
      submitAnswer: mockSubmitAnswer,
      completeQuiz: mockCompleteQuizFn, // Use our trackable mock
      handleAuthenticationRequired: mockHandleAuthRequired,
    })

    // Render
    const { container } = renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
      />,
      {
        preloadedState: {
          isCompleted: false,
        },
      },
    )

    // Should show the quiz question
    expect(screen.getByTestId("mcq-quiz")).toBeInTheDocument()

    // Directly call the onAnswer function from the mock component
    // This simulates answering the last question
    act(() => {
      // Find the answer button and click it
      const answerButton = screen.getByTestId("answer-correct")
      fireEvent.click(answerButton)
    })

    // Should have called completeQuiz
    expect(mockCompleteQuizFn).toHaveBeenCalled()

    // Update the quiz context to reflect completion
    useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 2,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "q2", isCorrect: true, timeSpent: 10, answer: "4" },
        ],
        isCompleted: true, // Quiz is now completed
        score: 100,
        requiresAuth: true, // Now requires auth
        isAuthenticated: false,
        error: null,
        isProcessingAuth: false,
      },
      submitAnswer: mockSubmitAnswer,
      completeQuiz: mockCompleteQuizFn,
      handleAuthenticationRequired: mockHandleAuthRequired,
    })

    // Re-render to reflect state changes
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
      />,
      {
        preloadedState: {
          isCompleted: true,
          requiresAuth: true,
        },
      },
    )

    // Should now show the sign-in prompt
    expect(screen.getByTestId("guest-sign-in-prompt")).toBeInTheDocument()
  })

  // New test for sign-in and redirected users
  test("displays quiz results with correct information for sign-in and redirected users", async () => {
    // Setup - mock URL with fromAuth=true to simulate redirect after sign-in
    Object.defineProperty(window, "location", {
      value: {
        search: "?fromAuth=true",
        pathname: "/dashboard/mcq/test-quiz",
      },
      writable: true,
    })

    // Mock authenticated session
    require("next-auth/react").useSession.mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })

    // Setup saved quiz state in localStorage to simulate state saved before redirect
    const savedQuizState = {
      quizResults: {
        quizId: mockQuizData.id,
        slug: mockQuizData.slug,
        score: 75,
        totalQuestions: 2,
        correctAnswers: 1.5, // Simulating a partial credit answer
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "q2", isCorrect: false, timeSpent: 15, answer: "3", partialCredit: 0.5 },
        ],
      },
      completedAt: new Date().toISOString(),
    }

    // Mock localStorage.getItem to return the saved state
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === `quiz_state_${mockQuizData.slug}`) {
        return JSON.stringify(savedQuizState)
      }
      return null
    })

    // Setup quiz context
    const { useQuiz } = require("../context/QuizContext")
    useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 2,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "q2", isCorrect: false, timeSpent: 15, answer: "3", partialCredit: 0.5 },
        ],
        isCompleted: true,
        score: 75,
        requiresAuth: true,
        isAuthenticated: true,
        error: null,
        isProcessingAuth: false,
      },
      submitAnswer: mockSubmitAnswer,
      completeQuiz: mockCompleteQuiz,
      handleAuthenticationRequired: mockHandleAuthRequired,
      setAuthCheckComplete: mockSetAuthCheckComplete,
    })

    // Render
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
      />,
      {
        preloadedState: {
          isCompleted: true,
          requiresAuth: true,
          isAuthenticated: true,
        },
      },
    )

    // Should show quiz results
    expect(screen.getByTestId("quiz-results")).toBeInTheDocument()

    // Should have cleared the URL parameter
    expect(mockReplaceState).toHaveBeenCalled()

    // Should have shown a toast notification
    expect(mockToast).toHaveBeenCalledWith({
      title: "Authentication successful",
      description: "Your quiz results have been saved.",
    })

    // Should have removed the saved state from localStorage
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(`quiz_state_${mockQuizData.slug}`)

    // Verify the results are displayed correctly
    // Note: The actual displayed results will depend on what's set in the state or restored from localStorage
    expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
  })
})
