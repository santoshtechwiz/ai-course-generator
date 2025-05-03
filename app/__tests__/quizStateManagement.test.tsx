"use client"

import type React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { SessionProvider } from "next-auth/react"
import { useRouter } from "next/navigation"
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
      <button>{isLastQuestion ? "Submit Quiz" : "Next"}</button>
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
        questions: mockQuizData.questions,
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

describe("Quiz State Management", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()

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

  test("saves quiz state to localStorage before redirecting to sign-in", async () => {
    // Setup
    const mockHandleAuthRequired = jest.fn()
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
      handleAuthenticationRequired: mockHandleAuthRequired,
      setAuthCheckComplete: jest.fn(),
      initializeQuiz: jest.fn(),
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
          isCompleted: true,
          requiresAuth: true,
          isAuthenticated: false,
          hasGuestResult: true,
        },
      },
    )

    // Guest sign-in prompt should appear
    expect(screen.getByTestId("guest-sign-in-prompt")).toBeInTheDocument()

    // Click sign in
    fireEvent.click(screen.getByTestId("sign-in"))

    // Check localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalled()

    // Auth required handler should be called
    expect(mockHandleAuthRequired).toHaveBeenCalled()
  })

  test("restores quiz state from localStorage when returning from sign-in", async () => {
    // Setup - mock URL with fromAuth=true
    Object.defineProperty(window, "location", {
      value: {
        search: "?fromAuth=true",
      },
      writable: true,
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

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === `quiz_state_${mockQuizData.slug}`) {
        return JSON.stringify(savedState)
      }
      return null
    })

    // Mock session as authenticated
    require("next-auth/react").useSession.mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })

    // Mock the completeQuiz function
    const mockCompleteQuiz = jest.fn()
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
        isCompleted: false,
        score: 0,
        requiresAuth: false,
        isAuthenticated: true,
        hasGuestResult: false,
        guestResultsSaved: false,
        error: null,
        animationState: "idle",
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
          isAuthenticated: true,
        },
      },
    )

    // Wait for state restoration
    await waitFor(() => {
      expect(localStorageMock.getItem).toHaveBeenCalledWith(`quiz_state_${mockQuizData.slug}`)
    })

    // Should have removed the saved state from localStorage
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(`quiz_state_${mockQuizData.slug}`)
  })

  test("handles error states correctly", async () => {
    // Mock useRouter
    ;(useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      replace: jest.fn(),
    })

    // Render with error prop
    renderWithProviders(
      <McqQuizWrapper
        quizData={mockQuizData}
        questions={mockQuizData.questions}
        quizId={mockQuizData.id}
        slug={mockQuizData.slug}
        error={{ message: "Test error", type: "UNKNOWN" }}
      />,
    )

    // Should show error message
    expect(screen.getByText("Error Loading Quiz")).toBeInTheDocument()

    // Should have a return button
    const returnButton = screen.getByText("Return to Quiz List")
    expect(returnButton).toBeInTheDocument()

    // Click return button
    fireEvent.click(returnButton)

    // Router should be called
    expect(useRouter().push).toHaveBeenCalledWith("/dashboard/mcq")
  })

  // test("continues as guest when selected", async () => {
  //   // Setup
  //   const { useQuiz } = require("../context/QuizContext")

  //   useQuiz.mockReturnValue({
  //     state: {
  //       quizId: "test-quiz-id",
  //       slug: "test-quiz",
  //       quizType: "mcq",
  //       questions: mockQuizData.questions,
  //       currentQuestionIndex: 0,
  //       answers: [],
  //       timeSpent: [],
  //       isCompleted: true,
  //       score: 0,
  //       requiresAuth: true,
  //       isAuthenticated: false,
  //       hasGuestResult: true,
  //       guestResultsSaved: false,
  //       error: null,
  //       animationState: "completed",
  //     },
  //     submitAnswer: jest.fn(),
  //     completeQuiz: jest.fn(),
  //     handleAuthenticationRequired: jest.fn(),
  //     setAuthCheckComplete: jest.fn(),
  //     initializeQuiz: jest.fn(),
  //   })

  //   // Render
  //   renderWithProviders(
  //     <McqQuizWrapper
  //       quizData={mockQuizData}
  //       questions={mockQuizData.questions}
  //       quizId={mockQuizData.id}
  //       slug={mockQuizData.slug}
  //     />,
  //     {
  //       preloadedState: {
  //         isCompleted: true,
  //         requiresAuth: true,
  //         isAuthenticated: false,
  //         hasGuestResult: true,
  //       },
  //     },
  //   )

  //   // Guest sign-in prompt should appear
  //   expect(screen.getByTestId("guest-sign-in-prompt")).toBeInTheDocument()

  //   // Click continue as guest
  //   fireEvent.click(screen.getByTestId("continue-as-guest"))

  //   // Should show quiz results
  //   await waitFor(() => {
  //     expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
  //   })
  // })

  // test("handles direct quiz results display when provided", async () => {
  //   // Setup - mock authenticated session
  //   require("next-auth/react").useSession.mockReturnValue({
  //     data: { user: { name: "Test User" } },
  //     status: "authenticated",
  //   })

  //   const quizResults = {
  //     quizId: mockQuizData.id,
  //     slug: mockQuizData.slug,
  //     score: 75,
  //     totalQuestions: 2,
  //     correctAnswers: 1.5, // Partial credit
  //     completedAt: new Date().toISOString(),
  //   }

  //   // Render with quiz results prop
  //   renderWithProviders(
  //     <McqQuizWrapper
  //       quizData={mockQuizData}
  //       questions={mockQuizData.questions}
  //       quizId={mockQuizData.id}
  //       slug={mockQuizData.slug}
  //       quizResults={quizResults}
  //       showResults={true}
  //     />,
  //     {
  //       preloadedState: {
  //         isAuthenticated: true,
  //       },
  //     },
  //   )

  //   // Should show quiz results immediately
  //   expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
  // })
})
