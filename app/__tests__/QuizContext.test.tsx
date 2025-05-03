"use client"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { SessionProvider } from "next-auth/react"
import { QuizProvider, useQuiz } from "@/app/context/QuizContext"
import quizReducer, { initQuiz, submitAnswer, completeQuiz, resetQuiz, setRequiresAuth } from "@/store/slices/quizSlice"

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
        onClick={() => {
          completeQuiz({
            answers: [{ answer: "test", isCorrect: true, timeSpent: 10 }],
            score: 100,
            completedAt: new Date().toISOString(),
          })
        }}
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
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
    })

    // Initialize the quiz state
    store.dispatch(
      initQuiz({
        questions: mockQuestions,
        quizId: "test-quiz",
        slug: "test-quiz",
        title: "Test Quiz",
        quizType: "mcq",
      }),
    )

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
    })
  })

  test("submits an answer and updates state", async () => {
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
    })

    // Initialize the quiz state
    store.dispatch(
      initQuiz({
        questions: mockQuestions,
        quizId: "test-quiz",
        slug: "test-quiz",
        title: "Test Quiz",
        quizType: "mcq",
      }),
    )

    render(
      <Provider store={store}>
        <SessionProvider session={null}>
          <QuizProvider quizData={{ questions: mockQuestions }} slug="test-quiz" quizType="mcq">
            <TestComponent />
          </QuizProvider>
        </SessionProvider>
      </Provider>,
    )

    // Submit an answer directly to the store
    store.dispatch(
      submitAnswer({
        answer: "test",
        isCorrect: true,
        timeSpent: 10,
        index: 0,
      }),
    )

    // Wait for state updates
    await waitFor(() => {
      const state = store.getState().quiz
      expect(state.answers[0]).toBeTruthy()
      expect(state.answers[0].answer).toBe("test")
      expect(state.answers[0].isCorrect).toBe(true)
    })
  })

  test("completes quiz and updates state", async () => {
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
    })

    // Initialize the quiz state
    store.dispatch(
      initQuiz({
        questions: mockQuestions,
        quizId: "test-quiz",
        slug: "test-quiz",
        title: "Test Quiz",
        quizType: "mcq",
      }),
    )

    render(
      <Provider store={store}>
        <SessionProvider session={null}>
          <QuizProvider quizData={{ questions: mockQuestions }} slug="test-quiz" quizType="mcq">
            <TestComponent />
          </QuizProvider>
        </SessionProvider>
      </Provider>,
    )

    // Click the complete quiz button
    fireEvent.click(screen.getByTestId("complete-quiz"))

    // Wait for state updates
    await waitFor(() => {
      const state = store.getState().quiz
      expect(state.isCompleted).toBe(true) // Ensure isCompleted is true
      expect(state.score).toBe(100) // Ensure score is updated correctly
      expect(state.answers).toEqual([
        { answer: "test", isCorrect: true, timeSpent: 10 },
      ]) // Ensure answers are updated
      expect(screen.getByTestId("completed")).toHaveTextContent("Completed: Yes")
    })
  })

  test("restarts quiz and resets state", async () => {
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
    })

    // Initialize the quiz state with completed quiz
    store.dispatch(
      initQuiz({
        questions: mockQuestions,
        quizId: "test-quiz",
        slug: "test-quiz",
        title: "Test Quiz",
        quizType: "mcq",
      }),
    )

    // Complete the quiz
    store.dispatch(
      completeQuiz({
        answers: [{ answer: "test", isCorrect: true, timeSpent: 10 }],
        score: 100,
        completedAt: new Date().toISOString(),
      }),
    )

    render(
      <Provider store={store}>
        <SessionProvider session={null}>
          <QuizProvider quizData={{ questions: mockQuestions }} slug="test-quiz" quizType="mcq">
            <TestComponent />
          </QuizProvider>
        </SessionProvider>
      </Provider>,
    )

    // Reset the quiz directly in the store
    store.dispatch(resetQuiz())

    await waitFor(() => {
      const state = store.getState().quiz
      expect(state.isCompleted).toBe(false)
      expect(state.score).toBe(0)
      expect(screen.getByTestId("completed")).toHaveTextContent("Completed: No")
    })
  })

  test("handles authentication required for guest users", async () => {
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
    })

    // Initialize the quiz state
    store.dispatch(
      initQuiz({
        questions: mockQuestions,
        quizId: "test-quiz",
        slug: "test-quiz",
        title: "Test Quiz",
        quizType: "mcq",
      }),
    )

    render(
      <Provider store={store}>
        <SessionProvider session={null}>
          <QuizProvider quizData={{ questions: mockQuestions }} slug="test-quiz" quizType="mcq">
            <TestComponent />
          </QuizProvider>
        </SessionProvider>
      </Provider>,
    )

    // Set requiresAuth directly in the store
    store.dispatch(setRequiresAuth(true))

    // Wait for state updates
    await waitFor(() => {
      const state = store.getState().quiz
      expect(state.requiresAuth).toBe(true)
    })
  })
})
