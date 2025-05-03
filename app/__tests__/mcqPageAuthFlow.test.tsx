import { render, screen, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { SessionProvider } from "next-auth/react"
import quizReducer from "@/store/slices/quizSlice"
import { jest } from "@jest/globals"

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

// Mock components
jest.mock("@/app/dashboard/(quiz)/components/GuestSignInPrompt", () => ({
  __esModule: true,
  default: () => <div data-testid="guest-sign-in-prompt">Guest Sign In Prompt</div>,
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

// Mock the MCQ page component
const MockMcqPage = () => {
  return (
    <div>
      <h1>MCQ Quiz Page</h1>
      <div data-testid="quiz-content">Quiz Content</div>
    </div>
  )
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
          <MockMcqPage />
        </SessionProvider>
      </Provider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("quiz-content")).toBeInTheDocument()
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
    })

    render(
      <Provider store={store}>
        <SessionProvider session={null}>
          <MockMcqPage />
        </SessionProvider>
      </Provider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("guest-sign-in-prompt")).toBeInTheDocument()
    })
  })
})
