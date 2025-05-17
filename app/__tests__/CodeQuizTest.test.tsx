"use client"

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
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
  SessionProvider: ({ children }) => <div>{children}</div>,
}))

// Mock hooks
jest.mock("@/hooks/useQuizState", () => ({
  useQuiz: jest.fn(),
}))

// Mock useAuth hook
jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(() => ({
    userId: "test-user",
    status: "authenticated",
    fromAuth: false,
  })),
}))

// Mock components
jest.mock("../dashboard/(quiz)/code/components/CodingQuiz", () => {
  return function MockCodingQuiz({ 
    question, 
    onAnswer, 
    questionNumber, 
    totalQuestions, 
    isLastQuestion,
  }) {
    return (
      <div data-testid="coding-quiz">
        <h2>Question {questionNumber}/{totalQuestions}</h2>
        <div data-testid="question-text">{question.question}</div>
        {question.codeSnippet && <pre data-testid="code-snippet">{question.codeSnippet}</pre>}
        <div data-testid="options">
          {question.options?.map((option, index) => (
            <button
              key={index}
              data-testid={`option-${index}`}
              onClick={() => onAnswer(option, 10, option === question.correctAnswer)}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          data-testid="submit-answer"
          onClick={() => onAnswer("test answer", 10, true)}
        >
          {isLastQuestion ? "Submit Quiz" : "Next"}
        </button>
      </div>
    )
  }
})

// Mock display components
jest.mock("../dashboard/(quiz)/components/QuizStateDisplay", () => ({
  InitializingDisplay: () => <div data-testid="initializing-display">Loading...</div>,
  QuizNotFoundDisplay: ({ onReturn }) => (
    <div data-testid="quiz-not-found">
      Quiz not found
      <button onClick={onReturn}>Return</button>
    </div>
  ),
  ErrorDisplay: ({ error, onRetry, onReturn }) => (
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
  EmptyQuestionsDisplay: ({ onReturn }) => (
    <div data-testid="empty-questions">
      No questions
      <button onClick={onReturn}>Return</button>
    </div>
  ),
}))

// Mock the QuizSubmissionLoading component
jest.mock("../dashboard/(quiz)/components/QuizSubmissionLoading", () => ({
  QuizSubmissionLoading: () => (
    <div data-testid="quiz-submission-loading">
      Submitting quiz...
    </div>
  ),
}))

// Mock NonAuthenticatedUserSignInPrompt component
jest.mock("../dashboard/(quiz)/components/NonAuthenticatedUserSignInPrompt", () => {
  return function MockNonAuthPrompt({ onSignIn, showSaveMessage }) {
    return (
      <div data-testid="non-authenticated-prompt">
        <p>Sign in to view your results</p>
        <button data-testid="sign-in-button" onClick={onSignIn}>
          Sign In
        </button>
        {showSaveMessage && <p data-testid="save-message">Your progress will be saved</p>}
      </div>
    )
  }
})

// Mock QuizResultPreview component
jest.mock("../dashboard/(quiz)/code/components/QuizResultPreview", () => {
  return function MockQuizResultPreview({ result, onSubmit, onCancel }) {
    return (
      <div data-testid="quiz-result-preview">
        <h2>Preview Results</h2>
        <p>Score: {result.score}/{result.maxScore}</p>
        <button data-testid="submit-results" onClick={() => onSubmit([{questionId: "q1", answer: "test"}], 60)}>
          Submit Results
        </button>
        <button data-testid="cancel-submit" onClick={onCancel}>
          Cancel
        </button>
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
  questions: [
    {
      id: "q1",
      question: "What is the output of this code?",
      codeSnippet: "console.log(1 + 1);",
      options: ["2", "11", "undefined", "error"],
      correctAnswer: "2",
      language: "javascript",
      type: "code",
    },
    {
      id: "q2",
      question: "Fix this code to return the sum of two numbers",
      codeSnippet: "function add(a, b) {\n  return\n}",
      answer: "function add(a, b) {\n  return a + b\n}",
      language: "javascript",
      type: "code",
    },
  ],
}

// Create mock hooks
const createMockUseQuiz = (overrides = {}) => ({
  // New API format
  quiz: {
    data: null,
    currentQuestion: 0,
    userAnswers: [],
    isLastQuestion: false,
    progress: 0,
    remainingTimeFormatted: "00:00"
  },
  status: {
    isLoading: false,
    isSubmitting: false,
    isCompleted: false,
    hasError: false,
    errorMessage: null
  },
  actions: {
    loadQuiz: jest.fn().mockResolvedValue(mockQuizData),
    submitQuiz: jest.fn().mockResolvedValue({
      score: 2,
      maxScore: 2,
    }),
    saveAnswer: jest.fn(),
    getResults: jest.fn(),
    reset: jest.fn(),
  },
  navigation: {
    next: jest.fn(),
    previous: jest.fn(),
    toQuestion: jest.fn(),
  },
  // Old API format for compatibility
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
  saveAnswer: jest.fn(),
  submitQuiz: jest.fn().mockResolvedValue({
    score: 2,
    maxScore: 2,
  }),
  isLastQuestion: jest.fn().mockReturnValue(false),
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

describe("Code Quiz Component", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("should display loading state initially", async () => {
    // Setup loading state
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(
      createMockUseQuiz({
        isLoading: true,
        status: { isLoading: true }
      })
    )

    render(
      <Provider store={setupStore()}>
        <SessionProvider>
          <CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
        </SessionProvider>
      </Provider>
    )

    // Check for loading indicator
    expect(screen.getByTestId("initializing-display")).toBeInTheDocument()
  })

  test("should display quiz questions when loaded", async () => {
    // Setup loaded quiz data
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(
      createMockUseQuiz({
        quiz: {
          data: mockQuizData,
          currentQuestion: 0,
          userAnswers: [],
          isLastQuestion: false
        },
        quizData: mockQuizData,
        isLoading: false,
      })
    )

    render(
      <Provider store={setupStore()}>
        <SessionProvider>
          <CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
        </SessionProvider>
      </Provider>
    )

    // Verify quiz content is displayed
    expect(screen.getByTestId("coding-quiz")).toBeInTheDocument()
    expect(screen.getByText("Question 1/2")).toBeInTheDocument()
    expect(screen.getByText("What is the output of this code?")).toBeInTheDocument()
    expect(screen.getByTestId("code-snippet")).toHaveTextContent("console.log(1 + 1);")
    
    // Check options are displayed
    expect(screen.getByTestId("options")).toBeInTheDocument()
  })

  test("should navigate to next question when answering", async () => {
    // Setup mock functions to track calls
    const mockSaveAnswer = jest.fn()
    const mockNextQuestion = jest.fn()
    
    // Setup hook with mocked functions
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(
      createMockUseQuiz({
        quiz: {
          data: mockQuizData,
          currentQuestion: 0,
          userAnswers: [],
          isLastQuestion: false
        },
        quizData: mockQuizData,
        isLoading: false,
        actions: {
          saveAnswer: mockSaveAnswer,
        },
        navigation: {
          next: mockNextQuestion,
        },
        saveAnswer: mockSaveAnswer,
        nextQuestion: mockNextQuestion,
      })
    )

    render(
      <Provider store={setupStore()}>
        <SessionProvider>
          <CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
        </SessionProvider>
      </Provider>
    )

    // Click to answer the first question
    fireEvent.click(screen.getByTestId("submit-answer"))

    // Verify answer was saved and navigation occurred
    expect(mockSaveAnswer).toHaveBeenCalled()
    expect(mockNextQuestion).toHaveBeenCalled()
  })

  test("should show results preview on last question", async () => {
    // Setup last question state
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(
      createMockUseQuiz({
        quiz: {
          data: mockQuizData,
          currentQuestion: 1,
          userAnswers: [{ questionId: "q1", answer: "2" }],
          isLastQuestion: true
        },
        quizData: mockQuizData,
        currentQuestion: 1,
        userAnswers: [{ questionId: "q1", answer: "2" }],
        isLoading: false,
        isLastQuestion: () => true,
      })
    )

    const { rerender } = render(
      <Provider store={setupStore()}>
        <SessionProvider>
          <CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
        </SessionProvider>
      </Provider>
    )

    // Answer last question
    fireEvent.click(screen.getByTestId("submit-answer"))
    
    // Update the mock to show preview state
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(
      createMockUseQuiz({
        quiz: {
          data: mockQuizData,
          currentQuestion: 1,
          userAnswers: [
            { questionId: "q1", answer: "2" },
            { questionId: "q2", answer: "test answer" }
          ],
          isLastQuestion: true
        },
        quizData: mockQuizData,
        currentQuestion: 1,
        userAnswers: [
          { questionId: "q1", answer: "2" },
          { questionId: "q2", answer: "test answer" }
        ],
        isLoading: false,
        isLastQuestion: () => true,
      })
    )

    // Re-render to trigger state update
    rerender(
      <Provider store={setupStore()}>
        <SessionProvider>
          <CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
        </SessionProvider>
      </Provider>
    )
    
    // Wait for results preview
    await waitFor(() => {
      expect(screen.queryByTestId("quiz-result-preview")).toBeInTheDocument()
    })
  })


  test("should show sign-in prompt for non-authenticated users", async () => {
    // Setup unauthenticated state
    require("@/hooks/useAuth").useAuth.mockReturnValue({
      userId: null,
      status: "unauthenticated",
      fromAuth: false,
    })
    
    // Setup hook with preview state
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(
      createMockUseQuiz({
        quiz: {
          data: mockQuizData,
          currentQuestion: 1,
          userAnswers: [
            { questionId: "q1", answer: "2" },
            { questionId: "q2", answer: "test answer" }
          ],
          isLastQuestion: true
        },
        quizData: mockQuizData,
        userAnswers: [
          { questionId: "q1", answer: "2" },
          { questionId: "q2", answer: "test answer" }
        ],
      })
    )

    render(
      <Provider store={setupStore()}>
        <SessionProvider>
          <CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId={null} />
        </SessionProvider>
      </Provider>
    )
    
    // Click to submit last question
    fireEvent.click(screen.getByTestId("submit-answer"))
    
    // Wait for sign-in prompt
    await waitFor(() => {
      expect(screen.getByTestId("non-authenticated-prompt")).toBeInTheDocument()
    })
    
    // Verify sign-in button is shown
    expect(screen.getByTestId("sign-in-button")).toBeInTheDocument()
    
    // Verify save message is shown
    expect(screen.getByTestId("save-message")).toBeInTheDocument()
  })

  test("should handle errors properly", async () => {
    // Setup error state
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(
      createMockUseQuiz({
        status: {
          errorMessage: "Failed to load quiz data",
          hasError: true,
        },
        error: "Failed to load quiz data",
      })
    )

    render(
      <Provider store={setupStore()}>
        <SessionProvider>
          <CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
        </SessionProvider>
      </Provider>
    )
    
    // Verify error is displayed
    expect(screen.getByTestId("error-display")).toBeInTheDocument()
    expect(screen.getByText("Failed to load quiz data")).toBeInTheDocument()
    
    // Verify retry button exists
    expect(screen.getByTestId("retry-button")).toBeInTheDocument()
  })

  test("should handle empty questions state", async () => {
    // Setup empty questions state
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(
      createMockUseQuiz({
        quiz: {
          data: { ...mockQuizData, questions: [] },
          currentQuestion: 0,
          userAnswers: [],
        },
        quizData: { ...mockQuizData, questions: [] },
      })
    )

    render(
      <Provider store={setupStore()}>
        <SessionProvider>
          <CodeQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
        </SessionProvider>
      </Provider>
    )
    
    // Verify empty questions message is displayed
    expect(screen.getByTestId("empty-questions")).toBeInTheDocument()
    expect(screen.getByText("No questions")).toBeInTheDocument()
  })
})
