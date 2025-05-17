import { configureStore } from "@reduxjs/toolkit"
import quizReducer, { setCurrentQuestion, submitQuiz } from "@/store/slices/quizSlice"
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

  test("should persist quiz state when actions are dispatched", async () => {
    // Create store with middleware
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware().prepend(persistQuizMiddleware.middleware),
    })

    // Set up initial quiz state with proper action
    await store.dispatch({
      type: "quiz/fetchQuiz/fulfilled",
      payload: {
        id: "test-quiz",
        title: "Test Quiz",
        type: "mcq",
        slug: "test-quiz",
        questions: [
          { 
            id: "q1", 
            question: "Question 1", 
            type: "mcq", 
            options: ["A", "B", "C"], 
            correctAnswer: "A" 
          }
        ],
      },
    })

    // Force middleware to run by dispatching synchronously
    store.dispatch(setCurrentQuestion(0))

    // Add small delay to allow middleware to complete
    await new Promise(resolve => setTimeout(resolve, 0))

    // Verify localStorage operations
    expect(localStorageMock.setItem).toHaveBeenCalled()

    // Verify stored data
    const storedValue = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
    expect(storedValue).toHaveProperty("currentQuestion", 0)
    expect(storedValue).toHaveProperty("currentQuizId", "test-quiz")
  })

  test("should remove quiz state from localStorage when quiz is completed", async () => {
    // Create store with middleware
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware().prepend(persistQuizMiddleware.middleware),
    })

    // Set initial state
    await store.dispatch({
      type: "quiz/fetchQuiz/fulfilled",
      payload: {
        id: "test-quiz",
        title: "Test Quiz",
        type: "mcq",
        slug: "test-quiz",
        questions: [
          { 
            id: "q1", 
            question: "Question 1", 
            type: "mcq",
            options: ["A", "B", "C"], 
            correctAnswer: "A" 
          }
        ],
      },
    })

    // Mock submission response
    await store.dispatch({
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

    // Add small delay to allow middleware to complete
    await new Promise(resolve => setTimeout(resolve, 0))

    // Verify localStorage operations
    expect(localStorageMock.removeItem).toHaveBeenCalled()
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("quiz_state")
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
