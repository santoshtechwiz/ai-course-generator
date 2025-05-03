import { configureStore } from "@reduxjs/toolkit"
import quizReducer, {
  initializeQuiz,
  submitAnswer,
  nextQuestion,
  completeQuiz,
  resetQuiz,
  setRequiresAuth,
  setIsAuthenticated,
  setGuestResultsSaved,
  setError,
  setProcessingAuth,
} from "@/store/slices/quizSlice"

describe("Quiz Slice", () => {
  // Mock quiz data
  const mockQuizData = {
    id: "test-quiz-id",
    slug: "test-quiz",
    title: "Test Quiz",
    quizType: "mcq",
    questions: [
      { id: "q1", question: "Question 1", answer: "A" },
      { id: "q2", question: "Question 2", answer: "B" },
    ],
  }

  // Create a test store
  const createTestStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        quiz: quizReducer,
      },
      preloadedState: {
        quiz: {
          quizId: "",
          slug: "",
          title: "",
          quizType: "",
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

  it("should initialize quiz with correct data", () => {
    const store = createTestStore()
    store.dispatch(initializeQuiz(mockQuizData))

    const state = store.getState().quiz

    expect(state.quizId).toBe(mockQuizData.id)
    expect(state.slug).toBe(mockQuizData.slug)
    expect(state.title).toBe(mockQuizData.title)
    expect(state.quizType).toBe(mockQuizData.quizType)
    expect(state.questions).toEqual(mockQuizData.questions)
    expect(state.currentQuestionIndex).toBe(0)
    expect(state.answers).toEqual([null, null])
    expect(state.timeSpent).toEqual([0, 0])
    expect(state.isCompleted).toBe(false)
  })

  it("should submit an answer correctly", () => {
    const store = createTestStore({
      questions: mockQuizData.questions,
      answers: [null, null],
      timeSpent: [0, 0],
    })

    store.dispatch(submitAnswer({ answer: "A", timeSpent: 10, isCorrect: true }))

    const state = store.getState().quiz
    expect(state.answers[0]).toEqual({ answer: "A", timeSpent: 10, isCorrect: true })
    expect(state.timeSpent[0]).toBe(10)
    expect(state.animationState).toBe("answering")
  })

  it("should move to the next question", () => {
    const store = createTestStore({
      questions: mockQuizData.questions,
      currentQuestionIndex: 0,
      answers: [{ answer: "A", timeSpent: 10, isCorrect: true }, null],
      timeSpent: [10, 0],
    })

    store.dispatch(nextQuestion())

    const state = store.getState().quiz
    expect(state.currentQuestionIndex).toBe(1)
    expect(state.animationState).toBe("idle")
  })

  it("should complete the quiz and calculate score", async () => {
    const answers = [
      { answer: "A", timeSpent: 10, isCorrect: true },
      { answer: "C", timeSpent: 15, isCorrect: false },
    ]

    const store = createTestStore({
      questions: mockQuizData.questions,
      answers: answers,
      timeSpent: [10, 15],
    })

    store.dispatch(completeQuiz())

    const state = store.getState().quiz
    expect(state.answers).toEqual(answers)
    expect(state.score).toBe(50) // 1 out of 2 correct = 50%
    expect(state.isCompleted).toBe(true)
    expect(state.animationState).toBe("completed")
  })

  it("should reset the quiz state", () => {
    const store = createTestStore({
      questions: mockQuizData.questions,
      currentQuestionIndex: 1,
      answers: [
        { answer: "A", timeSpent: 10, isCorrect: true },
        { answer: "B", timeSpent: 15, isCorrect: true },
      ],
      timeSpent: [10, 15],
      isCompleted: true,
      score: 100,
      animationState: "completed",
    })

    store.dispatch(resetQuiz())

    const state = store.getState().quiz
    expect(state.currentQuestionIndex).toBe(0)
    expect(state.answers).toEqual([null, null])
    expect(state.timeSpent).toEqual([0, 0])
    expect(state.isCompleted).toBe(false)
    expect(state.animationState).toBe("idle")
    expect(state.score).toBe(0)
  })

  it("should set authentication flags correctly", () => {
    const store = createTestStore()

    store.dispatch(setRequiresAuth(true))
    expect(store.getState().quiz.requiresAuth).toBe(true)

    store.dispatch(setIsAuthenticated(true))
    expect(store.getState().quiz.isAuthenticated).toBe(true)
  })

  it("should handle guest result flags", () => {
    const store = createTestStore()

    store.dispatch(setGuestResultsSaved(true))
    expect(store.getState().quiz.guestResultsSaved).toBe(true)
  })

  it("should set error state", () => {
    const store = createTestStore()
    const error = { message: "Test error", type: "validation" }

    store.dispatch(setError(error))
    expect(store.getState().quiz.error).toEqual(error)
  })

  it("should set processing auth state", () => {
    const store = createTestStore()

    store.dispatch(setProcessingAuth(true))
    expect(store.getState().quiz.isProcessingAuth).toBe(true)
  })
})
