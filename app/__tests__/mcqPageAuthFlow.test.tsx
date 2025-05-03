"use client"

import type React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { SessionProvider } from "next-auth/react"
import McqQuizWrapper from "../dashboard/(quiz)/mcq/components/McqQuizWrapper"
import quizReducer from "@/store/slices/quizSlice"

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
        <div onClick={() => onAnswer("Paris", 10, true)}>Paris</div>
        <div onClick={() => onAnswer("London", 10, false)}>London</div>
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

jest.mock("../dashboard/(quiz)/components/GuestSignInPrompt", () => ({
  __esModule: true,
  default: ({ onContinueAsGuest, onSignIn }: any) => (
    <div data-testid="guest-sign-in-prompt">
      <button data-testid="continue-as-guest" onClick={onContinueAsGuest}>
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
  const originalModule = jest.requireActual("../context/QuizContext")
  return {
    ...originalModule,
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
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
      initializeQuiz: jest.fn(),
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
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

describe("MCQ Quiz Auth Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset URL
    Object.defineProperty(window, "location", {
      value: { search: "" },
      writable: true,
    })

    // Reset session mock
    require("next-auth/react").useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    })
  })

  test("shows auth prompt when quiz requires authentication", () => {
    // Setup
    const { useQuiz } = require("../context/QuizContext")

    useQuiz.mockReturnValue({
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
        isAuthenticated: false,
        hasGuestResult: true,
        guestResultsSaved: false,
        error: null,
        animationState: "completed",
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
      initializeQuiz: jest.fn(),
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
          hasGuestResult: true,
        },
      },
    )

    // Check that auth prompt is shown
    expect(screen.getByTestId("guest-sign-in-prompt")).toBeInTheDocument()
  })

  test("shows 'Submit Quiz' on last question", () => {
    // Setup
    const { useQuiz } = require("../context/QuizContext")

    useQuiz.mockReturnValue({
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
        isAuthenticated: false,
        hasGuestResult: false,
        guestResultsSaved: false,
        error: null,
        animationState: "idle",
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
      initializeQuiz: jest.fn(),
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
          currentQuestionIndex: 1,
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
    // Setup
    const { useQuiz } = require("../context/QuizContext")

    useQuiz.mockReturnValue({
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
        isAuthenticated: true,
        hasGuestResult: false,
        guestResultsSaved: false,
        error: null,
        animationState: "completed",
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
      initializeQuiz: jest.fn(),
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
          isCompleted: true,
          isAuthenticated: true,
          score: 100,
        },
      },
    )

    // Check that results are shown
    expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
  })

  test("handles authentication flow when returning from sign-in", async () => {
    // Setup - mock URL with fromAuth=true
    Object.defineProperty(window, "location", {
      value: {
        search: "?fromAuth=true",
      },
      writable: true,
    })

    // Mock authenticated session
    require("next-auth/react").useSession.mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })

    // Mock localStorage with saved quiz state
    const savedState = {
      answers: [
        { answer: "Paris", isCorrect: true, timeSpent: 10, questionId: "q1" },
        { answer: "4", isCorrect: true, timeSpent: 5, questionId: "q2" },
      ],
      currentQuestionIndex: 1,
      quizId: mockQuizData.id,
      slug: mockQuizData.slug,
      quizResults: {
        quizId: mockQuizData.id,
        slug: mockQuizData.slug,
        score: 100,
        totalQuestions: 2,
        correctAnswers: 2,
      },
      completedAt: new Date().toISOString(),
    }

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn((key) => {
          if (key === `quiz_state_${mockQuizData.slug}`) {
            return JSON.stringify(savedState)
          }
          return null
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    })

    // Setup mock for useQuiz
    const { useQuiz } = require("../context/QuizContext")
    const mockCompleteQuiz = jest.fn()

    useQuiz.mockReturnValue({
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
        isAuthenticated: true,
        hasGuestResult: false,
        guestResultsSaved: false,
        error: null,
        animationState: "completed",
        pendingAuthRequired: true,
      },
      submitAnswer: jest.fn(),
      completeQuiz: mockCompleteQuiz,
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
      initializeQuiz: jest.fn(),
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
          pendingAuthRequired: true,
        },
      },
    )

    // Should show quiz results
    await waitFor(() => {
      expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
    })

    // Should have attempted to remove the saved state from localStorage
    expect(window.localStorage.removeItem).toHaveBeenCalledWith(`quiz_state_${mockQuizData.slug}`)
  })
})
