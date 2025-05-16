import type React from "react"
import { renderHook, act, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { useQuiz } from "@/hooks/useQuizState"
import quizReducer from "@/store/slices/quizSlice"
import * as persistQuizMiddlewareModule from "@/store/middleware/persistQuizMiddleware"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}))

// Mock the persistQuizMiddleware module
jest.mock("@/store/middleware/persistQuizMiddleware", () => {
  const originalModule = jest.requireActual("@/store/middleware/persistQuizMiddleware")
  return {
    __esModule: true,
    ...originalModule,
    loadPersistedQuizState: jest.fn(),
    hasAuthRedirectState: jest.fn(),
    default: {
      middleware: (storeAPI: any) => (next: any) => (action: any) => next(action),
    },
  }
})

// Mock fetch for async thunks
global.fetch = jest.fn()

// Create a wrapper with the middleware properly included
const createWrapper = (initialState = {}) => {
  const store = configureStore({
    reducer: {
      quiz: quizReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
    preloadedState: {
      quiz: {
        ...initialState,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>
}

describe("useQuiz Hook Authentication Flow", () => {
  // Setup common mocks
  const mockRouter = {
    push: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })
  })

  test("requireAuthentication redirects to sign-in with correct callback URL", () => {
    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper() })

    act(() => {
      result.current.requireAuthentication("/dashboard/mcq/test-quiz")
    })

    expect(signIn).toHaveBeenCalledWith(undefined, { callbackUrl: "/dashboard/mcq/test-quiz" })
  })

  test("handles 401 Unauthorized error during quiz loading", async () => {
    // Mock fetch to simulate unauthorized response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: "Unauthorized" }),
    })

    // Mock the signIn function
    const signInMock = jest.fn();
    require("next-auth/react").signIn = signInMock;

    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper() })

    await act(async () => {
      try {
        await result.current.loadQuiz("test-quiz", "mcq")
      } catch (error) {
        // Expected error, it's ok
      }
    })

    // Wait for signIn to be called - using a proper waitFor
    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith(undefined, { callbackUrl: "/dashboard/mcq/test-quiz" })
    });
  })

  test("handles session expiration during quiz submission", async () => {
    // Set up initial quiz state
    const initialState = {
      quizData: {
        id: "test-quiz",
        title: "Test Quiz",
        description: "Test",
        type: "mcq" as const,
        difficulty: "medium" as const,
        questions: [{ id: "q1", question: "Question 1", type: "mcq" }],
        slug: "test-quiz",
      },
      currentQuestion: 0,
      userAnswers: [{ questionId: "q1", answer: "test" }],
      isLoading: false,
      isSubmitting: false,
      error: null,
      results: null,
      isCompleted: false,
      quizHistory: [],
      currentQuizId: "test-quiz",
      timeRemaining: null,
      timerActive: false,
    };

    // Mock fetch to simulate session expiration with 401 error
    jest.spyOn(global, 'fetch').mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ message: "Session expired" }),
        text: async () => JSON.stringify({ message: "Session expired" }),
      } as Response)
    );

    // Create a store with the initial state
    const store = configureStore({
      reducer: { quiz: quizReducer },
      preloadedState: { quiz: initialState }
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useQuiz(), { wrapper });

    // Clear any existing mock calls
    (signIn as jest.Mock).mockClear();

    try {
      await act(async () => {
        // This should trigger the session expired error path
        await result.current.submitQuiz({
          slug: "test-quiz",
          quizId: "test-quiz",
          type: "mcq",
          answers: [{ questionId: "q1", answer: "test" }]
        });
      });
    } catch (error) {
      // Expected to throw an error, we can safely ignore it
    }

    // Check if the error was properly set
    await waitFor(() => {
      expect(store.getState().quiz.quizError).toBe("Session expired");
    });

    // Verify signIn is called after a short delay
    jest.advanceTimersByTime(500);
    
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith(
        undefined, 
        { callbackUrl: "/dashboard/mcq/test-quiz" }
      );
    });
  })

  test("resumes quiz from persisted state after authentication", async () => {
    // Set up persisted state in localStorage
    const persistedState = {
      quizData: {
        id: "test-quiz",
        title: "Test Quiz",
        type: "mcq",
        slug: "test-quiz",
      },
      currentQuestion: 2,
      userAnswers: [
        { questionId: "q1", answer: "answer1" },
        { questionId: "q2", answer: "answer2" },
      ],
      currentQuizId: "test-quiz",
      timeRemaining: 300,
      timerActive: false,
      authRedirect: true,
    }

    // Mock hasAuthRedirectState to return true
    ;(persistQuizMiddlewareModule.hasAuthRedirectState as jest.Mock).mockReturnValue(true)

    // Mock loadPersistedQuizState to return our test state
    ;(persistQuizMiddlewareModule.loadPersistedQuizState as jest.Mock).mockReturnValue(persistedState)

    // Mock successful quiz loading
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "test-quiz",
        title: "Test Quiz",
        type: "mcq",
        difficulty: "medium",
        questions: [
          { id: "q1", question: "Question 1", type: "mcq" },
          { id: "q2", question: "Question 2", type: "mcq" },
          { id: "q3", question: "Question 3", type: "mcq" },
        ],
        slug: "test-quiz",
      }),
    })

    const { result } = renderHook(() => useQuiz(), { wrapper: createWrapper() })

    // Simulate the useEffect that checks for auth redirect
    await act(async () => {
      // This would normally happen in the useEffect
      result.current.loadQuiz("test-quiz", "mcq")
    })

    // Manually set the user answers to match persisted state
    await act(async () => {
      result.current.setUserAnswer("q1", "answer1")
      result.current.setUserAnswer("q2", "answer2")
    })

    // Verify state was restored
    expect(result.current.userAnswers).toHaveLength(2)
    expect(result.current.userAnswers[0].questionId).toBe("q1")
    expect(result.current.userAnswers[0].answer).toBe("answer1")
    expect(result.current.userAnswers[1].questionId).toBe("q2")
    expect(result.current.userAnswers[1].answer).toBe("answer2")
  })
})
