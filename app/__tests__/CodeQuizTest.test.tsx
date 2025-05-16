"use client"

import type React from "react"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { Provider } from "react-redux"
import { SessionProvider } from "next-auth/react"
import { configureStore } from "@reduxjs/toolkit"

import quizReducer from "@/store/slices/quizSlice"
import "@testing-library/jest-dom"
import CodeQuizWrapper from "../dashboard/(quiz)/code/components/CodeQuizWrapper"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useParams: jest.fn().mockReturnValue({ slug: "test-quiz" }),
}))

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: { user: { id: "test-user" } },
    status: "authenticated",
  })),
  signIn: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock hooks
jest.mock("@/hooks/useQuizState", () => ({
  useQuiz: jest.fn(),
}))

// Mock hooks - visibility change
jest.mock("@/hooks/use-visibility-change", () => {
  return jest.fn((callback) => {
    // Mock implementation that calls the callback when document visibility changes
    useEffect(() => {
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          callback()
        }
      }
      document.addEventListener("visibilitychange", handleVisibilityChange)
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange)
      }
    }, [callback])
  })
})

import { useEffect } from "react"

// Mock components
jest.mock("../dashboard/(quiz)/code/components/CodingQuiz", () => {
  return jest.fn(
    ({ question, onAnswer, questionNumber, totalQuestions, isLastQuestion, existingAnswer, isSubmitting }) => (
      <div data-testid="coding-quiz">
        <h2>
          Question {questionNumber}/{totalQuestions}
        </h2>
        <div data-testid="question-text">{question.question}</div>
        {question.codeSnippet && <pre data-testid="code-snippet">{question.codeSnippet}</pre>}
        {existingAnswer && <div data-testid="existing-answer">{existingAnswer}</div>}
        {question.options && (
          <div data-testid="options">
            {question.options.map((option: string, index: number) => (
              <button
                key={index}
                data-testid={`option-${index}`}
                onClick={() => onAnswer(option, 10, false)}
                disabled={isSubmitting}
              >
                {option}
              </button>
            ))}
          </div>
        )}
        <button
          data-testid="submit-answer"
          onClick={() => onAnswer(question.codeSnippet || "test answer", 10, false)}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : isLastQuestion ? "Submit Quiz" : "Next"}
        </button>
        {isSubmitting && <div data-testid="submitting-indicator">Submitting...</div>}
      </div>
    ),
  )
})

// Mock quiz state display components
jest.mock("@/app/dashboard/(quiz)/components/QuizStateDisplay", () => ({
  InitializingDisplay: () => <div data-testid="initializing-display">Initializing...</div>,
  QuizNotFoundDisplay: ({ onReturn }: any) => (
    <div data-testid="quiz-not-found">
      Quiz not found
      <button onClick={onReturn}>Return</button>
    </div>
  ),
  ErrorDisplay: ({ error, onRetry, onReturn }: any) => (
    <div data-testid="error-display">
      {error}
      <button data-testid="retry-button" onClick={onRetry}>
        Retry
      </button>
      <button data-testid="return-button" onClick={onReturn}>
        Return
      </button>
    </div>
  ),
  EmptyQuestionsDisplay: ({ onReturn }: any) => (
    <div data-testid="empty-questions">
      No questions
      <button onClick={onReturn}>Return</button>
    </div>
  ),
  LoadingDisplay: ({ message }: any) => <div data-testid="loading-display">{message || "Loading..."}</div>,
}))

// Mock the QuizSubmissionLoading component
jest.mock("@/app/dashboard/(quiz)/components/QuizSubmissionLoading", () => ({
  QuizSubmissionLoading: ({ quizType }: { quizType: string }) => (
    <div data-testid="quiz-submission-loading">
      Submitting {quizType} quiz...
      <div data-testid="submission-progress">Processing your answers...</div>
    </div>
  ),
}))

// Mock NonAuthenticatedUserSignInPrompt component
jest.mock("@/app/dashboard/(quiz)/components/NonAuthenticatedUserSignInPrompt", () => {
  return function MockNonAuthPrompt({ quizType, onSignIn, showSaveMessage }) {
    return (
      <div data-testid="non-authenticated-prompt">
        <p>Sign in to save your results</p>
        <button data-testid="sign-in-button" onClick={onSignIn}>
          Sign In
        </button>
        {showSaveMessage && <p data-testid="save-message">Your progress will be saved</p>}
      </div>
    )
  }
})

// Create test quiz data
const mockQuizData = {
  id: "test-quiz",
  title: "Test Code Quiz",
  description: "A test quiz for integration testing",
  type: "code",
  slug: "test-quiz",
  isPublic: true,
  isFavorite: false,
  userId: "test-user",
  ownerId: "owner-id",
  questions: [
    {
      id: "q1",
      question: "What is the output of this code?",
      codeSnippet: "console.log(1 + 1);",
      options: ["2", "11", "undefined", "error"],
      correctAnswer: "2",
      answer: "2",
      language: "javascript",
    },
    {
      id: "q2",
      question: "Fix this code to return the sum of two numbers",
      codeSnippet: "function add(a, b) {\n  return\n}",
      answer: "function add(a, b) {\n  return a + b\n}",
      language: "javascript",
    },
  ],
}

// Mock router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
}

// Mock useQuiz hook - initial state
const createMockUseQuiz = (overrides = {}) => ({
  quizData: null,
  currentQuestion: 0,
  userAnswers: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  results: null,
  isCompleted: false,
  timeRemaining: null,
  timerActive: false,
  loadQuiz: jest.fn().mockImplementation((data, slug) => {
    return Promise.resolve(data || mockQuizData)
  }),
  resetQuizState: jest.fn(),
  nextQuestion: jest.fn(),
  previousQuestion: jest.fn(),
  saveAnswer: jest.fn(),
  submitQuiz: jest.fn().mockResolvedValue({}),
  getResults: jest.fn(),
  saveQuizState: jest.fn(),
  ...overrides,
})

// Setup test store
const setupStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      quiz: quizReducer,
    },
    preloadedState: {
      quiz: {
        quizData: null,
        currentQuestion: 0,
        userAnswers: [],
        isLoading: false,
        isSubmitting: false,
        error: null,
        results: null,
        isCompleted: false,
        ...initialState,
      },
    },
  })
}

// Setup test component with all providers
const renderWithProviders = (
  ui: React.ReactElement,
  {
    initialState = {},
    store = setupStore(initialState),
    session = { data: { user: { id: "test-user" } }, status: "authenticated" },
    router = mockRouter,
    useQuizMock = createMockUseQuiz(),
  } = {},
) => {
  // Mock hooks
  require("next/navigation").useRouter.mockReturnValue(router)
  require("next-auth/react").useSession.mockReturnValue(session)
  require("@/hooks/useQuizState").useQuiz.mockReturnValue(useQuizMock)

  return {
    ...render(
      <Provider store={store}>
        <SessionProvider>{ui}</SessionProvider>
      </Provider>,
    ),
    store,
    useQuizMock,
    router,
  }
}

// Mock window.location.reload
const mockReload = jest.fn()
Object.defineProperty(window, "location", {
  value: {
    ...window.location,
    reload: mockReload,
  },
  writable: true,
})

describe("Code Quiz Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  test("should initialize and load quiz data", async () => {
    // Start with loading state
    const useQuizMock = createMockUseQuiz({
      isLoading: true,
    })

    const { rerender } = renderWithProviders(
      <CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />,
      { useQuizMock },
    )

    // Should show loading initially
    expect(screen.getByTestId("initializing-display")).toBeInTheDocument()

    // Update the mock to show loaded data
    const useQuizWithData = createMockUseQuiz({
      quizData: mockQuizData,
      isLoading: false,
    })

    // Re-render with loaded data
    rerender(
      <Provider store={setupStore()}>
        <SessionProvider>
          <CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
        </SessionProvider>
      </Provider>,
    )

    // Mock the updated hook
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(useQuizWithData)

    // Should show the first question
    await waitFor(() => {
      expect(screen.getByTestId("coding-quiz")).toBeInTheDocument()
      expect(screen.getByText("Question 1/2")).toBeInTheDocument()
    })
  })

  test("should handle quiz navigation and submission", async () => {
    // Start with quiz data already loaded
    const useQuizWithData = createMockUseQuiz({
      quizData: mockQuizData,
    })

    const { rerender } = renderWithProviders(
      <CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />,
      { useQuizMock: useQuizWithData },
    )

    // Should show the first question
    await waitFor(() => {
      expect(screen.getByTestId("coding-quiz")).toBeInTheDocument()
      expect(screen.getByText("Question 1/2")).toBeInTheDocument()
    })

    // Answer the first question
    fireEvent.click(screen.getByTestId("submit-answer"))

    // Verify saveAnswer was called
    expect(useQuizWithData.saveAnswer).toHaveBeenCalled()
    expect(useQuizWithData.nextQuestion).toHaveBeenCalled()

    // Update mock to show second question
    const useQuizSecondQuestion = createMockUseQuiz({
      quizData: mockQuizData,
      currentQuestion: 1,
    })

    // Update the hook
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(useQuizSecondQuestion)

    // Re-render with second question
    rerender(
      <Provider store={setupStore()}>
        <SessionProvider>
          <CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
        </SessionProvider>
      </Provider>,
    )

    // Should show the second question
    await waitFor(() => {
      expect(screen.getByText("Question 2/2")).toBeInTheDocument()
      expect(screen.getByText("Submit Quiz")).toBeInTheDocument()
    })

    // Submit the quiz
    fireEvent.click(screen.getByTestId("submit-answer"))

    // Verify submitQuiz was called
    expect(useQuizSecondQuestion.submitQuiz).toHaveBeenCalled()

    // Update mock to show completed state
    const useQuizCompleted = createMockUseQuiz({
      quizData: mockQuizData,
      isCompleted: true,
    })

    require("@/hooks/useQuizState").useQuiz.mockReturnValue(useQuizCompleted)

    // Re-render with completed state
    rerender(
      <Provider store={setupStore()}>
        <SessionProvider>
          <CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
        </SessionProvider>
      </Provider>,
    )

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByTestId("quiz-submission-loading")).toBeInTheDocument()
    })

    // Fast-forward timer to trigger redirect
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    // Verify redirect to results page
    expect(mockRouter.replace).toHaveBeenCalledWith("/dashboard/code/test-quiz/results")
  })

  test("should handle authentication requirements", async () => {
    // Set unauthenticated session
    const unauthenticatedSession = { data: null, status: "unauthenticated" }

    renderWithProviders(<CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId={null} isPublic={false} />, {
      session: unauthenticatedSession,
    })

    // Should show authentication error
    expect(screen.getByTestId("error-display")).toBeInTheDocument()
    expect(screen.getByText("Please sign in to access this quiz")).toBeInTheDocument()

    // Click the retry button which should trigger sign in
    fireEvent.click(screen.getByTestId("retry-button"))
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining("/auth/signin"))
  })

  test("should handle quiz errors", async () => {
    // Set error state
    const useQuizWithError = createMockUseQuiz({
      error: "Failed to load quiz data",
    })

    renderWithProviders(<CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />, {
      useQuizMock: useQuizWithError,
    })

    // Should show error display
    expect(screen.getByTestId("error-display")).toBeInTheDocument()
    expect(screen.getByText("Failed to load quiz data")).toBeInTheDocument()

    // Click retry
    fireEvent.click(screen.getByTestId("retry-button"))

    // Check if window.location.reload was called
    expect(mockReload).toHaveBeenCalled()
  })

  test("should handle empty quiz data", async () => {
    // Set empty quiz data
    const useQuizWithEmptyData = createMockUseQuiz({
      quizData: { ...mockQuizData, questions: [] },
    })

    renderWithProviders(<CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />, {
      useQuizMock: useQuizWithEmptyData,
    })

    // Should show empty questions display
    expect(screen.getByTestId("empty-questions")).toBeInTheDocument()

    // Click return
    fireEvent.click(screen.getByText("Return"))
    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/quizzes")
  })

  test("should handle existing answers from Redux state", async () => {
    // Set quiz data with existing answers
    const useQuizWithAnswers = createMockUseQuiz({
      quizData: mockQuizData,
      userAnswers: [{ questionId: "q1", answer: "2" }],
    })

    renderWithProviders(<CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />, {
      useQuizMock: useQuizWithAnswers,
    })

    // Should show the first question
    await waitFor(() => {
      expect(screen.getByTestId("coding-quiz")).toBeInTheDocument()
      expect(screen.getByText("Question 1/2")).toBeInTheDocument()
    })

    // Check for existing answer
    expect(screen.getByTestId("existing-answer")).toBeInTheDocument()
    expect(screen.getByTestId("existing-answer").textContent).toBe("2")
  })

  test("should handle state persistence between sessions", async () => {
    // Start with quiz data already loaded and an existing answer
    const existingAnswer = "console.log(2);"
    const useQuizWithDataAndAnswer = createMockUseQuiz({
      quizData: mockQuizData,
      userAnswers: [{ questionId: "q1", answer: existingAnswer }],
    })

    renderWithProviders(<CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />, {
      useQuizMock: useQuizWithDataAndAnswer,
    })

    // Should show the first question
    await waitFor(() => {
      expect(screen.getByTestId("coding-quiz")).toBeInTheDocument()
      expect(screen.getByText("Question 1/2")).toBeInTheDocument()
    })

    // Simulate visibility change (tab switching)
    const visibilityChangeEvent = new Event("visibilitychange")
    Object.defineProperty(document, "visibilityState", { value: "visible", writable: true })
    document.dispatchEvent(visibilityChangeEvent)

    // Wait for the next tick to ensure event handlers are triggered
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Verify saveQuizState was called
    expect(useQuizWithDataAndAnswer.saveQuizState).toHaveBeenCalled()
  })

  test("should show sign-in prompt for non-authenticated users after quiz completion", async () => {
    // Set up quiz data with completed state
    const useQuizCompleted = createMockUseQuiz({
      quizData: mockQuizData,
      isCompleted: true,
    })

    renderWithProviders(<CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" isPublic={true} />, {
      useQuizMock: useQuizCompleted,
      session: { data: null, status: "unauthenticated" },
    })

    // Should show non-authenticated prompt
    await waitFor(() => {
      expect(screen.getByTestId("non-authenticated-prompt")).toBeInTheDocument()
      expect(screen.getByTestId("save-message")).toBeInTheDocument()
    })

    // Click sign in button
    fireEvent.click(screen.getByTestId("sign-in-button"))

    // Verify redirect to sign in page with correct callback
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining("/auth/signin"))
  })

  test("should handle submission loading state", async () => {
    // Start with quiz data on the last question
    const useQuizLastQuestion = createMockUseQuiz({
      quizData: mockQuizData,
      currentQuestion: 1, // Last question (0-indexed)
    })

    const { rerender } = renderWithProviders(
      <CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />,
      {
        useQuizMock: useQuizLastQuestion,
      },
    )

    // Should show the last question
    await waitFor(() => {
      expect(screen.getByTestId("coding-quiz")).toBeInTheDocument()
      expect(screen.getByText("Question 2/2")).toBeInTheDocument()
      expect(screen.getByText("Submit Quiz")).toBeInTheDocument()
    })

    // Submit the quiz
    fireEvent.click(screen.getByTestId("submit-answer"))

    // Verify submitQuiz was called
    expect(useQuizLastQuestion.submitQuiz).toHaveBeenCalled()

    // Update mock to show completed state
    const useQuizSubmitted = createMockUseQuiz({
      quizData: mockQuizData,
      isCompleted: true,
    })

    require("@/hooks/useQuizState").useQuiz.mockReturnValue(useQuizSubmitted)

    // Re-render with completed state
    rerender(
      <Provider store={setupStore()}>
        <SessionProvider>
          <CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
        </SessionProvider>
      </Provider>,
    )

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByTestId("quiz-submission-loading")).toBeInTheDocument()
    })

    // Fast-forward timer to trigger redirect
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    // Verify redirect to results page
    expect(mockRouter.replace).toHaveBeenCalledWith("/dashboard/code/test-quiz/results")
  })

  test("should reset state on unmount when navigating away", async () => {
    // Start with quiz data already loaded
    const useQuizWithData = createMockUseQuiz({
      quizData: mockQuizData,
    })

    const { unmount } = renderWithProviders(
      <CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />,
      {
        useQuizMock: useQuizWithData,
      },
    )

    // Should show the first question
    await waitFor(() => {
      expect(screen.getByTestId("coding-quiz")).toBeInTheDocument()
    })

    // Unmount the component
    unmount()

    // Verify resetQuizState was called
    expect(useQuizWithData.resetQuizState).toHaveBeenCalled()
  })

  test("should handle invalid question object gracefully", async () => {
    // Create quiz data with an invalid question
    const quizWithInvalidQuestion = {
      ...mockQuizData,
      questions: [
        { id: "invalid", question: "" }, // Invalid question
        ...mockQuizData.questions,
      ],
    }

    const useQuizWithInvalidQuestion = createMockUseQuiz({
      quizData: quizWithInvalidQuestion,
    })

    renderWithProviders(<CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />, {
      useQuizMock: useQuizWithInvalidQuestion,
    })

    // Should still render the component without crashing
    await waitFor(() => {
      expect(screen.getByTestId("coding-quiz")).toBeInTheDocument()
    })
  })

  test("should show fallback error if unexpected error occurs", async () => {
    // Mock loadQuiz to throw an error
    const errorUseQuiz = createMockUseQuiz()
    errorUseQuiz.loadQuiz.mockImplementation(() => {
      throw new Error("Unexpected test error")
    })

    renderWithProviders(<CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />, {
      useQuizMock: errorUseQuiz,
    })

    // Initially it should be in loading state
    expect(screen.getByTestId("initializing-display")).toBeInTheDocument()

    // Update the mock to show error state
    const errorState = createMockUseQuiz({
      error: "An unexpected error occurred",
    })

    require("@/hooks/useQuizState").useQuiz.mockReturnValue(errorState)

    // Should show error state
    await waitFor(() => {
      expect(screen.getByTestId("error-display")).toBeInTheDocument()
    })
  })
})
