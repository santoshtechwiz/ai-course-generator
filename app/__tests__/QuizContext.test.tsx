"use client"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { SessionProvider } from "next-auth/react"
import { QuizProvider, useQuiz } from "@/app/context/QuizContext"
import quizReducer from "@/store/slices/quizSlice"

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  SessionProvider: ({ children }) => children,
}))

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/test-path",
  useSearchParams: () => new URLSearchParams(),
}))

// Mock quiz-index.ts
jest.mock("@/lib/utils/quiz-index", () => ({
  calculateTotalTime: (answers) => {
    if (!Array.isArray(answers)) return 0
    return answers.reduce((total, answer) => total + (answer?.timeSpent || 0), 0)
  },
}))

// Mock data
const mockQuestions = [
  {
    id: "1",
    question: "What is the capital of France?",
    answer: "Paris",
    option1: "London",
    option2: "Berlin",
    option3: "Madrid",
  },
  {
    id: "2",
    question: "What is 2 + 2?",
    answer: "4",
    option1: "3",
    option2: "5",
    option3: "6",
  },
]

// Create a test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      quiz: quizReducer,
    },
    preloadedState: {
      quiz: {
        quizId: "test-quiz",
        slug: "test-quiz",
        title: "Test Quiz",
        quizType: "mcq",
        questions: mockQuestions,
        currentQuestionIndex: 0,
        answers: [null, null],
        timeSpent: [0, 0],
        isCompleted: false,
        score: 0,
        requiresAuth: false,
        isAuthenticated: false,
        hasGuestResult: false,
        guestResultsSaved: false,
        pendingAuthRequired: false,
        authCheckComplete: false,
        isProcessingAuth: false,
        error: null,
        animationState: "idle",
        isSavingResults: false,
        resultsSaved: false,
        completedAt: null,
        ...initialState,
      },
    },
  })
}

// Test component that uses the QuizContext
const TestComponent = () => {
  const { state, submitAnswer, completeQuiz, restartQuiz, handleAuthenticationRequired } = useQuiz()

  return (
    <div>
      <h1>Test Component</h1>
      <p data-testid="current-question">Current Question: {state.currentQuestionIndex + 1}</p>
      <p data-testid="score">Score: {state.score}</p>
      <p data-testid="completed">Completed: {state.isCompleted ? "Yes" : "No"}</p>
      <p data-testid="answers-length">Answers Length: {state.answers?.length || 0}</p>
      <button
        data-testid="submit-answer"
        onClick={() => submitAnswer({ answer: "test", isCorrect: true, timeSpent: 10 })}
      >
        Submit Answer
      </button>
      <button
        data-testid="complete-quiz"
        onClick={() => completeQuiz([{ answer: "test", isCorrect: true, timeSpent: 10 }])}
      >
        Complete Quiz
      </button>
      <button data-testid="restart-quiz" onClick={restartQuiz}>
        Restart Quiz
      </button>
      <button data-testid="auth-required" onClick={() => handleAuthenticationRequired("/test")}>
        Auth Required
      </button>
    </div>
  )
}

describe("QuizContext", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("initializes with correct default state", async () => {
    const store = createTestStore()

    render(
      <Provider store={store}>
        <SessionProvider session={null}>
          <QuizProvider quizData={{ questions: mockQuestions }} slug="test-quiz" quizType="mcq">
            <TestComponent />
          </QuizProvider>
        </SessionProvider>
      </Provider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("current-question")).toHaveTextContent("Current Question: 1")
      expect(screen.getByTestId("score")).toHaveTextContent("Score: 0")
      expect(screen.getByTestId("completed")).toHaveTextContent("Completed: No")
      expect(screen.getByTestId("answers-length")).toHaveTextContent("Answers Length: 2")
    })
  })

  test("submits an answer and updates state", async () => {
    const store = createTestStore()

    // Mock dispatch to directly update the store
    const originalDispatch = store.dispatch
    store.dispatch = jest.fn((action) => {
      const result = originalDispatch(action)
      return result
    })

    render(
      <Provider store={store}>
        <SessionProvider session={null}>
          <QuizProvider quizData={{ questions: mockQuestions }} slug="test-quiz" quizType="mcq">
            <TestComponent />
          </QuizProvider>
        </SessionProvider>
      </Provider>,
    )

    // Submit an answer
    fireEvent.click(screen.getByTestId("submit-answer"))

    // Wait for state updates
    await waitFor(() => {
      const state = store.getState().quiz
      expect(state.answers[0]).toBeTruthy()
      expect(state.answers[0].answer).toBe("test")
      expect(state.answers[0].isCorrect).toBe(true)
    })
  })

  test("completes quiz and updates state", async () => {
    const store = createTestStore()

    // Mock dispatch to directly update the store
    const originalDispatch = store.dispatch
    store.dispatch = jest.fn((action) => {
      const result = originalDispatch(action)
      return result
    })

    render(
      <Provider store={store}>
        <SessionProvider session={null}>
          <QuizProvider quizData={{ questions: mockQuestions }} slug="test-quiz" quizType="mcq">
            <TestComponent />
          </QuizProvider>
        </SessionProvider>
      </Provider>,
    )

    // Complete the quiz
    fireEvent.click(screen.getByTestId("complete-quiz"))

    // Wait for state updates
    await waitFor(() => {
      const state = store.getState().quiz
      expect(state.isCompleted).toBe(true)
      expect(state.score).toBeGreaterThan(0)
      expect(screen.getByTestId("completed")).toHaveTextContent("Completed: Yes")
    })
  })

  test("restarts quiz and resets state", async () => {
    const store = createTestStore({
      isCompleted: true,
      score: 100,
      answers: [{ answer: "test", isCorrect: true, timeSpent: 10 }, null],
    })

    render(
      <Provider store={store}>
        <SessionProvider session={null}>
          <QuizProvider
            quizData={{
              questions: mockQuestions,
              isCompleted: true,
              score: 100,
            }}
            slug="test-quiz"
            quizType="mcq"
          >
            <TestComponent />
          </QuizProvider>
        </SessionProvider>
      </Provider>,
    )

    // Restart the quiz
    fireEvent.click(screen.getByTestId("restart-quiz"))

    await waitFor(() => {
      const state = store.getState().quiz
      expect(state.isCompleted).toBe(false)
      expect(state.score).toBe(0)
      expect(screen.getByTestId("completed")).toHaveTextContent("Completed: No")
    })
  })

  test("handles authentication required for guest users", async () => {
    const store = createTestStore()

    // Mock dispatch to directly update the store
    const originalDispatch = store.dispatch
    store.dispatch = jest.fn((action) => {
      const result = originalDispatch(action)
      return result
    })

    render(
      <Provider store={store}>
        <SessionProvider session={null}>
          <QuizProvider quizData={{ questions: mockQuestions }} slug="test-quiz" quizType="mcq">
            <TestComponent />
          </QuizProvider>
        </SessionProvider>
      </Provider>,
    )

    // Trigger auth required
    fireEvent.click(screen.getByTestId("auth-required"))

    // Wait for state updates
    await waitFor(() => {
      const state = store.getState().quiz
      expect(state.requiresAuth).toBe(true)
      expect(state.pendingAuthRequired).toBe(true)
      expect(state.isProcessingAuth).toBe(true)
    })
  })
})
