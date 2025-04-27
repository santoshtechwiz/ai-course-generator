"use client"

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { useQuiz, QuizProvider } from "../context/QuizContext"


// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

jest.mock("@/lib/QuizService", () => ({
  quizService: {
    saveQuizState: jest.fn(),
    getQuizState: jest.fn(),
    clearQuizState: jest.fn(),
    saveCompleteQuizResult: jest.fn(),
    saveAuthRedirect: jest.fn(),
    handleAuthRedirect: jest.fn(),
    isAuthenticated: jest.fn().mockReturnValue(false),
  },
}))

jest.mock("@/app/context/QuizContext", () => {
  const originalModule = jest.requireActual("@/app/context/QuizContext")
  return {
    ...originalModule,
    useQuiz: jest.fn(),
    QuizProvider: function MockQuizProvider(props) {
      return React.createElement("div", null, props.children)
    },
  }
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

// Test component that uses the quiz context
const TestComponent = () => {
  const { state, submitAnswer, completeQuiz, restartQuiz } = useQuiz()

  return (
    <div>
      <div data-testid="current-question">{state.currentQuestionIndex}</div>
      <div data-testid="is-completed">{state.isCompleted ? "true" : "false"}</div>
      <div data-testid="score">{state.score}</div>
      <button data-testid="submit-answer" onClick={() => submitAnswer("test answer", 10, true)}>
        Submit Answer
      </button>
      <button
        data-testid="complete-quiz"
        onClick={() => completeQuiz([{ answer: "test", timeSpent: 10, isCorrect: true }])}
      >
        Complete Quiz
      </button>
      <button data-testid="restart-quiz" onClick={restartQuiz}>
        Restart Quiz
      </button>
    </div>
  )
}

describe("QuizContext", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
  })

  const mockQuizData = {
    id: "123",
    title: "Test Quiz",
    questions: [
      {
        id: 1,
        question: "Question 1",
        answer: "Answer 1",
        option1: "Option 1",
        option2: "Option 2",
        option3: "Option 3",
      },
      {
        id: 2,
        question: "Question 2",
        answer: "Answer 2",
        option1: "Option 1",
        option2: "Option 2",
        option3: "Option 3",
      },
    ],
  }

  test("initializes with correct default state", () => {
    render(
      <QuizProvider quizData={mockQuizData} slug="test-quiz">
        <TestComponent />
      </QuizProvider>,
    )

    expect(screen.getByTestId("current-question").textContent).toBe("0")
    expect(screen.getByTestId("is-completed").textContent).toBe("false")
    expect(screen.getByTestId("score").textContent).toBe("0")
  })

  test("submits an answer and updates state", async () => {
    render(
      <QuizProvider quizData={mockQuizData} slug="test-quiz">
        <TestComponent />
      </QuizProvider>,
    )

    fireEvent.click(screen.getByTestId("submit-answer"))

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId("current-question").textContent).toBe("1")
    })
  })

  test("completes quiz and updates state", async () => {
    render(
      <QuizProvider quizData={mockQuizData} slug="test-quiz">
        <TestComponent />
      </QuizProvider>,
    )

    fireEvent.click(screen.getByTestId("complete-quiz"))

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId("is-completed").textContent).toBe("true")
      expect(screen.getByTestId("score").textContent).toBe("100")
    })
  })

  test("prevents multiple completions", async () => {
    const { quizService } = require("../lib/QuizService")

    render(
      <QuizProvider quizData={mockQuizData} slug="test-quiz">
        <TestComponent />
      </QuizProvider>
    )

    fireEvent.click(screen.getByTestId("complete-quiz"))

    await waitFor(() => {
      expect(screen.getByTestId("is-completed").textContent).toBe("true")
    })

    jest.clearAllMocks()

    fireEvent.click(screen.getByTestId("complete-quiz"))

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(quizService.saveCompleteQuizResult).not.toHaveBeenCalled()
  })

  test("restarts quiz and resets state", async () => {
    const { quizService } = require("../lib/QuizService")

    render(
      <QuizProvider quizData={mockQuizData} slug="test-quiz">
        <TestComponent />
      </QuizProvider>,
    )

    // First complete the quiz
    fireEvent.click(screen.getByTestId("complete-quiz"))

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId("is-completed").textContent).toBe("true")
    })

    // Now restart
    fireEvent.click(screen.getByTestId("restart-quiz"))

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId("is-completed").textContent).toBe("false")
      expect(screen.getByTestId("current-question").textContent).toBe("0")
      expect(screen.getByTestId("score").textContent).toBe("0")
    })

    // Verify service was called
    expect(quizService.clearQuizState).toHaveBeenCalled()
  })
})
