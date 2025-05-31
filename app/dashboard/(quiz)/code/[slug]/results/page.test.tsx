import React from "react"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { Provider } from "react-redux"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import { configureStore } from "@reduxjs/toolkit"
import CodeResultsPage from "./page"
import { useSessionService } from "@/hooks/useSessionService"
import quizReducer from "@/store/slices/quizSlice"
import authReducer from "@/store/slices/authSlice"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn((param) => param === "fromAuth" ? "false" : null),
  })),
}))

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}))

// Mock useSessionService hook
jest.mock("@/hooks/useSessionService", () => ({
  useSessionService: jest.fn(),
}))

// Mock QuizResult component to prevent related errors
jest.mock("../../../components/QuizResult", () => ({
  __esModule: true,
  default: ({ result }) => (
    <div data-testid="result-summary">
      <h2>{result?.title || "Quiz Results"}</h2>
      <div>{result?.percentage}% Score</div>
    </div>
  ),
}))

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

describe("Code Results Page", () => {
  // Setup common mocks and utilities
  const mockRouter = { push: jest.fn() }
  const mockClearQuizResults = jest.fn()
  const mockRestoreAuthRedirectState = jest.fn()
  const mockSaveAuthRedirectState = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (useRouter as jest.Mock).mockReturnValue(mockRouter)
    (useSession as jest.Mock).mockReturnValue({
      status: "unauthenticated",
      data: null,
    })
    (useSessionService as jest.Mock).mockReturnValue({
      clearQuizResults: mockClearQuizResults,
      restoreAuthRedirectState: mockRestoreAuthRedirectState,
      saveAuthRedirectState: mockSaveAuthRedirectState,
    })
    
    // Mock session storage
    const mockSessionStorage = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(window, "sessionStorage", {
      value: mockSessionStorage,
    })
  })

  // Test: Loading state is displayed while authentication is loading
  it("shows loading state when auth is loading", () => {
    (useSession as jest.Mock).mockReturnValue({
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
        <CodeResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    )
    
    expect(screen.getByText("Checking authentication")).toBeInTheDocument()
  })
  
  // Test: Redirect to quiz when no results exist
  it("redirects to quiz when no results or answers exist", async () => {
    // Set authenticated status
    (useSession as jest.Mock).mockReturnValue({
      status: "authenticated",
      data: { user: { name: "Test User" } },
    })
    
    const initialState = {
      quiz: {
        status: "succeeded",
        questions: [],
        answers: {},
        quizResults: null,
      },
      auth: {
        isAuthenticated: true,
      },
    }
    
    const store = createStore(initialState)
    
    render(
      <Provider store={store}>
        <CodeResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    )
    
    // Wait for the redirect timeout
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/code/test-slug")
    }, { timeout: 1500 })
  })
  
  // Test: Unauthenticated user sees sign-in prompt
  it("shows sign-in prompt for unauthenticated user", () => {
    const initialState = {
      quiz: {
        status: "succeeded",
        questions: [
          { id: "1", text: "Question 1", correctOptionId: "a" },
          { id: "2", text: "Question 2", correctOptionId: "b" },
        ],
        answers: {
          "1": { selectedOptionId: "a", isCorrect: true, type: "code" },
          "2": { selectedOptionId: "c", isCorrect: false, type: "code" },
        },
        title: "Code Quiz",
        quizResults: {
          slug: "test-slug",
          title: "Code Quiz",
          score: 1,
          maxScore: 2,
          percentage: 50,
          questionResults: [
            { questionId: "1", isCorrect: true, userAnswer: "a", correctAnswer: "a" },
            { questionId: "2", isCorrect: false, userAnswer: "c", correctAnswer: "b" },
          ],
        },
      },
      auth: {
        isAuthenticated: false,
      },
    }
    
    const store = createStore(initialState)
    
    render(
      <Provider store={store}>
        <CodeResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    )
    
    // Should show sign-in prompt
    expect(screen.getByText(/Sign In to/)).toBeInTheDocument()
  })
  
  // Test: Authenticated user sees full results
  it("shows full results for authenticated user", () => {
    const initialState = {
      quiz: {
        status: "succeeded",
        questions: [
          { id: "1", text: "Question 1", correctOptionId: "a" },
          { id: "2", text: "Question 2", correctOptionId: "b" },
        ],
        answers: {
          "1": { selectedOptionId: "a", isCorrect: true, type: "code" },
          "2": { selectedOptionId: "c", isCorrect: false, type: "code" },
        },
        title: "Code Quiz",
        quizResults: {
          slug: "test-slug",
          title: "Code Quiz",
          score: 1,
          maxScore: 2,
          percentage: 50,
          completedAt: new Date().toISOString(),
          questionResults: [
            { questionId: "1", isCorrect: true, userAnswer: "a", correctAnswer: "a" },
            { questionId: "2", isCorrect: false, userAnswer: "c", correctAnswer: "b" },
          ],
        },
      },
      auth: {
        isAuthenticated: true,
      },
    }
    
    const store = createStore(initialState)
    
    (useSession as jest.Mock).mockReturnValue({
      status: "authenticated",
      data: { user: { name: "Test User" } },
    })
    
    render(
      <Provider store={store}>
        <CodeResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    )
    
    // Check for the title and score percentage
    expect(screen.getByText("Code Quiz")).toBeInTheDocument()
    expect(screen.getByText("50% Score")).toBeInTheDocument()
  })
  
  // Test: Sign-in handler is called when user clicks sign in
  it("calls sign in when user clicks sign in button", async () => {
    const initialState = {
      quiz: {
        status: "succeeded",
        questions: [{ id: "1", text: "Question 1", correctOptionId: "a" }],
        answers: { "1": { selectedOptionId: "a", isCorrect: true, type: "code" } },
        title: "Code Quiz",
        quizResults: {
          score: 1,
          maxScore: 1,
          percentage: 100,
          questionResults: [
            { questionId: "1", isCorrect: true, userAnswer: "a", correctAnswer: "a" },
          ],
        },
      },
      auth: {
        isAuthenticated: false,
      },
    }
    
    const store = createStore(initialState)
    
    render(
      <Provider store={store}>
        <CodeResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    )
    
    // Find and click the sign in button
    const signInButton = screen.getByRole("button", { name: /sign in/i })
    fireEvent.click(signInButton)
    
    // Verify saveAuthRedirectState and signIn were called
    await waitFor(() => {
      expect(mockSaveAuthRedirectState).toHaveBeenCalled()
      expect(signIn).toHaveBeenCalled()
    })
  })
})
