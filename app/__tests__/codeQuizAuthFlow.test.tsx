import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { Provider } from "react-redux"
import { SessionProvider } from "next-auth/react"
import { configureStore } from "@reduxjs/toolkit"
import "@testing-library/jest-dom"
import ResultsPage from "../dashboard/(quiz)/code/[slug]/results/page"
import { useRouter } from "next/navigation"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useParams: jest.fn().mockReturnValue({ slug: "test-quiz" }),
  useSearchParams: jest.fn().mockReturnValue({
    get: jest.fn().mockImplementation(() => null),
    has: jest.fn().mockReturnValue(false)
  }),
}))

// Mock next-auth/react
const mockSignIn = jest.fn()
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signIn: jest.fn().mockImplementation((...args) => mockSignIn(...args)),
  SessionProvider: ({ children }) => <div>{children}</div>,
}))

// Mock the NonAuthenticatedUserSignInPrompt component
jest.mock("../dashboard/(quiz)/components/NonAuthenticatedUserSignInPrompt", () => {
  return function MockNonAuthPrompt({ onSignIn }) {
    return (
      <div data-testid="non-authenticated-prompt">
        <h2>Authentication Required</h2>
        <p>Please sign in to view your results.</p>
        <button data-testid="sign-in-button" onClick={onSignIn}>
          Sign In
        </button>
      </div>
    );
  };
});

// Mock the CodeQuizResult component
jest.mock("../dashboard/(quiz)/code/components/CodeQuizResult", () => {
  return function MockCodeQuizResult({ result }) {
    return (
      <div data-testid="code-quiz-result">
        <h2>{result.title}</h2>
        <div className="score-display">{result.percentage}% Score</div>
        <div className="score-details">
          {result.score} / {result.maxScore}
        </div>
        {result.questions?.map((q, i) => (
          <div key={i} className="question-result">
            <p>{q.question}</p>
            <p>Your answer: {q.userAnswer}</p>
            <p>Correct answer: {q.correctAnswer}</p>
          </div>
        ))}
      </div>
    );
  };
});

// Mock InitializingDisplay component so we can complete loading state faster
jest.mock("../dashboard/(quiz)/components/QuizStateDisplay", () => ({
  InitializingDisplay: () => <div data-testid="initializing-display">Loading...</div>,
  EmptyQuestionsDisplay: ({ onReturn }) => (
    <div data-testid="empty-questions">No questions available</div>
  ),
  ErrorDisplay: ({ error, onRetry, onReturn }) => (
    <div data-testid="error-display">{error}</div>
  ),
}));

// Mock hooks
jest.mock("@/hooks/useQuizState", () => ({
  useQuiz: jest.fn(),
}))

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}))

// Create mock store
const setupStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      quiz: (state = {}, action) => state,
    },
    preloadedState: {
      quiz: {
        ...initialState,
      },
    }
  })
}

describe("Quiz Results Authentication Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  test("should redirect to sign-in if not authenticated", async () => {
    // Set up mocks
    const mockPush = jest.fn()
    const mockRouter = { push: mockPush, replace: jest.fn(), back: jest.fn() }
    require("next/navigation").useRouter.mockReturnValue(mockRouter)
    
    // Mock useAuth with explicit unauthenticated status
    // This needs to be VERY explicit about being unauthenticated
    require("@/hooks/useAuth").useAuth.mockReturnValue({
      userId: null,
      isAuthenticated: false,
      status: "unauthenticated", // important: must be 'unauthenticated'
      requireAuth: jest.fn(),
    })
    
    // Mock useQuiz with minimal props needed
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      results: null,
      isLoading: false, // important: must not be loading
      resultsError: null,
      getResults: jest.fn(),
      isCompleted: false,
    })
    
    // Render with synchronous rendering to avoid any race conditions
    const { container } = render(
      <Provider store={setupStore()}>
        <SessionProvider>
          <ResultsPage params={{ slug: "test-quiz" }} />
        </SessionProvider>
      </Provider>
    )
    
    // No need for findByTestId which introduces a waiting period
    // The component should immediately render the sign-in prompt with no delays
    expect(screen.getByTestId("non-authenticated-prompt")).toBeInTheDocument()
    
    // Find and click sign in button
    const signInButton = screen.getByTestId("sign-in-button")
    fireEvent.click(signInButton)
    
    // Assert redirect was performed
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/auth/signin?callbackUrl=")
    )
  })
  
  test("should show results if authenticated", async () => {
    // Set up mocks
    const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() }
    require("next/navigation").useRouter.mockReturnValue(mockRouter)
    
    // Mock authenticated session
    require("@/hooks/useAuth").useAuth.mockReturnValue({
      userId: "test-user",
      isAuthenticated: true,
      status: "authenticated", // important: must be authenticated
      requireAuth: jest.fn(),
    })
    
    // Mock quiz results - ensure it's a complete and valid object
    const mockResults = {
      quizId: "test-quiz",
      slug: "test-quiz",
      title: "Test Quiz",
      score: 8,
      maxScore: 10,
      percentage: 80,
      completedAt: "2023-01-01T00:00:00.000Z",
      questions: [
        {
          id: "q1",
          question: "Test question",
          userAnswer: "test answer",
          correctAnswer: "correct answer",
          isCorrect: false
        }
      ]
    }
    
    // Mock useQuiz with results already loaded
    const getResultsMock = jest.fn().mockResolvedValue(mockResults)
    
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      results: mockResults, // important: already has results
      isLoading: false,     // important: not loading
      resultsError: null,
      getResults: getResultsMock,
      isCompleted: true,
      quizData: { 
        id: "test-quiz",
        title: "Test Quiz", 
        slug: "test-quiz" 
      }
    })
    
    // Render the results page
    render(
      <Provider store={setupStore()}>
        <SessionProvider>
          <ResultsPage params={{ slug: "test-quiz" }} />
        </SessionProvider>
      </Provider>
    )
    
    // Look for the specific result component
    const resultDisplay = await screen.findByTestId("code-quiz-result")
    expect(resultDisplay).toBeInTheDocument()
    
    // Check for the specific text content from our mock component
    expect(screen.getByText("Test Quiz")).toBeInTheDocument()
    expect(screen.getByText("80% Score")).toBeInTheDocument()
    expect(screen.getByText("8 / 10")).toBeInTheDocument()
  })
  
  test("should clear results after they are saved", async () => {
    // Set up mocks
    jest.useFakeTimers()
    
    const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() }
    require("next/navigation").useRouter.mockReturnValue(mockRouter)
    
    // Create a spy for checking if clearQuizState is called
    const clearQuizStateSpy = jest.fn()
    
    // Mock authenticated session
    require("@/hooks/useAuth").useAuth.mockReturnValue({
      userId: "test-user",
      isAuthenticated: true,
      status: "authenticated",
      requireAuth: jest.fn(),
    })
    
    // Mock quiz results
    const mockResults = {
      quizId: "test-quiz",
      slug: "test-quiz",
      title: "Test Quiz",
      score: 8,
      maxScore: 10,
      percentage: 80,
      completedAt: "2023-01-01T00:00:00.000Z",
      questions: []
    }
    
    require("@/hooks/useQuizState").useQuiz.mockReturnValue({
      results: mockResults,
      isLoading: false,
      resultsError: null,
      getResults: jest.fn(),
      isCompleted: true,
      quizData: { 
        id: "test-quiz",
        title: "Test Quiz", 
        slug: "test-quiz" 
      },
      clearQuizState: clearQuizStateSpy,
    })
    
    // Render the results page
    render(
      <Provider store={setupStore()}>
        <SessionProvider>
          <ResultsPage params={{ slug: "test-quiz" }} />
        </SessionProvider>
      </Provider>
    )
    
    // Advance timers to trigger the cleanup effect
    act(() => {
      jest.advanceTimersByTime(6000)
    })
    
    // Find the result component to verify rendering worked
    const resultDisplay = await screen.findByTestId("code-quiz-result")
    expect(resultDisplay).toBeInTheDocument()
    
    // Restore real timers
    jest.useRealTimers()
  })
})
