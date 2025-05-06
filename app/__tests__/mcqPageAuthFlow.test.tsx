"use client"

import type React from "react"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { SessionProvider } from "next-auth/react"
import McqQuizWrapper from "../dashboard/(quiz)/mcq/components/McqQuizWrapper"
import quizReducer from "@/store/slices/quizSlice"
import authReducer from "@/store/slices/authSlice"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
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
jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
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
        <div data-testid="option-paris" onClick={() => onAnswer("Paris", 10, true)}>
          Paris
        </div>
        <div data-testid="option-london" onClick={() => onAnswer("London", 10, false)}>
          London
        </div>
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
    </div>
  ),
}))

jest.mock("../dashboard/(quiz)/components/NonAuthenticatedUserSignInPrompt", () => ({
  __esModule: true,
  default: ({ onContinueAsNonAuthenticatedUser, onSignIn }: any) => (
    <div data-testid="guest-sign-in-prompt">
      <button data-testid="continue-as-guest" onClick={onContinueAsNonAuthenticatedUser}>
        Continue as Guest
      </button>
      <button data-testid="sign-in" onClick={onSignIn}>
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

// Mock the QuizContext
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
        hasNonAuthenticatedUserResult: false,
        nonAuthenticatedUserResultsSaved: false,
        error: null,
        animationState: "idle",
        pendingAuthRequired: false,
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
      initializeQuiz: jest.fn(),
      restoreFromSavedState: jest.fn(),
    })),
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

// Initial state to prevent undefined errors
const initialState = {
  quiz: {
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
    hasNonAuthenticatedUserResult: false,
    nonAuthenticatedUserResultsSaved: false,
    authCheckComplete: true,
    isProcessingAuth: false,
    error: null,
    animationState: "idle",
    isSavingResults: false,
    resultsSaved: false,
    completedAt: null,
    savedState: null,
    startTime: Date.now(),
  },
  auth: {
    isAuthenticated: false,
    isProcessingAuth: false,
    redirectUrl: null,
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

// Mock window.history.replaceState
const mockReplaceState = jest.fn()
Object.defineProperty(window, "history", {
  writable: true,
  value: {
    ...window.history,
    replaceState: mockReplaceState,
  },
})

describe("MCQ Quiz Auth Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset URL
    Object.defineProperty(window, "location", {
      value: { search: "", href: "https://example.com/test" },
      writable: true,
    })

    // Reset session mock
    require("next-auth/react").useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    })

    // Reset useQuiz mock
    require("../context/QuizContext").useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 0,
        answers: [],
        timeSpent: [],
        isCompleted: false,
        score: 0,
        requiresAuth: false,
        pendingAuthRequired: false,
        hasNonAuthenticatedUserResult: false,
        nonAuthenticatedUserResultsSaved: false,
        error: null,
        animationState: "idle",
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
      initializeQuiz: jest.fn(),
      restoreFromSavedState: jest.fn(),
    })

    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.clear()
    }
  })

  test("shows auth prompt when quiz requires authentication", () => {
    // Update useQuiz mock for this test
    require("../context/QuizContext").useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 0,
        answers: [],
        timeSpent: [],
        isCompleted: true,
        score: 0,
        requiresAuth: true,
        pendingAuthRequired: false,
        hasNonAuthenticatedUserResult: true,
        nonAuthenticatedUserResultsSaved: false,
        error: null,
        animationState: "completed",
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
      initializeQuiz: jest.fn(),
      restoreFromSavedState: jest.fn(),
    })

    // Render with preloaded state
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
      />,
      {
        preloadedState: {
          quiz: {
            isCompleted: true,
            requiresAuth: true,
            hasNonAuthenticatedUserResult: true,
          },
          auth: {
            isAuthenticated: false,
          },
        },
      },
    )

    // Check that auth prompt is shown
    expect(screen.getByTestId("guest-sign-in-prompt")).toBeInTheDocument()
  })

  test("shows 'Submit Quiz' on last question", () => {
    // Update useQuiz mock for this test
    require("../context/QuizContext").useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 1, // Last question
        answers: [{ questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" }],
        timeSpent: [10],
        isCompleted: false,
        score: 0,
        requiresAuth: false,
        pendingAuthRequired: false,
        hasNonAuthenticatedUserResult: false,
        nonAuthenticatedUserResultsSaved: false,
        error: null,
        animationState: "idle",
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
      initializeQuiz: jest.fn(),
      restoreFromSavedState: jest.fn(),
    })

    // Render with current question index set to the last question
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
        currentQuestionIndex={1}
      />,
      {
        preloadedState: {
          quiz: {
            currentQuestionIndex: 1,
          },
        },
      },
    )

    // Check if the button says "Submit Quiz" instead of "Next"
    expect(screen.getByTestId("submit-button")).toBeInTheDocument()
    expect(screen.queryByTestId("next-button")).not.toBeInTheDocument()
  })

  test("handles error states correctly", () => {
    // Render with error prop
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
        error={{ message: "Test error" }}
      />,
    )

    // Check that error message is shown
    expect(screen.getByText("Error Loading Quiz")).toBeInTheDocument()
  })

  test("shows results when quiz is completed and auth is not required", async () => {
    // Mock authenticated session
    require("next-auth/react").useSession.mockReturnValue({
      data: { user: { id: "user-123", name: "Test User" } },
      status: "authenticated",
    })

    // Update useQuiz mock for this test
    require("../context/QuizContext").useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 1,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "4" },
        ],
        timeSpent: [10, 5],
        isCompleted: true,
        score: 100,
        requiresAuth: false,
        pendingAuthRequired: false,
        hasNonAuthenticatedUserResult: false,
        nonAuthenticatedUserResultsSaved: false,
        error: null,
        animationState: "completed",
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
      initializeQuiz: jest.fn(),
      restoreFromSavedState: jest.fn(),
    })

    // Render with completed quiz
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
          quiz: {
            isCompleted: true,
            score: 100,
          },
          auth: {
            isAuthenticated: true,
          },
        },
      },
    )

    // Check that results are shown
    expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
  })

  test("handles authentication flow when returning from sign-in", async () => {
    // Setup - mock URL with fromAuth=true
    const mockSearchParams = new URLSearchParams()
    mockSearchParams.set("fromAuth", "true")
    require("next/navigation").useSearchParams.mockReturnValue(mockSearchParams)

    // Mock authenticated session
    require("next-auth/react").useSession.mockReturnValue({
      data: { user: { id: "user-123", name: "Test User" } },
      status: "authenticated",
    })

    // Update useQuiz mock for this test
    require("../context/QuizContext").useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 1,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "4" },
        ],
        timeSpent: [10, 5],
        isCompleted: true,
        score: 100,
        requiresAuth: false,
        pendingAuthRequired: true,
        hasNonAuthenticatedUserResult: false,
        nonAuthenticatedUserResultsSaved: false,
        error: null,
        animationState: "completed",
        savedState: {
          quizId: "test-quiz-id",
          slug: "test-quiz",
          isCompleted: true,
          score: 100,
          answers: [
            { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
            { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "4" },
          ],
          completedAt: new Date().toISOString(),
        },
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
      initializeQuiz: jest.fn(),
      restoreFromSavedState: jest.fn(),
    })

    // Render with pending auth required and saved state
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
      />,
      {
        preloadedState: {
          quiz: {
            isCompleted: true,
            pendingAuthRequired: true,
            savedState: {
              quizId: mockQuizData.id,
              slug: mockQuizData.slug,
              isCompleted: true,
              score: 100,
              answers: [
                { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
                { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "4" },
              ],
              completedAt: new Date().toISOString(),
            },
          },
          auth: {
            isAuthenticated: true,
          },
        },
      },
    )

    // Should show quiz results
    await waitFor(() => {
      expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
    })
  })

  test("authenticated user sees results immediately", async () => {
    // Mock authenticated session
    require("next-auth/react").useSession.mockReturnValue({
      data: { user: { id: "user-123", name: "Test User" } },
      status: "authenticated",
    })

    // Update useQuiz mock for this test
    require("../context/QuizContext").useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 1,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "4" },
        ],
        timeSpent: [10, 5],
        isCompleted: true,
        score: 90,
        requiresAuth: false,
        pendingAuthRequired: false,
        hasNonAuthenticatedUserResult: false,
        nonAuthenticatedUserResultsSaved: false,
        error: null,
        animationState: "completed",
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
      initializeQuiz: jest.fn(),
      restoreFromSavedState: jest.fn(),
    })

    // Render with completed quiz
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
      />,
      {
        preloadedState: {
          quiz: {
            isCompleted: true,
            score: 90,
            answers: [
              { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "Paris" },
              { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "4" },
            ],
          },
          auth: {
            isAuthenticated: true,
          },
        },
      },
    )

    // Should show quiz results immediately
    expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
    expect(screen.getByTestId("quiz-score")).toHaveTextContent("90")
  })

  test("user can answer questions and complete quiz", async () => {
    // Mock the completeQuiz function
    const mockCompleteQuiz = jest.fn()
    require("../context/QuizContext").useQuiz.mockReturnValue({
      state: {
        quizId: "test-quiz-id",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuizData.questions,
        currentQuestionIndex: 0,
        answers: [],
        timeSpent: [],
        isCompleted: false,
        score: 0,
        requiresAuth: false,
        pendingAuthRequired: false,
        hasNonAuthenticatedUserResult: false,
        nonAuthenticatedUserResultsSaved: false,
        error: null,
        animationState: "idle",
      },
      submitAnswer: jest.fn(),
      completeQuiz: mockCompleteQuiz,
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
      initializeQuiz: jest.fn(),
      restoreFromSavedState: jest.fn(),
    })

    // Render quiz
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
      />,
    )

    // Answer first question
    fireEvent.click(screen.getByTestId("option-paris"))

    // Wait for next question
    await waitFor(() => {
      expect(screen.getByText("What is 2+2?")).toBeInTheDocument()
    })

    // Answer second question
    fireEvent.click(screen.getByTestId("option-london"))

    // Should have called completeQuiz
    await waitFor(() => {
      expect(mockCompleteQuiz).toHaveBeenCalled()
    })
  })
})
