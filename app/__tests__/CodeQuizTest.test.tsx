"use client"

import type React from "react"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { Provider } from "react-redux"
import { SessionProvider } from "next-auth/react"
import { configureStore } from "@reduxjs/toolkit"

import  quizReducer  from "@/store/slices/quizSlice"
import "@testing-library/jest-dom"
import CodeQuizWrapper from "../dashboard/(quiz)/code/components/CodeQuizWrapper"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn().mockReturnValue({ slug: "test-quiz" }),
}))

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock hooks
jest.mock("@/hooks/useQuizState", () => ({
  useQuiz: jest.fn(),
}))

// Mock components
jest.mock("@/components/CodingQuiz", () => {
  return jest.fn(({ question, onAnswer, questionNumber, totalQuestions, isLastQuestion }) => (
    <div data-testid="coding-quiz">
      <h2>
        Question {questionNumber}/{totalQuestions}
      </h2>
      <div data-testid="question-text">{question.question}</div>
      {question.codeSnippet && <pre data-testid="code-snippet">{question.codeSnippet}</pre>}
      {question.options && (
        <div data-testid="options">
          {question.options.map((option: string, index: number) => (
            <button key={index} data-testid={`option-${index}`} onClick={() => onAnswer(option, 10, false)}>
              {option}
            </button>
          ))}
        </div>
      )}
      <button data-testid="submit-answer" onClick={() => onAnswer(question.codeSnippet || "test answer", 10, false)}>
        {isLastQuestion ? "Submit Quiz" : "Next"}
      </button>
    </div>
  ))
})

// Mock quiz state display components
jest.mock("@/components/ui/quiz-state-display", () => ({
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
      <button onClick={onRetry}>Retry</button>
      <button onClick={onReturn}>Return</button>
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

// Create test quiz data
const mockQuizData = {
  id: "test-quiz",
  title: "Test Code Quiz",
  description: "A test quiz for integration testing",
  type: "code",
  questions: [
    {
      id: "q1",
      question: "What is the output of this code?",
      codeSnippet: "console.log(1 + 1);",
      options: ["2", "11", "undefined", "error"],
      correctAnswer: "2",
      language: "javascript",
    },
    {
      id: "q2",
      question: "Fix this code to return the sum of two numbers",
      codeSnippet: "function add(a, b) {\n  return\n}",
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

// Mock useQuiz hook
const mockUseQuiz = {
  quizData: null,
  currentQuestion: 0,
  userAnswers: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  results: null,
  isCompleted: false,
  loadQuiz: jest.fn().mockResolvedValue(mockQuizData),
  resetQuizState: jest.fn(),
  nextQuestion: jest.fn(),
  previousQuestion: jest.fn(),
  saveAnswer: jest.fn(),
  submitQuiz: jest.fn().mockResolvedValue({}),
  getResults: jest.fn(),
  requireAuthentication: jest.fn(),
}

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
    useQuizMock = mockUseQuiz,
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
  }
}

describe("Code Quiz Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("should initialize and load quiz data", async () => {
    const { store } = renderWithProviders(<CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />)

    // Should show loading initially
    expect(screen.getByTestId("initializing-display")).toBeInTheDocument()

    // Mock the quiz data loading
    await act(async () => {
      await mockUseQuiz.loadQuiz.mock.results[0].value
    })

    // Update the mock to return loaded quiz data
    const updatedUseQuiz = {
      ...mockUseQuiz,
      quizData: mockQuizData,
    }
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(updatedUseQuiz)

    // Re-render with loaded data
    renderWithProviders(<CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />, {
      useQuizMock: updatedUseQuiz,
    })

    // Should show the first question
    await waitFor(() => {
      expect(screen.getByTestId("coding-quiz")).toBeInTheDocument()
      expect(screen.getByTestId("question-text")).toHaveTextContent("What is the output of this code?")
    })
  })

  test("should handle quiz navigation and submission", async () => {
    // Start with quiz data already loaded
    const useQuizWithData = {
      ...mockUseQuiz,
      quizData: mockQuizData,
    }

    renderWithProviders(<CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />, {
      useQuizMock: useQuizWithData,
    })

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
    const useQuizSecondQuestion = {
      ...useQuizWithData,
      currentQuestion: 1,
    }
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(useQuizSecondQuestion)

    // Re-render with second question
    renderWithProviders(<CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />, {
      useQuizMock: useQuizSecondQuestion,
    })

    // Should show the second question
    await waitFor(() => {
      expect(screen.getByText("Question 2/2")).toBeInTheDocument()
      expect(screen.getByText("Submit Quiz")).toBeInTheDocument()
    })

    // Submit the quiz
    fireEvent.click(screen.getByText("Submit Quiz"))

    // Verify submitQuiz was called
    expect(useQuizSecondQuestion.submitQuiz).toHaveBeenCalled()
    expect(mockRouter.replace).toHaveBeenCalledWith("/dashboard/code/test-quiz/results")
  })

  test("should handle authentication requirements", async () => {
    // Set unauthenticated session
    const unauthenticatedSession = { data: null, status: "unauthenticated" }

    renderWithProviders(<CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId={null} />, {
      session: unauthenticatedSession,
    })

    // Should show authentication error
    expect(screen.getByTestId("error-display")).toBeInTheDocument()
    expect(screen.getByText("Please sign in to access this quiz")).toBeInTheDocument()

    // Click the retry button which should trigger sign in
    fireEvent.click(screen.getByText("Retry"))
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining("/auth/signin"))
  })

  test("should handle quiz errors", async () => {
    // Set error state
    const useQuizWithError = {
      ...mockUseQuiz,
      error: "Failed to load quiz data",
    }

    renderWithProviders(<CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />, {
      useQuizMock: useQuizWithError,
    })

    // Should show error display
    expect(screen.getByTestId("error-display")).toBeInTheDocument()
    expect(screen.getByText("Failed to load quiz data")).toBeInTheDocument()

    // Click retry
    fireEvent.click(screen.getByText("Retry"))
    expect(window.location.reload).toHaveBeenCalled()
  })

  test("should handle empty quiz data", async () => {
    // Set empty quiz data
    const useQuizWithEmptyData = {
      ...mockUseQuiz,
      quizData: { ...mockQuizData, questions: [] },
    }

    renderWithProviders(<CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />, {
      useQuizMock: useQuizWithEmptyData,
    })

    // Should show empty questions display
    expect(screen.getByTestId("empty-questions")).toBeInTheDocument()

    // Click return
    fireEvent.click(screen.getByText("Return"))
    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/quizzes")
  })
})
