import { configureStore } from "@reduxjs/toolkit"
import quizReducer, {
  resetQuizState,
  setCurrentQuestion,
  setUserAnswer,
  startTimer,
  pauseTimer,
  resumeTimer,
  decrementTimer,
  markQuizCompleted,
} from "@/store/slices/quizSlice"
import type { UserAnswer, QuizResult } from "@/app/types/quiz-types"

describe("quizSlice", () => {
  // Test initial state
  test("should return the initial state", () => {
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
    })

    const state = store.getState().quiz

    expect(state.quizData).toBeNull()
    expect(state.currentQuestion).toBe(0)
    expect(state.userAnswers).toEqual([])
    expect(state.isLoading).toBe(false)
    expect(state.isSubmitting).toBe(false)
    expect(state.error).toBeNull()
    expect(state.results).toBeNull()
    expect(state.isCompleted).toBe(false)
    expect(state.quizHistory).toEqual([])
    expect(state.currentQuizId).toBeNull()
    expect(state.timeRemaining).toBeNull()
    expect(state.timerActive).toBe(false)
  })

  // Test resetQuizState action
  test("should handle resetQuizState", () => {
    const initialState = {
      quizData: {
        id: "test",
        title: "Test Quiz",
        description: "Test",
        type: "mcq" as const,
        difficulty: "medium" as const,
        questions: [],
        slug: "test",
      },
      currentQuestion: 2,
      userAnswers: [{ questionId: "q1", answer: "test" }],
      isLoading: true,
      isSubmitting: true,
      error: "Some error",
      results: {
        quizId: "test",
        userId: "user1",
        score: 80,
        maxScore: 100,
        percentage: 80,
        answers: [],
        submittedAt: "",
      },
      isCompleted: true,
      quizHistory: [
        {
          quizId: "test",
          quizTitle: "Test",
          quizType: "mcq" as const,
          score: 80,
          maxScore: 100,
          completedAt: "",
          slug: "test",
        },
      ],
      currentQuizId: "test",
      timeRemaining: 300,
      timerActive: true,
    }

    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      preloadedState: {
        quiz: initialState,
      },
    })

    store.dispatch(resetQuizState())
    const state = store.getState().quiz

    expect(state.quizData).toBeNull()
    expect(state.currentQuestion).toBe(0)
    expect(state.userAnswers).toEqual([])
    expect(state.isLoading).toBe(false)
    expect(state.isSubmitting).toBe(false)
    expect(state.error).toBeNull()
    expect(state.results).toBeNull()
    expect(state.isCompleted).toBe(false)
    // Quiz history should be preserved
    expect(state.quizHistory).toEqual(initialState.quizHistory)
    expect(state.currentQuizId).toBeNull()
    expect(state.timeRemaining).toBeNull()
    expect(state.timerActive).toBe(false)
  })

  // Test setCurrentQuestion action
  test("should handle setCurrentQuestion", () => {
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
    })

    store.dispatch(setCurrentQuestion(3))
    const state = store.getState().quiz

    expect(state.currentQuestion).toBe(3)
  })

  // Test setUserAnswer action
  test("should handle setUserAnswer for new answer", () => {
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
    })

    const answer: UserAnswer = {
      questionId: "q1",
      answer: "test answer",
    }

    store.dispatch(setUserAnswer(answer))
    const state = store.getState().quiz

    expect(state.userAnswers).toHaveLength(1)
    expect(state.userAnswers[0]).toEqual(answer)
  })

  // Test setUserAnswer action for existing answer
  test("should handle setUserAnswer for existing answer", () => {
    const initialState = {
      quizData: null,
      currentQuestion: 0,
      userAnswers: [
        { questionId: "q1", answer: "old answer" },
        { questionId: "q2", answer: "answer 2" },
      ],
      isLoading: false,
      isSubmitting: false,
      error: null,
      results: null,
      isCompleted: false,
      quizHistory: [],
      currentQuizId: null,
      timeRemaining: null,
      timerActive: false,
    }

    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      preloadedState: {
        quiz: initialState,
      },
    })

    const updatedAnswer: UserAnswer = {
      questionId: "q1",
      answer: "new answer",
    }

    store.dispatch(setUserAnswer(updatedAnswer))
    const state = store.getState().quiz

    expect(state.userAnswers).toHaveLength(2)
    expect(state.userAnswers[0]).toEqual(updatedAnswer)
    expect(state.userAnswers[1]).toEqual({ questionId: "q2", answer: "answer 2" })
  })

  // Test timer actions
  test("should handle timer actions", () => {
    const initialState = {
      quizData: {
        id: "test",
        title: "Test Quiz",
        description: "Test",
        type: "mcq" as const,
        difficulty: "medium" as const,
        questions: [],
        timeLimit: 10, // 10 minutes
        slug: "test",
      },
      currentQuestion: 0,
      userAnswers: [],
      isLoading: false,
      isSubmitting: false,
      error: null,
      results: null,
      isCompleted: false,
      quizHistory: [],
      currentQuizId: "test",
      timeRemaining: null,
      timerActive: false,
    }

    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      preloadedState: {
        quiz: initialState,
      },
    })

    // Start timer
    store.dispatch(startTimer())
    let state = store.getState().quiz
    expect(state.timeRemaining).toBe(600) // 10 minutes * 60 seconds
    expect(state.timerActive).toBe(true)

    // Pause timer
    store.dispatch(pauseTimer())
    state = store.getState().quiz
    expect(state.timerActive).toBe(false)

    // Resume timer
    store.dispatch(resumeTimer())
    state = store.getState().quiz
    expect(state.timerActive).toBe(true)

    // Decrement timer
    store.dispatch(decrementTimer())
    state = store.getState().quiz
    expect(state.timeRemaining).toBe(599)
  })

  // Test markQuizCompleted action
  test("should handle markQuizCompleted", () => {
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
    })

    const result: QuizResult = {
      quizId: "test",
      userId: "user1",
      score: 80,
      maxScore: 100,
      percentage: 80,
      answers: [],
      submittedAt: new Date().toISOString(),
    }

    store.dispatch(markQuizCompleted(result))
    const state = store.getState().quiz

    expect(state.isCompleted).toBe(true)
    expect(state.results).toEqual(result)
    expect(state.timerActive).toBe(false)
  })
})
