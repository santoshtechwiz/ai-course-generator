"use client"

import type React from "react"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { SessionProvider } from "next-auth/react"
import OpenEndedQuizQuestion from "../dashboard/(quiz)/openended/components/OpenEndedQuizQuestion"
import OpenEndedQuizWrapper from "../dashboard/(quiz)/openended/components/OpenEndedQuizWrapper"
import QuizResultsOpenEnded from "../dashboard/(quiz)/openended/components/QuizResultsOpenEnded"
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
  signIn: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock hooks/use-toast
jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
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

// Mock quiz validation
jest.mock("@/lib/utils/quiz-validation", () => ({
  isTooFastAnswer: jest.fn(() => false),
}))

// Mock quiz performance utils
jest.mock("@/lib/utils/quiz-performance", () => ({
  calculatePerformanceLevel: jest.fn((score) => {
    if (score >= 90) return "Excellent"
    if (score >= 70) return "Good"
    if (score >= 50) return "Average"
    return "Needs Improvement"
  }),
  formatQuizTime: jest.fn((time) => `${Math.floor(time / 60)}m ${time % 60}s`),
}))

// Mock QuizStateDisplay component
jest.mock("@/app/dashboard/components/QuizStateDisplay", () => ({
  ErrorDisplay: ({ error }: any) => <div data-testid="error-display">{error || "Unknown error"}</div>,
  LoadingDisplay: () => <div data-testid="loading-display">Loading...</div>,
  InitializingDisplay: () => <div data-testid="initializing-display">Initializing...</div>,
  QuizNotFoundDisplay: () => <div data-testid="not-found-display">Quiz not found</div>,
  EmptyQuestionsDisplay: () => <div data-testid="empty-questions-display">No questions available</div>,
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

// Mock useQuiz hook
const mockRequireAuthentication = jest.fn()
const mockRestoreState = jest.fn()
const mockSubmitAnswer = jest.fn()
const mockCompleteQuiz = jest.fn().mockImplementation(() => Promise.resolve())

jest.mock("@/hooks/useQuizState", () => ({
  useQuiz: jest.fn(() => ({
    quizState: {
      quizId: "test-openended-quiz-id",
      slug: "test-openended-quiz",
      title: "Test Open-Ended Quiz",
      quizType: "openended",
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

// Mock sessionStorage
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

// Sample quiz data
const mockOpenEndedQuizData = {
  id: "test-openended-quiz-id",
  slug: "test-openended-quiz",
  title: "Test Open-Ended Quiz",
  quizType: "openended",
  questions: [
    {
      id: "q1",
      question: "Explain the concept of React hooks and how they improve component development.",
      answer: "React hooks are functions that let you use state and other React features without writing a class.",
      openEndedQuestion: {
        hints:
          "They were introduced in React 16.8|They let you use state without classes|Examples include useState and useEffect",
        difficulty: "medium",
        tags: "react,hooks,frontend",
      },
    },
    {
      id: "q2",
      question: "What are the key differences between REST and GraphQL APIs?",
      answer:
        "REST uses multiple endpoints with fixed data structures while GraphQL uses a single endpoint with flexible queries.",
      openEndedQuestion: {
        hints:
          "Think about how data is fetched|Consider over-fetching and under-fetching|Think about the number of endpoints",
        difficulty: "hard",
        tags: "api,graphql,rest",
      },
    },
  ],
}

// Initial state to prevent undefined errors
const initialState = {
  quiz: {
    quizId: "test-openended-quiz-id",
    slug: "test-openended-quiz",
    title: "Test Open-Ended Quiz",
    quizType: "openended",
    questions: mockOpenEndedQuizData.questions,
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

describe("OpenEndedQuizQuestion Component", () => {
  // Sample question data
  const mockQuestion = mockOpenEndedQuizData.questions[0]

  // Mock functions
  const mockOnAnswer = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("renders question and textarea correctly", () => {
    render(
      <OpenEndedQuizQuestion
        question={mockQuestion}
        onAnswer={mockOnAnswer}
        questionNumber={1}
        totalQuestions={2}
        isLastQuestion={false}
      />,
    )

    // Check that the component renders
    expect(screen.getByTestId("openended-quiz-question")).toBeInTheDocument()

    // Check that the question is displayed correctly
    expect(screen.getByTestId("question-text")).toHaveTextContent(
      "Explain the concept of React hooks and how they improve component development.",
    )

    // Check that the textarea is displayed
    expect(screen.getByTestId("answer-textarea")).toBeInTheDocument()

    // Check that the question number is displayed correctly
    expect(screen.getByText("Question 1")).toBeInTheDocument()
  })

  test("submit button is disabled until a valid answer is entered", () => {
    render(
      <OpenEndedQuizQuestion
        question={mockQuestion}
        onAnswer={mockOnAnswer}
        questionNumber={1}
        totalQuestions={2}
        isLastQuestion={false}
      />,
    )

    // Check that the submit button is disabled initially
    const submitButton = screen.getByTestId("submit-button")
    expect(submitButton).toBeDisabled()

    // Enter a short answer (less than minimum)
    fireEvent.change(screen.getByTestId("answer-textarea"), { target: { value: "Short" } })

    // Check that the submit button is still disabled
    expect(submitButton).toBeDisabled()

    // Enter a valid answer
    fireEvent.change(screen.getByTestId("answer-textarea"), {
      target: { value: "React hooks are functions that let you use state in functional components." },
    })

    // Check that the submit button is now enabled
    expect(submitButton).not.toBeDisabled()
  })

  test("calls onAnswer with correct parameters when submitting", () => {
    render(
      <OpenEndedQuizQuestion
        question={mockQuestion}
        onAnswer={mockOnAnswer}
        questionNumber={1}
        totalQuestions={2}
        isLastQuestion={false}
      />,
    )

    // Enter an answer
    fireEvent.change(screen.getByTestId("answer-textarea"), {
      target: { value: "React hooks are functions that let you use state in functional components." },
    })

    // Submit the answer
    fireEvent.click(screen.getByTestId("submit-button"))

    // Check that onAnswer was called with the correct parameters
    expect(mockOnAnswer).toHaveBeenCalledWith(
      "React hooks are functions that let you use state in functional components.",
    )
  })

  test("shows hint when hint button is clicked", () => {
    render(
      <OpenEndedQuizQuestion
        question={mockQuestion}
        onAnswer={mockOnAnswer}
        questionNumber={1}
        totalQuestions={2}
        isLastQuestion={false}
      />,
    )

    // Check that hint is not initially displayed
    expect(screen.queryByText("They were introduced in React 16.8")).not.toBeInTheDocument()

    // Click the hint button
    fireEvent.click(screen.getByTestId("hint-button"))

    // Check that hint is now displayed
    expect(screen.getByText("They were introduced in React 16.8")).toBeInTheDocument()
  })
})

describe("QuizResultsOpenEnded Component", () => {
  // Sample quiz result data
  const mockQuizResult = {
    quizId: "test-openended-quiz-id",
    slug: "test-openended-quiz",
    title: "Test Open-Ended Quiz",
    answers: [
      {
        questionId: "q1",
        question: "Explain the concept of React hooks and how they improve component development.",
        answer: "React hooks are functions that let you use state in functional components without writing classes.",
        timeSpent: 45,
      },
      {
        questionId: "q2",
        question: "What are the key differences between REST and GraphQL APIs?",
        answer:
          "REST uses multiple endpoints with fixed data structures while GraphQL uses a single endpoint with flexible queries.",
        timeSpent: 60,
      },
    ],
    questions: mockOpenEndedQuizData.questions,
    totalQuestions: 2,
    totalTimeSpent: 105,
    completedAt: new Date().toISOString(),
    startTime: Date.now() - 105000, // 105 seconds ago
  }

  test("renders quiz results correctly", () => {
    renderWithProviders(<QuizResultsOpenEnded result={mockQuizResult} />)

    // Check that the component renders
    expect(screen.getByTestId("quiz-results-openended")).toBeInTheDocument()

    // Check that the title is displayed correctly
    expect(screen.getByText("Test Open-Ended Quiz")).toBeInTheDocument()

    // Check that the summary tab is active by default
    expect(screen.getByText("Summary")).toHaveAttribute("data-state", "active")
  })

  test("displays correct statistics", () => {
    renderWithProviders(<QuizResultsOpenEnded result={mockQuizResult} />)

    // Check questions answered - look for the value in the stats card
    expect(screen.getAllByText("2")[0]).toBeInTheDocument()

    // Check total questions - look for the value in the stats card
    expect(screen.getAllByText("2")[1]).toBeInTheDocument()

    // Check completion percentage
    expect(screen.getByText("2 of 2 questions answered")).toBeInTheDocument()

    // Check for time display
    expect(screen.getByText("Total Time")).toBeInTheDocument()
    expect(screen.getByText("Avg. Time/Question")).toBeInTheDocument()
  })

})

describe("OpenEndedQuizWrapper Component", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset URL
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "location", {
        value: {
          search: "",
          pathname: "/dashboard/openended/test-openended-quiz",
          href: "http://localhost/dashboard/openended/test-openended-quiz",
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

    // Clear sessionStorage
    sessionStorage.clear()
  })

  test("shows quiz content when data is loaded", async () => {
    // Mock useQuiz to return loaded quiz state
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        questions: mockOpenEndedQuizData.questions,
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

    const { container } = renderWithProviders(
      <OpenEndedQuizWrapper
        quizData={mockOpenEndedQuizData}
        slug={mockOpenEndedQuizData.slug}
        userId="user-123"
        quizId={mockOpenEndedQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Wait for initialization to complete and check for the question component
    await waitFor(() => {
      // Look for the question text directly
      expect(
        screen.getByText("Explain the concept of React hooks and how they improve component development."),
      ).toBeInTheDocument()
    })
  })

  test("shows auth prompt when quiz is completed and user is not authenticated", async () => {
    // Mock useQuiz to return completed quiz state but not authenticated
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        isCompleted: true,
        requiresAuth: true,
        questions: mockOpenEndedQuizData.questions,
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
      <OpenEndedQuizWrapper
        quizData={mockOpenEndedQuizData}
        slug={mockOpenEndedQuizData.slug}
        userId=""
        quizId={mockOpenEndedQuizData.id}
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
        questions: mockOpenEndedQuizData.questions,
        answers: [
          {
            questionId: "q1",
            timeSpent: 45,
            answer: "React hooks are functions that let you use state in functional components.",
          },
          {
            questionId: "q2",
            timeSpent: 60,
            answer: "REST uses multiple endpoints while GraphQL uses a single endpoint with flexible queries.",
          },
        ],
        completedAt: new Date().toISOString(),
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

    const { debug } = renderWithProviders(
      <OpenEndedQuizWrapper
        quizData={mockOpenEndedQuizData}
        slug={mockOpenEndedQuizData.slug}
        userId="user-123"
        quizId={mockOpenEndedQuizData.id}
        isPublic={false}
        isFavorite={false}
      />,
    )

    // Wait for the results container to appear
    await waitFor(() => {
      const resultsContainer = screen.queryByTestId("quiz-results-container")
      if (!resultsContainer) {
        debug() // Print the DOM if the container isn't found
        throw new Error("Results container not found")
      }
      expect(resultsContainer).toBeInTheDocument()
    })

    // Then check for the quiz results component
    await waitFor(() => {
      const resultsComponent = screen.queryByTestId("quiz-results-openended")
      if (!resultsComponent) {
        debug() // Print the DOM if the component isn't found
        throw new Error("Quiz results component not found")
      }
      expect(resultsComponent).toBeInTheDocument()
    })
  })

  test("saves quiz state to sessionStorage before redirecting to sign in", async () => {
    // Create a local mock function that we can verify
    const localMockRequireAuth = jest.fn()

    // Mock useQuiz to return completed quiz state but not authenticated
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      quizState: {
        ...initialState.quiz,
        isCompleted: true,
        requiresAuth: true,
        questions: mockOpenEndedQuizData.questions,
        answers: [
          {
            questionId: "q1",
            timeSpent: 45,
            answer: "React hooks are functions that let you use state in functional components.",
          },
          {
            questionId: "q2",
            timeSpent: 60,
            answer: "REST uses multiple endpoints while GraphQL uses a single endpoint with flexible queries.",
          },
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
      <OpenEndedQuizWrapper
        quizData={mockOpenEndedQuizData}
        slug={mockOpenEndedQuizData.slug}
        userId=""
        quizId={mockOpenEndedQuizData.id}
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
    expect(localMockRequireAuth).toHaveBeenCalledWith(
      `/dashboard/openended/${mockOpenEndedQuizData.slug}?fromAuth=true`,
    )

    // Check that state was saved to sessionStorage
    expect(sessionStorage.setItem).toHaveBeenCalled()
    const savedStateKey = `openended_quiz_state_${mockOpenEndedQuizData.slug}`
    expect(sessionStorage.setItem).toHaveBeenCalledWith(savedStateKey, expect.stringContaining('"isCompleted":true'))
  })

  test("restores quiz state from sessionStorage when returning from auth", async () => {
    // Mock URL with fromAuth=true
    const mockSearchParams = new URLSearchParams()
    mockSearchParams.set("fromAuth", "true")
    require("next/navigation").useSearchParams.mockReturnValue(mockSearchParams)

    // Mock completeQuiz to resolve immediately
    mockCompleteQuiz.mockImplementation(() => Promise.resolve())

    // Set up saved state in sessionStorage
    const savedState = {
      quizId: "test-openended-quiz-id",
      slug: "test-openended-quiz",
      isCompleted: true,
      answers: [
        {
          questionId: "q1",
          timeSpent: 45,
          answer: "React hooks are functions that let you use state in functional components.",
        },
        {
          questionId: "q2",
          timeSpent: 60,
          answer: "REST uses multiple endpoints while GraphQL uses a single endpoint with flexible queries.",
        },
      ],
      questions: mockOpenEndedQuizData.questions,
      completedAt: new Date().toISOString(),
    }

    // Pre-populate sessionStorage before the test
    sessionStorage.setItem(`openended_quiz_state_${mockOpenEndedQuizData.slug}`, JSON.stringify(savedState))

    // Verify sessionStorage was set up correctly
    expect(sessionStorage.getItem(`openended_quiz_state_${mockOpenEndedQuizData.slug}`)).toBeTruthy()

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
      <OpenEndedQuizWrapper
        quizData={mockOpenEndedQuizData}
        slug={mockOpenEndedQuizData.slug}
        userId="user-123"
        quizId={mockOpenEndedQuizData.id}
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
      expect(sessionStorage.getItem).toHaveBeenCalledWith(`openended_quiz_state_${mockOpenEndedQuizData.slug}`)
    })

    // Check that completeQuiz was called with the saved state
    await waitFor(() => {
      expect(mockCompleteQuiz).toHaveBeenCalledWith({
        answers: savedState.answers,
        completedAt: expect.any(String),
      })
    })
  })
})
