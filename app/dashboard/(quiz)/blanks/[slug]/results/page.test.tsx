import React from "react"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { Provider } from "react-redux"
import BlanksResultsPage from "./page"
import { configureStore } from "@reduxjs/toolkit"
import quizReducer from "@/store/slices/quizSlice"
import authReducer from "@/store/slices/authSlice"

// Import the mocks directly to manipulate them
import { useRouter, useSearchParams } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import { useSessionService } from "@/hooks/useSessionService"

// Mock modules correctly
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}))

jest.mock("@/hooks/useSessionService", () => ({
  useSessionService: jest.fn(),
}))

// Mock QuizResult component with data-testid attributes for better testing
jest.mock("../../../components/QuizResult", () => {
  return {
    __esModule: true,
    default: ({ result }) => (
      <div data-testid="blanks-quiz-result">
        <div data-testid="quiz-title">{result?.title || "Quiz Results"}</div>
        <div data-testid="quiz-score">{result?.percentage || 0}%</div>
        <div data-testid="quiz-questions">{result?.score || 0} / {result?.maxScore || 0}</div>
      </div>
    ),
  }
})

// Mock React's use function for handling params
jest.mock("react", () => {
  const originalReact = jest.requireActual("react");
  return {
    ...originalReact,
    use: jest.fn((promise) => {
      if (promise && typeof promise === "object" && "slug" in promise) {
        return promise;
      }
      return promise;
    }),
  };
})

// Mock selectOrGenerateQuizResults
jest.mock("@/store/slices/quizSlice", () => {
  const original = jest.requireActual("@/store/slices/quizSlice");
  return {
    ...original,
    selectOrGenerateQuizResults: () => ({
      title: "Fill-in-the-Blanks Quiz",
      score: 2,
      maxScore: 3,
      percentage: 67,
      questionResults: [
        { questionId: "1", isCorrect: true },
        { questionId: "2", isCorrect: true },
        { questionId: "3", isCorrect: false },
      ],
    }),
  };
});

// Create a mock store with the necessary state
const createStore = (initialState = {}) => configureStore({
  reducer: {
    quiz: quizReducer,
    auth: authReducer,
  },
  preloadedState: initialState,
})

// Mock window.scrollTo since it's not implemented in jsdom
window.scrollTo = jest.fn();

describe("Blanks Results Page", () => {
  // Setup common mocks and utilities
  const mockRouter = { push: jest.fn(), replace: jest.fn() }
  const mockClearQuizResults = jest.fn()
  const mockRestoreAuthRedirectState = jest.fn()
  const mockSaveAuthRedirectState = jest.fn()
  const mockGetStoredResults = jest.fn().mockReturnValue(null)
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set up the mocks properly with semicolon notation
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((param) => param === "fromAuth" ? "false" : null),
    })
    ;(useSession as jest.Mock).mockReturnValue({
      status: "unauthenticated",
      data: null,
    })
    ;(useSessionService as jest.Mock).mockReturnValue({
      clearQuizResults: mockClearQuizResults,
      restoreAuthRedirectState: mockRestoreAuthRedirectState,
      saveAuthRedirectState: mockSaveAuthRedirectState,
      getStoredResults: mockGetStoredResults,
    })
    
    // Mock session storage
    const mockStorageData = {}
    const mockSessionStorage = {
      getItem: jest.fn(key => mockStorageData[key] || null),
      setItem: jest.fn((key, value) => { mockStorageData[key] = value }),
      removeItem: jest.fn(key => { delete mockStorageData[key] }),
      clear: jest.fn(),
    }
    
    Object.defineProperty(window, "sessionStorage", {
      value: mockSessionStorage,
      writable: true,
    })
  })

  // Test: Loading state is displayed while authentication is loading
  it("shows loading state when auth is loading", () => {
    // Override the default mock for this test
    ;(useSession as jest.Mock).mockReturnValue({
      status: "loading",
      data: null,
    })
    
    const initialState = {
      quiz: {
        status: "idle",
        questions: [],
        answers: {},
        quizResults: null,
      },
      auth: {
        isAuthenticated: false,
      },
    }
    
    const store = createStore(initialState)
    
    render(
      <Provider store={store}>
        <BlanksResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    )
    
    expect(screen.getByText(/checking authentication/i)).toBeInTheDocument()
  })
  
  // Test: Redirect to quiz when no results exist
  it("redirects to quiz when no results or answers exist", async () => {
    const initialState = {
      quiz: {
        status: "succeeded",
        questions: [],
        answers: {},
        quizResults: null,
      },
      auth: {
        isAuthenticated: false,
      },
    }
    
    const store = createStore(initialState)
    
    render(
      <Provider store={store}>
        <BlanksResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    )
    
    // Wait for the redirect timeout
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/blanks/test-slug")
    }, { timeout: 1500 })
  })
  
  // Test: Unauthenticated user sees limited results
  it("shows limited results for unauthenticated user", () => {
    const quizResults = {
      slug: "test-slug",
      title: "Fill-in-the-Blanks Quiz",
      score: 2,
      maxScore: 3,
      percentage: 67,
      completedAt: new Date().toISOString(),
      questionResults: [
        { questionId: "1", isCorrect: true, userAnswer: "correct", correctAnswer: "correct" },
        { questionId: "2", isCorrect: true, userAnswer: "right", correctAnswer: "right" },
        { questionId: "3", isCorrect: false, userAnswer: "wrong", correctAnswer: "correct" },
      ],
    }
    
    // Update mockGetStoredResults to return our quiz results
    mockGetStoredResults.mockReturnValue(quizResults)
    
    const initialState = {
      quiz: {
        status: "succeeded",
        questions: [
          { id: "1", text: "Question 1", correctAnswer: "correct" },
          { id: "2", text: "Question 2", correctAnswer: "right" },
          { id: "3", text: "Question 3", correctAnswer: "correct" },
        ],
        answers: {
          "1": { answer: "correct", isCorrect: true, type: "blanks" },
          "2": { answer: "right", isCorrect: true, type: "blanks" },
          "3": { answer: "wrong", isCorrect: false, type: "blanks" },
        },
        title: "Fill-in-the-Blanks Quiz",
        quizResults: quizResults,
      },
      auth: {
        isAuthenticated: false,
      },
    }
    
    const store = createStore(initialState)
    
    render(
      <Provider store={store}>
        <BlanksResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    )
    
    // Check for limited results view for unauthenticated user
    expect(screen.getByText(/Your Score: 67%/i)).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes("Sign in to see your detailed results"))).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument()
  })
  
  // Test: Authenticated user sees full results
  it("shows full results for authenticated user", async () => {
    // Set authenticated status
    ;(useSession as jest.Mock).mockReturnValue({
      status: "authenticated",
      data: { user: { name: "Test User" } },
    })
    
    // Create meaningful quiz results
    const quizResults = {
      slug: "test-slug",
      title: "Fill-in-the-Blanks Quiz",
      score: 2,
      maxScore: 3,
      percentage: 67,
      completedAt: new Date().toISOString(),
      questionResults: [
        { questionId: "1", isCorrect: true, userAnswer: "correct", correctAnswer: "correct" },
        { questionId: "2", isCorrect: true, userAnswer: "right", correctAnswer: "right" },
        { questionId: "3", isCorrect: false, userAnswer: "wrong", correctAnswer: "correct" },
      ],
    }
    
    // Update mockGetStoredResults to return our quiz results
    mockGetStoredResults.mockReturnValue(quizResults)
    
    const initialState = {
      quiz: {
        status: "succeeded",
        questions: [
          { id: "1", text: "Question 1", correctAnswer: "correct" },
          { id: "2", text: "Question 2", correctAnswer: "right" },
          { id: "3", text: "Question 3", correctAnswer: "correct" },
        ],
        answers: {
          "1": { answer: "correct", isCorrect: true, type: "blanks" },
          "2": { answer: "right", isCorrect: true, type: "blanks" },
          "3": { answer: "wrong", isCorrect: false, type: "blanks" },
        },
        title: "Fill-in-the-Blanks Quiz",
        quizResults: quizResults,
      },
      auth: {
        isAuthenticated: true,
      },
    }
    
    const store = createStore(initialState)
    
    render(
      <Provider store={store}>
        <BlanksResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    )
    
    // Wait for any state updates to complete
    await waitFor(() => {
      expect(screen.getByTestId("blanks-quiz-result")).toBeInTheDocument()
    })
    
    // Verify the score values
    expect(screen.getByTestId("quiz-title")).toHaveTextContent("Fill-in-the-Blanks Quiz")
    expect(screen.getByTestId("quiz-score")).toHaveTextContent("67%")
    expect(screen.getByTestId("quiz-questions")).toHaveTextContent("2 / 3")
  })
  
  // Test: Sign-in handler is called when user clicks sign in
  it("calls sign in when user clicks sign in button", async () => {
    const quizResults = {
      slug: "test-slug",
      title: "Fill-in-the-Blanks Quiz",
      score: 2,
      maxScore: 3,
      percentage: 67,
      questionResults: [
        { questionId: "1", isCorrect: true },
        { questionId: "2", isCorrect: true },
        { questionId: "3", isCorrect: false },
      ],
    }
    
    const initialState = {
      quiz: {
        status: "succeeded",
        questions: [
          { id: "1", text: "Question 1", correctAnswer: "correct" },
          { id: "2", text: "Question 2", correctAnswer: "right" },
          { id: "3", text: "Question 3", correctAnswer: "correct" },
        ],
        answers: {
          "1": { answer: "correct", isCorrect: true, type: "blanks" },
          "2": { answer: "right", isCorrect: true, type: "blanks" },
          "3": { answer: "wrong", isCorrect: false, type: "blanks" },
        },
        title: "Fill-in-the-Blanks Quiz",
        quizResults: quizResults,
      },
      auth: {
        isAuthenticated: false,
      },
    }
    
    const store = createStore(initialState)
    
    render(
      <Provider store={store}>
        <BlanksResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    )
    
    // Find and click the sign in button
    const signInButton = screen.getByRole("button", { name: /sign in/i })
    fireEvent.click(signInButton)
    
    // Verify saveAuthRedirectState and signIn were called
    expect(mockSaveAuthRedirectState).toHaveBeenCalled()
    expect(signIn).toHaveBeenCalled()
  })
  
  // Test: Auth restoration happens after login
  it("restores auth state when user returns after authentication", () => {
    // Mock fromAuth parameter
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((param) => param === "fromAuth" ? "true" : null),
    })
    
    ;(useSession as jest.Mock).mockReturnValue({
      status: "authenticated",
      data: { user: { name: "Test User" } },
    })
    
    const initialState = {
      quiz: {
        status: "succeeded",
        questions: [],
        answers: {},
        results: null,
      },
      auth: {
        isAuthenticated: true,
      },
    }
    
    const store = createStore(initialState)
    
    render(
      <Provider store={store}>
        <BlanksResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    )
    
    // Verify restoreAuthRedirectState was called
    expect(mockRestoreAuthRedirectState).toHaveBeenCalled()
  })
})
