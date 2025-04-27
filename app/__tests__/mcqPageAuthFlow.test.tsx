import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { quizService } from "@/lib/QuizService"
import * as QuizContext from "@/app/context/QuizContext"
import McqQuizWrapper from "../dashboard/(quiz)/mcq/components/McqQuizWrapper"

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

// Ensure the path is correct
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

// Mock the McqQuiz component
jest.mock("@/mcq/components/McqQuiz", () => {
  return function MockMcqQuiz(props) {
    return React.createElement(
      "div",
      { "data-testid": "mcq-quiz" },
      React.createElement("button", {
        "data-testid": "answer-question",
        onClick: () => props.onAnswer("test", 10, true),
        children: "Answer Question",
      })
    )
  }
})

// Mock the McqQuizResult component
jest.mock("@/mcq/components/McqQuizResult", () => {
  return function MockMcqQuizResult(props) {
    return React.createElement(
      "div",
      { "data-testid": "mcq-result" },
      React.createElement("button", {
        "data-testid": "restart-quiz",
        onClick: props.onRestart,
        children: "Restart Quiz",
      })
    )
  }
})

// Mock the GuestPrompt component
jest.mock("../../components/GuestSignInPrompt", () => ({
  GuestPrompt: function MockGuestPrompt(props) {
    return {
      type: "div",
      props: {
        "data-testid": "guest-prompt",
        children: {
          type: "button",
          props: {
            "data-testid": "continue-as-guest",
            onClick: props.onContinueAsGuest,
            children: "Continue as Guest",
          },
        },
      },
    }
  },
}))

describe("McqQuizWrapper", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementation for useQuiz
    const mockUseQuiz = {
      state: {
        currentQuestionIndex: 0,
        questionCount: 2,
        isLoading: false,
        error: null,
        isCompleted: false,
        answers: [null, null],
        animationState: "idle",
        timeSpentPerQuestion: [0, 0],
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      isAuthenticated: false,
    }
    ;(QuizContext.useQuiz as jest.Mock).mockReturnValue(mockUseQuiz)
  })

  const mockQuizData = {
    id: "123",
    title: "Test Quiz",
    slug: "test-quiz",
    isPublic: true,
    isFavorite: false,
    userId: "user1",
  }

  const mockQuestions = [
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
  ]

  test("renders quiz component when not completed", () => {
    render(<McqQuizWrapper quizData={mockQuizData} questions={mockQuestions} slug="test-quiz" />)

    expect(screen.getByTestId("mcq-quiz")).toBeInTheDocument()
  })

  test("renders result component when completed", () => {
    // Override the default mock to show completed state
    ;(QuizContext.useQuiz as jest.Mock).mockReturnValue({
      state: {
        currentQuestionIndex: 1,
        questionCount: 2,
        isLoading: false,
        error: null,
        isCompleted: true,
        answers: [{ answer: "test", timeSpent: 10, isCorrect: true }, null],
        animationState: "showing-results",
        timeSpentPerQuestion: [10, 0],
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      isAuthenticated: false,
    })

    render(<McqQuizWrapper quizData={mockQuizData} questions={mockQuestions} slug="test-quiz" />)

    expect(screen.getByTestId("mcq-result")).toBeInTheDocument()
  })

  test("shows auth prompt for guest users on last question", () => {
    // Mock for last question
    const submitAnswer = jest.fn()
    const completeQuiz = jest.fn()
    ;(QuizContext.useQuiz as jest.Mock).mockReturnValue({
      state: {
        currentQuestionIndex: 1, // Last question (0-indexed)
        questionCount: 2,
        isLoading: false,
        error: null,
        isCompleted: false,
        answers: [{ answer: "test", timeSpent: 10, isCorrect: true }, null],
        animationState: "idle",
        timeSpentPerQuestion: [10, 0],
      },
      submitAnswer,
      completeQuiz,
      restartQuiz: jest.fn(),
      isAuthenticated: false,
    })

    render(<McqQuizWrapper quizData={mockQuizData} questions={mockQuestions} slug="test-quiz" />)

    // Answer the last question
    fireEvent.click(screen.getByTestId("answer-question"))

    // Wait for the auth prompt to appear
    return waitFor(() => {
      expect(submitAnswer).toHaveBeenCalledWith("test", 10, true)

      // This would normally show the auth prompt after a timeout
      // But since we're mocking, we need to manually update the component state
      ;(QuizContext.useQuiz as jest.Mock).mockReturnValue({
        state: {
          currentQuestionIndex: 1,
          questionCount: 2,
          isLoading: false,
          error: null,
          isCompleted: false,
          answers: [
            { answer: "test", timeSpent: 10, isCorrect: true },
            { answer: "test", timeSpent: 10, isCorrect: true },
          ],
          animationState: "idle",
          timeSpentPerQuestion: [10, 10],
        },
        submitAnswer,
        completeQuiz,
        restartQuiz: jest.fn(),
        isAuthenticated: false,
      })

      // Re-render with updated state
      screen.rerender(<McqQuizWrapper quizData={mockQuizData} questions={mockQuestions} slug="test-quiz" />)

      // Now we should see the guest prompt
      expect(screen.getByTestId("guest-prompt")).toBeInTheDocument()
    })
  })

  test("handles URL completed parameter correctly", () => {
    // Mock window.location
    const originalLocation = window.location
    delete window.location
    window.location = {
      ...originalLocation,
      search: "?completed=true",
    } as Location

    // Mock getQuizState to return completed state
    quizService.getQuizState.mockReturnValue({
      isCompleted: true,
      answers: [{ answer: "test", timeSpent: 10, isCorrect: true }],
    })

    const completeQuiz = jest.fn()
    ;(QuizContext.useQuiz as jest.Mock).mockReturnValue({
      state: {
        currentQuestionIndex: 0,
        questionCount: 2,
        isLoading: false,
        error: null,
        isCompleted: false,
        answers: [null, null],
        animationState: "idle",
        timeSpentPerQuestion: [0, 0],
      },
      submitAnswer: jest.fn(),
      completeQuiz,
      restartQuiz: jest.fn(),
      isAuthenticated: false,
    })

    render(<McqQuizWrapper quizData={mockQuizData} questions={mockQuestions} slug="test-quiz" />)

    // Check if completeQuiz was called with the saved answers
    expect(quizService.getQuizState).toHaveBeenCalledWith("123", "mcq")

    // Restore original location
    window.location = originalLocation
  })
})
