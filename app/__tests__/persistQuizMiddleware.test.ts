import { configureStore } from "@reduxjs/toolkit"
import quizReducer, { setCurrentQuestion } from "@/store/slices/quizSlice"
import persistQuizMiddleware, {
  loadPersistedQuizState,
  clearPersistedQuizState,
} from "@/store/middleware/persistQuizMiddleware"

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

// Mock requestIdleCallback
window.requestIdleCallback = jest.fn((callback) => {
  callback({} as IdleDeadline)
  return 0
})

describe("persistQuizMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
  })

  test("should persist quiz state when actions are dispatched", () => {
    // Create store with middleware
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(persistQuizMiddleware.middleware),
    })

    // Set up initial quiz state
    store.dispatch({
      type: "quiz/fetchQuiz/fulfilled",
      payload: {
        id: "test-quiz",
        title: "Test Quiz",
        type: "mcq",
        slug: "test-quiz",
        questions: [{ id: "q1", question: "Question 1", type: "mcq", options: ["A", "B", "C"], correctAnswer: "A" }],
      },
    })

    // Dispatch an action that should trigger persistence
    store.dispatch(setCurrentQuestion(0))

    // Check if localStorage.setItem was called
    expect(localStorageMock.setItem).toHaveBeenCalled()

    // Get the stored value and parse it
    const key = "quiz_state"
    const storedValue = JSON.parse(localStorageMock.setItem.mock.calls[0][1])

    // Verify the stored data
    expect(storedValue.currentQuestion).toBe(0)
    expect(storedValue.currentQuizId).toBe("test-quiz")
  })

  test("should remove quiz state from localStorage when quiz is completed", () => {
    // Create store with middleware
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(persistQuizMiddleware.middleware),
    })

    // Set up initial quiz state
    store.dispatch({
      type: "quiz/fetchQuiz/fulfilled",
      payload: {
        id: "test-quiz",
        title: "Test Quiz",
        type: "mcq",
        slug: "test-quiz",
        questions: [{ id: "q1", question: "Question 1", type: "mcq", options: ["A", "B", "C"], correctAnswer: "A" }],
      },
    })

    // Mark quiz as completed
    store.dispatch({
      type: "quiz/submitQuiz/fulfilled",
      payload: {
        quizId: "test-quiz",
        userId: "user1",
        score: 10,
        maxScore: 10,
        percentage: 100,
        submittedAt: new Date().toISOString(),
      },
    })

    // Check if localStorage.removeItem was called
    expect(localStorageMock.removeItem).toHaveBeenCalled()
  })

  test("loadPersistedQuizState should return persisted state", () => {
    const mockState = {
      currentQuestion: 1,
      userAnswers: [{ questionId: "q1", answer: "A" }],
      currentQuizId: "test-quiz",
    }

    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockState))

    const result = loadPersistedQuizState()
    expect(result).toEqual(mockState)
  })

  test("clearPersistedQuizState should remove state from localStorage", () => {
    clearPersistedQuizState()
    expect(localStorageMock.removeItem).toHaveBeenCalled()
  })
})
