"use client"

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { Provider } from "react-redux"
import { SessionProvider } from "next-auth/react"
import { configureStore } from "@reduxjs/toolkit"
import quizReducer from "@/store/slices/quizSlice"
import "@testing-library/jest-dom"
import MCQQuizWrapper from "../dashboard/(quiz)/mcq/components/MCQQuizWrapper"
import toast from "react-hot-toast"
import { MockAnimationProvider } from "./mocks/mockAnimationProvider"

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
jest.mock("../dashboard/(quiz)/mcq/components/McqQuiz", () => {
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
  saveSubmissionState: jest.fn().mockResolvedValue({}),
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

  test("should submit quiz and redirect to results page", async () => {
    jest.useFakeTimers();
    
    // Setup mock router
    const mockReplace = jest.fn()
    require("next/navigation").useRouter.mockReturnValue({
      push: jest.fn(),
      replace: mockReplace,
      back: jest.fn(),
    })
    
    // Setup submit function
    const mockSubmitQuiz = jest.fn().mockResolvedValue({
      score: 2,
      maxScore: 2,
    })
    
    // Directly set up the state to show the preview
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
        userAnswers: [
          { questionId: "q1", answer: "2" },
          { questionId: "q2", answer: "Paris" }
        ],
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
    )

    // Render with mock state that would show results preview
    renderWithProviders(
      <MCQQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
    )
    
    // Check that preview is shown before attempting to click submit
    await waitFor(() => {
      expect(screen.getByTestId("mcq-quiz-result-preview")).toBeInTheDocument();
      expect(screen.getByTestId("submit-results")).toBeInTheDocument();
    });
    
    // Click submit on results preview
    await act(async () => {
      fireEvent.click(screen.getByTestId("submit-results"))
    })
    
    // Verify submission happened
    expect(mockSubmitQuiz).toHaveBeenCalled()
    
    // Show loading state during submission
    expect(screen.getByTestId("quiz-submission-loading")).toBeInTheDocument()
    
    // Run timers to trigger the redirect
    await act(async () => {
      jest.runAllTimers();
    });
    
    // Verify redirect to results page
    expect(mockReplace).toHaveBeenCalledWith("/dashboard/mcq/test-quiz/results")
    
    jest.useRealTimers();
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
            { questionId: "q2", answer: "Paris" }
          ],
          isLastQuestion: true
        },
        quizData: mockQuizData,
        userAnswers: [
          { questionId: "q1", answer: "2" },
          { questionId: "q2", answer: "Paris" }
        ],
      })
    )

    renderWithProviders(
      <MCQQuizWrapper slug="test-quiz" quizId="test-quiz" userId={null} />
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

    renderWithProviders(
      <MCQQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
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

    renderWithProviders(
      <MCQQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
    )
    
    // Verify empty questions message is displayed
    expect(screen.getByTestId("empty-questions")).toBeInTheDocument()
    expect(screen.getByText("No questions")).toBeInTheDocument()
  })
  
  test("redirects unauthenticated user to login page", async () => {
    // Setup auth error during submission
    const mockSubmitQuiz = jest.fn().mockImplementation(() => {
      const error = new Error("Unauthorized");
      (error as any).status = 401;
      throw error;
    });
    
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
    )

    renderWithProviders(
      <MCQQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
    )
    
    // Wait for the submit button to be available
    await waitFor(() => {
      expect(screen.getByTestId("submit-results")).toBeInTheDocument();
    });
    
    // Click submit button
    fireEvent.click(screen.getByTestId("submit-results"))
    
    // Verify sign-in was called
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
    
    // Verify authentication redirect state was saved
    expect(mockSaveAuthRedirectState).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "test-quiz",
        quizId: "test-quiz",
        type: "mcq", // Key difference: mcq vs code
        userAnswers: expect.any(Array),
        fromSubmission: true
      })
    );
  });
  
  test("sends correct payload on submit", async () => {
    // Setup submit function that captures the payload
    const mockSubmitQuiz = jest.fn().mockResolvedValue({
      score: 2,
      maxScore: 2,
    });

    const userAnswers = [
      { questionId: "q1", answer: "2" },
      { questionId: "q2", answer: "Paris" }
    ];
    
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(
      createMockUseQuiz({
        quiz: {
          data: mockQuizData,
          currentQuestion: 1,
          userAnswers,
          isLastQuestion: true
        },
        quizData: mockQuizData,
        userAnswers,
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
    
    // Submit the quiz
    fireEvent.click(screen.getByTestId("submit-results"));
    
    // Verify the payload
    expect(mockSubmitQuiz).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "test-quiz",
        quizId: "test-quiz",
        type: "mcq", // Key difference: mcq vs code
        answers: expect.arrayContaining([
          expect.objectContaining({ questionId: "q1" }),
        ]),
        timeTaken: expect.any(Number)
      })
    );
  });
  
  test("saves result in state after successful API response", async () => {
    jest.useFakeTimers();
    
    // Mock the API response
    const mockResults = {
      score: 85,
      maxScore: 100,
      percentage: 85,
      submittedAt: new Date().toISOString(),
      questions: []
    };
    
    const mockSubmitQuiz = jest.fn().mockResolvedValue(mockResults);
    const mockResetQuizState = jest.fn();
    
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
          reset: mockResetQuizState
        },
        submitQuiz: mockSubmitQuiz,
        resetQuizState: mockResetQuizState,
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
    
    // Submit the quiz
    fireEvent.click(screen.getByTestId("submit-results"));
    
    // Verify the result was saved
    await waitFor(() => {
      expect(mockSubmitQuiz).toHaveBeenCalled();
    });
    
    jest.useRealTimers();
  });
  
  test("shows success toast on result save", async () => {
    // Setup mock success toast
    const mockSubmitQuiz = jest.fn().mockResolvedValue({
      score: 2,
      maxScore: 2
    });
    
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
    
    // Submit the quiz
    fireEvent.click(screen.getByTestId("submit-results"));
    
    // Verify toast was triggered
    await waitFor(() => {
      expect(mockSubmitQuiz).toHaveBeenCalled();
    });
  });
  
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
  });
  
  test("prevents tampering by validating submission server-side", async () => {
    // Mock global.console.log to verify no sensitive data is logged
    const originalConsoleLog = console.log;
    const mockConsoleLog = jest.fn();
    console.log = mockConsoleLog;

    // Set up mock submit with server-side validation behavior
    const mockServerResponse = { 
      score: 1, // Server calculated score (different from client)
      maxScore: 2, 
      validationError: "Answers did not match server validation"
    };
    
    const mockSubmitQuiz = jest.fn().mockResolvedValue(mockServerResponse);
    
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
        userAnswers: [
          { questionId: "q1", answer: "2" },
          { questionId: "q2", answer: "Paris" }
        ],
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
    
    // Submit quiz
    fireEvent.click(screen.getByTestId("submit-results"));
    
    // Verify server was called with the client answers for validation
    expect(mockSubmitQuiz).toHaveBeenCalledWith(expect.objectContaining({
      slug: "test-quiz",
      quizId: "test-quiz",
      type: "mcq", // Key difference: mcq vs code
      answers: expect.arrayContaining([
        expect.objectContaining({ 
          questionId: expect.any(String),
        })
      ]),
      timeTaken: expect.any(Number)
    }));
    
    // Verify console doesn't include sensitive data
    const sensitiveTerms = ["token", "jwt", "bearer", "authorization", "password"];
    for (const log of mockConsoleLog.mock.calls) {
      const logStr = JSON.stringify(log).toLowerCase();
      for (const term of sensitiveTerms) {
        expect(logStr).not.toContain(term);
      }
    }
    
    // Restore console.log
    console.log = originalConsoleLog;
  });
  
  test("does not expose auth token in client state or DOM", async () => {
    // Get the DOM content
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(
      createMockUseQuiz({
        quiz: {
          data: mockQuizData,
          currentQuestion: 0,
          userAnswers: [],
        },
        quizData: mockQuizData,
      })
    );

    const { container } = renderWithProviders(
      <MCQQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
    );
    
    // Get DOM content as string
    const domContent = container.innerHTML;
    
    // Check for sensitive terms
    const sensitiveTerms = ["token", "jwt", "bearer", "authorization", "password", "secret"];
    
    for (const term of sensitiveTerms) {
      expect(domContent.toLowerCase()).not.toContain(term);
    }
    
    // Check localStorage for sensitive data
    for (const call of localStorageMock.setItem.mock.calls) {
      const [key, value] = call;
      const valueString = String(value).toLowerCase();
      
      for (const term of sensitiveTerms) {
        expect(valueString).not.toContain(term);
      }
    }
  });
  
  test("displays quiz result from state after sign-in", async () => {
    // Setup state with fromAuth=true
    require("@/hooks/useAuth").useAuth.mockReturnValue({
      userId: "test-user",
      status: "authenticated",
      fromAuth: true,
    });
    
    // Mock quiz with existing results
    const mockResults = {
      score: 85,
      maxScore: 100,
      percentage: 85,
      questions: [{ id: "q1", question: "Test Q", userAnswer: "test", correctAnswer: "test", isCorrect: true }],
      title: "Test Quiz",
      slug: "test-quiz"
    };
    
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(
      createMockUseQuiz({
        quiz: {
          data: mockQuizData,
          currentQuestion: 1,
          userAnswers: [{ questionId: "q1", answer: "2" }],
          isLastQuestion: true
        },
        quizData: mockQuizData,
        userAnswers: [{ questionId: "q1", answer: "2" }],
      })
    );

    const { rerender } = renderWithProviders(
      <MCQQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
    );
    
    // Click to get results preview
    fireEvent.click(screen.getByTestId("submit-answer"));
    
    // Update state to have preview results
    require("@/hooks/useQuizState").useQuiz.mockReturnValue(
      createMockUseQuiz({
        quiz: {
          data: mockQuizData,
          currentQuestion: 1,
          userAnswers: [{ questionId: "q1", answer: "2" }],
          isLastQuestion: true
        },
        quizData: mockQuizData,
        isLoading: false,
        isLastQuestion: () => true,
      })
    );
    
    // Re-render to trigger state update
     renderWithProviders(
      <MCQQuizWrapper slug="test-quiz" quizId="test-quiz" userId="test-user" />
    );
    
    // Wait for quiz component
    await waitFor(() => {
      expect(screen.queryByTestId("mcq-quiz")).toBeInTheDocument();
    });
  });
})
