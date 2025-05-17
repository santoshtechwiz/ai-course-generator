"use client"

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { Provider } from "react-redux"
import { SessionProvider } from "next-auth/react"
import { configureStore } from "@reduxjs/toolkit"
import quizReducer from "@/store/slices/quizSlice"
import "@testing-library/jest-dom"
import CodeQuizWrapper from "../dashboard/(quiz)/code/components/CodeQuizWrapper"
import toast from "react-hot-toast"

// Mocks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useParams: jest.fn().mockReturnValue({ slug: "test-quiz" }),
}))

const mockSignIn = jest.fn()
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: { user: { id: "test-user" } },
    status: "authenticated",
  })),
  signIn: jest.fn((provider, options) => mockSignIn(provider, options)),
  SessionProvider: ({ children }) => <div>{children}</div>,
}))

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
  promise: jest.fn(),
}))

jest.mock("@/hooks/useQuizState", () => ({
  useQuiz: jest.fn(),
}))

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(() => ({
    userId: "test-user",
    status: "authenticated",
    fromAuth: false,
  })),
}))

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key) => store[key] ?? null),
    setItem: jest.fn((key, value) => { store[key] = String(value) }),
    removeItem: jest.fn((key) => { delete store[key] }),
    clear: jest.fn(() => { store = {} }),
    length: 0,
    key: jest.fn((index) => "")
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock })

jest.mock("../dashboard/(quiz)/code/components/CodingQuiz", () => {
  return function MockCodingQuiz({ question, onAnswer, questionNumber, totalQuestions, isLastQuestion }) {
    return (
      <div data-testid="coding-quiz">
        <h2>Question {questionNumber}/{totalQuestions}</h2>
        <div data-testid="question-text">{question.question}</div>
        {question.codeSnippet && <pre data-testid="code-snippet">{question.codeSnippet}</pre>}
        <div data-testid="options">
          {question.options?.map((option, index) => (
            <button
              key={index}
              data-testid={`option-${index}`}
              onClick={() => onAnswer(option, 10, option === question.correctAnswer)}
            >
              {option}
            </button>
          ))}
        </div>
        <button data-testid="submit-answer" onClick={() => onAnswer("test answer", 10, true)}>
          {isLastQuestion ? "Submit Quiz" : "Next"}
        </button>
      </div>
    )
  }
})

jest.mock("../dashboard/(quiz)/components/QuizStateDisplay", () => ({
  InitializingDisplay: () => <div data-testid="initializing-display">Loading...</div>,
  QuizNotFoundDisplay: ({ onReturn }) => (
    <div data-testid="quiz-not-found">Quiz not found<button onClick={onReturn}>Return</button></div>
  ),
  ErrorDisplay: ({ error, onRetry, onReturn }) => (
    <div data-testid="error-display">{error}
      <button data-testid="retry-button" onClick={onRetry}>Retry</button>
      <button data-testid="return-button" onClick={onReturn}>Return</button>
    </div>
  ),
  EmptyQuestionsDisplay: ({ onReturn }) => (
    <div data-testid="empty-questions">No questions<button onClick={onReturn}>Return</button></div>
  ),
}))

jest.mock("../dashboard/(quiz)/components/QuizSubmissionLoading", () => ({
  QuizSubmissionLoading: () => <div data-testid="quiz-submission-loading">Submitting quiz...</div>
}))

jest.mock("../dashboard/(quiz)/components/NonAuthenticatedUserSignInPrompt", () => {
  return function MockNonAuthPrompt({ onSignIn, showSaveMessage }) {
    return (
      <div data-testid="non-authenticated-prompt">
        <p>Sign in to view your results</p>
        <button data-testid="sign-in-button" onClick={onSignIn}>Sign In</button>
        {showSaveMessage && <p data-testid="save-message">Your progress will be saved</p>}
      </div>
    )
  }
})

jest.mock("../dashboard/(quiz)/code/components/QuizResultPreview", () => {
  return function MockQuizResultPreview({ result, onSubmit, onCancel }) {
    return (
      <div data-testid="quiz-result-preview">
        <h2>Preview Results</h2>
        <p>Score: {result.score}/{result.maxScore}</p>
        <button data-testid="submit-results" onClick={() => onSubmit([{ questionId: "q1", answer: "test" }], 60)}>Submit Results</button>
        <button data-testid="cancel-submit" onClick={onCancel}>Cancel</button>
      </div>
    )
  }
})

global.fetch = jest.fn()

const mockQuizData = {
  id: "test-quiz",
  title: "Test Code Quiz",
  slug: "test-quiz",
  type: "code",
  questions: [
    {
      id: "q1",
      question: "What is 1+1?",
      codeSnippet: "console.log(1 + 1);",
      options: ["2", "11", "undefined", "error"],
      correctAnswer: "2",
      language: "javascript",
      type: "code",
    },
    {
      id: "q2",
      question: "Fix this function",
      codeSnippet: "function add(a, b) {\n  return\n}",
      answer: "function add(a, b) {\n  return a + b\n}",
      language: "javascript",
      type: "code",
    },
  ]
}

const previewResults = {
  score: 2,
  maxScore: 2,
  percentage: 100,
  title: "Test Code Quiz",
  slug: "test-quiz",
  questions: [],
}

const createMockUseQuiz = (overrides = {}) => ({
  quiz: {
    data: mockQuizData,
    currentQuestion: 1,
    userAnswers: [
      { questionId: "q1", answer: "2" },
      { questionId: "q2", answer: "test answer" },
    ],
    isLastQuestion: true
  },
  status: {
    isLoading: false,
    errorMessage: null,
  },
  actions: {
    loadQuiz: jest.fn().mockResolvedValue(mockQuizData),
    submitQuiz: jest.fn().mockResolvedValue({
      score: 2,
      maxScore: 2,
    }),
    saveAnswer: jest.fn(),
    reset: jest.fn(),
  },
  navigation: {
    next: jest.fn(),
  },
  submitQuiz: jest.fn().mockResolvedValue({
    score: 2,
    maxScore: 2,
  }),
  ...overrides,
})

jest.mock("@/store/middleware/persistQuizMiddleware", () => ({
  loadAuthRedirectState: jest.fn(() => ({
    slug: "test-quiz",
    quizId: "test-quiz",
    type: "code",
    userAnswers: [
      { questionId: "q1", answer: "2" },
      { questionId: "q2", answer: "test answer" },
    ],
    fromSubmission: true,
    previewResults,
  })),
  hasAuthRedirectState: jest.fn(() => true),
  clearAuthRedirectState: jest.fn(),
  saveAuthRedirectState: jest.fn(),
}))

const setupStore = () => configureStore({ reducer: { quiz: quizReducer } })

describe("CodeQuizWrapper - Submission Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })



})
