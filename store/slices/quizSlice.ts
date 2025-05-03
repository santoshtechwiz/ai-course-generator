import { QuizType } from "@/lib/quiz-utils"
import { createSlice, type PayloadAction } from "@reduxjs/toolkit"


interface Answer {
  answer: string
  userAnswer: string
  isCorrect: boolean
  timeSpent: number
  questionId?: string | number
}

export interface QuizState {
  quizId: string
  slug: string
  quizType: QuizType
  title: string
  description: string
  questions: any[]
  currentQuestionIndex: number
  answers: Answer[]
  timeSpent: number[]
  startTime: number
  isLoading: boolean
  isLoadingResults: boolean
  isCompleted: boolean
  isProcessingAuth: boolean
  savingResults: boolean
  resultsReady: boolean
  requiresAuth: boolean
  pendingAuthRequired: boolean
  authCheckComplete: boolean
  hasGuestResult: boolean
  score: number
  animationState: "idle" | "answering" | "completed"
  error: string | null
  isRefreshed: boolean
  completedAt?: string | null
  isAuthenticated?: boolean
}

const initialState: QuizState = {
  quizId: "",
  slug: "",
  quizType: "mcq",
  title: "",
  description: "",
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  timeSpent: [],
  startTime: Date.now(),
  isLoading: false,
  isLoadingResults: false,
  isCompleted: false,
  isProcessingAuth: false,
  savingResults: false,
  resultsReady: false,
  requiresAuth: false,
  pendingAuthRequired: false,
  authCheckComplete: false,
  hasGuestResult: false,
  score: 0,
  animationState: "idle",
  error: null,
  isRefreshed: false,
  completedAt: null,
}

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    initQuiz: (state, action: PayloadAction<any>) => {
      const { questions = [] } = action.payload

      return {
        ...initialState,
        ...action.payload,
        questions,
        currentQuestionIndex: 0,
        answers: Array(questions.length).fill(null),
        timeSpent: Array(questions.length).fill(0),
        startTime: Date.now(),
        isLoading: false,
        isCompleted: false,
        score: 0,
        animationState: "idle",
      }
    },
    resetQuiz: (state) => {
      return {
        ...state,
        currentQuestionIndex: 0,
        answers: Array(state.questions.length).fill(null),
        timeSpent: Array(state.questions.length).fill(0),
        isCompleted: false,
        score: 0,
        completedAt: null,
        animationState: "idle",
        error: null,
      }
    },
    submitAnswer: (state, action: PayloadAction<Answer>) => {
      state.answers[state.currentQuestionIndex] = action.payload
      state.timeSpent[state.currentQuestionIndex] = action.payload.timeSpent
      state.animationState = "answering"
    },
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1
        state.animationState = "idle"
      }
    },
    completeQuiz: (state, action: PayloadAction<{ answers: Answer[]; score: number; completedAt: string }>) => {
      state.isCompleted = true
      state.score = action.payload.score
      state.completedAt = action.payload.completedAt
      state.animationState = "completed"

      // If quiz requires auth and user is not authenticated, set pendingAuthRequired
      if (state.requiresAuth && !state.isAuthenticated) {
        state.pendingAuthRequired = true
      }
    },
    setRequiresAuth: (state, action: PayloadAction<boolean>) => {
      state.requiresAuth = action.payload
    },
    setPendingAuthRequired: (state, action: PayloadAction<boolean>) => {
      state.pendingAuthRequired = action.payload
    },
    setAuthCheckComplete: (state, action: PayloadAction<boolean>) => {
      state.authCheckComplete = action.payload
    },
    setHasGuestResult: (state, action: PayloadAction<boolean>) => {
      state.hasGuestResult = action.payload
    },
    clearGuestResults: (state) => {
      state.hasGuestResult = false
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setIsProcessingAuth: (state, action: PayloadAction<boolean>) => {
      state.isProcessingAuth = action.payload
    },
    fetchQuizResults: (state) => {
      state.isLoadingResults = true
    },
    submitQuizResults: (state, action: PayloadAction<any>) => {
      state.savingResults = true
    },
  },
})

export const {
  initQuiz,
  resetQuiz,
  submitAnswer,
  nextQuestion,
  completeQuiz,
  setRequiresAuth,
  setPendingAuthRequired,
  setAuthCheckComplete,
  setHasGuestResult,
  clearGuestResults,
  setError,
  setIsProcessingAuth,
  fetchQuizResults,
  submitQuizResults,
} = quizSlice.actions

export default quizSlice.reducer
