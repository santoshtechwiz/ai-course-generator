import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import type { QuizType } from '@/types/quiz'
import { API_ENDPOINTS } from './quiz-slice-helper'
import { QuizResults, QuizState } from './quiz-slice-types'


// -- Initial State --

const initialState: QuizState = {
  slug: null,
  quizType: null,
  title: '',
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  results: null,
  isCompleted: false,
  status: 'idle',
  error: null,
  requiresAuth: false,
  redirectAfterLogin: null,
  userId: null, // Optional: can be used to track quiz ownership
}

// -- Thunks --

/**
 * Load quiz definition based on slug/type
 */
export const fetchQuiz = createAsyncThunk(
  "quiz/fetch",
  async (payload: {
    slug?: string
    quizType?: QuizType
    data?: any
  }, { rejectWithValue }) => {
    try {
      // Validate payload
      if (!payload) {
        return rejectWithValue({
          error: "Invalid quiz request: No payload provided"
        })
      }

      const slug = payload.slug?.trim() || '';
      const type = payload.quizType as QuizType;
      // If we already have the data, use it directly
      if (payload.data && Array.isArray(payload.data.questions)) {
        return {
          ...payload.data,
          slug: slug,
          quizType: type,
          id: slug // For backward compatibility
        }
      }

      // Validate required parameters for API call
      if (!slug || !type) {
        return rejectWithValue({
          error: "Invalid quiz request: Missing slug or quizType"
        })
      }

      // Fetch from API
      const endpoint = API_ENDPOINTS[type as keyof typeof API_ENDPOINTS]
      if (!endpoint) {
        return rejectWithValue({
          error: `Invalid quiz type: ${type}`
        })
      }

      const response = await fetch(`${endpoint}/${slug}`)

      if (!response.ok) {
        const errorText = await response.text()
        return rejectWithValue({
          error: `Error loading quiz: ${response.status} ${response.statusText}`,
          details: errorText
        })
      }

      const data = await response.json()

      // Validate response data
      if (!data || !Array.isArray(data.questions)) {
        return rejectWithValue({
          error: "Invalid quiz data received from server"
        })
      }

      return {
        ...data,
        slug: slug,
        quizType: type,
        id: slug // For backward compatibility
      }
    } catch (error: any) {
      console.error("Quiz fetch error:", error)
      return rejectWithValue({
        error: error.message || "Failed to load quiz"
      })
    }
  }
)



/**
 * Submit and calculate quiz result
 */
// ✅ Thunk: Submit quiz and calculate result
export const submitQuiz = createAsyncThunk(
  'quiz/submit',
  async (_, { getState }) => {
    const state = getState() as RootState
    const { questions, answers, slug, quizType } = state.quiz

    let score = 0
    const tempResults: QuizResults['results'] = []

    for (const question of questions) {
      const answer = answers[question.id]
      let isCorrect = false
      let correctAnswer = ''
      let userAnswer: string | null = null
      const skipped = !answer || (!answer.selectedOptionId && !answer.userAnswer)

      switch (quizType) {
        case 'mcq':
        case 'code': {
          correctAnswer = String(question.answer ?? '').trim()
          const selected = String(answer?.selectedOptionId ?? '').trim()
          userAnswer = selected || null
          isCorrect = answer?.isCorrect === true || selected === correctAnswer
          break
        }

        case 'blanks': {
          correctAnswer = String(question.answer ?? '').trim().toLowerCase()
          const filled = String(answer?.userAnswer ?? '').trim().toLowerCase()
          userAnswer = filled || null
          isCorrect = filled === correctAnswer
          break
        }

        case 'openended': {
          correctAnswer = String(question.answer ?? '')
          userAnswer = answer?.userAnswer ?? null
          isCorrect = answer?.isCorrect === true
          break
        }

        default:
          correctAnswer = ''
          userAnswer = null
          isCorrect = false
      }

      if (isCorrect) score++

      tempResults.push({
        questionId: String(question.id),
        userAnswer,
        correctAnswer,
        isCorrect,
        skipped,
      })
    }

    const total = questions.length

    const results: QuizResults = {
      slug: slug!,
      quizType: quizType!,
      score,
      maxScore: total,
      percentage: total > 0 ? Math.round((score / total) * 100) : 0,
      submittedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      answers: Object.values(answers),
      results: tempResults,
    }

    return results
  }
)
export const checkAuthAndLoadResults = createAsyncThunk(
  'quiz/checkAuthAndLoadResults',
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState
    const quiz = state.quiz

    // If results already loaded, no need to check auth
    if (quiz.results) return

    // If auth is required, mark it and return
    if (quiz.requiresAuth) {
      return { requiresAuth: true, redirectUrl: quiz.redirectAfterLogin }
    }

    // Otherwise, load results directly
    if (quiz.slug && quiz.quizType) {
      try {
        const results = await dispatch(submitQuiz()).unwrap()
        return { requiresAuth: false, results }
      } catch (error) {
        console.error("Failed to submit quiz:", error)
        throw error
      }
    }

    throw new Error("No quiz data available")
  }
)
export const hydrateQuiz = createAsyncThunk(
  'quiz/hydrate',
  async (payload: { quizData: Partial<QuizState> }, { getState }) => {
    const state = getState() as RootState
    const currentQuiz = state.quiz

    return {
      ...currentQuiz,
      ...payload.quizData,
    }
  }
)

/// -- Slice --

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setQuiz(state, action: PayloadAction<{ slug: string; quizType: QuizType; title: string; questions: QuizQuestion[]; userId?: string }>) {
      state.slug = action.payload.slug
      state.quizType = action.payload.quizType
      state.title = action.payload.title
      state.questions = action.payload.questions
      state.answers = {}
      state.results = null
      state.currentQuestionIndex = 0
      state.isCompleted = false
      state.status = 'succeeded'
      state.error = null
      state.userId = action.payload.userId ?? null // Set userId if provided
    },

    saveAnswer(state, action: PayloadAction<{
      questionId: string;
      answer: string | Record<string, any>;
      selectedOptionId?: string
    }>) {
      const question = state.questions.find((q) => String(q.id) === action.payload.questionId)
      if (!question) return

      const correctAnswer = question.correctOptionId || question.answer || ''

      const userAnswer = typeof action.payload.answer === 'string'
        ? action.payload.answer
        : ''

      const selectedOptionId = action.payload.selectedOptionId ||
        (typeof action.payload.answer === 'object' && action.payload.answer.selectedOptionId) ||
        null

      const isCorrect = selectedOptionId
        ? String(selectedOptionId) === String(correctAnswer)
        : typeof userAnswer === 'string' &&
        userAnswer.trim().toLowerCase() === String(correctAnswer).trim().toLowerCase()

      state.answers[action.payload.questionId] = {
        questionId: action.payload.questionId,
        userAnswer: typeof action.payload.answer === 'object' ? '' : action.payload.answer,
        selectedOptionId,
        isCorrect,
        type: question.type,
        timestamp: Date.now(),
      }
    },

    setCurrentQuestionIndex(state, action: PayloadAction<number>) {
      const index = action.payload
      if (index >= 0 && index < state.questions.length) {
        state.currentQuestionIndex = index
      }
    },

    resetQuiz(state, action: PayloadAction<{ keepResults?: boolean } | undefined>) {
      const keep = action.payload?.keepResults ?? false
      state.questions = []
      state.answers = {}
      state.title = ''
      state.status = 'idle'
      state.currentQuestionIndex = 0
      state.isCompleted = keep
      state.slug = null
      state.quizType = null
      if (!keep) state.results = null
      state.requiresAuth = false
      state.redirectAfterLogin = null
    },

    clearResults(state) {
      state.results = null
      state.isCompleted = false
    },

    /**
     * Auth required: user must sign in to see results
     * Triggers: 
     *   Unauthenticated --> RedirectToSignIn
     */
    markRequiresAuth(state, action: PayloadAction<{ redirectUrl: string }>) {
      state.requiresAuth = true
      state.redirectAfterLogin = action.payload.redirectUrl
    },

    /**
     * After sign-in, clear auth redirect flag
     * Triggers:
     *   RedirectToSignIn --> Authenticated
     */
    clearRequiresAuth(state) {
      state.requiresAuth = false
      state.redirectAfterLogin = null
    },

    /**
     * @deprecated Use resetQuiz({ keepResults: false }) instead
     */
    clearQuizState() {
      console.warn('⚠️ [DEPRECATED] Use resetQuiz({ keepResults: false }) instead.')
    },
    resetSubmissionState(state) {
      state.status = 'idle'
      state.error = null
      state.results = null
      state.isCompleted = false
    },
    setQuizCompleted(state, action: PayloadAction<boolean>) {
      state.isCompleted = action.payload
    },
    setQuizResults(state, action: PayloadAction<QuizResults>) {
      state.results = action.payload
      state.isCompleted = true
    }
  }, 
  extraReducers: (builder) => {
    builder
      .addCase(submitQuiz.pending, (state) => {
        state.status = 'submitting'
        state.error = null
      })
      
      .addCase(submitQuiz.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.results = action.payload
        state.isCompleted = true
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message || 'Quiz submission failed'
      })
      .addCase(fetchQuiz.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchQuiz.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.slug = action.payload.slug
        state.quizType = action.payload.quizType
        state.title = action.payload.title || ''
        state.questions = action.payload.questions || []
        state.answers = {}
        state.results = null
        state.currentQuestionIndex = 0
        state.isCompleted = false
        state.error = null
        state.userId = action.payload.userId ?? null // Set userId if present in payload
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message || 'Quiz loading failed'
      })
  },
})



// -- Actions --

export const {
  setQuiz,
  saveAnswer,
  resetQuiz,
  resetSubmissionState,
  clearResults,
  clearQuizState, // ⚠️ DEPRECATED
  setCurrentQuestionIndex,
  markRequiresAuth,        // ⇨ signals redirect to sign-in required
  clearRequiresAuth,      // ⇨ reset flag after successful auth
  setQuizCompleted,
  setQuizResults
} = quizSlice.actions

// -- Thunks --



// -- Selectors --

export const selectQuiz = (state: RootState) => state.quiz
export const selectQuizResults = (state: RootState) => state.quiz.results
export const selectQuizQuestions = (state: RootState) => state.quiz.questions
export const selectQuizAnswers = (state: RootState) => state.quiz.answers
export const selectQuizStatus = (state: RootState) => state.quiz.status
export const selectIsQuizComplete = (state: RootState) => state.quiz.isCompleted
export const selectRequiresAuth = (state: RootState) => state.quiz.requiresAuth
export const selectRedirectAfterLogin = (state: RootState) => state.quiz.redirectAfterLogin
export const selectCurrentQuestionIndex = (state: RootState) => state.quiz.currentQuestionIndex
export const selectQuizId = (state: RootState) => state.quiz.slug || null
// Renamed to avoid conflict with imported 'selectQuizTitle'
export const selectQuizTitle = (state: RootState) => state.quiz.title || ''
export const selectQuizType = (state: RootState) => state.quiz.quizType || null
export const selectCurrentQuestion = createSelector(
  [selectQuizQuestions, selectCurrentQuestionIndex],
  (questions, index) => questions[index]
)
export const selectQuizUserId = (state: RootState) => state.quiz.userId

// -- Reducer Export --

export default quizSlice.reducer
