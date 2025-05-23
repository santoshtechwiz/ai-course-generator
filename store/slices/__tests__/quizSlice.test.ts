import quizReducer, {
  resetQuizState,
  setCurrentQuestion,
  setUserAnswer,
  startTimer,
  pauseTimer,
  resumeTimer,
  decrementTimer,
  markQuizCompleted,
  submitQuiz,
  quizInitialState,
} from "../quizSlice"
import { configureStore } from "@reduxjs/toolkit"

const sampleQuizData = {
  id: "quiz-123",
  title: "Test Quiz",
  slug: "test-quiz",
  type: "mcq",
  timeLimit: 30,
  questions: [
    {
      id: "q1",
      question: "What is 1+1?",
      options: ["1", "2", "3", "4"],
      correctAnswer: "2",
      type: "mcq",
    },
  ],
  isPublic: true,
  isFavorite: false,
  ownerId: "user-123",
}

describe("quizSlice", () => {
  const initialState = { ...quizInitialState }

  test("should return the initial state", () => {
    const state = quizReducer(undefined, { type: "unknown" })
    expect(state).toEqual(initialState)
  })

  test("should handle resetQuizState", () => {
    const existingHistory = [{ id: "1", quizTitle: "Old", completedAt: "2022" }]
    const customState = {
      ...initialState,
      currentQuestion: 3,
      userAnswers: [{ questionId: "q1", answer: "test", isCorrect: true }],
      quizData: sampleQuizData,
      quizHistory: existingHistory,
    }

    const newState = quizReducer(customState, resetQuizState())
    expect(newState).toEqual({
      ...initialState,
      quizHistory: existingHistory,
    })
  })

  test("should handle setCurrentQuestion", () => {
    const newState = quizReducer(initialState, setCurrentQuestion(2))
    expect(newState.currentQuestion).toBe(2)
  })

  test("should handle setUserAnswer (new)", () => {
    const answer = { questionId: "q1", answer: "2" }
    const newState = quizReducer(initialState, setUserAnswer(answer))
    expect(newState.userAnswers).toContainEqual(answer)
  })

  test("should update existing userAnswer", () => {
    const stateWithAnswers = {
      ...initialState,
      userAnswers: [{ questionId: "q1", answer: "1" }],
    }
    const updated = { questionId: "q1", answer: "2" }
    const newState = quizReducer(stateWithAnswers, setUserAnswer(updated))
    expect(newState.userAnswers).toEqual([updated])
  })

  test("should handle timer actions", () => {
    let state = quizReducer(
      { ...initialState, quizData: sampleQuizData },
      startTimer(),
    )
    expect(state.timeRemaining).toBe(1800)
    expect(state.timerActive).toBe(true)

    state = quizReducer(state, pauseTimer())
    expect(state.timerActive).toBe(false)

    state = quizReducer(state, resumeTimer())
    expect(state.timerActive).toBe(true)

    state = quizReducer(state, decrementTimer())
    expect(state.timeRemaining).toBe(1799)
  })

  test("should handle markQuizCompleted", () => {
    const result = {
      quizId: "quiz-123",
      slug: "test-quiz",
      title: "Test Quiz",
      score: 10,
      maxScore: 10,
      percentage: 100,
      completedAt: new Date().toISOString(),
      questions: [],
    }
    const state = quizReducer(initialState, markQuizCompleted(result))
    expect(state.isCompleted).toBe(true)
    expect(state.results).toEqual(result)
    expect(state.timerActive).toBe(false)
  })

  test("should handle async submitQuiz", async () => {
    const store = configureStore({
      reducer: { quiz: quizReducer },
      preloadedState: {
        quiz: {
          ...initialState,
          quizData: sampleQuizData,
          userAnswers: [{ questionId: "q1", answer: "2", isCorrect: true }],
        },
      },
    })

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          quizId: "quiz-123",
          slug: "test-quiz",
          title: "Test Quiz",
          score: 1,
          maxScore: 1,
          percentage: 100,
          completedAt: new Date().toISOString(),
          questions: [],
        }),
    })

    await store.dispatch(
      submitQuiz({
        slug: "test-quiz",
        quizId: "quiz-123",
        type: "mcq",
        answers: [{ questionId: "q1", answer: "2", isCorrect: true }],
      }),
    )

    const state = store.getState().quiz
    expect(state.isCompleted).toBe(true)
    expect(state.results?.score).toBe(1)
  })
})
