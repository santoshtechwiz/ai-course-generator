import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { API_ENDPOINTS } from './quiz-helpers'
import { QuizQuestion, QuizResults, QuizState } from './quiz-types'
import { QuizType } from '@/app/types/quiz-types'

// Initial State
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
  error: null,  requiresAuth: false,
  redirectAfterLogin: null,
  userId: null,
}

// Async Thunks

/**
 * Load quiz definition based on slug/type
 */
export const fetchQuiz = createAsyncThunk(
  "quiz/fetch",  async (
    payload: {
      slug?: string
      quizType?: QuizType
      data?: any
    },
    { rejectWithValue }
  ) => {
    try {
      if (!payload) {
        return rejectWithValue('No payload provided')
     
      }

      const slug = payload.slug?.trim() || ""
      const type = payload.quizType as QuizType

      if (payload.data && Array.isArray(payload.data.questions)) {
        return {
          ...payload.data,
          slug,
          quizType: type,
          id: slug,
        }
      }

      if (!slug || !type) {
        return rejectWithValue({ error: "Missing slug or quizType" })
      }
      
      // Always use the unified API approach with type and slug for consistency
      let url: string;
      
      // Use the unified approach with byTypeAndSlug helper
      if (API_ENDPOINTS.byTypeAndSlug) {
        // Use the unified API pattern
        url = API_ENDPOINTS.byTypeAndSlug(type, slug);
        console.log(`Using unified API endpoint: ${url}`);
      } else {
        // Fallback to legacy approach only if unified approach isn't available
        const endpoint = API_ENDPOINTS[type as keyof typeof API_ENDPOINTS];
        if (!endpoint) {
          return rejectWithValue({ error: `Invalid quiz type: ${type}` });
        }
        url = `${endpoint}/${slug}`;
        console.log(`Using legacy API endpoint: ${url}`);
      }
      
      const response = await fetch(url)
      if (!response.ok) {
        const errorText = await response.text()
        
        // Handle 404 specifically as not found
        if (response.status === 404) {
          return rejectWithValue({
            error: `Quiz not found`,
            status: 'not-found',
            details: `Quiz with slug "${slug}" and type "${type}" does not exist.`,
          })
        }
        
        return rejectWithValue({
          error: `Error loading quiz: ${response.status}`,
          details: errorText,
        })
      }

      const data = await response.json()

      if (!data || !Array.isArray(data.questions)) {
        return rejectWithValue({ 
          error: "Quiz not found or invalid data",
          status: 'not-found',
          details: "The quiz exists but contains no valid questions."
        })
      }

      const questions = data.questions.map((q: any) => {
        const base: QuizQuestion = {
          id: q.id || crypto.randomUUID(),
          question: q.question,
          type: type,
          answer: q.answer,
          codeSnippet: q.codeSnippet,
          language: q.language,
          tags: q.tags || [],
          hints: q.hints || [],
          difficulty: q.difficulty,
          keywords: q.keywords,
        }

        if (type === "mcq") {
          return {
            ...base,
            options: q.options,
            correctOptionId: q.correctOptionId,
          }
        }

        if (type === "code") {
          return {
            ...base,
             options: q.options,
            codeSnippet: q.codeSnippet,
            language: q.language || "javascript",
          }
        }

        if (type === "blanks" || type === "openended") {
          const open = q.openEndedQuestion || {}
          return {
            ...base,
            tags: q.tags || open.tags || [],
            hints: q.hints || open.hints || [],
          }
        }

        return base
      })

      const normalized = {
        ...data,
        questions,
        slug,
        quizType: type,
        id: slug,
      }

      console.log("Quiz fetched successfully:", normalized)
      return normalized
    } catch (error: any) {
      console.error("Quiz fetch error:", error)
      return rejectWithValue({
        error: error.message || "Failed to load quiz",
      })
    }
  }
)

/**
 * Submit and calculate quiz result
 */
export const submitQuiz = createAsyncThunk(
  'quiz/submit',
  async (_, { getState }) => {
    try {
      const state = getState() as RootState
      const quiz = state.quiz as unknown as QuizState
      const { questions, answers, slug, quizType } = quiz

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
    } catch (error) {
      throw error
    }
  }
)

/**
 * Check authentication and load results if authenticated
 */
export const checkAuthAndLoadResults = createAsyncThunk(
  'quiz/checkAuthAndLoadResults',
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState
    const quiz = state.quiz as unknown as QuizState

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

/**
 * Hydrate quiz state from external data
 */
export const hydrateQuiz = createAsyncThunk(
  'quiz/hydrate',
  async (payload: { quizData: Partial<QuizState> }, { getState }) => {
    const state = getState() as RootState
    const currentQuiz = state.quiz as unknown as QuizState

    return {
      ...currentQuiz,
      ...payload.quizData,
    }
  }
)

// Quiz Slice
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
      state.userId = action.payload.userId ?? null
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
     * Mark that authentication is required to see quiz results
     */
    markRequiresAuth(state, action: PayloadAction<{ redirectUrl: string }>) {
      state.requiresAuth = true
      state.redirectAfterLogin = action.payload.redirectUrl
    },

    /**
     * Clear authentication requirement flag after successful auth
     */
    clearRequiresAuth(state) {
      state.requiresAuth = false
      state.redirectAfterLogin = null
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
        state.userId = action.payload.userId ?? null
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        const payload = action.payload as any
        
        // Check if this is a "not found" error
        if (payload?.status === 'not-found') {
          state.status = 'not-found'
          state.error = payload.error || 'Quiz not found'
        } else {
          state.status = 'failed'
          state.error = payload?.error || action.error.message || 'Quiz loading failed'
        }
        
        // Clear quiz data when fetch fails
        state.questions = []
        state.answers = {}
        state.results = null
        state.slug = null
        state.quizType = null
        state.title = ''
      })
  },
})

// Action Creators
export const {
  setQuiz,
  saveAnswer,
  resetQuiz,
  resetSubmissionState,
  clearResults,
  setCurrentQuestionIndex,
  markRequiresAuth,
  clearRequiresAuth,
  setQuizCompleted,
  setQuizResults
} = quizSlice.actions

// Selectors
export const selectQuiz = (state: RootState) => state.quiz as unknown as QuizState
export const selectQuizResults = (state: RootState) => (state.quiz as unknown as QuizState).results
export const selectQuizQuestions = (state: RootState) => (state.quiz as unknown as QuizState).questions
export const selectQuizAnswers = (state: RootState) => (state.quiz as unknown as QuizState).answers
export const selectQuizStatus = (state: RootState) => (state.quiz as unknown as QuizState).status
export const selectQuizError = (state: RootState) => (state.quiz as unknown as QuizState).error
export const selectIsQuizNotFound = (state: RootState) => (state.quiz as unknown as QuizState).status === 'not-found'
export const selectIsQuizLoading = (state: RootState) => (state.quiz as unknown as QuizState).status === 'loading'
export const selectIsQuizComplete = (state: RootState) => (state.quiz as unknown as QuizState).isCompleted
export const selectRequiresAuth = (state: RootState) => (state.quiz as unknown as QuizState).requiresAuth
export const selectRedirectAfterLogin = (state: RootState) => (state.quiz as unknown as QuizState).redirectAfterLogin
export const selectCurrentQuestionIndex = (state: RootState) => (state.quiz as unknown as QuizState).currentQuestionIndex
export const selectQuizId = (state: RootState) => (state.quiz as unknown as QuizState).slug || null
export const selectQuizTitle = (state: RootState) => (state.quiz as unknown as QuizState).title || ''
export const selectQuizType = (state: RootState) => (state.quiz as unknown as QuizState).quizType || null
export const selectCurrentQuestion = createSelector(
  [selectQuizQuestions, selectCurrentQuestionIndex],
  (questions, index) => questions[index]
)
export const selectQuizUserId = (state: RootState) => (state.quiz as unknown as QuizState).userId

// Default Export
export default quizSlice.reducer
