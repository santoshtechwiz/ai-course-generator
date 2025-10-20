import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

interface OrderingQuizStep {
  id: number
  description: string
  explanation?: string
}

interface OrderingQuizQuestion {
  id: string | number
  title: string
  topic: string
  steps: OrderingQuizStep[]
  description?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  type: 'ordering'
}

export interface OrderingQuizState {
  data: any | null
  currentQuestion: OrderingQuizQuestion | null
  userAnswers: Record<string, number[]>
  isLoading: boolean
  isSubmitting: boolean
  isSubmitted: boolean
  error: string | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
}

const initialState: OrderingQuizState = {
  data: null,
  currentQuestion: null,
  userAnswers: {},
  isLoading: false,
  isSubmitting: false,
  isSubmitted: false,
  error: null,
  status: 'idle',
}

// Load quiz by slug
export const loadOrderingQuiz = createAsyncThunk(
  'orderingQuiz/loadQuiz',
  async (slug: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/ordering-quizzes/${slug}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to load quiz')
      }
      const data = await response.json()
      return data.quiz
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to load quiz'
      )
    }
  }
)

// Submit quiz answers - ALIGNED WITH UNIFIED ENDPOINT (MCQ/Code pattern)
export const submitOrderingQuiz = createAsyncThunk(
  'orderingQuiz/submit',
  async (
    {
      quizId,
      slug,
      answers,
      totalTime,
      score,
      totalQuestions,
    }: {
      quizId: string
      slug: string
      answers: Array<{
        questionId: string
        userAnswer: number[]
        answer: number[]
        isCorrect: boolean
        timeSpent: number
      }>
      totalTime: number
      score: number
      totalQuestions: number
    },
    { rejectWithValue }
  ) => {
    try {
      // Use unified endpoint - matches MCQ/Code pattern
      const response = await fetch(`/api/quizzes/ordering/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: slug, // Use slug as quizId for the unified API
          answers,
          totalTime,
          score,
          totalQuestions,
          type: 'ordering',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to submit quiz')
      }

      const data = await response.json()
      return data.result || data.metrics
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to submit quiz'
      )
    }
  }
)

const orderingQuizSlice = createSlice({
  name: 'orderingQuiz',
  initialState,
  reducers: {
    // Reset quiz state
    resetQuiz: () => initialState,

    // Save user answer for a question
    saveAnswer: (
      state,
      action: PayloadAction<{ questionId: string; answer: number[] }>
    ) => {
      state.userAnswers[action.payload.questionId] = action.payload.answer
    },

    // Set current question
    setCurrentQuestion: (state, action: PayloadAction<OrderingQuizQuestion>) => {
      state.currentQuestion = action.payload
    },

    // Clear error
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Load quiz
    builder
      .addCase(loadOrderingQuiz.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.status = 'loading'
      })
      .addCase(loadOrderingQuiz.fulfilled, (state, action) => {
        state.isLoading = false
        state.data = action.payload
        // Set first question as current
        if (action.payload.steps && action.payload.steps.length > 0) {
          state.currentQuestion = {
            id: '1',
            title: action.payload.title,
            topic: action.payload.description || '',
            description: action.payload.description,
            difficulty: action.payload.difficulty,
            steps: action.payload.steps,
            type: 'ordering',
          }
        }
        state.status = 'succeeded'
      })
      .addCase(loadOrderingQuiz.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.status = 'failed'
      })

    // Submit quiz
    builder
      .addCase(submitOrderingQuiz.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(submitOrderingQuiz.fulfilled, (state, action) => {
        state.isSubmitting = false
        state.isSubmitted = true
        state.error = null
      })
      .addCase(submitOrderingQuiz.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload as string
      })
  },
})

export const { resetQuiz, saveAnswer, setCurrentQuestion, clearError } =
  orderingQuizSlice.actions

export default orderingQuizSlice.reducer

// Selectors
export const selectOrderingQuizData = (state: RootState) => state.orderingQuiz?.data
export const selectCurrentQuestion = (state: RootState) =>
  state.orderingQuiz?.currentQuestion
export const selectIsLoading = (state: RootState) => state.orderingQuiz?.isLoading
export const selectError = (state: RootState) => state.orderingQuiz?.error
