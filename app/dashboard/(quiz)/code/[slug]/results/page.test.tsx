import React from "react"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { Provider } from "react-redux"
import { useRouter } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import configureStore from "redux-mock-store"
import CodeResultsPage from "./page"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn((param) => (param === "auth" ? null : null)),
  })),
}))

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
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

// Create mock store
const mockStore = configureStore([])

// Create default state to avoid null selector issues
const createDefaultState = (overrides = {}) => ({
  quiz: {
    quizId: "test-code-quiz",
    slug: "test-code-quiz",
    quizResults: null,
    questions: [],
    answers: {},
    status: "idle",
    error: null,
    title: "Test Code Quiz",
    ...(overrides.quiz || {}),
  },
  auth: {
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
    ...(overrides.auth || {}),
  },
})

// Mock store utils to ensure results are properly retrieved
jest.mock("@/store/utils/session", () => ({
  getQuizResults: jest.fn().mockImplementation(() => null),
  saveQuizResults: jest.fn(),
}))

// Mock thunks to return plain objects so redux-mock-store doesn't throw
jest.mock("@/store/slices/quizSlice", () => {
  const actual = jest.requireActual("@/store/slices/quizSlice")
  return {
    ...actual,
    checkAuthAndLoadResults: jest.fn(() => ({
      type: "quiz/checkAuthAndLoadResults",
      payload: {},
    })),
    rehydrateQuiz: jest.fn((payload) => ({ type: "quiz/rehydrateQuiz", payload })),
    resetPendingQuiz: jest.fn(() => ({ type: "quiz/resetPendingQuiz" })),
    setQuizResults: jest.fn((payload) => ({ type: "quiz/setQuizResults", payload })),
  }
})

describe("Code Results Page", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock sessionStorage
    const mockSessionStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(),
    }
    Object.defineProperty(window, "sessionStorage", {
      value: mockSessionStorage,
      writable: true,
    })
  })

  it("shows sign-in prompt for unauthenticated users", async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "unauthenticated",
    })
    const store = mockStore(
      createDefaultState({
        auth: { isAuthenticated: false },
      })
    )
    render(
      <Provider store={store}>
        <CodeResultsPage params={{ slug: "test-code-quiz" }} />
      </Provider>
    )
    await waitFor(() => {
      expect(screen.getByText(/sign in to view results/i)).toBeInTheDocument()
    })
    const signInButton = screen.getByRole("button", { name: /sign in/i })
    fireEvent.click(signInButton)
    expect(signIn).toHaveBeenCalled()
  })

  it("shows results when authenticated with results available", async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })
    const store = mockStore(
      createDefaultState({
        auth: {
          isAuthenticated: true,
          user: { name: "Test User" },
        },
        quiz: {
          status: "succeeded", // Change this to "completed" to skip loading state
          quizResults: {
            score: 2,
            maxScore: 3,
            percentage: 67,
            slug: "test-code-quiz",
            title: "Test Code Quiz",
            completedAt: new Date().toISOString(),
            questions: [{ id: "1", question: "Q1", answer: "A" }],
            questionResults: [{ questionId: "1", isCorrect: true, userAnswer: "A" }],
            answers: [{ questionId: "1", answer: "A", isCorrect: true }],
          },
        },
      })
    )
    
    // Mock implementation to bypass loading states and ensure results are shown immediately
    jest.useFakeTimers();
    
    render(
      <Provider store={store}>
        <CodeResultsPage params={{ slug: "test-code-quiz" }} />
      </Provider>
    )
    
    // Wait for the loading spinner to disappear and the result summary to appear
    jest.advanceTimersByTime(2000);
    
    await waitFor(() => {
      // First make sure the component has rendered results
      expect(screen.queryByTestId("result-summary")).not.toBeNull();
    });
    
    // Now we can safely assert content
    expect(screen.getByTestId("result-summary")).toHaveTextContent("2 out of 3");
    expect(screen.getByTestId("score-percentage")).toHaveTextContent("67%");
    
    // Clean up
    jest.useRealTimers();
  }, { timeout: 5000 })

  it("shows loading state when auth is loading", async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "loading",
    })
    const store = mockStore(
      createDefaultState({
        quiz: { status: "loading" },
      })
    )
    render(
      <Provider store={store}>
        <CodeResultsPage params={{ slug: "test-code-quiz" }} />
      </Provider>
    )
    await waitFor(() => {
      expect(screen.getByText(/checking authentication/i)).toBeInTheDocument()
    })
  })

  it("shows error message when quiz status is failed", async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })
    const store = mockStore(
      createDefaultState({
        auth: { isAuthenticated: true },
        quiz: {
          status: "failed",
          error: "Failed to load quiz results",
        },
      })
    )
    render(
      <Provider store={store}>
        <CodeResultsPage params={{ slug: "test-code-quiz" }} />
      </Provider>
    )
    await waitFor(() => {
      expect(screen.getByText(/error loading results/i)).toBeInTheDocument()
      expect(screen.getByText(/failed to load quiz results/i)).toBeInTheDocument()
    })
  })

  it("handles the special case of 'Results not found' error by generating results", async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })
    const pendingQuizData = {
      slug: "test-code-quiz",
      quizData: {
        title: "Test Code Quiz",
        questions: [{ id: "1", question: "Q1", answer: "A" }],
      },
      currentState: {
        showResults: true,
      },
    }
    const store = mockStore(
      createDefaultState({
        auth: { isAuthenticated: true },
        quiz: {
          status: "failed",
          error: "Results not found. Please take the quiz again.",
          pendingQuiz: pendingQuizData,
        },
      })
    )
    render(
      <Provider store={store}>
        <CodeResultsPage params={{ slug: "test-code-quiz" }} />
      </Provider>
    )
    await waitFor(() => {
      expect(screen.getByText(/generating quiz results/i)).toBeInTheDocument()
    })
    const actions = store.getActions()
    expect(
      actions.some(
        (action) =>
          action.type === "quiz/rehydrateQuiz" &&
          action.payload.currentState.showResults === true
      )
    ).toBeTruthy()
  })

  it("redirects to quiz page when no results and no answers on authenticated state", async () => {
    const mockPush = jest.fn()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })
    const store = mockStore(
      createDefaultState({
        auth: { isAuthenticated: true },
        quiz: {
          status: "succeeded",
          questions: [],
          answers: {},
        },
      })
    )
    jest.useFakeTimers()
    render(
      <Provider store={store}>
        <CodeResultsPage params={{ slug: "test-code-quiz" }} />
      </Provider>
    )
    jest.advanceTimersByTime(500)
    expect(mockPush).toHaveBeenCalledWith("/dashboard/code/test-code-quiz")
    jest.useRealTimers()
  })

  it("handles recovery from pendingQuiz with showResults=true", async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })
    const pendingQuizData = {
      slug: "test-code-quiz",
      quizData: {
        title: "Test Code Quiz",
        questions: [{ id: "1", question: "Q1", answer: "A" }],
      },
      currentState: {
        showResults: true,
      },
    }
    window.sessionStorage.getItem = jest.fn().mockImplementation((key) => {
      if (key === "pendingQuiz") return JSON.stringify(pendingQuizData)
      return null
    })
    const store = mockStore(
      createDefaultState({
        auth: { isAuthenticated: true },
        quiz: {
          status: "idle",
          pendingQuiz: pendingQuizData,
        },
      })
    )
    render(
      <Provider store={store}>
        <CodeResultsPage params={{ slug: "test-code-quiz" }} />
      </Provider>
    )
    await waitFor(() => {
      const actions = store.getActions()
      expect(actions.some((action) => action.type === "quiz/rehydrateQuiz")).toBeTruthy()
    })
  })

  it("handles numeric IDs in the URL by redirecting to proper slug", async () => {
    const numericSlug = "123"
    const mockPush = jest.fn()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })
    const pendingQuizWithProperSlug = {
      slug: "proper-slug-name",
      quizData: { title: "Test Code Quiz" },
    }
    window.sessionStorage.getItem = jest.fn().mockImplementation((key) => {
      if (key === "pendingQuiz") return JSON.stringify(pendingQuizWithProperSlug)
      return null
    })
    const store = mockStore(
      createDefaultState({
        auth: { isAuthenticated: true },
        quiz: {
          status: "idle",
          pendingQuiz: pendingQuizWithProperSlug,
        },
      })
    )
    jest.useFakeTimers()
    render(
      <Provider store={store}>
        <CodeResultsPage params={{ slug: numericSlug }} />
      </Provider>
    )
    jest.advanceTimersByTime(500)
    expect(mockPush).toHaveBeenCalledWith("/dashboard/code/proper-slug-name")
    jest.useRealTimers()
  })

  it("properly handles slug values when fetching results", async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })
    const mockGetItem = jest.fn()
    window.sessionStorage.getItem = mockGetItem
    mockGetItem.mockImplementation((key) => {
      if (key === "quiz_results_code-advanced-XYZ") {
        return JSON.stringify({
          score: 5,
          maxScore: 10,
          percentage: 50,
          slug: "code-advanced-XYZ",
          title: "Code Advanced",
          completedAt: new Date().toISOString(),
          questions: [],
          questionResults: [],
        })
      }
      return null
    })
    const store = mockStore(
      createDefaultState({
        auth: { isAuthenticated: true },
        quiz: {
          status: "succeeded",
          slug: "code-advanced-XYZ",
          questions: [{ id: "1", question: "Q1", answer: "A" }],
          answers: {
            "1": { questionId: "1", answer: "A", isCorrect: true },
          },
        },
      })
    )
    render(
      <Provider store={store}>
        <CodeResultsPage params={{ slug: "code-advanced-XYZ" }} />
      </Provider>
    )
    await waitFor(() => {
      expect(screen.getByTestId("result-summary")).toHaveTextContent("1 out of 1")
      expect(screen.getByTestId("score-percentage")).toHaveTextContent("100%")
    })
    expect(mockGetItem).toHaveBeenCalled()
    expect(mockGetItem).toHaveBeenCalledWith("quiz_results_code-advanced-XYZ")
  })

  it("handles numeric slugs by treating them as strings", async () => {
    const numericSlug = "38"
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })
    const store = mockStore(
      createDefaultState({
        auth: { isAuthenticated: true },
        quiz: {
          slug: numericSlug,
          status: "succeeded",
          questions: [{ id: "1", question: "What is React?", answer: "A" }],
          answers: {
            "1": { questionId: "1", answer: "A", isCorrect: true },
          },
          pendingQuiz: {
            slug: numericSlug,
            quizData: {
              title: "React Advanced",
              questions: [{ id: "1", question: "What is React?", answer: "A" }],
            },
            currentState: {
              showResults: true,
            },
          },
        },
      })
    )
    const { saveQuizResults } = require("@/store/utils/session")
    render(
      <Provider store={store}>
        <CodeResultsPage params={{ slug: numericSlug }} />
      </Provider>
    )
    await waitFor(() => {
      expect(screen.getByTestId("result-summary")).toHaveTextContent("1 out of 1")
      expect(screen.getByTestId("score-percentage")).toHaveTextContent("100%")
    })
    const actions = store.getActions()
    const setResultsAction = actions.find((action) => action.type === "quiz/setQuizResults")
    if (setResultsAction) {
      expect(setResultsAction.payload.slug).toBe(numericSlug)
      expect(saveQuizResults).toHaveBeenCalledWith(numericSlug, expect.objectContaining({ slug: numericSlug }))
    }
  })
  it("when click next question move to next question", async () => {
 
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })
    const store = mockStore(
      createDefaultState({
        auth: { isAuthenticated: true },
        quiz: {
          status: "idle",
          questions: [
            { id: "1", question: "Q1", options: ["A", "B"], answer: "A" },
            { id: "2", question: "Q2", options: ["C", "D"], answer: "C" },
          ],
          answers: {},
          currentQuestionIndex: 0,
          title: "Test Code Quiz",
        },
      })
    )
    render(
      <Provider store={store}>
        <CodeResultsPage params={{ slug: "test-code-quiz" }} />
      </Provider>
    )
    // Click Next button
    const nextButton = screen.getByTestId("next-question")
    fireEvent.click(nextButton)
    // Should move to next question
    await waitFor(() => {
      expect(screen.getByText(/question 2\/2/i)).toBeInTheDocument()
    })
  })

  it("allows user to select an option and click Next to move to next question", async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })
    
    // Mock the dispatch function to handle thunks properly
    const dispatchMock = jest.fn().mockImplementation((action) => {
      if (typeof action === 'function') {
        return action(dispatchMock, () => ({}), undefined);
      }
      return action;
    });
    
    const store = mockStore(
      createDefaultState({
        auth: { isAuthenticated: true },
        quiz: {
          status: "idle",
          questions: [
            { id: "1", question: "Q1", options: [
              { id: "A", text: "Option A" },
              { id: "B", text: "Option B" }
            ], correctOptionId: "A" },
            { id: "2", question: "Q2", options: [
              { id: "C", text: "Option C" },
              { id: "D", text: "Option D" }
            ], correctOptionId: "C" },
          ],
          answers: {},
          currentQuestionIndex: 0,
          title: "Test Code Quiz",
        },
      })
    )
    
    // Use the real dispatch to handle thunks
    store.dispatch = dispatchMock;
    
    // Render the quiz wrapper directly to test navigation
    const CodeQuizWrapper = require("@/app/dashboard/(quiz)/code/components/CodeQuizWrapper").default
    render(
      <Provider store={store}>
        <CodeQuizWrapper slug="test-code-quiz" quizData={{
          title: "Test Code Quiz",
          questions: [
            { id: "1", question: "Q1", options: [
              { id: "A", text: "Option A" },
              { id: "B", text: "Option B" }
            ], correctOptionId: "A" },
            { id: "2", question: "Q2", options: [
              { id: "C", text: "Option C" },
              { id: "D", text: "Option D" }
            ], correctOptionId: "C" },
          ]
        }} />
      </Provider>
    )
    
    // Wait for quiz to load
    await waitFor(() => {
      expect(screen.queryByText(/loading quiz data/i)).not.toBeInTheDocument();
    });
    
    // Select option for first question
    const optionA = screen.getByTestId("option-0");
    fireEvent.click(optionA);
    
    // Verify the option was selected
    expect(dispatchMock).toHaveBeenCalledWith(expect.objectContaining({
      type: "quiz/saveAnswer"
    }));
    
    // Wait for feedback
    await waitFor(() => {
      expect(screen.queryByText(/correct/i)).toBeInTheDocument();
    });
    
    // Wait for automatic navigation to next question
    await waitFor(() => {
      expect(screen.getByText(/question 2/i)).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Select option for second question
    const optionC = screen.getByTestId("option-0");
    fireEvent.click(optionC);
    
    // Verify the second option was selected
    expect(dispatchMock).toHaveBeenCalledWith(expect.objectContaining({
      type: "quiz/saveAnswer"
    }));
    
    // Wait for completion
    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledWith(expect.objectContaining({
        type: "quiz/setQuizCompleted"
      }));
    });
  })
})
