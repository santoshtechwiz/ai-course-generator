import persistQuizMiddleware, {
  clearPersistedQuizState,
  loadPersistedQuizState,
} from "@/store/middleware/persistQuizMiddleware"
import { configureStore } from "@reduxjs/toolkit"
import quizReducer, {
  quizInitialState,
  setCurrentQuestion,
  markQuizCompleted,
} from "@/store/slices/quizSlice"

describe("persistQuizMiddleware", () => {
  let store: ReturnType<typeof configureStore>

  const quizSlug = "test-quiz"

  // Preload state with valid slug to ensure middleware works correctly
  const initialQuizState = {
    ...quizInitialState,
    currentQuizSlug: quizSlug,
    currentQuizType: "code",
    quizData: {
      id: "q123",
      slug: quizSlug,
      type: "code",
      title: "Test Quiz",
      questions: [],
      isPublic: true,
      isFavorite: false,
      ownerId: "owner1",
      timeLimit: 10,
    },
  }

  beforeEach(() => {
    process.env.NODE_ENV = "test"

    store = configureStore({
      reducer: { quiz: quizReducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().prepend(persistQuizMiddleware.middleware),
      preloadedState: {
        quiz: initialQuizState,
      },
    })

    clearPersistedQuizState(quizSlug)

    // Ensure global memoryStorage is present for direct inspection
    if (!(globalThis as any).memoryStorage) {
      ;(globalThis as any).memoryStorage = {
        data: new Map<string, string>(),
        getItem: function (key: string) {
          return this.data.get(key) || null
        },
        setItem: function (key: string, value: string) {
          this.data.set(key, value)
        },
        removeItem: function (key: string) {
          this.data.delete(key)
        },
        clear: function () {
          this.data.clear()
        },
      }
    }
  })

  it("should persist quiz state on relevant actions", () => {
    store.dispatch(setCurrentQuestion(1))
    const persisted = loadPersistedQuizState(quizSlug)
    expect(persisted?.currentQuestion).toBe(1)
  })

  it("should clear state on quiz completion", () => {
    store.dispatch({
      type: "quiz/submitQuiz/fulfilled",
      payload: { slug: quizSlug },
      meta: { arg: { slug: quizSlug } },
    })
    const persisted = loadPersistedQuizState(quizSlug)
    expect(persisted).toBeNull()
  })

  it("should save auth redirect on authenticationRequired", () => {
    store.dispatch({
      type: "quiz/authenticationRequired",
      payload: { fromSubmission: true },
    })

    const authRedirect = JSON.parse(
      (global as any).memoryStorage.getItem("quiz_auth_redirect") || "{}",
    )

    expect(authRedirect.fromSubmission).toBe(true)
    expect(authRedirect.slug).toBe("test-quiz")
  })

  it("should save results when markQuizCompleted is dispatched", () => {
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
      } as any),
    )

    const results = JSON.parse(
      (global as any).memoryStorage.getItem(`quiz_results_${quizSlug}`) || "{}",
    )

    expect(results.slug).toBe("test-quiz")
    expect(results.score).toBe(5)
  })
})
