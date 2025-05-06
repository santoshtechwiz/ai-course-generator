"use client"

import type React from "react"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { SessionProvider } from "next-auth/react"
import OpenEndedQuizWrapper from "../dashboard/(quiz)/openended/components/OpenEndedQuizWrapper"
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

// Mock window.history.replaceState
const mockReplaceState = jest.fn()
Object.defineProperty(window.history, "replaceState", {
  writable: true,
  value: mockReplaceState,
})

// Mock quiz components
jest.mock("../dashboard/(quiz)/openended/components/OpenEndedQuizQuestion", () => ({
  __esModule: true,
  default: ({ question, onAnswer, questionNumber, totalQuestions }: any) => (
    <div data-testid="openended-quiz">
      <h2>{question?.question || "Test Question"}</h2>
      <p>
        Question {questionNumber}/{totalQuestions}
      </p>
      <div>
        <textarea data-testid="answer-textarea" />
        <button data-testid="submit-answer" onClick={() => onAnswer("This is my answer")}>
          Submit Answer
        </button>
      </div>
    </div>
  ),
}))

jest.mock("../dashboard/(quiz)/openended/components/QuizResultsOpenEnded", () => ({
  __esModule: true,
  default: ({ answers, questions, onRestart, onSignIn }: any) => (
    <div data-testid="quiz-results">
      Open Ended Quiz Results
      <div data-testid="answers-count">{answers?.length || 0}</div>
      <button data-testid="restart-quiz" onClick={onRestart}>
        Restart Quiz
      </button>
      {onSignIn && (
        <button data-testid="sign-in-from-results" onClick={onSignIn}>
          Sign In
        </button>
      )}
    </div>
  ),
}))

jest.mock("../dashboard/(quiz)/components/NonAuthenticatedUserSignInPrompt", () => ({
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

// Sample quiz data
const mockOpenEndedQuizData = {
  id: "test-openended-quiz-id",
  slug: "test-openended-quiz",
  title: "Test Open Ended Quiz",
  quizType: "openended",
  questions: [
    {
      id: "q1",
      question: "Describe the process of photosynthesis.",
      modelAnswer: "Photosynthesis is the process by which plants convert light energy into chemical energy.",
    },
    {
      id: "q2",
      question: "Explain the concept of gravity.",
      modelAnswer: "Gravity is a force that attracts objects with mass towards each other.",
    },
  ],
}

// Initial state to prevent undefined errors
const initialState = {
  quiz: {
    quizId: "test-openended-quiz-id",
    slug: "test-openended-quiz",
    title: "Test Open Ended Quiz",
    quizType: "openended",
    questions: mockOpenEndedQuizData.questions,
    currentQuestionIndex: 0,
    answers: [],
    timeSpent: [],
    isCompleted: false,
    score: 0,
    requiresAuth: false,
    pendingAuthRequired: false,
    hasNonAuthenticatedUserResult: false,
    guestResultsSaved: false,
    authCheckComplete: false,
    isProcessingAuth: false,
    error: null,
    animationState: "idle",
    isSavingResults: false,
    resultsSaved: false,
    completedAt: null,
    savedState: null,
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
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}

describe("Open Ended Quiz Auth Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset URL
    Object.defineProperty(window, "location", {
      value: {
        search: "",
        href: "https://example.com/test",
        origin: "https://example.com",
        pathname: "/test",
      },
      writable: true,
    })

    // Reset session mock
    require("next-auth/react").useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    })
  })

  test("shows auth prompt when quiz requires authentication", async () => {
    // Render with preloaded state
    renderWithProviders(<OpenEndedQuizWrapper quizData={mockOpenEndedQuizData} slug={mockOpenEndedQuizData.slug} />, {
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
    })

    // Check that auth prompt is shown
    await waitFor(() => {
      expect(screen.getByTestId("guest-sign-in-prompt")).toBeInTheDocument()
    })
  })

  test("shows results when quiz is completed and user is authenticated", async () => {
    // Mock authenticated session
    require("next-auth/react").useSession.mockReturnValue({
      data: { user: { id: "user-123", name: "Test User" } },
      status: "authenticated",
    })

    // Render with completed quiz
    renderWithProviders(<OpenEndedQuizWrapper quizData={mockOpenEndedQuizData} slug={mockOpenEndedQuizData.slug} />, {
      preloadedState: {
        quiz: {
          isCompleted: true,
          score: 100,
          answers: [
            { questionId: "q1", isCorrect: true, timeSpent: 120, answer: "Photosynthesis is a process..." },
            { questionId: "q2", isCorrect: true, timeSpent: 90, answer: "Gravity is a force..." },
          ],
        },
        auth: {
          isAuthenticated: true,
        },
      },
    })

    // Should show quiz results
    await waitFor(() => {
      expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
    })
  })

  test("handles error states correctly", async () => {
    // Mock the validateInitialQuizData function to return an error
    jest.mock(
      "@/lib/utils/quiz-state-utils",
      () => ({
        validateInitialQuizData: jest.fn(() => ({ isValid: false, error: "Test error message" })),
        createSafeQuizData: jest.fn((data) => data),
      }),
      { virtual: true },
    )

    // Render with invalid quiz data
    renderWithProviders(
      <OpenEndedQuizWrapper
        quizData={null} // Invalid quiz data to trigger error
        slug="test-slug"
      />,
    )

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Error loading quiz/i)).toBeInTheDocument()
    })
  })

  test("allows guest to continue without signing in", async () => {
    // Render with completed quiz requiring auth
    renderWithProviders(<OpenEndedQuizWrapper quizData={mockOpenEndedQuizData} slug={mockOpenEndedQuizData.slug} />, {
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
    })

    // Check that auth prompt is shown
    await waitFor(() => {
      expect(screen.getByTestId("guest-sign-in-prompt")).toBeInTheDocument()
    })

    // Click continue as guest
    fireEvent.click(screen.getByTestId("continue-as-guest"))

    // Should show quiz results
    await waitFor(() => {
      expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
    })
  })

  test("handles authentication flow when returning from sign-in", async () => {
    // Setup - mock URL with fromAuth=true
    const mockSearchParams = new URLSearchParams("fromAuth=true")
    require("next/navigation").useSearchParams.mockReturnValue(mockSearchParams)

    // Mock authenticated session
    require("next-auth/react").useSession.mockReturnValue({
      data: { user: { id: "user-123", name: "Test User" } },
      status: "authenticated",
    })

    // Render with pending auth required and valid saved state
    renderWithProviders(<OpenEndedQuizWrapper quizData={mockOpenEndedQuizData} slug={mockOpenEndedQuizData.slug} />, {
      preloadedState: {
        quiz: {
          pendingAuthRequired: true,
          savedState: {
            quizId: mockOpenEndedQuizData.id,
            slug: mockOpenEndedQuizData.slug,
            isCompleted: true,
            score: 100,
            answers: [
              { questionId: "q1", isCorrect: true, timeSpent: 120, answer: "Photosynthesis is a process..." },
              { questionId: "q2", isCorrect: true, timeSpent: 90, answer: "Gravity is a force..." },
            ],
            completedAt: new Date().toISOString(),
          },
          // Add these properties to ensure the quiz is properly initialized
          quizId: mockOpenEndedQuizData.id,
          slug: mockOpenEndedQuizData.slug,
          questions: mockOpenEndedQuizData.questions,
          isCompleted: true,
        },
        auth: {
          isAuthenticated: true,
        },
      },
    })

    // Should show quiz results
    await waitFor(() => {
      expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
    })
  })
})
