"use client"

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { Provider } from "react-redux"
import { SessionProvider } from "next-auth/react"
import { configureStore } from "@reduxjs/toolkit"
import quizReducer from "@/store/slices/quizSlice"
import "@testing-library/jest-dom"
import { MockAnimationProvider } from "@/__tests__/mocks/mockAnimationProvider.test"
import CodeQuizWrapper from "@/app/dashboard/(quiz)/code/components/CodeQuizWrapper"
import toast from "react-hot-toast"


// Mock next/navigation with proper implementation for tracking replace calls
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: mockReplace, // Use the tracked mockReplace
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

// Mock toast
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
  promise: jest.fn().mockImplementation((promise) => promise),
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

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key) => store[key] ?? null),
    setItem: jest.fn((key, value) => { store[key] = String(value) }),
    removeItem: jest.fn((key) => { delete store[key] }),
    clear: jest.fn(() => { store = {} }),
    length: 0,
    key: jest.fn((index) => "")
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock })

// Mock components
jest.mock("../dashboard/(quiz)/code/components/CodingQuiz", () => ({
  __esModule: true,
  default: ({ question, onAnswer, questionNumber, totalQuestions, isLastQuestion }) => (
    <div data-testid="coding-quiz">
      <h2>Question {questionNumber}/{totalQuestions}</h2>
      <div data-testid="question-text">{question.question}</div>
      <button data-testid="submit-answer" onClick={() => onAnswer("test answer", 10, true)}>
        {isLastQuestion ? "Submit Quiz" : "Next"}
      </button>
    </div>
  )
}))

// Mock QuizResultPreview
jest.mock("../dashboard/(quiz)/code/components/QuizResultPreview", () => ({
  __esModule: true,
  default: ({ result, onSubmit, userAnswers }) => (
    <div data-testid="quiz-result-preview">
      <div>Score: {result.score}/{result.maxScore}</div>
      <button data-testid="submit-results" onClick={() => 
        onSubmit(userAnswers || [{ questionId: "q1", answer: "test" }], 60)
      }>
        Submit Results
      </button>
    </div>
  )
}))

// Mock QuizStateDisplay components
jest.mock("../dashboard/(quiz)/components/QuizStateDisplay", () => ({
  InitializingDisplay: () => <div data-testid="initializing-display">Loading...</div>,
  ErrorDisplay: ({ error }) => <div data-testid="error-display">{error}</div>,
  EmptyQuestionsDisplay: () => <div data-testid="empty-questions">No questions</div>,
}))

// Mock QuizSubmissionLoading
jest.mock("../dashboard/(quiz)/components/QuizSubmissionLoading", () => ({
  QuizSubmissionLoading: () => <div data-testid="quiz-submission-loading">Submitting...</div>,
}))

// Mock middleware
jest.mock("@/store/middleware/persistQuizMiddleware", () => ({
  loadAuthRedirectState: jest.fn(() => null),
  hasAuthRedirectState: jest.fn(() => false),
  clearAuthRedirectState: jest.fn(),
  saveAuthRedirectState: jest.fn(),
}))

// Mock test quiz data
const mockQuizData = {
  id: "test-quiz-id",
  title: "Test Code Quiz",
  slug: "test-quiz",
  type: "code",
  questions: [
    {
      id: "q1",
      question: "What is the output of console.log(1 + 1)?",
      options: ["2", "11", "undefined", "error"],
      correctAnswer: "2",
      language: "javascript",
      type: "code",
    },
    {
      id: "q2",
      question: "What is the time complexity of binary search?",
      options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
      correctAnswer: "O(log n)",
      language: "javascript", 
      type: "code",
    }
  ],
}

// Mock createResultsPreview helper function
const mockCreateResultsPreview = jest.fn(() => ({
  score: 2,
  maxScore: 2,
  percentage: 100,
  title: "Test Code Quiz",
  slug: "test-quiz",
  questions: []
}))

// Mock the QuizHelpers module
jest.mock("../dashboard/(quiz)/code/components/QuizHelpers", () => ({
  createResultsPreview: (params) => mockCreateResultsPreview(params)
}))

// Create mock useQuiz hook
const createMockUseQuiz = (overrides = {}) => ({
  quiz: {
    data: mockQuizData,
    currentQuestion: 1,
    userAnswers: [
      { questionId: "q1", answer: "2" },
      { questionId: "q2", answer: "O(log n)" }
    ],
    isLastQuestion: true
  },
  status: {
    isLoading: false,
    isSubmitting: false,
    errorMessage: null,
  },
  actions: {
    submitQuiz: jest.fn().mockResolvedValue({
      score: 2,
      maxScore: 2,
      percentage: 100,
    }),
    saveAnswer: jest.fn(),
  },
  navigation: {
    next: jest.fn(),
  },
  ...overrides,
})

// Setup test store
const setupStore = () => configureStore({ reducer: { quiz: quizReducer } })

describe("Code Quiz Submission Flow", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
    mockReplace.mockClear(); // Ensure mockReplace is cleared
  })

  test("handles submission payload correctly", async () => {
    // Mock the submission function
    const mockSubmitQuiz = jest.fn().mockResolvedValue({
      score: 2,
      maxScore: 2,
      percentage: 100,
      submittedAt: new Date().toISOString()
    })

    // Force a previewResults state by setting up mock quiz hook
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(
      createMockUseQuiz({
        actions: {
          submitQuiz: mockSubmitQuiz,
          saveAnswer: jest.fn(),
        },
        submitQuiz: mockSubmitQuiz,
      })
    )
    
    // Render component
    const { rerender } = render(
      <Provider store={setupStore()}>
        <SessionProvider>
          <MockAnimationProvider>
            <CodeQuizWrapper 
              slug="test-quiz" 
              quizId="test-quiz-id" 
              userId="test-user" 
            />
          </MockAnimationProvider>
        </SessionProvider>
      </Provider>
    )

    // First, let's click the submit button for the last question
    fireEvent.click(screen.getByTestId("submit-answer"))
    
    // Now rerender with updated state to show preview
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(
      createMockUseQuiz({
        actions: {
          submitQuiz: mockSubmitQuiz,
          saveAnswer: jest.fn(),
        },
        submitQuiz: mockSubmitQuiz,
        quiz: {
          data: mockQuizData,
          currentQuestion: 1,
          userAnswers: [
            { questionId: "q1", answer: "2" },
            { questionId: "q2", answer: "O(log n)" }
          ],
          isLastQuestion: true
        },
        // This is for state inspection by the test
        _showResultsPreview: true,
        _previewResults: {
          score: 2,
          maxScore: 2,
          percentage: 100,
          title: "Test Code Quiz",
          slug: "test-quiz",
          questions: []
        }
      })
    )
    
    // Rerender to trigger state update
    rerender(
      <Provider store={setupStore()}>
        <SessionProvider>
          <MockAnimationProvider>
            <CodeQuizWrapper 
              slug="test-quiz" 
              quizId="test-quiz-id" 
              userId="test-user" 
            />
          </MockAnimationProvider>
        </SessionProvider>
      </Provider>
    )
    
    // Check if result preview is shown
    expect(await screen.findByTestId("quiz-result-preview")).toBeInTheDocument()
    
    // Click submit button
    await act(async () => {
      fireEvent.click(screen.getByTestId("submit-results"))
    })
    
    // Wait for submission logic
    await waitFor(() => {
      // Check if submission loading is shown
      expect(screen.getByTestId("quiz-submission-loading")).toBeInTheDocument()
    })
    
    // Check if submit was called with correct data
    expect(mockSubmitQuiz).toHaveBeenCalledWith(expect.objectContaining({
      quizId: "test-quiz-id",
      type: "code",
      answers: expect.arrayContaining([
        expect.objectContaining({ questionId: expect.any(String) })
      ]),
      timeTaken: expect.any(Number)
    }))
    
    // Use fake timers with explicit control
    jest.useFakeTimers();
    
    // Run pending timers
    await act(async () => {
      jest.runAllTimers(); 
    });
    
    // Verify redirect to results page - this should now work
    expect(mockReplace).toHaveBeenCalledWith("/dashboard/code/test-quiz/results");
    
    // Restore timers
    jest.useRealTimers();
  })

  test("handles server-side validation errors", async () => {
    // Create error response with validation error
    const validationError = {
      status: 400,
      message: "Validation failed",
      data: { 
        validationError: "One or more answers were invalid",
        score: 1,
        maxScore: 2
      }
    };
    
    const mockSubmitWithValidationError = jest.fn().mockImplementation(() => {
      return Promise.reject(validationError);
    });
    
    // Mock toast for testing error messages
    jest.spyOn(toast, 'error');
    
    // Setup mock quiz state - directly mock the results preview state
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(
      createMockUseQuiz({
        actions: {
          submitQuiz: mockSubmitWithValidationError
        },
        submitQuiz: mockSubmitWithValidationError,
        // Add this previewResults state to ensure the preview component renders
        _showResultsPreview: true,
        _previewResults: {
          score: 2,
          maxScore: 2,
          percentage: 100,
          title: "Test Code Quiz",
          slug: "test-quiz",
          questions: []
        }
      })
    );
    
    // Mock ErrorDisplay component to be rendered when error occurs
    jest.mock("../dashboard/(quiz)/components/QuizStateDisplay", () => ({
      ...jest.requireActual("../dashboard/(quiz)/components/QuizStateDisplay"),
      ErrorDisplay: ({ error }) => (
        <div data-testid="error-display">{error}</div>
      ),
    }), { virtual: true });
    
    // Render component - the preview should show immediately because we mocked _showResultsPreview
    render(
      <Provider store={setupStore()}>
        <SessionProvider>
          <MockAnimationProvider>
            <CodeQuizWrapper 
              slug="test-quiz" 
              quizId="test-quiz-id" 
              userId="test-user" 
            />
          </MockAnimationProvider>
        </SessionProvider>
      </Provider>
    );
    
    // Check that the preview is rendered
    expect(await screen.findByTestId("quiz-result-preview")).toBeInTheDocument();
    
    // Click submit button with proper error handling
    await act(async () => {
      fireEvent.click(screen.getByTestId("submit-results"));
      
      // Allow time for async error handling
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    
    // Verify validation error was handled
    expect(mockSubmitWithValidationError).toHaveBeenCalled();
    
    // Check that toast.error was called
    expect(toast.error).toHaveBeenCalledWith("Failed to submit quiz. Please try again.");
    
    // Verify error display is shown
    await waitFor(() => {
      expect(screen.queryByTestId("quiz-submission-loading")).not.toBeInTheDocument();
      expect(screen.getByTestId("error-display")).toBeInTheDocument();
    });
  })

  test("handles missing quiz ID in payload", async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Setup quiz with null ID
    const quizWithNoId = {
      ...mockQuizData,
      id: null // Missing ID
    }
    
    const mockSubmit = jest.fn().mockResolvedValue({
      score: 2,
      maxScore: 2,
    })
    
    // Setup mock quiz state - directly start with preview state
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(
      createMockUseQuiz({
        quiz: {
          data: quizWithNoId,
          currentQuestion: 1,
          userAnswers: [
            { questionId: "q1", answer: "2" },
            { questionId: "q2", answer: "O(log n)" }
          ],
          isLastQuestion: true
        },
        actions: {
          submitQuiz: mockSubmit
        },
        submitQuiz: mockSubmit,
        // Add this to ensure preview render
        _showResultsPreview: true,
        _previewResults: {
          score: 2,
          maxScore: 2,
          percentage: 100,
          title: "Test Code Quiz",
          slug: "test-quiz",
          questions: []
        }
      })
    )
    
    // Render component (should show preview immediately)
    render(
      <Provider store={setupStore()}>
        <SessionProvider>
          <MockAnimationProvider>
            <CodeQuizWrapper 
              slug="test-quiz" 
              quizId="" // Empty quiz ID in props
              userId="test-user" 
            />
          </MockAnimationProvider>
        </SessionProvider>
      </Provider>
    )
    
    // Check that we have the preview component
    expect(await screen.findByTestId("quiz-result-preview")).toBeInTheDocument()
    
    // Click submit
    await act(async () => {
      fireEvent.click(screen.getByTestId("submit-results"))
    })
    
    // The quiz should still be submitted with the slug as fallback
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled()
      const submitCall = mockSubmit.mock.calls[0][0]
      expect(submitCall.quizId).toBeTruthy() // Should have a non-empty quizId
      expect(submitCall.slug).toBe("test-quiz") // Should use the slug
    })
    
    consoleErrorSpy.mockRestore()
  })
})
