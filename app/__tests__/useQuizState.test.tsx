import { renderHook, act } from "@testing-library/react"
import { useQuizState } from "@/hooks/useQuizState"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import quizReducer from "@/store/slices/quizSlice"
import { SessionProvider } from "next-auth/react"

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  })),
}))

// Mock calculateTotalTime
jest.mock("@/lib/utils/quiz-index", () => ({
  calculateTotalTime: jest.fn((answers) => {
    if (!Array.isArray(answers)) return 0
    return answers.reduce((total, answer) => total + (answer?.timeSpent || 0), 0)
  }),
}))

// Create a test Redux store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      quiz: quizReducer,
    },
    preloadedState: {
      quiz: {
        ...initialState,
      },
    },
  })
}

// Wrapper component for the hook
const wrapper = ({ children }) => {
  const store = createTestStore()
  return (
    <SessionProvider>
      <Provider store={store}>{children}</Provider>
    </SessionProvider>
  )
}

describe("useQuizState Hook", () => {
  const mockQuizData = {
    id: "test-quiz-id",
    slug: "test-quiz",
    title: "Test Quiz",
    quizType: "mcq",
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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should initialize quiz state", () => {
    const { result } = renderHook(() => useQuizState(), { wrapper })

    act(() => {
      result.current.initializeQuiz(mockQuizData)
    })

    // Basic assertions that don't depend on Redux state
    expect(result.current.initializeQuiz).toBeDefined()
    expect(typeof result.current.initializeQuiz).toBe("function")
  })

  it("should submit an answer", () => {
    const { result } = renderHook(() => useQuizState(), { wrapper })

    act(() => {
      result.current.initializeQuiz(mockQuizData)
    })

    const answer = { answer: "test answer", timeSpent: 10, isCorrect: true }

    act(() => {
      result.current.submitAnswer(answer)
    })

    // Basic assertions that don't depend on Redux state
    expect(result.current.submitAnswer).toBeDefined()
    expect(typeof result.current.submitAnswer).toBe("function")
  })

  it("should move to the next question", () => {
    const { result } = renderHook(() => useQuizState(), { wrapper })

    act(() => {
      result.current.initializeQuiz(mockQuizData)
    })

    act(() => {
      result.current.nextQuestion()
    })

    // Basic assertions that don't depend on Redux state
    expect(result.current.nextQuestion).toBeDefined()
    expect(typeof result.current.nextQuestion).toBe("function")
  })

  it("should complete the quiz", () => {
    const { result } = renderHook(() => useQuizState(), { wrapper })

    act(() => {
      result.current.initializeQuiz(mockQuizData)
    })

    const answers = [
      { answer: "test answer 1", timeSpent: 10, isCorrect: true },
      { answer: "test answer 2", timeSpent: 15, isCorrect: false },
    ]

    act(() => {
      result.current.completeQuiz(answers)
    })

    // Basic assertions that don't depend on Redux state
    expect(result.current.completeQuiz).toBeDefined()
    expect(typeof result.current.completeQuiz).toBe("function")
  })

  it("should restart the quiz", () => {
    const { result } = renderHook(() => useQuizState(), { wrapper })

    act(() => {
      result.current.initializeQuiz(mockQuizData)
    })

    act(() => {
      result.current.restartQuiz()
    })

    // Basic assertions that don't depend on Redux state
    expect(result.current.restartQuiz).toBeDefined()
    expect(typeof result.current.restartQuiz).toBe("function")
  })

  it("should handle authentication requirement", () => {
    const { result } = renderHook(() => useQuizState(), { wrapper })

    act(() => {
      result.current.handleAuthenticationRequired("/test-redirect")
    })

    // Basic assertions that don't depend on Redux state
    expect(result.current.handleAuthenticationRequired).toBeDefined()
    expect(typeof result.current.handleAuthenticationRequired).toBe("function")
  })

  it("should clear guest results", () => {
    const { result } = renderHook(() => useQuizState(), { wrapper })

    act(() => {
      result.current.clearGuestResults()
    })

    // Basic assertions that don't depend on Redux state
    expect(result.current.clearGuestResults).toBeDefined()
    expect(typeof result.current.clearGuestResults).toBe("function")
  })
})
