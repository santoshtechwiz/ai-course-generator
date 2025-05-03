import { render, screen, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { SessionProvider } from "next-auth/react"
import { QuizProvider } from "@/app/context/QuizContext"
import McqQuizWrapper from "../dashboard/(quiz)/mcq/components/McqQuizWrapper"
import quizReducer from "@/store/slices/quizSlice"

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  signIn: jest.fn(),
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

// Mock the GuestSignInPrompt component
jest.mock("../app/dashboard/(quiz)/components/GuestSignInPrompt", () => ({
  GuestSignInPrompt: () => <div data-testid="guest-sign-in-prompt">Guest Sign In Prompt</div>,
}))

// Mock the McqQuizResult component
jest.mock("../dashboard/(quiz)/mcq/components/McqQuizResult", () => ({
  __esModule: true,
  default: () => <div data-testid="quiz-results">Quiz Results</div>,
}))

// Mock quiz-index.ts
jest.mock("@/lib/utils/quiz-index", () => ({
  createQuizError: (type, message) => ({ type, message }),
  QuizErrorType: {
    VALIDATION: "VALIDATION",
    UNKNOWN: "UNKNOWN",
  },
  getUserFriendlyErrorMessage: (error) => error.message,
  quizUtils: {
    calculateScore: () => 100,
  },
  formatQuizTime: () => "5m 30s",
  calculateTotalTime: () => 330,
}))

// Mock the useToast hook
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Mock the McqQuiz component
jest.mock("../dashboard/(quiz)/mcq/components/McqQuiz", () => ({
  __esModule: true,
  default: () => <div data-testid="mcq-quiz">MCQ Quiz</div>,
}))

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
        questions: [
          {
            id: "1",
            question: "Test Question 1",
            answer: "Answer 1",
            option1: "Option 1",
            option2: "Option 2",
            option3: "Option 3",
          },
          {
            id: "2",
            question: "Test Question 2",
            answer: "Answer 2",
            option1: "Option 1",
            option2: "Option 2",
            option3: "Option 3",
          },
        ],
        currentQuestionIndex: 0,
        answers: ["", ""], // Replace null with empty strings or appropriate default values of type Answer
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

describe("MCQ Page Auth Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("shows quiz content for authenticated users", async () => {
    // Mock authenticated session
    jest.spyOn(require("next-auth/react"), "useSession").mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })

    const store = createTestStore({ isAuthenticated: true })

    render(
      <Provider store={store}>
        <SessionProvider session={{ user: { name: "Test User" } }}>
          <QuizProvider quizData={{ questions: store.getState().quiz.questions }} slug="test-quiz" quizType="mcq">
            <McqQuizWrapper quizData={store.getState().quiz} slug="test-quiz" />
          </QuizProvider>
        </SessionProvider>
      </Provider>,
    )

    // The quiz should be rendered for authenticated users
    await waitFor(() => {
      expect(screen.queryByTestId("guest-sign-in-prompt")).not.toBeInTheDocument()
    })
  })

  test("shows sign-in prompt for guest users with completed quiz", async () => {
    // Mock unauthenticated session
    jest.spyOn(require("next-auth/react"), "useSession").mockReturnValue({
      data: null,
      status: "unauthenticated",
    })

    const store = createTestStore({
      isCompleted: true,
      requiresAuth: true,
      isAuthenticated: false,
      isProcessingAuth: false,
      pendingAuthRequired: false,
    })

    render(
      <Provider store={store}>
        <SessionProvider session={null}>
          <QuizProvider quizData={{ questions: store.getState().quiz.questions }} slug="test-quiz" quizType="mcq">
            <McqQuizWrapper quizData={store.getState().quiz} slug="test-quiz" />
          </QuizProvider>
        </SessionProvider>
      </Provider>,
    )

    // The guest sign-in prompt should be shown for unauthenticated users with completed quiz
    await waitFor(() => {
      expect(screen.getByTestId("guest-sign-in-prompt")).toBeInTheDocument()
    })
  })
})
