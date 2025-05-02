import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { QuizType, type QuizAnswer, type QuizDataInput } from "@/app/types/quiz-types"

// Define the state type
export interface QuizState {
  quizId: string
  slug: string
  title: string
  description: string
  quizType: QuizType | string
  questionCount: number
  currentQuestionIndex: number
  answers: (QuizAnswer | null)[]
  isCompleted: boolean
  isLoading: boolean
  error: string | null
  score: number
  animationState: "idle" | "completing" | "preparing-results" | "showing-results" | "redirecting"
  timeSpentPerQuestion: number[]
  lastQuestionChangeTime: number
  isProcessingAuth: boolean
  isLoadingResults: boolean
  resultsReady: boolean
  quizData?: QuizDataInput
  isRefreshed: boolean
  requiresAuth: boolean
  hasGuestResult: boolean
  authCheckComplete: boolean
  pendingAuthRequired: boolean
  savingResults: boolean
  resultLoadError: string | null
  startTime?: number
}

// Define the initial state
const initialState: QuizState = {
  quizId: "",
  slug: "",
  title: "",
  description: "",
  quizType: QuizType.MCQ,
  questionCount: 0,
  currentQuestionIndex: 0,
  answers: [],
  isCompleted: false,
  isLoading: true,
  isLoadingResults: false,
  resultsReady: false,
  error: null,
  score: 0,
  animationState: "idle",
  timeSpentPerQuestion: [],
  lastQuestionChangeTime: Date.now(),
  isProcessingAuth: false,
  quizData: undefined,
  isRefreshed: false,
  requiresAuth: false,
  hasGuestResult: false,
  authCheckComplete: false,
  pendingAuthRequired: false,
  savingResults: false,
  resultLoadError: null,
}

// Create the slice
export const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    initializeQuiz: (state, action: PayloadAction<Partial<QuizState>>) => {
      return { ...state, ...action.payload, answers: new Array(action.payload.questionCount || 0).fill(null) }
    },

    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      const elapsed = Date.now() - state.lastQuestionChangeTime
      const times = [...state.timeSpentPerQuestion]
      times[state.currentQuestionIndex] = (times[state.currentQuestionIndex] || 0) + elapsed

      state.currentQuestionIndex = action.payload
      state.timeSpentPerQuestion = times
      state.lastQuestionChangeTime = Date.now()
    },

    setAnswer: (state, action: PayloadAction<{ index: number; answer: QuizAnswer }>) => {
      const answers = [...state.answers]
      answers[action.payload.index] = action.payload.answer
      state.answers = answers
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    setLoadingResults: (state, action: PayloadAction<boolean>) => {
      state.isLoadingResults = action.payload
    },

    setResultsReady: (state, action: PayloadAction<boolean>) => {
      state.resultsReady = action.payload
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    completeQuiz: (state, action: PayloadAction<{ score: number; answers: (QuizAnswer | null)[] }>) => {
      // If already completed, don't update again to prevent loops
      if (state.isCompleted) return state

      const elapsed = Date.now() - state.lastQuestionChangeTime
      const times = [...state.timeSpentPerQuestion]
      times[state.currentQuestionIndex] = (times[state.currentQuestionIndex] || 0) + elapsed

      state.isCompleted = true
      state.score = action.payload.score
      state.answers = action.payload.answers
      state.timeSpentPerQuestion = times
      state.animationState = "showing-results"
      state.resultsReady = true
    },

    resetQuiz: (state) => {
      state.currentQuestionIndex = 0
      state.answers = new Array(state.questionCount).fill(null)
      state.isCompleted = false
      state.score = 0
      state.error = null
      state.timeSpentPerQuestion = new Array(state.questionCount).fill(0)
      state.lastQuestionChangeTime = Date.now()
      state.animationState = "idle"
      state.resultsReady = false
      state.isRefreshed = false
      state.requiresAuth = false
      state.hasGuestResult = false
    },

    setAnimationState: (state, action: PayloadAction<QuizState["animationState"]>) => {
      state.animationState = action.payload
    },

    setProcessingAuth: (state, action: PayloadAction<boolean>) => {
      state.isProcessingAuth = action.payload
    },

    setQuizData: (state, action: PayloadAction<QuizDataInput>) => {
      state.quizData = action.payload
    },

    setRefreshed: (state, action: PayloadAction<boolean>) => {
      state.isRefreshed = action.payload
    },

    setRequiresAuth: (state, action: PayloadAction<boolean>) => {
      state.requiresAuth = action.payload
    },

    setHasGuestResult: (state, action: PayloadAction<boolean>) => {
      state.hasGuestResult = action.payload
    },

    setAuthCheckComplete: (state, action: PayloadAction<boolean>) => {
      state.authCheckComplete = action.payload
    },

    setPendingAuthRequired: (state, action: PayloadAction<boolean>) => {
      state.pendingAuthRequired = action.payload
    },

    setSavingResults: (state, action: PayloadAction<boolean>) => {
      state.savingResults = action.payload
    },

    setResultLoadError: (state, action: PayloadAction<string | null>) => {
      state.resultLoadError = action.payload
    },

    clearGuestResults: (state) => {
      return {
        ...initialState,
        quizId: state.quizId,
        slug: state.slug,
        quizType: state.quizType,
        questionCount: state.questionCount,
        quizData: state.quizData,
        authCheckComplete: true,
        answers: new Array(state.questionCount).fill(null),
        timeSpentPerQuestion: new Array(state.questionCount).fill(0),
      }
    },
  },
})

// Export actions
export const {
  initializeQuiz,
  setCurrentQuestion,
  setAnswer,
  setLoading,
  setLoadingResults,
  setResultsReady,
  setError,
  completeQuiz,
  resetQuiz,
  setAnimationState,
  setProcessingAuth,
  setQuizData,
  setRefreshed,
  setRequiresAuth,
  setHasGuestResult,
  setAuthCheckComplete,
  setPendingAuthRequired,
  setSavingResults,
  setResultLoadError,
  clearGuestResults,
} = quizSlice.actions

// Selector
export const selectQuizState = (state: { quiz: QuizState }) => state.quiz

export default quizSlice.reducer
