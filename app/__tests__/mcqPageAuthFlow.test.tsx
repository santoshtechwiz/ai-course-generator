"use client"

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { SessionProvider } from "next-auth/react"
import { QuizProvider } from "@/app/context/QuizContext"
import McqQuizWrapper from "../dashboard/(quiz)/mcq/components/McqQuizWrapper"
import quizReducer from "@/store/slices/quizSlice"

// Mock router
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

// Mock the useSession hook
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  SessionProvider: ({ children }) => children,
}))

// Mock the McqQuiz component
jest.mock("../dashboard/(quiz)/mcq/components/McqQuiz", () => ({
  __esModule: true,
  default: ({ question, onAnswer, questionNumber, totalQuestions, isLastQuestion }) => (
    <div data-testid="mcq-quiz">
      <h2>{question.question}</h2>
      <p>
        Question {questionNumber}/{totalQuestions}
      </p>
      <div>
        <div onClick={() => onAnswer(question.answer, 5, true)}>{question.answer}</div>
        <div onClick={() => onAnswer(question.option1, 5, false)}>{question.option1}</div>
        <div onClick={() => onAnswer(question.option2, 5, false)}>{question.option2}</div>
        <div onClick={() => onAnswer(question.option3, 5, false)}>{question.option3}</div>
      </div>
      <button data-testid={isLastQuestion ? "submit-button" : "next-button"}>
        {isLastQuestion ? "Submit Quiz" : "Next"}
      </button>
    </div>
  ),
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

// Mock quiz-index.ts which is the central export point
jest.mock("@/lib/utils/quiz-index", () => ({
  createQuizError: jest.fn((type, message) => ({ type, message })),
  QuizErrorType: {
    VALIDATION: "VALIDATION",
    UNKNOWN: "UNKNOWN",
  },
  getUserFriendlyErrorMessage: jest.fn((error) => error.message),
  quizUtils: {
    calculateScore: jest.fn((answers, type) => {
      if (!Array.isArray(answers) || answers.length === 0) return 0
      const correctCount = answers.filter((a) => a?.isCorrect).length
      return Math.round((correctCount / answers.length) * 100)
    }),
  },
  formatQuizTime: jest.fn((seconds) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`),
  calculateTotalTime: jest.fn((answers) => {
    if (!Array.isArray(answers)) return 0
    return answers.reduce((total, answer) => total + (answer?.timeSpent || 0), 0)
  }),
}))

// Mock the useToast hook
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
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
        answers: [],
        timeSpent: [],
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
        completedAt: null,
        ...initialState,
      },
    },
  })
}

// Mock the QuizContext
jest.mock("@/app/context/QuizContext", () => {
  const originalModule = jest.requireActual("@/app/context/QuizContext")

  return {
    ...originalModule,
    useQuiz: jest.fn(() => ({
      state: {
        quizId: "test-quiz",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuestions,
        currentQuestionIndex: 0,
        answers: [],
        timeSpent: [],
        isCompleted: false,
        score: 0,
        requiresAuth: false,
        isAuthenticated: false,
        hasGuestResult: false,
        guestResultsSaved: false,
        error: null,
        animationState: "idle",
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
    })),
    QuizProvider: ({ children }) => children,
  }
})

// Mock McqQuizResult component
jest.mock("../dashboard/(quiz)/mcq/components/McqQuizResult", () => ({
  __esModule: true,
  default: () => <div data-testid="quiz-results">Quiz Results</div>,
}))

// Mock GuestSignInPrompt component
jest.mock("../dashboard/(quiz)/components/GuestSignInPrompt", () => ({
  __esModule: true,
  default: ({ onSignIn }) => (
    <div data-testid="guest-signin-prompt">
      <h2>Sign In to Save Results</h2>
      <p>You need to sign in to save your quiz results.</p>
      <button onClick={onSignIn}>Sign In</button>
    </div>
  ),
}))

describe("MCQ Quiz Auth Flow", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()

    // Reset the useQuiz mock implementation for each test
    const { useQuiz } = require("@/app/context/QuizContext")
    useQuiz.mockImplementation(() => ({
      state: {
        quizId: "test-quiz",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuestions,
        currentQuestionIndex: 0,
        answers: [],
        timeSpent: [],
        isCompleted: false,
        score: 0,
        requiresAuth: false,
        isAuthenticated: false,
        hasGuestResult: false,
        guestResultsSaved: false,
        error: null,
        animationState: "idle",
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
    }))
  })

  test("renders quiz questions correctly", () => {
    const store = createTestStore({ questions: mockQuestions })

    render(
      <Provider store={store}>
        <SessionProvider session={null}>
          <QuizProvider quizData={{ questions: mockQuestions }} slug="test-quiz" quizType="mcq">
            <McqQuizWrapper questions={mockQuestions} quizId="test-quiz" slug="test-quiz" />
          </QuizProvider>
        </SessionProvider>
      </Provider>,
    )

    // Check if the first question is rendered
    expect(screen.getByText("What is the capital of France?")).toBeInTheDocument()
    expect(screen.getByText("Question 1/2")).toBeInTheDocument()
  })

  test("allows selecting an answer and moving to next question", async () => {
    const store = createTestStore({ questions: mockQuestions })
    const { useQuiz } = require("@/app/context/QuizContext")
    const submitAnswerMock = jest.fn()

    useQuiz.mockImplementation(() => ({
      state: {
        quizId: "test-quiz",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuestions,
        currentQuestionIndex: 0,
        answers: [],
        timeSpent: [],
        isCompleted: false,
        score: 0,
        requiresAuth: false,
        isAuthenticated: false,
        hasGuestResult: false,
        guestResultsSaved: false,
        error: null,
        animationState: "idle",
      },
      submitAnswer: submitAnswerMock,
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
    }))

    render(
      <Provider store={store}>
        <SessionProvider session={null}>
          <QuizProvider quizData={{ questions: mockQuestions }} slug="test-quiz" quizType="mcq">
            <McqQuizWrapper questions={mockQuestions} quizId="test-quiz" slug="test-quiz" />
          </QuizProvider>
        </SessionProvider>
      </Provider>,
    )

    // Select an answer by clicking directly on the answer
    fireEvent.click(screen.getByText("Paris"))

    // This should trigger the onAnswer callback which will move to the next question
    await waitFor(() => {
      expect(submitAnswerMock).toHaveBeenCalled()
      expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument()
      expect(screen.getByText("Question 2/2")).toBeInTheDocument()
    })
  })

  test("shows 'Submit Quiz' on last question", async () => {
    const store = createTestStore({ questions: mockQuestions })
    const { useQuiz } = require("@/app/context/QuizContext")
    const submitAnswerMock = jest.fn()

    // Mock the component to be on the last question
    useQuiz.mockImplementation(() => ({
      state: {
        quizId: "test-quiz",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuestions,
        currentQuestionIndex: 1, // Set to the last question index
        answers: [{ questionId: "1", isCorrect: true, timeSpent: 10, answer: "Paris" }],
        timeSpent: [10],
        isCompleted: false,
        score: 0,
        requiresAuth: false,
        isAuthenticated: false,
        hasGuestResult: false,
        guestResultsSaved: false,
        error: null,
        animationState: "idle",
      },
      submitAnswer: submitAnswerMock,
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
    }))

    render(
      <Provider store={store}>
        <SessionProvider session={null}>
          <QuizProvider quizData={{ questions: mockQuestions }} slug="test-quiz" quizType="mcq">
            <McqQuizWrapper
              questions={mockQuestions}
              quizId="test-quiz"
              slug="test-quiz"
              currentQuestionIndex={1} // Pass the current question index directly
            />
          </QuizProvider>
        </SessionProvider>
      </Provider>,
    )

    // Check if the submit button is rendered
    expect(screen.getByTestId("submit-button")).toBeInTheDocument()
    expect(screen.queryByTestId("next-button")).not.toBeInTheDocument()
  })

  test("shows auth prompt when quiz requires authentication", async () => {
    // Override the useQuiz mock for this specific test
    const { useQuiz } = require("@/app/context/QuizContext")
    useQuiz.mockImplementation(() => ({
      state: {
        quizId: "test-quiz",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuestions,
        currentQuestionIndex: 0,
        answers: [],
        timeSpent: [],
        isCompleted: true, // Set isCompleted to true
        score: 0,
        requiresAuth: true, // Set requiresAuth to true
        isAuthenticated: false,
        hasGuestResult: true,
        guestResultsSaved: false,
        error: null,
        animationState: "idle",
        isProcessingAuth: false,
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
    }))

    const store = createTestStore({
      questions: mockQuestions,
      requiresAuth: true,
      isAuthenticated: false,
      isCompleted: true,
      hasGuestResult: true,
      guestResultsSaved: false,
      isProcessingAuth: false,
    })

    render(
      <Provider store={store}>
        <SessionProvider session={null}>
          <QuizProvider
            quizData={{
              questions: mockQuestions,
              requiresAuth: true,
              isCompleted: true,
            }}
            slug="test-quiz"
            quizType="mcq"
          >
            <McqQuizWrapper questions={mockQuestions} quizId="test-quiz" slug="test-quiz" />
          </QuizProvider>
        </SessionProvider>
      </Provider>,
    )

    // Check if auth prompt is shown
    await waitFor(() => {
      expect(screen.getByTestId("guest-signin-prompt")).toBeInTheDocument()
      expect(screen.getByText("Sign In to Save Results")).toBeInTheDocument()
    })
  })

  test("handles error states correctly", async () => {
    // Override the useQuiz mock for this specific test
    const { useQuiz } = require("@/app/context/QuizContext")
    useQuiz.mockImplementation(() => ({
      state: {
        quizId: "test-quiz",
        slug: "test-quiz",
        quizType: "mcq",
        questions: [],
        currentQuestionIndex: 0,
        answers: [],
        timeSpent: [],
        isCompleted: false,
        score: 0,
        requiresAuth: false,
        isAuthenticated: false,
        hasGuestResult: false,
        guestResultsSaved: false,
        error: "No questions available for this quiz.",
        animationState: "idle",
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
    }))

    const store = createTestStore({
      questions: [],
      error: "No questions available for this quiz.",
    })

    render(
      <Provider store={store}>
        <SessionProvider session={null}>
          <QuizProvider quizData={{ questions: [] }} slug="test-quiz" quizType="mcq">
            <McqQuizWrapper
              questions={[]}
              quizId="test-quiz"
              slug="test-quiz"
              error={{ message: "No questions available for this quiz." }}
            />
          </QuizProvider>
        </SessionProvider>
      </Provider>,
    )

    // Check if error message is displayed
    expect(screen.getByText(/No questions available for this quiz/i)).toBeInTheDocument()
  })

  test("shows results when quiz is completed and auth is not required", async () => {
    // Override the useQuiz mock for this specific test
    const { useQuiz } = require("@/app/context/QuizContext")
    useQuiz.mockImplementation(() => ({
      state: {
        quizId: "test-quiz",
        slug: "test-quiz",
        quizType: "mcq",
        questions: mockQuestions,
        currentQuestionIndex: 0,
        answers: [
          { questionId: "1", isCorrect: true, timeSpent: 10, answer: "Paris" },
          { questionId: "2", isCorrect: true, timeSpent: 15, answer: "4" },
        ],
        timeSpent: [10, 15],
        isCompleted: true, // Set isCompleted to true
        score: 100,
        requiresAuth: false,
        isAuthenticated: true, // Set isAuthenticated to true
        hasGuestResult: false,
        guestResultsSaved: false,
        error: null,
        animationState: "completed",
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
      setAuthCheckComplete: jest.fn(),
    }))

    const store = createTestStore({
      questions: mockQuestions,
      isCompleted: true,
      isAuthenticated: true,
      answers: [
        { questionId: "1", isCorrect: true, timeSpent: 10, answer: "Paris" },
        { questionId: "2", isCorrect: true, timeSpent: 15, answer: "4" },
      ],
      score: 100,
    })

    render(
      <Provider store={store}>
        <SessionProvider session={{ user: { name: "Test User" } }}>
          <QuizProvider
            quizData={{
              questions: mockQuestions,
              requiresAuth: false,
              isCompleted: true,
            }}
            slug="test-quiz"
            quizType="mcq"
          >
            <McqQuizWrapper
              questions={mockQuestions}
              quizId="test-quiz"
              slug="test-quiz"
              showResults={true} // Force showing results
              quizResults={{
                quizId: "test-quiz",
                slug: "test-quiz",
                score: 100,
                answers: [
                  { questionId: "1", isCorrect: true, timeSpent: 10, answer: "Paris" },
                  { questionId: "2", isCorrect: true, timeSpent: 15, answer: "4" },
                ],
              }}
            />
          </QuizProvider>
        </SessionProvider>
      </Provider>,
    )

    // Check if results component is rendered
    expect(screen.getByTestId("quiz-results")).toBeInTheDocument()
  })
})
