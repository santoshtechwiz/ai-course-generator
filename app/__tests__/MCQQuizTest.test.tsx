"use client"

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { Provider } from "react-redux"
import { SessionProvider } from "next-auth/react"
import { configureStore } from "@reduxjs/toolkit"
import quizReducer from "@/store/slices/quizSlice"
import "@testing-library/jest-dom"

import toast from "react-hot-toast"
import { MockAnimationProvider } from "./mocks/mockAnimationProvider"
import MCQQuizWrapper from "../dashboard/(quiz)/mcq/components/McqQuizWrapper"

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
const mockSignIn = jest.fn()
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: { user: { id: "test-user" } },
    status: "authenticated",
  })),
  signIn: jest.fn((provider, options) => mockSignIn(provider, options)),
  SessionProvider: ({ children }) => <div>{children}</div>,
}))

// Mock toast
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
  promise: jest.fn(),
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

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key) => store[key] ?? null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    length: 0,
    key: jest.fn((index) => "")
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock });

// Mock components
jest.mock("../dashboard/(quiz)/mcq/components/MCQQuiz", () => {
  return function MockMCQQuiz({ 
    question, 
    onAnswer, 
    questionNumber, 
    totalQuestions, 
    isLastQuestion,
  }) {
    return (
      <div data-testid="mcq-quiz">
        <h2>Question {questionNumber}/{totalQuestions}</h2>
        <div data-testid="question-text">{question.question}</div>
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
          onClick={() => onAnswer(question.options[0], 10, question.options[0] === question.correctAnswer)}
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

// Mock MCQResultPreview component
jest.mock("../dashboard/(quiz)/mcq/components/MCQResultPreview", () => {
  return function MockMCQResultPreview({ result, onSubmit, onCancel }) {
    return (
      <div data-testid="mcq-quiz-result-preview">
        <h2>Preview Results</h2>
        <p>Score: {result.score}/{result.maxScore}</p>
        <button data-testid="submit-results" onClick={() => onSubmit([{questionId: "q1", answer: "Option 1"}], 60)}>
          Submit Results
        </button>
        <button data-testid="cancel-submit" onClick={onCancel}>
          Cancel
        </button>
      </div>
    )
  }
})

// Mock server API
global.fetch = jest.fn();

// Create test quiz data
const mockQuizData = {
  id: "test-quiz",
  title: "Test MCQ Quiz",
  description: "A test quiz for integration testing",
  type: "mcq",
  slug: "test-quiz",
  isPublic: true,
  questions: [
    {
      id: "q1",
      question: "What is 1 + 1?",
      options: ["1", "2", "3", "4"],
      correctAnswer: "2",
      type: "mcq",
    },
    {
      id: "q2",
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: "Paris",
      type: "mcq",
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

// Mock saveAuthRedirectState function
const mockSaveAuthRedirectState = jest.fn();
jest.mock("@/store/middleware/persistQuizMiddleware", () => ({
  loadAuthRedirectState: jest.fn().mockReturnValue(null),
  clearAuthRedirectState: jest.fn(),
  saveAuthRedirectState: jest.fn((...args) => mockSaveAuthRedirectState(...args)),
  hasAuthRedirectState: jest.fn().mockReturnValue(false),
}));

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

// Helper function for rendering with providers
function renderWithProviders(ui, options = {}) {
  const store = options.store || setupStore()
  return render(
    <Provider store={store}>
      <SessionProvider>
        <MockAnimationProvider>
          {ui}
        </MockAnimationProvider>
      </SessionProvider>
    </Provider>,
    options
  )
}

describe("MCQ Quiz Component", () => {
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

    renderWithProviders(
      <MCQQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
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

    renderWithProviders(
      <MCQQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
    )

    // Verify quiz content is displayed
    expect(screen.getByTestId("mcq-quiz")).toBeInTheDocument()
    expect(screen.getByText("Question 1/2")).toBeInTheDocument()
    expect(screen.getByText("What is 1 + 1?")).toBeInTheDocument()
    
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

    renderWithProviders(
      <MCQQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
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

    const { rerender } = renderWithProviders(
      <MCQQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
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
            { questionId: "q2", answer: "Paris" }
          ],
          isLastQuestion: true
        },
        quizData: mockQuizData,
        currentQuestion: 1,
        userAnswers: [
          { questionId: "q1", answer: "2" },
          { questionId: "q2", answer: "Paris" }
        ],
        isLoading: false,
        isLastQuestion: () => true,
        // Force preview results to show in test
        _showResultsPreview: true,
        _previewResults: {
          score: 2,
          maxScore: 2,
          percentage: 100,
          title: "Test Quiz",
          slug: "test-quiz",
          questions: []
        }
      })
    )

    // Re-render to trigger state update using the existing rerender function
    rerender(
      <Provider store={setupStore()}>
        <SessionProvider>
          <MockAnimationProvider>
            <MCQQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
          </MockAnimationProvider>
        </SessionProvider>
      </Provider>
    )
    
    // Wait for results preview
    await waitFor(() => {
      expect(screen.queryByTestId("mcq-quiz-result-preview")).toBeInTheDocument()
    })
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

    renderWithProviders(
      <MCQQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
    )
    
    // Verify error is displayed
    expect(screen.getByTestId("error-display")).toBeInTheDocument()
    expect(screen.getByText("Failed to load quiz data")).toBeInTheDocument()
    
    // Verify retry button exists
    expect(screen.getByTestId("retry-button")).toBeInTheDocument()
  })

  test("should handle error with submission", async () => {
    // Setup submission error that won't crash tests
    const mockError = new Error("Failed to submit quiz");
    const mockSubmitQuiz = jest.fn().mockImplementation(() => Promise.reject(mockError));
    
    // Mock toast to track calls
    jest.spyOn(toast, 'error');
    
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(
      createMockUseQuiz({
        quiz: {
          data: mockQuizData,
          currentQuestion: 1,
          userAnswers: [{ questionId: "q1", answer: "2" }],
          isLastQuestion: true
        },
        quizData: mockQuizData,
        actions: {
          submitQuiz: mockSubmitQuiz,
        },
        submitQuiz: mockSubmitQuiz,
        // Force preview mode in tests
        _showResultsPreview: true,
        _previewResults: {
          score: 2,
          maxScore: 2,
          percentage: 100,
          title: "Test Quiz",
          slug: "test-quiz",
          questions: []
        }
      })
    );

    renderWithProviders(
      <MCQQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
    );
    
    // Wait for the submit button to be available
    await waitFor(() => {
      expect(screen.getByTestId("submit-results")).toBeInTheDocument();
    });
    
    // Click submit and handle the error safely using act
    await act(async () => {
      fireEvent.click(screen.getByTestId("submit-results"));
      
      // Short wait to let error propagate
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Verify error handling
    await waitFor(() => {
      expect(mockSubmitQuiz).toHaveBeenCalled();
    });
    
    // Verify toast error is called
    expect(toast.error).toHaveBeenCalledWith("Failed to submit quiz. Please try again.");
  })
})
