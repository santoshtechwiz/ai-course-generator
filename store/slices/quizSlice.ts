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
  quizType: string
  questions: any[]
  currentQuestionIndex: number
  answers: Answer[]
  timeSpent: number[]
  isCompleted: boolean
  score: number
  requiresAuth: boolean
  pendingAuthRequired: boolean
  isAuthenticated: boolean
  hasGuestResult: boolean
  guestResultsSaved: boolean
  authCheckComplete: boolean
  isProcessingAuth: boolean
  error: string | null
  animationState: "idle" | "answering" | "completed"
  isSavingResults: boolean
  resultsSaved: boolean
  completedAt: string | null
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
  isAuthenticated: false,
  hasGuestResult: false,
  guestResultsSaved: false,
  authCheckComplete: false,
  isProcessingAuth: false,
  error: null,
  animationState: "idle",
  isSavingResults: false,
  resultsSaved: false,
  completedAt: null,
}



// Async thunks
export const fetchQuizResults = createAsyncThunk(
  "quiz/fetchResults",
  async ({ quizId, slug, quizType }: { quizId: string; slug: string; quizType: string }, { rejectWithValue }) => {
    try {
      const result = await quizApi.submitQuiz(quizId, slug, quizType)
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
      const result = await quizApi.submitQuizResult(quizId, slug, quizType, answers, score, totalTime, totalQuestions)
      return result
    } catch (error) {
      return rejectWithValue(error)
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
      state.isAuthenticated = action.payload.isAuthenticated || false
      state.hasGuestResult = action.payload.hasGuestResult || false
      state.guestResultsSaved = action.payload.guestResultsSaved || false
      state.authCheckComplete = action.payload.authCheckComplete || false
      state.isProcessingAuth = action.payload.isProcessingAuth || false
      state.error = null
      state.animationState = "idle"
      state.isSavingResults = false
      state.resultsSaved = false
      state.completedAt = null
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
      if (state.requiresAuth && !state.isAuthenticated) {
        state.pendingAuthRequired = true
      }
    },
    resetQuiz: (state) => {
      state.currentQuestionIndex = 0
      state.answers = Array(state.questions.length).fill(null)
      state.timeSpent = Array(state.questions.length).fill(0)
      state.isCompleted = false
      state.score = 0
      state.completedAt = null
      state.animationState = "idle"
      state.error = null
      state.resultsSaved = false
    },
    setIsAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload
    },
    setRequiresAuth: (state, action: PayloadAction<boolean>) => {
      state.requiresAuth = action.payload
    },
    setPendingAuthRequired: (state, action: PayloadAction<boolean>) => {
      state.pendingAuthRequired = action.payload
    },
    setHasGuestResult: (state, action: PayloadAction<boolean>) => {
      state.hasGuestResult = action.payload
      state.guestResultsSaved = action.payload
    },
    setGuestResultsSaved: (state, action: PayloadAction<boolean>) => {
      state.guestResultsSaved = action.payload
    },
    clearGuestResults: (state) => {
      state.hasGuestResult = false
      state.guestResultsSaved = false
    },
    setAuthCheckComplete: (state, action: PayloadAction<boolean>) => {
      state.authCheckComplete = action.payload
    },
    setIsProcessingAuth: (state, action: PayloadAction<boolean>) => {
      state.isProcessingAuth = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setAnimationState: (state, action: PayloadAction<"idle" | "answering" | "completed">) => {
      state.animationState = action.payload
    },
    restoreQuizState: (state, action: PayloadAction<Partial<QuizState>>) => {
      // Only restore properties that are provided in the payload
      const payload = action.payload

      if (payload.quizId !== undefined) state.quizId = payload.quizId
      if (payload.slug !== undefined) state.slug = payload.slug
      if (payload.title !== undefined) state.title = payload.title
      if (payload.quizType !== undefined) state.quizType = payload.quizType
      if (payload.questions !== undefined) state.questions = payload.questions
      if (payload.currentQuestionIndex !== undefined) state.currentQuestionIndex = payload.currentQuestionIndex
      if (payload.answers !== undefined) state.answers = payload.answers
      if (payload.timeSpent !== undefined) state.timeSpent = payload.timeSpent
      if (payload.isCompleted !== undefined) state.isCompleted = payload.isCompleted
      if (payload.score !== undefined) state.score = payload.score
      if (payload.completedAt !== undefined) state.completedAt = payload.completedAt

      // Reset animation state
      state.animationState = "idle"

      // If the quiz was completed, set animation state to completed
      if (payload.isCompleted) {
        state.animationState = "completed"
      }
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
  setIsAuthenticated,
  setRequiresAuth,
  setPendingAuthRequired,
  setHasGuestResult,
  setGuestResultsSaved,
  clearGuestResults,
  setAuthCheckComplete,
  setIsProcessingAuth,
  setError,
  setAnimationState,
  restoreQuizState,
} = quizSlice.actions

// Export reducer
export default quizSlice.reducer
