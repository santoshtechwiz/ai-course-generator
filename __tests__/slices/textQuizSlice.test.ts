// ✅ Correct imports
import { configureStore } from "@reduxjs/toolkit"
import textQuizReducer, {
  initializeQuiz,
  submitAnswerLocally,
  completeQuiz,
  setCurrentQuestion,
  saveQuizState,
  restoreQuizState,
  clearSavedState,
} from "@/app/store/slices/textQuizSlice"
import type { OpenEndedQuizData } from "@/types/quiz"

// Sample quiz data for testing
const sampleQuiz: OpenEndedQuizData = {
  id: "quiz1",
  title: "Test Quiz",
  slug: "test-quiz",
  questions: [
    {
      id: "q1",
      question: "What is React?",
      answer: "A JavaScript library",
    },
    {
      id: "q2",
      question: "What is Redux?",
      answer: "State management",
    },
  ],
}

// Setup store for testing
const setupStore = () =>
  configureStore({
    reducer: {
      textQuiz: textQuizReducer,
    },
  })

describe("textQuizSlice", () => {
  it("should initialize quiz correctly", () => {
    const store = setupStore()
    store.dispatch(initializeQuiz(sampleQuiz))

    const state = store.getState().textQuiz
    expect(state.quizData).toEqual(sampleQuiz)
    expect(state.currentQuestionIndex).toBe(0)
    expect(state.answers).toEqual([])
    expect(state.status).toBe("idle")
    expect(state.isCompleted).toBe(false)
  })

  it("should submit an answer locally", () => {
    const store = setupStore()
    store.dispatch(initializeQuiz(sampleQuiz))

    const answer = {
      questionId: "q1",
      question: "What is React?",
      answer: "A JavaScript library",
      timeSpent: 30,
      hintsUsed: false,
      index: 0,
    }

    store.dispatch(submitAnswerLocally(answer))
    const state = store.getState().textQuiz

    expect(state.answers.length).toBe(1)
    expect(state.answers[0]).toEqual(answer)
    // Current question index is not automatically updated by submitAnswerLocally
    expect(state.currentQuestionIndex).toBe(0)
  })

  it("should replace existing answer when submitting for same question", () => {
    const store = setupStore()
    store.dispatch(initializeQuiz(sampleQuiz))

    const firstAnswer = {
      questionId: "q1",
      question: "What is React?",
      answer: "Wrong answer",
      timeSpent: 30,
      hintsUsed: false,
      index: 0,
    }

    const updatedAnswer = {
      questionId: "q1",
      question: "What is React?",
      answer: "A JavaScript library",
      timeSpent: 45,
      hintsUsed: false,
      index: 0,
    }

    store.dispatch(submitAnswerLocally(firstAnswer))
    store.dispatch(submitAnswerLocally(updatedAnswer))

    const state = store.getState().textQuiz
    expect(state.answers.length).toBe(1)
    expect(state.answers[0].answer).toBe("A JavaScript library")
    expect(state.answers[0].timeSpent).toBe(45)
  })

  it("should complete quiz properly", () => {
    const store = setupStore()
    store.dispatch(initializeQuiz(sampleQuiz))

    const completionData = {
      completedAt: "2023-08-01T12:00:00Z",
      score: 85,
      quizId: "quiz1",
      title: "Test Quiz",
    }

    store.dispatch(completeQuiz(completionData))

    const state = store.getState().textQuiz
    expect(state.isCompleted).toBe(true)
    expect(state.status).toBe("succeeded")
    expect(state.score).toBe(85)
    expect(state.quizId).toBe("quiz1")
    expect(state.completedAt).toBe(completionData.completedAt)
  })

  it("should update current question index", () => {
    const store = setupStore()
    store.dispatch(initializeQuiz(sampleQuiz))
    store.dispatch(setCurrentQuestion(1))

    const state = store.getState().textQuiz
    expect(state.currentQuestionIndex).toBe(1)
  })

  it("should save and restore quiz state", () => {
    const store = setupStore()
    store.dispatch(initializeQuiz(sampleQuiz))

    const answer = {
      questionId: "q1",
      question: "What is React?",
      answer: "A JavaScript library",
      timeSpent: 30,
      hintsUsed: false,
      index: 0,
    }

    store.dispatch(submitAnswerLocally(answer))
    store.dispatch(setCurrentQuestion(1))
    store.dispatch(saveQuizState())

    // Change state
    store.dispatch(setCurrentQuestion(0))
    store.dispatch(
      submitAnswerLocally({
        ...answer,
        answer: "Changed answer",
      }),
    )

    // Restore previous state
    store.dispatch(restoreQuizState())

    const state = store.getState().textQuiz
    expect(state.currentQuestionIndex).toBe(1)
    expect(state.answers[0].answer).toBe("A JavaScript library")
  })

  it("should clear saved state", () => {
    const store = setupStore()
    store.dispatch(initializeQuiz(sampleQuiz))
    store.dispatch(saveQuizState())

    store.dispatch(clearSavedState())

    const state = store.getState().textQuiz
    expect(state.savedState).toBeNull()
  })
})
