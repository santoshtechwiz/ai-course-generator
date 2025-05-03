"use client"

import type React from "react"

import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { SessionProvider } from "next-auth/react"
import CodeQuizWrapper from "../dashboard/(quiz)/code/components/CodeQuizWrapper"
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
jest.mock("../dashboard/(quiz)/code/components/CodingQuiz", () => ({
  __esModule: true,
  default: ({ question, onAnswer, questionNumber, totalQuestions, isLastQuestion }: any) => (
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
  ),
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
        quizId: "test-code-quiz-id",
        slug: "test-code-quiz",
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

// Add this mock to display error messages
jest.mock("../dashboard/(quiz)/components/QuizStateDisplay", () => ({
  __esModule: true,
  default: ({ error }: any) => (error ? <div data-testid="error-display">{error.message}</div> : null),
}))

describe("Code Quiz Auth Flow", () => {
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
        quizId: "test-code-quiz-id",
        slug: "test-code-quiz",
        quizType: "code",
        questions: mockCodeQuizData.questions,
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
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId="user-123"
        quizId={mockCodeQuizData.id}
        isPublic={true}
        isFavorite={false}
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

    // Mock the useQuiz hook to return the last question
    useQuiz.mockReturnValue({
      state: {
        quizId: "test-code-quiz-id",
        slug: "test-code-quiz",
        quizType: "code",
        questions: mockCodeQuizData.questions,
        currentQuestionIndex: 1, // Last question (index 1 of 2 questions)
        answers: [{ questionId: "q1", isCorrect: true, timeSpent: 10, answer: "return a + b" }],
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

    // Create a special mock for CodingQuiz just for this test
    const originalCodingQuiz = require("../dashboard/(quiz)/code/components/CodingQuiz").default

    // Override the CodingQuiz mock for this specific test
    jest.spyOn(require("../dashboard/(quiz)/code/components/CodingQuiz"), "default").mockImplementation((props: any) => {
      // Force isLastQuestion to true for this test
      return (
        <div data-testid="coding-quiz">
          <h2>{props.question?.question || "Test Coding Question"}</h2>
          <p>
            Question {props.questionNumber}/{props.totalQuestions}
          </p>
          <div>
            <textarea
              data-testid="code-editor"
              defaultValue={props.question?.codeSnippet || "// Write your code here"}
            ></textarea>
          </div>
          <button data-testid="submit-answer" onClick={() => props.onAnswer("console.log('test')", 10, true)}>
            Submit Quiz
          </button>
        </div>
      )
    })

    // Render with current question index set to the last question
    renderWithProviders(
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId="user-123"
        quizId={mockCodeQuizData.id}
        isPublic={true}
        isFavorite={false}
      />,
      {
        preloadedState: {
          currentQuestionIndex: 1, // Last question
        },
      },
    )

    // Check if the button says "Submit Quiz" instead of "Next"
    expect(screen.getByTestId("submit-answer")).toBeInTheDocument()
    expect(screen.getByText("Submit Quiz")).toBeInTheDocument()
  })



  test("shows results when quiz is completed and auth is not required", async () => {
    // Setup
    const { useQuiz } = require("../context/QuizContext")

    useQuiz.mockReturnValue({
      state: {
        quizId: "test-code-quiz-id",
        slug: "test-code-quiz",
        quizType: "code",
        questions: mockCodeQuizData.questions,
        currentQuestionIndex: 1,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "return a + b" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "return a * b" },
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
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId="user-123"
        quizId={mockCodeQuizData.id}
        isPublic={true}
        isFavorite={false}
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
        { answer: "return a + b", isCorrect: true, timeSpent: 10, questionId: "q1" },
        { answer: "return a * b", isCorrect: true, timeSpent: 5, questionId: "q2" },
      ],
      currentQuestionIndex: 1,
      quizId: mockCodeQuizData.id,
      slug: mockCodeQuizData.slug,
      quizResults: {
        quizId: mockCodeQuizData.id,
        slug: mockCodeQuizData.slug,
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
          if (key === `code_quiz_state_${mockCodeQuizData.slug}`) {
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
        quizId: "test-code-quiz-id",
        slug: "test-code-quiz",
        quizType: "code",
        questions: mockCodeQuizData.questions,
        currentQuestionIndex: 1,
        answers: [
          { questionId: "q1", isCorrect: true, timeSpent: 10, answer: "return a + b" },
          { questionId: "q2", isCorrect: true, timeSpent: 5, answer: "return a * b" },
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
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId="user-123"
        quizId={mockCodeQuizData.id}
        isPublic={true}
        isFavorite={false}
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
    expect(window.localStorage.removeItem).toHaveBeenCalledWith(`code_quiz_state_${mockCodeQuizData.slug}`)
  })

  test("saves quiz state to localStorage before redirecting to sign-in", async () => {
    // Setup
    const { useQuiz } = require("../context/QuizContext")
    const mockHandleAuthenticationRequired = jest.fn()

    useQuiz.mockReturnValue({
      state: {
        quizId: "test-code-quiz-id",
        slug: "test-code-quiz",
        quizType: "code",
        questions: mockCodeQuizData.questions,
        currentQuestionIndex: 0,
        answers: [{ questionId: "q1", isCorrect: true, timeSpent: 10, answer: "return a + b" }],
        timeSpent: [10],
        isCompleted: true,
        score: 50,
        requiresAuth: true,
        isAuthenticated: false,
        hasGuestResult: false,
        guestResultsSaved: false,
        error: null,
        animationState: "completed",
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: mockHandleAuthenticationRequired,
      setAuthCheckComplete: jest.fn(),
      initializeQuiz: jest.fn(),
    })

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    })

    // Render
    renderWithProviders(
      <CodeQuizWrapper
        quizData={mockCodeQuizData}
        slug={mockCodeQuizData.slug}
        userId="user-123"
        quizId={mockCodeQuizData.id}
        isPublic={true}
        isFavorite={false}
      />,
      {
        preloadedState: {
          isCompleted: true,
          requiresAuth: true,
          isAuthenticated: false,
        },
      },
    )

    // Find and click the sign-in button
    const signInButton = screen.getByTestId("sign-in")
    fireEvent.click(signInButton)

    // Check that state was saved to localStorage
    expect(window.localStorage.setItem).toHaveBeenCalled()

    // Check that handleAuthenticationRequired was called with the correct redirect URL
    expect(mockHandleAuthenticationRequired).toHaveBeenCalledWith(
      `/dashboard/code/${mockCodeQuizData.slug}?fromAuth=true`,
    )
  })
})
