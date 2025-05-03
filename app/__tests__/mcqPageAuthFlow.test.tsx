import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { QuizProvider } from "@/app/context/QuizContext"
import McqQuizWrapper from "../dashboard/(quiz)/mcq/components/McqQuizWrapper"
import quizReducer from "@/store/slices/quizSlice"
import { createQuizError, QuizErrorType } from "@/lib/utils/quiz-error-handling"

// Mock router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
}))

// Mock the utility functions
jest.mock("@/lib/utils/quiz-options", () => ({
  shuffleArray: (array) => array,
  isAnswerCorrect: (userAnswer, correctAnswer) => userAnswer === correctAnswer,
}))

jest.mock("@/lib/utils/quiz-performance", () => ({
  formatQuizTime: (seconds) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`,
  calculatePerformanceLevel: (score) =>
    score >= 90 ? "Excellent" : score >= 75 ? "Good" : score >= 60 ? "Satisfactory" : "Needs Improvement",
  getDifficultyColor: (difficulty) =>
    difficulty === "easy" ? "text-green-500" : difficulty === "medium" ? "text-yellow-500" : "text-red-500",
  isTooFastAnswer: () => false,
}))

jest.mock("@/lib/utils/quiz-utils", () => ({
  quizUtils: {
    calculateScore: (answers, type) => {
      const correctCount = answers.filter((a) => a.isCorrect).length
      return Math.round((correctCount / answers.length) * 100)
    },
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
        questions: [],
        currentQuestionIndex: 0,
        answers: [],
        timeSpent: [],
        isCompleted: false,
        score: 0,
        requiresAuth: false,
        isAuthenticated: false,
        error: null,
        animationState: "idle",
        ...initialState,
      },
    },
  })
}

describe("MCQ Quiz Auth Flow", () => {
  test("renders quiz questions correctly", () => {
    const store = createTestStore()

    render(
      <Provider store={store}>
        <QuizProvider quizData={{ questions: mockQuestions }} slug="test-quiz" quizType="mcq">
          <McqQuizWrapper questions={mockQuestions} quizId="test-quiz" slug="test-quiz" />
        </QuizProvider>
      </Provider>,
    )

    // Check if the first question is rendered
    expect(screen.getByText("What is the capital of France?")).toBeInTheDocument()
    expect(screen.getByText("Question 1/2")).toBeInTheDocument()
  })

  test("allows selecting an answer and moving to next question", async () => {
    const store = createTestStore()

    render(
      <Provider store={store}>
        <QuizProvider quizData={{ questions: mockQuestions }} slug="test-quiz" quizType="mcq">
          <McqQuizWrapper questions={mockQuestions} quizId="test-quiz" slug="test-quiz" />
        </QuizProvider>
      </Provider>,
    )

    // Select an answer
    fireEvent.click(screen.getByText("Paris"))

    // Click next
    fireEvent.click(screen.getByText("Next"))

    // Check if the second question is rendered
    await waitFor(() => {
      expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument()
      expect(screen.getByText("Question 2/2")).toBeInTheDocument()
    })
  })

  test("shows 'Submit Quiz' on last question", async () => {
    const store = createTestStore()

    render(
      <Provider store={store}>
        <QuizProvider quizData={{ questions: mockQuestions }} slug="test-quiz" quizType="mcq">
          <McqQuizWrapper questions={mockQuestions} quizId="test-quiz" slug="test-quiz" />
        </QuizProvider>
      </Provider>,
    )

    // Select an answer for first question
    fireEvent.click(screen.getByText("Paris"))

    // Click next
    fireEvent.click(screen.getByText("Next"))

    // Wait for second question
    await waitFor(() => {
      expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument()
    })

    // Select an answer for second question
    fireEvent.click(screen.getByText("4"))

    // Check if the button says "Submit Quiz" instead of "Next"
    expect(screen.getByText("Submit Quiz")).toBeInTheDocument()
    expect(screen.queryByText("Next")).not.toBeInTheDocument()
  })

  test("shows auth prompt when quiz requires authentication", async () => {
    const store = createTestStore({
      requiresAuth: true,
      isAuthenticated: false,
    })

    render(
      <Provider store={store}>
        <QuizProvider quizData={{ questions: mockQuestions, requiresAuth: true }} slug="test-quiz" quizType="mcq">
          <McqQuizWrapper questions={mockQuestions} quizId="test-quiz" slug="test-quiz" />
        </QuizProvider>
      </Provider>,
    )

    // Complete the quiz
    // First question
    fireEvent.click(screen.getByText("Paris"))
    fireEvent.click(screen.getByText("Next"))

    // Wait for second question
    await waitFor(() => {
      expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument()
    })

    // Second question
    fireEvent.click(screen.getByText("4"))
    fireEvent.click(screen.getByText("Submit Quiz"))

    // Check if auth prompt is shown
    await waitFor(() => {
      expect(screen.getByText("Sign In to Save Results")).toBeInTheDocument()
      expect(screen.getByText("You need to sign in to save your quiz results.")).toBeInTheDocument()
      expect(screen.getByText("Sign In")).toBeInTheDocument()
    })
  })

  test("handles error states correctly", async () => {
    // Mock the error state
    const errorMessage = "No questions available for this quiz."
    const mockError = createQuizError(QuizErrorType.VALIDATION, errorMessage, null, false)

    // Render with empty questions to trigger error
    const store = createTestStore()

    render(
      <Provider store={store}>
        <QuizProvider quizData={{ questions: [] }} slug="test-quiz" quizType="mcq">
          <McqQuizWrapper questions={[]} quizId="test-quiz" slug="test-quiz" />
        </QuizProvider>
      </Provider>,
    )

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText("Error Loading Quiz")).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  test("shows results when quiz is completed and auth is not required", async () => {
    const store = createTestStore({
      requiresAuth: false,
      isAuthenticated: true,
      isCompleted: true,
    })

    render(
      <Provider store={store}>
        <QuizProvider
          quizData={{
            questions: mockQuestions,
            requiresAuth: false,
            isCompleted: true,
          }}
          slug="test-quiz"
          quizType="mcq"
        >
          <McqQuizWrapper questions={mockQuestions} quizId="test-quiz" slug="test-quiz" />
        </QuizProvider>
      </Provider>,
    )

    // Complete the quiz
    // First question
    fireEvent.click(screen.getByText("Paris"))
    fireEvent.click(screen.getByText("Next"))

    // Wait for second question
    await waitFor(() => {
      expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument()
    })

    // Second question
    fireEvent.click(screen.getByText("4"))
    fireEvent.click(screen.getByText("Submit Quiz"))

    // Check if results are shown
    await waitFor(() => {
      // The test might fail here because the results component might not be fully rendered
      // We can check for elements that would be in the results component
      expect(screen.queryByText("Quiz Results")).toBeInTheDocument()
    })
  })
})
