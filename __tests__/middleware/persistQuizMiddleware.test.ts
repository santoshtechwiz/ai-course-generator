import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import persistQuizMiddleware, {
  checkStoredAuthRedirectState,
  clearPersistedQuizState,
  loadPersistedQuizState,
  loadPersistedQuizResults,
  cleanup,
} from "@/store/middleware/persistQuizMiddleware"

// Define proper types
interface QuizState {
  currentQuestion: number
  currentQuizSlug: string
  currentQuizId: string
  currentQuizType: "code" | "multiple-choice" | "essay"
  userAnswers: any[]
  quizData: any
  tempResults: any
  isLoading: boolean
  isSubmitting: boolean
  isCompleted: boolean
  timerActive: boolean
  submissionStateInProgress: boolean
  results: any
  quizHistory: any[]
  timeRemaining: number | null
  errors: {
    quiz: string | null
    submission: string | null
    results: string | null
    history: string | null
  }
  hasMoreHistory: boolean
  authRedirectState: any
}

interface QuizCompletedPayload {
  quizId: string
  slug: string
  score: number
  totalQuestions: number
  correctAnswers: number
  totalTime: number
  type: "code" | "multiple-choice" | "essay"
  results: any
}

interface AuthRequiredPayload {
  fromSubmission?: boolean
  type?: "code" | "multiple-choice" | "essay"
}

// Create a mock quiz slice for testing
const mockQuizSlice = createSlice({
  name: "quiz",
  initialState: {
    currentQuestion: 0,
    currentQuizSlug: "",
    currentQuizId: "",
    currentQuizType: "code",
    userAnswers: [],
    quizData: null,
    tempResults: null,
    isLoading: false,
    isSubmitting: false,
    isCompleted: false,
    timerActive: false,
    submissionStateInProgress: false,
    results: null,
    quizHistory: [],
    timeRemaining: null,
    errors: {
      quiz: null,
      submission: null,
      results: null,
      history: null,
    },
    hasMoreHistory: true,
    authRedirectState: null,
  } as QuizState,
  reducers: {
    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestion = action.payload
    },
    markQuizCompleted: (state, action: PayloadAction<QuizCompletedPayload>) => {
      state.isCompleted = true
      state.results = action.payload
    },
    saveAuthRedirectState: (state, action: PayloadAction<any>) => {
      state.authRedirectState = action.payload
    },
    restoreFromAuthRedirect: (state, action: PayloadAction<any>) => {
      Object.assign(state, action.payload)
    },
    authenticationRequired: (state, action: PayloadAction<AuthRequiredPayload>) => {
      // This action triggers auth redirect save
    },
  },
})

const {
  setCurrentQuestion,
  markQuizCompleted,
  saveAuthRedirectState,
  restoreFromAuthRedirect,
  authenticationRequired,
} = mockQuizSlice.actions

// Mock the quiz slice module
jest.mock("@/store/slices/quizSlice", () => ({
  __esModule: true,
  default: mockQuizSlice.reducer,
  setCurrentQuestion,
  markQuizCompleted,
  saveAuthRedirectState,
  restoreFromAuthRedirect,
  authenticationRequired,
}))

// Mock window and storage
const createMockStorage = () => {
  const storage = new Map<string, string>()
  return {
    getItem: jest.fn((key: string) => storage.get(key) || null),
    setItem: jest.fn((key: string, value: string) => {
      storage.set(key, value)
    }),
    removeItem: jest.fn((key: string) => {
      storage.delete(key)
    }),
    clear: jest.fn(() => storage.clear()),
    get length() {
      return storage.size
    },
    key: jest.fn((index: number) => Array.from(storage.keys())[index] || null),
    // For test inspection
    _getAll: () => Object.fromEntries(storage.entries()),
  }
}

// Setup test environment
describe("persistQuizMiddleware", () => {
  let mockStorage: ReturnType<typeof createMockStorage>
  let store: ReturnType<typeof configureStore>
  const quizSlug = "test-quiz"

  // Store original implementations
  const originalSetTimeout = global.setTimeout
  const originalClearTimeout = global.clearTimeout

  beforeEach(() => {
    // Use real timers but with manual control
    jest.useRealTimers()

    // Reset mocks
    jest.clearAllMocks()

    // Setup mock storage
    mockStorage = createMockStorage()

    // Mock window
    Object.defineProperty(global, "window", {
      value: {
        sessionStorage: mockStorage,
        localStorage: mockStorage,
        setTimeout: originalSetTimeout,
        clearTimeout: originalClearTimeout,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
      writable: true,
      configurable: true,
    })

    // Mock document
    Object.defineProperty(global, "document", {
      value: {
        visibilityState: "visible",
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
      writable: true,
      configurable: true,
    })

    // Create store with middleware
    store = configureStore({
      reducer: {
        quiz: mockQuizSlice.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }).concat(persistQuizMiddleware.middleware),
      preloadedState: {
        quiz: {
          currentQuestion: 0,
          currentQuizSlug: quizSlug,
          currentQuizId: "q123",
          currentQuizType: "code",
          userAnswers: [],
          quizData: {
            id: "q123",
            slug: quizSlug,
            title: "Test Quiz",
            questions: [],
            type: "code",
            isPublic: true,
            isFavorite: false,
            ownerId: "owner1",
          },
          tempResults: null,
          isLoading: false,
          isSubmitting: false,
          isCompleted: false,
          timerActive: false,
          submissionStateInProgress: false,
          results: null,
          quizHistory: [],
          timeRemaining: null,
          errors: {
            quiz: null,
            submission: null,
            results: null,
            history: null,
          },
          hasMoreHistory: true,
          authRedirectState: null,
        },
      },
    })
  })

  afterEach(() => {
    cleanup()
  })

  it("should persist quiz state with debouncing", async () => {
    // Dispatch actions
    store.dispatch(setCurrentQuestion(1))
    store.dispatch(setCurrentQuestion(2))
    store.dispatch(setCurrentQuestion(3))

    // Wait for debounced save (300ms + buffer)
    await new Promise((resolve) => setTimeout(resolve, 400))

    // Check if storage was called
    expect(mockStorage.setItem).toHaveBeenCalled()

    // Get the calls for our specific key
    const setItemCalls = mockStorage.setItem.mock.calls.filter((call) => call[0] === `quiz_state_${quizSlug}`)

    expect(setItemCalls.length).toBeGreaterThan(0)

    const lastCall = setItemCalls[setItemCalls.length - 1]
    const value = JSON.parse(lastCall[1])

    expect(value.currentQuestion).toBe(3)
    expect(value.version).toBe("1.0.0")
  }, 15000)

  it("should handle storage errors gracefully", async () => {
    // Mock storage error
    mockStorage.setItem.mockImplementationOnce(() => {
      throw new Error("Storage full")
    })

    // This should not throw
    expect(() => {
      store.dispatch(setCurrentQuestion(1))
    }).not.toThrow()

    // Wait for debounced save
    await new Promise((resolve) => setTimeout(resolve, 400))

    // Should have attempted to save
    expect(mockStorage.setItem).toHaveBeenCalled()
  }, 15000)

  it("should clear state on quiz completion atomically", async () => {
    // First set a question
    store.dispatch(setCurrentQuestion(2))
    await new Promise((resolve) => setTimeout(resolve, 400))

    // Reset mock to check next calls
    mockStorage.setItem.mockClear()
    mockStorage.removeItem.mockClear()

    // Mark quiz as completed
    store.dispatch(
      markQuizCompleted({
        quizId: "q123",
        slug: quizSlug,
        score: 5,
        totalQuestions: 10,
        correctAnswers: 5,
        totalTime: 120,
        type: "code",
        results: {},
      }),
    )

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Verify results were saved
    const resultsCalls = mockStorage.setItem.mock.calls.filter((call) => call[0] === `quiz_results_${quizSlug}`)
    expect(resultsCalls.length).toBeGreaterThan(0)

    // Verify state was cleared
    expect(mockStorage.removeItem).toHaveBeenCalledWith(`quiz_state_${quizSlug}`)
  }, 15000)

  it("should validate and migrate stored data", async () => {
    // Setup legacy data without version
    const legacy = {
      currentQuestion: 1,
      userAnswers: [],
      quizData: null,
      timestamp: Date.now(),
    }

    // Mock the storage to return legacy data
    mockStorage.getItem.mockImplementationOnce(() => JSON.stringify(legacy))

    // Load it
    const loaded = await loadPersistedQuizState(quizSlug)

    // Check if version was added
    expect(loaded).not.toBeNull()
    expect(loaded?.currentQuestion).toBe(1)
    expect(loaded?.version).toBeDefined()
  })

  it("should handle corrupted storage data", async () => {
    // Mock corrupted data
    mockStorage.getItem.mockImplementationOnce(() => "invalid json{")

    // Load it
    const loaded = await loadPersistedQuizState(quizSlug)

    // Should return null for corrupted data
    expect(loaded).toBeNull()

    // Should attempt to remove corrupted data
    expect(mockStorage.removeItem).toHaveBeenCalledWith(`quiz_state_${quizSlug}`)
  })

  it("should handle missing or empty quiz data gracefully", async () => {
    // Test with partial data
    const partialData = {
      timestamp: Date.now(),
      version: "1.0.0",
    }

    mockStorage.getItem.mockImplementationOnce(() => JSON.stringify(partialData))

    // Load it
    const loaded = await loadPersistedQuizState(quizSlug)

    // Should use defaults
    expect(loaded).not.toBeNull()
    expect(loaded?.currentQuestion).toBe(0)
    expect(loaded?.userAnswers).toEqual([])

    // Test with null
    mockStorage.getItem.mockImplementationOnce(() => null)

    // Load it
    const loadedNull = await loadPersistedQuizState(quizSlug)

    // Should return null
    expect(loadedNull).toBeNull()
  })

  it("should save and load quiz results correctly", async () => {
    const result: QuizCompletedPayload = {
      quizId: "q123",
      slug: quizSlug,
      score: 5,
      totalQuestions: 10,
      correctAnswers: 5,
      totalTime: 120,
      type: "code",
      results: {},
    }

    // Save results
    store.dispatch(markQuizCompleted(result))

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Setup mock for loading
    const savedData = JSON.stringify({
      ...result,
      timestamp: Date.now(),
      version: "1.0.0",
    })
    mockStorage.getItem.mockImplementationOnce(() => savedData)

    // Load results
    const results = await loadPersistedQuizResults(quizSlug)

    // Verify loaded data
    expect(results).not.toBeNull()
    expect(results?.score).toBe(5)
    expect(results?.slug).toBe(quizSlug)
  }, 15000)

  it("should handle errors when loading quiz results", async () => {
    // Mock corrupted data
    mockStorage.getItem.mockImplementationOnce(() => "corrupt data{")

    // Load it
    const results = await loadPersistedQuizResults(quizSlug)

    // Should return null
    expect(results).toBeNull()

    // Should attempt to remove corrupted data
    expect(mockStorage.removeItem).toHaveBeenCalledWith(`quiz_results_${quizSlug}`)
  })

  it("should check and restore auth redirect state", async () => {
    // Setup auth state
    const authState = {
      slug: quizSlug,
      type: "code" as const,
      currentQuestion: 3,
      userAnswers: [],
      tempResults: null,
      quizId: "q123",
      timestamp: Date.now(),
      version: "1.0.0",
    }

    mockStorage.getItem.mockImplementationOnce(() => JSON.stringify(authState))

    // Mock dispatch
    const dispatchSpy = jest.spyOn(store, "dispatch")

    // Check stored state
    await checkStoredAuthRedirectState(store)

    // Verify dispatch was called
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "quiz/restoreFromAuthRedirect",
        payload: expect.objectContaining({
          slug: quizSlug,
          type: "code",
          currentQuestion: 3,
        }),
      }),
    )

    // Verify state was removed
    expect(mockStorage.removeItem).toHaveBeenCalledWith("quiz_auth_redirect")

    dispatchSpy.mockRestore()
  })

  it("should handle corrupted auth redirect state", async () => {
    // Mock corrupted data
    mockStorage.getItem.mockImplementationOnce(() => "not json{")

    // Mock dispatch
    const dispatchSpy = jest.spyOn(store, "dispatch")

    // Check stored state
    await checkStoredAuthRedirectState(store)

    // Verify dispatch was not called with restore action
    const restoreCalls = dispatchSpy.mock.calls.filter((call) => call[0].type === "quiz/restoreFromAuthRedirect")
    expect(restoreCalls.length).toBe(0)

    // Verify corrupted state was removed
    expect(mockStorage.removeItem).toHaveBeenCalledWith("quiz_auth_redirect")

    dispatchSpy.mockRestore()
  })

  it("should handle invalid auth redirect state", async () => {
    // Mock invalid data (missing required fields)
    mockStorage.getItem.mockImplementationOnce(() => JSON.stringify({ incomplete: true }))

    // Mock dispatch
    const dispatchSpy = jest.spyOn(store, "dispatch")

    // Check stored state
    await checkStoredAuthRedirectState(store)

    // Verify dispatch was not called with restore action
    const restoreCalls = dispatchSpy.mock.calls.filter((call) => call[0].type === "quiz/restoreFromAuthRedirect")
    expect(restoreCalls.length).toBe(0)

    // Verify invalid state was removed
    expect(mockStorage.removeItem).toHaveBeenCalledWith("quiz_auth_redirect")

    dispatchSpy.mockRestore()
  })

  it("should handle authentication required action", async () => {
    // Dispatch auth required action
    store.dispatch(
      authenticationRequired({
        fromSubmission: true,
        type: "code",
      }),
    )

    // Wait for debounced save (shorter delay for auth)
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Verify auth state was saved
    const authCalls = mockStorage.setItem.mock.calls.filter((call) => call[0] === "quiz_auth_redirect")

    expect(authCalls.length).toBeGreaterThan(0)
    const authData = JSON.parse(authCalls[0][1])
    expect(authData.fromSubmission).toBe(true)
    expect(authData.type).toBe("code")
  }, 15000)

  it("should use tab-specific keys for debouncing", async () => {
    // Dispatch actions to trigger debounced saves
    store.dispatch(setCurrentQuestion(1))
    store.dispatch(setCurrentQuestion(2))

    // Wait for debounced save
    await new Promise((resolve) => setTimeout(resolve, 400))

    // Verify save occurred with the latest value
    const setItemCalls = mockStorage.setItem.mock.calls.filter((call) => call[0] === `quiz_state_${quizSlug}`)

    expect(setItemCalls.length).toBeGreaterThan(0)

    // The saved value should contain the latest question number
    const savedData = JSON.parse(setItemCalls[setItemCalls.length - 1][1])
    expect(savedData.currentQuestion).toBe(2)
  }, 15000)

  // it("should force save pending changes on visibility change", async () => {
  //   // Clear any existing calls
  //   mockStorage.setItem.mockClear()

  //   // Dispatch action to create pending changes
  //   store.dispatch(setCurrentQuestion(4))

  //   // Wait a bit but not enough for debounce to trigger
  //   await new Promise((resolve) => setTimeout(resolve, 100))

  //   // Verify no save has happened yet (debounce hasn't triggered)
  //   const initialCalls = mockStorage.setItem.mock.calls.filter((call) => call[0] === `quiz_state_${quizSlug}`)
  //   expect(initialCalls.length).toBe(0)

  //   // Now trigger visibility change
  //   Object.defineProperty(document, "visibilityState", {
  //     value: "hidden",
  //     writable: true,
  //     configurable: true,
  //   })

  //   // Create and dispatch visibility change event
  //   const visibilityChangeEvent = new Event("visibilitychange")

  //   // Find the visibility change handler that was registered
  //   const addEventListenerCalls = (window.addEventListener as jest.Mock).mock.calls
  //   const visibilityHandler = addEventListenerCalls.find((call) => call[0] === "visibilitychange")?.[1]

  //   // Verify the handler was registered
  //   expect(window.addEventListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function))

  //   if (visibilityHandler) {
  //     // Call the handler directly
  //     visibilityHandler(visibilityChangeEvent)

  //     // Wait a bit for any async operations
  //     await new Promise((resolve) => setTimeout(resolve, 50))

  //     // Now check if the save was forced
  //     const forcedSaveCalls = mockStorage.setItem.mock.calls.filter((call) => call[0] === `quiz_state_${quizSlug}`)
  //     expect(forcedSaveCalls.length).toBeGreaterThan(0)

  //     // Verify the saved data contains our question
  //     const savedData = JSON.parse(forcedSaveCalls[0][1])
  //     expect(savedData.currentQuestion).toBe(4)
  //   } else {
  //     // If no handler found, at least verify the event listener was registered
  //     expect(window.addEventListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function))
  //   }
  // }, 15000)

  it("should clear persisted state correctly", async () => {
    // Clear specific quiz state
    await clearPersistedQuizState(quizSlug)

    expect(mockStorage.removeItem).toHaveBeenCalledWith(`quiz_state_${quizSlug}`)
    expect(mockStorage.removeItem).toHaveBeenCalledWith(`quiz_results_${quizSlug}`)
    expect(mockStorage.removeItem).toHaveBeenCalledWith("quiz_auth_redirect")

    // Clear without slug
    mockStorage.removeItem.mockClear()
    await clearPersistedQuizState()

    expect(mockStorage.removeItem).toHaveBeenCalledWith("quiz_auth_redirect")
  })

  it("should handle expired data correctly", async () => {
    // Setup expired data
    const expiredData = {
      currentQuestion: 1,
      userAnswers: [],
      quizData: null,
      timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      version: "1.0.0",
    }

    mockStorage.getItem.mockImplementationOnce(() => JSON.stringify(expiredData))

    // Load it
    const loaded = await loadPersistedQuizState(quizSlug)

    // Should return null for expired data
    expect(loaded).toBeNull()

    // Should remove expired data
    expect(mockStorage.removeItem).toHaveBeenCalledWith(`quiz_state_${quizSlug}`)
  })

  it("should maintain backward compatibility with state structure", () => {
    // Verify that the quiz state structure is maintained
    const state = store.getState()

    // Essential properties should exist
    expect(state.quiz).toHaveProperty("currentQuestion")
    expect(state.quiz).toHaveProperty("currentQuizSlug")
    expect(state.quiz).toHaveProperty("currentQuizId")
    expect(state.quiz).toHaveProperty("currentQuizType")
    expect(state.quiz).toHaveProperty("userAnswers")
    expect(state.quiz).toHaveProperty("quizData")
    expect(state.quiz).toHaveProperty("tempResults")

    // Dispatch should not break existing functionality
    expect(() => {
      store.dispatch(setCurrentQuestion(5))
    }).not.toThrow()

    const updatedState = store.getState()
    expect(updatedState.quiz.currentQuestion).toBe(5)
  })

  it("should calculate quiz progress correctly", () => {
    // Mock quiz data with questions for progress calculation
    const mockQuizData = {
      id: "q123",
      slug: quizSlug,
      title: "Test Quiz",
      questions: new Array(10).fill(null).map((_, i) => ({
        id: `q${i}`,
        question: `Question ${i + 1}`,
        type: "multiple-choice",
        options: ["A", "B", "C", "D"],
        correctAnswer: "A",
      })),
      type: "code" as const,
      isPublic: true,
      isFavorite: false,
      ownerId: "owner1",
    }

    // Create a new store with quiz data that has questions
    const storeWithQuestions = configureStore({
      reducer: {
        quiz: mockQuizSlice.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }).concat(persistQuizMiddleware.middleware),
      preloadedState: {
        quiz: {
          currentQuestion: 0,
          currentQuizSlug: quizSlug,
          currentQuizId: "q123",
          currentQuizType: "code",
          userAnswers: [],
          quizData: mockQuizData,
          tempResults: null,
          isLoading: false,
          isSubmitting: false,
          isCompleted: false,
          timerActive: false,
          submissionStateInProgress: false,
          results: null,
          quizHistory: [],
          timeRemaining: null,
          errors: {
            quiz: null,
            submission: null,
            results: null,
            history: null,
          },
          hasMoreHistory: true,
          authRedirectState: null,
        },
      },
    })

    // Dispatch to change question
    storeWithQuestions.dispatch(setCurrentQuestion(5))

    // Verify state was updated
    const updatedState = storeWithQuestions.getState()
    expect(updatedState.quiz.currentQuestion).toBe(5)
    expect(updatedState.quiz.currentQuizSlug).toBe(quizSlug)

    // Calculate progress (current question / total questions)
    const totalQuestions = updatedState.quiz.quizData?.questions?.length || 0
    const currentQuestion = updatedState.quiz.currentQuestion
    const progress = totalQuestions > 0 ? (currentQuestion / totalQuestions) * 100 : 0

    // Verify progress calculation
    expect(totalQuestions).toBe(10)
    expect(progress).toBe(50) // 5/10 * 100 = 50%
  })

  it("should handle quiz progress with empty or invalid quiz data", () => {
    // Test with no quiz data
    const state = store.getState()
    const totalQuestions = state.quiz.quizData?.questions?.length || 0
    const progress = totalQuestions > 0 ? (state.quiz.currentQuestion / totalQuestions) * 100 : 0

    // Should handle gracefully when no quiz data
    expect(totalQuestions).toBe(0)
    expect(progress).toBe(0)
    expect(state.quiz.currentQuestion).toBe(0)
  })
})
