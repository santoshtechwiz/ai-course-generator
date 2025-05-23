import { createSlice, createAsyncThunk, createAction, PayloadAction } from "@reduxjs/toolkit"
import type {
  QuizData,
  UserAnswer,
  QuizResult,
  QuizHistoryItem,
  QuizType,
} from "@/app/types/quiz-types"

interface ErrorMap {
  quiz: string | null
  submission: string | null
  results: string | null
  history: string | null
}

export interface QuizState {
  quizData: QuizData | null
  currentQuestion: number
  userAnswers: UserAnswer[]
  isLoading: boolean
  isSubmitting: boolean
  isCompleted: boolean
  timerActive: boolean
  submissionStateInProgress: boolean
  results: QuizResult | null
  tempResults: QuizResult | null
  quizHistory: QuizHistoryItem[]
  currentQuizId: string | null
  timeRemaining: number | null
  error: string | null
  quizError: string | null
  submissionError: string | null
  resultsError: string | null
  historyError: string | null
  errors: ErrorMap
  currentQuizType: QuizType | null
  currentQuizSlug: string | null
  hasMoreHistory: boolean
}

export const initialState: QuizState = {
  quizData: null,
  currentQuestion: 0,
  userAnswers: [],
  isLoading: false,
  isSubmitting: false,
  isCompleted: false,
  timerActive: false,
  submissionStateInProgress: false,
  results: null,
  tempResults: null,
  quizHistory: [],
  currentQuizId: null,
  timeRemaining: null,
  error: null,
  quizError: null,
  submissionError: null,
  resultsError: null,
  historyError: null,
  errors: {
    quiz: null,
    submission: null,
    results: null,
    history: null,
  },
  currentQuizType: null,
  currentQuizSlug: null,
  hasMoreHistory: true,
}

export const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    resetQuizState: (state) => {
      const { quizHistory } = state
      return {
        ...initialState,
        quizHistory,
      }
    },
    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestion = action.payload
    },
    setUserAnswer: (state, action: PayloadAction<UserAnswer>) => {
      const existing = state.userAnswers.findIndex((a) => a.questionId === action.payload.questionId)
      if (existing >= 0) {
        state.userAnswers[existing] = action.payload
      } else {
        state.userAnswers.push(action.payload)
      }
    },
    startTimer: (state) => {
      const limit = state.quizData?.timeLimit
      if (limit) {
        state.timeRemaining = limit * 60
        state.timerActive = true
      }
    },
    pauseTimer: (state) => {
      state.timerActive = false
    },
    resumeTimer: (state) => {
      state.timerActive = true
    },
    decrementTimer: (state) => {
      if (state.timeRemaining && state.timeRemaining > 0) {
        state.timeRemaining -= 1
      }
    },
    markQuizCompleted: (state, action: PayloadAction<QuizResult>) => {
      state.results = action.payload
      state.isCompleted = true
      state.timerActive = false
      state.timeRemaining = 0
    },
    setError: (
      state,
      action: PayloadAction<{ type: keyof ErrorMap; message: string }>,
    ) => {
      state.errors[action.payload.type] = action.payload.message
      switch (action.payload.type) {
        case "quiz":
          state.quizError = action.payload.message
          state.error = action.payload.message
          break
        case "submission":
          state.submissionError = action.payload.message
          state.error = action.payload.message
          break
        case "results":
          state.resultsError = action.payload.message
          break
        case "history":
          state.historyError = action.payload.message
          break
      }
    },
    clearErrors: (state) => {
      state.errors = {
        quiz: null,
        submission: null,
        results: null,
        history: null,
      }
      state.error = null
      state.quizError = null
      state.submissionError = null
      state.resultsError = null
      state.historyError = null
    },
    setSubmissionInProgress: (state, action: PayloadAction<boolean>) => {
      state.submissionStateInProgress = action.payload
    },
    setTempResults: (state, action: PayloadAction<QuizResult>) => {
      state.tempResults = action.payload
    },
    clearTempResults: (state) => {
      state.tempResults = null
    },
    clearQuizStateAfterSubmission: (state) => {
      state.quizData = null
      state.currentQuestion = 0
      state.userAnswers = []
      state.isCompleted = false
      state.timerActive = false
      state.timeRemaining = null
      state.currentQuizType = null
      state.currentQuizSlug = null
      state.submissionStateInProgress = false
      state.errors = {
        quiz: null,
        submission: null,
        results: null,
        history: null,
      }
      state.error = null
      state.quizError = null
      state.submissionError = null
      state.resultsError = null
      state.historyError = null
    },
    storeQuizResults: (state, action: PayloadAction<QuizResult>) => {
      state.results = action.payload
      state.tempResults = action.payload
      state.isCompleted = true
      state.isSubmitting = false
      state.timerActive = false
    },
  },
})

export const {
  resetQuizState,
  setCurrentQuestion,
  setUserAnswer,
  startTimer,
  pauseTimer,
  resumeTimer,
  decrementTimer,
  markQuizCompleted,
  setError,
  clearErrors,
  setSubmissionInProgress,
  setTempResults,
  clearTempResults,
  clearQuizStateAfterSubmission,
  storeQuizResults,
} = quizSlice.actions

export const quizInitialState = initialState
export default quizSlice.reducer
