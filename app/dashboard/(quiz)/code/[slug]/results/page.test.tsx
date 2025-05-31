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

// Mock React's use function for handling params
jest.mock("react", () => {
  const originalReact = jest.requireActual("react")
  return {
    ...originalReact,
    use: jest.fn((promise) => {
      if (promise && typeof promise === "object" && "slug" in promise) {
        return promise
      }
      return promise
    }),
  }
})

// Create a mock store with the necessary state
const createStore = (initialState = {}) => configureStore({
  reducer: {
    quiz: quizReducer,
    auth: authReducer,
  },
  preloadedState: initialState,
})

describe("Code Results Page", () => {
  // Setup common mocks and utilities
  const mockRouter = { push: jest.fn() }
  const mockClearQuizResults = jest.fn()
  const mockRestoreAuthRedirectState = jest.fn()
  const mockSaveAuthRedirectState = jest.fn()
  
  beforeEach(() => {
    jest.clearAllTimers();
    
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
    
    const store = createStore(initialState) as ReturnType<typeof configureStore>
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
    expect(screen.getByText("Sign In to View Results")).toBeInTheDocument()
    expect(screen.getByText("Please sign in to view your code quiz results and track your progress.")).toBeInTheDocument()
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
    
    // Should show the full quiz result component with data-testid
    expect(screen.getByTestId("result-summary")).toBeInTheDocument()
    // Check for the score percentage
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
  
  // Test: Retake button redirects to quiz with reset parameter
  it("redirects to quiz with reset parameter when retake is clicked", () => {
    const initialState = {
      quiz: {
        status: "succeeded",
        questions: [{ id: "1", text: "Question 1", correctOptionId: "a" }],
        answers: { "1": { selectedOptionId: "a", isCorrect: true, type: "code" } },
        title: "Code Quiz",
        quizResults: {
          slug: "test-slug",
          score: 1,
          maxScore: 1,
          percentage: 100,
          completedAt: new Date().toISOString(),
          questionResults: [
            { questionId: "1", isCorrect: true, userAnswer: "a", correctAnswer: "a" },
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
    
    // Find and click the retake button
    const retakeButton = screen.getByRole("button", { name: /retake quiz/i })
    fireEvent.click(retakeButton)
    
    // Verify router.push was called with the right URL
    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/code/test-slug?reset=true")
  })

  // Test: Error state is shown
  it("shows error message when quiz status is failed", () => {
    const initialState = {
      quiz: {
        status: "failed",
        error: "Failed to load quiz results",
        questions: [],
        answers: {},
      },
      auth: {
        isAuthenticated: true
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
    
    // Should show error state
    expect(screen.getByText("Error Loading Results")).toBeInTheDocument()
    expect(screen.getByText("Failed to load quiz results")).toBeInTheDocument()
  })
  
  // Test: Auth restoration happens after login
  it("restores auth state when user returns after authentication", () => {
    // Mock fromAuth parameter
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((param) => param === "fromAuth" ? "true" : null),
    })
    
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
    
    // Verify restoreAuthRedirectState was called
    expect(mockRestoreAuthRedirectState).toHaveBeenCalled()
  })
  
  // Test: No results found message is shown when questions exist but no answers
  it("shows 'No Results Found' when questions exist but no answers", () => {
    const initialState = {
      quiz: {
        status: "succeeded",
        questions: [
          { id: "1", text: "Question 1", correctOptionId: "a" },
          { id: "2", text: "Question 2", correctOptionId: "b" },
        ],
        answers: {},
        quizResults: null,
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
    
    // Should show no results found message
    expect(screen.getByText("No Results Found")).toBeInTheDocument()
    expect(screen.getByText("We couldn't find your results for this quiz.")).toBeInTheDocument()
  })
  
  // Test: Results are computed on the spot when questions and answers exist but no results
  it("computes results on the spot when questions and answers exist but no results", () => {
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
        quizResults: null,
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
    
    // Should compute and show results
    expect(screen.getByTestId("result-summary")).toBeInTheDocument()
  })
})
