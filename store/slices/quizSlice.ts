import type { QuizType } from "@/app/types/quiz-types"
import { quizApi } from "@/lib/utils/quiz-index"
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

// Define types
export interface Answer {
  answer: string
  timeSpent: number
  isCorrect: boolean
  questionId?: string | number
  userAnswer?: string
  index?: number
}

export interface QuizState {
  quizId: string
  slug: string
  title: string
  quizType: QuizType
  questions: any[]
  currentQuestionIndex: number
  answers: Answer[]
  timeSpent: number[]
  isCompleted: boolean
  score: number
  requiresAuth: boolean
  pendingAuthRequired: boolean
  hasNonAuthenticatedUserResult: boolean
  nonAuthenticatedUserResultsSaved: boolean
  authCheckComplete: boolean
  error: string | null
  animationState: "idle" | "answering" | "completed"
  isSavingResults: boolean
  resultsSaved: boolean
  completedAt: string | null
  savedState: {
    quizId?: string
    slug?: string
    quizType?: string
    currentQuestionIndex?: number
    answers?: Answer[]
    isCompleted?: boolean
    score?: number
    completedAt?: string
  } | null
  isProcessingAuth?: boolean
  redirectUrl?: string | null
}

// Define initial state
const initialState: QuizState = {
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
  pendingAuthRequired: false,
  hasNonAuthenticatedUserResult: false,
  nonAuthenticatedUserResultsSaved: false,
  authCheckComplete: false,
  error: null,
  animationState: "idle",
  isSavingResults: false,
  resultsSaved: false,
  completedAt: null,
  savedState: null,
  isProcessingAuth: false,
  redirectUrl: null,
}

// Async thunks
export const fetchQuizResults = createAsyncThunk(
  "quiz/fetchResults",
  async ({ quizId, slug, quizType }: { quizId: string; slug: string; quizType: QuizType }, { rejectWithValue }) => {
    try {
      const result = await quizApi.getQuizData(slug, quizType)
      return result
    } catch (error) {
      return rejectWithValue(error)
    }
  },
)

export const submitQuizResults = createAsyncThunk(
  "quiz/submitResults",
  async (
    {
      quizId,
      slug,
      quizType,
      answers,
      score,
      totalTime,
      totalQuestions,
    }: {
      quizId: string
      slug: string
      quizType: string
      answers: Answer[]
      score: number
      totalTime: number
      totalQuestions: number
    },
    { rejectWithValue },
  ) => {
    try {
      const result = await quizApi.submitQuiz(quizId, slug, quizType, answers, score, totalTime, totalQuestions)
      return result
    } catch (error: any) {
      console.error("Failed to submit quiz results:", error)
      return rejectWithValue(error.message || "Failed to submit quiz results")
    }
  },
)

// Create slice
const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    initQuiz: (state, action: PayloadAction<any>) => {
      const questionCount = action.payload.questions?.length || 0

      state.quizId = action.payload.id || action.payload.quizId || ""
      state.slug = action.payload.slug || ""
      state.title = action.payload.title || ""
      state.quizType = action.payload.quizType || ""
      state.questions = action.payload.questions || []
      state.currentQuestionIndex = 0

      // Initialize with proper arrays based on question count
      state.answers = action.payload.initialAnswers || Array(questionCount).fill(null)
      state.timeSpent = action.payload.initialTimeSpent || Array(questionCount).fill(0)

      state.isCompleted = action.payload.isCompleted || false
      state.score = action.payload.score || 0
      state.requiresAuth = action.payload.requiresAuth || false
      state.pendingAuthRequired = action.payload.pendingAuthRequired || false
      state.hasNonAuthenticatedUserResult = action.payload.hasNonAuthenticatedUserResult || false
      state.nonAuthenticatedUserResultsSaved = action.payload.nonAuthenticatedUserResultsSaved || false
      state.authCheckComplete = action.payload.authCheckComplete || false
      state.error = null
      state.animationState = "idle"
      state.isSavingResults = false
      state.resultsSaved = false
      state.completedAt = null
      state.savedState = null
    },
    submitAnswer: (state, action: PayloadAction<Answer>) => {
      // Create a new answers array if it doesn't exist
      if (!Array.isArray(state.answers)) {
        state.answers = Array(state.questions.length).fill(null)
      }

      // Create a new timeSpent array if it doesn't exist
      if (!Array.isArray(state.timeSpent)) {
        state.timeSpent = Array(state.questions.length).fill(0)
      }

      // Get the index to update (either from the action payload or use currentQuestionIndex)
      const indexToUpdate = action.payload.index !== undefined ? action.payload.index : state.currentQuestionIndex

      // Update the answer at the specified index
      const newAnswers = [...state.answers]
      newAnswers[indexToUpdate] = {
        answer: action.payload.answer,
        userAnswer: action.payload.userAnswer || action.payload.answer,
        isCorrect: action.payload.isCorrect,
        timeSpent: action.payload.timeSpent,
        questionId: action.payload.questionId,
      }
      state.answers = newAnswers

      // Update the timeSpent at the specified index
      const newTimeSpent = [...state.timeSpent]
      newTimeSpent[indexToUpdate] = action.payload.timeSpent
      state.timeSpent = newTimeSpent

      state.animationState = "answering"
    },
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1
        state.animationState = "idle"
      }
    },
    completeQuiz: (
      state,
      action: PayloadAction<{ answers?: Answer[]; score?: number; completedAt?: string }> = { payload: {} },
    ) => {
      // Always set isCompleted to true first
      state.isCompleted = true

      // Calculate score if not provided
      let calculatedScore = action.payload?.score

      if (calculatedScore === undefined && Array.isArray(state.answers)) {
        const correctAnswers = state.answers.filter((a) => a?.isCorrect).length
        const totalQuestions = state.questions.length || 1 // Avoid division by zero
        calculatedScore = Math.round((correctAnswers / totalQuestions) * 100)
      }

      // Update state with provided or calculated values
      state.score = calculatedScore || 0
      state.completedAt = action.payload?.completedAt || new Date().toISOString()
      state.animationState = "completed"

      // If answers are provided, update them
      if (Array.isArray(action.payload?.answers) && action.payload.answers.length > 0) {
        state.answers = action.payload.answers
      }

      // If quiz requires auth and user is not authenticated, set pendingAuthRequired
      if (state.requiresAuth) {
        state.pendingAuthRequired = true
      }
    },
    resetQuiz: (state) => {
      return {
        ...initialState,
        requiresAuth: state.requiresAuth,
        pendingAuthRequired: state.pendingAuthRequired,
        hasNonAuthenticatedUserResult: state.hasNonAuthenticatedUserResult,
        nonAuthenticatedUserResultsSaved: state.nonAuthenticatedUserResultsSaved,
        authCheckComplete: state.authCheckComplete,
      }
    },
    setRequiresAuth: (state, action: PayloadAction<boolean>) => {
      state.requiresAuth = action.payload
    },
    setPendingAuthRequired: (state, action: PayloadAction<boolean>) => {
      state.pendingAuthRequired = action.payload
    },
    setHasNonAuthenticatedUserResult: (state, action: PayloadAction<boolean>) => {
      state.hasNonAuthenticatedUserResult = action.payload
      state.nonAuthenticatedUserResultsSaved = action.payload
    },
    setNonAuthenticatedUserResultsSaved: (state, action: PayloadAction<boolean>) => {
      state.nonAuthenticatedUserResultsSaved = action.payload
    },
    clearNonAuthenticatedUserResults: (state) => {
      state.hasNonAuthenticatedUserResult = false
      state.nonAuthenticatedUserResultsSaved = false
    },
    setAuthCheckComplete: (state, action: PayloadAction<boolean>) => {
      state.authCheckComplete = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setAnimationState: (state, action: PayloadAction<"idle" | "answering" | "completed">) => {
      state.animationState = action.payload
    },
    saveStateBeforeAuth: (
      state,
      action: PayloadAction<{
        quizId?: string
        slug?: string
        quizType?: string
        currentQuestionIndex?: number
        answers?: Answer[]
        isCompleted?: boolean
        score?: number
        completedAt?: string
      }>,
    ) => {
      state.savedState = action.payload
    },
    clearSavedState: (state) => {
      state.savedState = null
    },
    restoreQuizState: (state, action: PayloadAction<Partial<QuizState>>) => {
      // Only restore properties that are provided in the payload
      const payload = action.payload

      // Core quiz data
      if (payload.quizId !== undefined) state.quizId = payload.quizId
      if (payload.slug !== undefined) state.slug = payload.slug
      if (payload.title !== undefined) state.title = payload.title
      if (payload.quizType !== undefined) state.quizType = payload.quizType
      if (payload.questions !== undefined) state.questions = payload.questions

      // Progress data
      if (payload.currentQuestionIndex !== undefined) state.currentQuestionIndex = payload.currentQuestionIndex
      if (payload.answers !== undefined) state.answers = payload.answers
      if (payload.timeSpent !== undefined) state.timeSpent = payload.timeSpent

      // Completion data
      if (payload.isCompleted !== undefined) state.isCompleted = payload.isCompleted
      if (payload.score !== undefined) state.score = payload.score
      if (payload.completedAt !== undefined) state.completedAt = payload.completedAt

      // Auth state
      if (payload.requiresAuth !== undefined) state.requiresAuth = payload.requiresAuth
      if (payload.pendingAuthRequired !== undefined) state.pendingAuthRequired = payload.pendingAuthRequired
      if (payload.authCheckComplete !== undefined) state.authCheckComplete = payload.authCheckComplete

      // Results state
      if (payload.resultsSaved !== undefined) state.resultsSaved = payload.resultsSaved
      if (payload.hasNonAuthenticatedUserResult !== undefined)
        state.hasNonAuthenticatedUserResult = payload.hasNonAuthenticatedUserResult
      if (payload.nonAuthenticatedUserResultsSaved !== undefined)
        state.nonAuthenticatedUserResultsSaved = payload.nonAuthenticatedUserResultsSaved

      // Reset animation state based on completion
      state.animationState = payload.isCompleted ? "completed" : "idle"

      // Reset error state
      state.error = null
    },
    restoreFromSavedState: (state) => {
      if (state.savedState) {
        if (state.savedState.quizId) state.quizId = state.savedState.quizId
        if (state.savedState.slug) state.slug = state.savedState.slug
        if (state.savedState.quizType) state.quizType = state.savedState.quizType
        if (state.savedState.currentQuestionIndex !== undefined)
          state.currentQuestionIndex = state.savedState.currentQuestionIndex
        if (state.savedState.answers) state.answers = state.savedState.answers
        if (state.savedState.isCompleted !== undefined) state.isCompleted = state.savedState.isCompleted
        if (state.savedState.score !== undefined) state.score = state.savedState.score
        if (state.savedState.completedAt) state.completedAt = state.savedState.completedAt

        // Set animation state based on completion
        state.animationState = state.savedState.isCompleted ? "completed" : "idle"

        // Clear saved state after restoring
        state.savedState = null
      }
    },
    setCurrentQuestion: (state, action) => {
      state.currentQuestionIndex = action.payload
      state.animationState = "idle"
    },
    prevQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1
        state.animationState = "idle"
      }
    },
    setIsProcessingAuth: (state, action) => {
      state.isProcessingAuth = action.payload
    },
    setRedirectUrl: (state, action) => {
      state.redirectUrl = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase("FORCE_QUIZ_COMPLETED", (state) => {
        state.isCompleted = true
      })
      .addCase(fetchQuizResults.pending, (state) => {
        state.isSavingResults = true
        state.error = null
      })
      .addCase(fetchQuizResults.fulfilled, (state, action) => {
        state.isSavingResults = false
        if (action.payload) {
          state.score = action.payload.score || 0
          state.isCompleted = true
          state.completedAt = action.payload.completedAt || new Date().toISOString()
          state.resultsSaved = true
        }
      })
      .addCase(fetchQuizResults.rejected, (state, action) => {
        state.isSavingResults = false
        state.error = action.error.message || "Failed to fetch quiz results"
      })
      .addCase(submitQuizResults.pending, (state) => {
        state.isSavingResults = true
        state.error = null
      })
      .addCase(submitQuizResults.fulfilled, (state) => {
        state.isSavingResults = false
        state.resultsSaved = true
      })
      .addCase(submitQuizResults.rejected, (state, action) => {
        state.isSavingResults = false
        state.error = action.error.message || "Failed to submit quiz results"
      })
  },
})

// Export actions
export const {
  initQuiz,
  submitAnswer,
  nextQuestion,
  completeQuiz,
  resetQuiz,
  setRequiresAuth,
  setPendingAuthRequired,
  setHasNonAuthenticatedUserResult,
  setNonAuthenticatedUserResultsSaved,
  clearNonAuthenticatedUserResults,
  setAuthCheckComplete,
  setError,
  setAnimationState,
  restoreQuizState,
  saveStateBeforeAuth,
  clearSavedState,
  restoreFromSavedState,
  setCurrentQuestion,
  prevQuestion,
  setIsProcessingAuth,
  setRedirectUrl,
} = quizSlice.actions

// Export reducer
export default quizSlice.reducer
