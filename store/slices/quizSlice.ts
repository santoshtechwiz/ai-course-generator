import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { QuizData, UserAnswer, QuizResult, QuizHistoryItem, QuizType } from "@/app/types/quiz-types"

// Define the API endpoints for different quiz types (can be used in future if needed)
export const API_ENDPOINTS: Record<QuizType, string> = {
  mcq: "/api/quiz/mcq",
  code: "/api/code-quiz",
  blanks: "/api/quiz/blanks",
  openended: "/api/quiz/openended",
}

// Define the state interface
interface QuizState {
  quizData: QuizData | null
  currentQuestion: number
  userAnswers: UserAnswer[]
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  results: QuizResult | null
  isCompleted: boolean
  quizHistory: QuizHistoryItem[]
  currentQuizId: string | null
  timeRemaining: number | null
  timerActive: boolean
}

// Initial state
const initialState: QuizState = {
  quizData: null,
  currentQuestion: 0,
  userAnswers: [],
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

// Async thunks
export const fetchQuiz = createAsyncThunk(
  "quiz/fetchQuiz",
  async ({ slug, type }: { slug: string; type: QuizType }, { rejectWithValue }) => {
    try {
      const endpoint = API_ENDPOINTS[type] || `/api/quiz/${slug}`
      const response = await fetch(`${endpoint}/${slug}`)

      if (!response.ok) {
        const errorData = await response.json()
        return rejectWithValue(errorData.message || `Failed to fetch ${type} quiz`)
      }

      return await response.json()
    } catch {
      return rejectWithValue("An unexpected error occurred. Please try again.")
    }
  },
)

export const submitAnswer = createAsyncThunk(
  "quiz/submitAnswer",
  async (
    {
      slug,
      questionId,
      answer,
    }: {
      slug: string
      questionId: string
      answer: string | Record<string, string>
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch("/api/quiz/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, questionId, answer }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return rejectWithValue(errorData.message || "Failed to submit answer")
      }

      return await response.json()
    } catch {
      return rejectWithValue("An unexpected error occurred. Please try again.")
    }
  },
)

export const submitQuiz = createAsyncThunk(
  "quiz/submitQuiz",
  async (
    {
      slug,
      answers,
      timeTaken,
    }: {
      slug: string
      answers: UserAnswer[]
      timeTaken?: number
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`/api/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, answers, timeTaken }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return rejectWithValue(errorData.message || "Failed to submit quiz")
      }

      return await response.json()
    } catch {
      return rejectWithValue("An unexpected error occurred. Please try again.")
    }
  },
)

export const getQuizResults = createAsyncThunk(
  "quiz/getResults",
  async (slug: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/quiz/${slug}/results`)

      if (!response.ok) {
        const errorData = await response.json()
        return rejectWithValue(errorData.message || "Failed to get quiz results")
      }

      return await response.json()
    } catch {
      return rejectWithValue("An unexpected error occurred. Please try again.")
    }
  },
)

export const fetchQuizHistory = createAsyncThunk(
  "quiz/fetchQuizHistory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/quiz/history")

      if (!response.ok) {
        const errorData = await response.json()
        return rejectWithValue(errorData.message || "Failed to fetch quiz history")
      }

      return await response.json()
    } catch {
      return rejectWithValue("An unexpected error occurred. Please try again.")
    }
  },
)

// Slice
const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    resetQuizState: (state) => ({
      ...initialState,
      quizHistory: state.quizHistory, // Preserve history
    }),
    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestion = action.payload
    },
    setUserAnswer: (state, action: PayloadAction<UserAnswer>) => {
      const index = state.userAnswers.findIndex((a) => a.questionId === action.payload.questionId)
      if (index !== -1) {
        state.userAnswers[index] = action.payload
      } else {
        state.userAnswers.push(action.payload)
      }
    },
    startTimer: (state) => {
      if (state.quizData?.timeLimit) {
        state.timeRemaining = state.quizData.timeLimit * 60
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
      if (state.timeRemaining !== null && state.timeRemaining > 0) {
        state.timeRemaining -= 1
      }
    },
    markQuizCompleted: (state, action: PayloadAction<QuizResult>) => {
      state.isCompleted = true
      state.results = action.payload
      state.timerActive = false
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchQuiz
      .addCase(fetchQuiz.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchQuiz.fulfilled, (state, action) => {
        state.isLoading = false
        state.quizData = action.payload
        state.currentQuizId = action.payload.id
        state.userAnswers = []
        state.currentQuestion = 0
        state.isCompleted = false
        state.results = null
        state.timeRemaining = action.payload.timeLimit ? action.payload.timeLimit * 60 : null
        state.timerActive = false
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // submitAnswer
      .addCase(submitAnswer.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(submitAnswer.fulfilled, (state) => {
        state.isSubmitting = false
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload as string
      })

      // submitQuiz
      .addCase(submitQuiz.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        state.isSubmitting = false
        state.results = action.payload
        state.isCompleted = true
        state.timerActive = false

        if (state.quizData) {
          const historyItem: QuizHistoryItem = {
            slug: state.quizData.id,
            quizTitle: state.quizData.title,
            quizType: state.quizData.type,
            score: action.payload.score,
            maxScore: action.payload.maxScore,
            completedAt: new Date().toISOString(),
            slug: state.quizData.slug,
          }

          const index = state.quizHistory.findIndex((item) => item.slug === historyItem.slug)
          if (index !== -1) {
            state.quizHistory[index] = historyItem
          } else {
            state.quizHistory.push(historyItem)
          }
        }
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload as string
      })

      // getQuizResults
      .addCase(getQuizResults.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getQuizResults.fulfilled, (state, action) => {
        state.isLoading = false
        state.results = action.payload
        state.isCompleted = true
      })
      .addCase(getQuizResults.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // fetchQuizHistory
      .addCase(fetchQuizHistory.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchQuizHistory.fulfilled, (state, action) => {
        state.isLoading = false
        state.quizHistory = action.payload
      })
      .addCase(fetchQuizHistory.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
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
} = quizSlice.actions

export default quizSlice.reducer
