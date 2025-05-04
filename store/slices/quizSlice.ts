import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

// Define types
export interface Answer {
  answer: string
  userAnswer?: string
  selectedOption?: string
  correctOption?: string
  question?: string
  isCorrect: boolean
  timeSpent: number
  questionId: string | number
  index: number
}

export interface QuizState {
  quizId: string | null
  slug: string | null
  quizType: string | null
  questions: any[]
  currentQuestionIndex: number
  answers: Answer[]
  timeSpent: number[]
  score: number
  isCompleted: boolean
  completedAt: string | null
  isAuthenticated: boolean
  requiresAuth: boolean
  isProcessingAuth: boolean
  authCheckComplete: boolean
  forceShowResults: boolean
  pendingAuthRedirect: boolean
  redirectUrl: string | null
}

// Initial state
const initialState: QuizState = {
  quizId: null,
  slug: null,
  quizType: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  timeSpent: [],
  score: 0,
  isCompleted: false,
  completedAt: null,
  isAuthenticated: false,
  requiresAuth: false,
  isProcessingAuth: false,
  authCheckComplete: false,
  forceShowResults: false,
  pendingAuthRedirect: false,
  redirectUrl: null,
}

// Async thunk for submitting quiz results
export const submitQuizResults = createAsyncThunk("quiz/submitResults", async (data: any, { rejectWithValue }) => {
  try {
    // Implement your API call here
    return data
  } catch (error) {
    return rejectWithValue(error)
  }
})

// Create quiz slice
const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    // Initialize quiz
    initQuiz: (state, action: PayloadAction<any>) => {
      const { id, slug, questions, quizType, requiresAuth, isAuthenticated } = action.payload
      const questionCount = questions?.length || 0

      console.log("Initializing quiz in Redux:", { id, slug, quizType, requiresAuth, isAuthenticated, questionCount })

      // Set quiz metadata
      state.quizId = id || null
      state.slug = slug || null
      state.quizType = quizType || "mcq"
      state.questions = questions || []
      state.requiresAuth = requiresAuth || false
      state.isAuthenticated = isAuthenticated || false

      // Only reset if not coming back from authentication
      if (!state.pendingAuthRedirect) {
        // Reset quiz progress
        state.currentQuestionIndex = 0
        state.answers = Array(questionCount).fill(null)
        state.timeSpent = Array(questionCount).fill(0)

        // Reset quiz status
        state.isCompleted = false
        state.score = 0
        state.completedAt = null
        state.forceShowResults = false
      } else {
        console.log("Preserving quiz state due to pending auth redirect")
      }
    },

    // Submit answer
    submitAnswer: (state, action: PayloadAction<Answer>) => {
      const { index, isCorrect, timeSpent } = action.payload

      // Update answers and time spent
      state.answers[index] = action.payload
      state.timeSpent[index] = timeSpent

      // Update score if answer is correct
      if (isCorrect) {
        state.score += 1
      }
    },

    // Navigation
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1
      }
    },
    previousQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1
      }
    },
    goToQuestion: (state, action: PayloadAction<number>) => {
      const index = action.payload
      if (index >= 0 && index < state.questions.length) {
        state.currentQuestionIndex = index
      }
    },

    // Complete quiz
    completeQuiz: (state) => {
      state.isCompleted = true
      state.completedAt = new Date().toISOString()
      console.log("Quiz completed:", { score: state.score, totalQuestions: state.questions.length })
    },

    // Reset quiz
    resetQuiz: (state) => {
      const questionCount = state.questions.length

      console.log("Resetting quiz")

      // Reset progress
      state.currentQuestionIndex = 0
      state.answers = Array(questionCount).fill(null)
      state.timeSpent = Array(questionCount).fill(0)

      // Reset quiz status
      state.isCompleted = false
      state.score = 0
      state.completedAt = null
      state.forceShowResults = false
      state.pendingAuthRedirect = false
      state.redirectUrl = null
    },

    // Authentication
    setIsAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload

      // If becoming authenticated and there was a pending redirect, force show results
      if (action.payload && state.pendingAuthRedirect) {
        console.log("User authenticated with pending redirect, forcing show results")
        state.forceShowResults = true
      }
    },
    setRequiresAuth: (state, action: PayloadAction<boolean>) => {
      state.requiresAuth = action.payload
    },
    setIsProcessingAuth: (state, action: PayloadAction<boolean>) => {
      state.isProcessingAuth = action.payload
    },
    setAuthCheckComplete: (state, action: PayloadAction<boolean>) => {
      state.authCheckComplete = action.payload
    },

    // Force show results (used after authentication)
    setForceShowResults: (state, action: PayloadAction<boolean>) => {
      console.log("Setting forceShowResults:", action.payload)
      state.forceShowResults = action.payload
    },

    // Set pending auth redirect
    setPendingAuthRedirect: (state, action: PayloadAction<{ pending: boolean; redirectUrl?: string }>) => {
      console.log("Setting pendingAuthRedirect:", action.payload)
      state.pendingAuthRedirect = action.payload.pending
      state.redirectUrl = action.payload.redirectUrl || null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitQuizResults.fulfilled, (state, action) => {
        // Handle successful submission
      })
      .addCase(submitQuizResults.rejected, (state, action) => {
        // Handle failed submission
      })
  },
})

// Export actions
export const {
  initQuiz,
  submitAnswer,
  nextQuestion,
  previousQuestion,
  goToQuestion,
  completeQuiz,
  resetQuiz,
  setIsAuthenticated,
  setRequiresAuth,
  setIsProcessingAuth,
  setAuthCheckComplete,
  setForceShowResults,
  setPendingAuthRedirect,
} = quizSlice.actions

// Export reducer
export default quizSlice.reducer
