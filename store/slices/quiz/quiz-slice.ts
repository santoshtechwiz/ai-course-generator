import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { API_ENDPOINTS } from './quiz-helpers'
import { QuizQuestion, QuizResults, QuizState } from './quiz-types'
import { QuizType } from '@/app/types/quiz-types'
import { STORAGE_KEYS } from '@/constants/global'
// Loader system removed; progress indicators are now handled by NProgress.

// Lightweight non-hook helper to interact with global loader store inside thunks
// Removed loader helper functions (startQuizLoader / stopQuizLoader) – no longer needed.

// In-memory cache for fetched quizzes (per session). Keeps last N entries with TTL.
const QUIZ_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_ENTRIES = 100
const quizCache = new Map<string, { timestamp: number; data: any }>()

function getQuizCacheKey(type: QuizType | null, slug: string | null): string {
  return `${type || 'unknown'}::${slug || 'unknown'}`
}

function getCachedQuiz(type: QuizType | null, slug: string | null): any | null {
  const key = getQuizCacheKey(type, slug)
  const entry = quizCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > QUIZ_CACHE_TTL_MS) {
    quizCache.delete(key)
    return null
  }
  return entry.data
}

function setCachedQuiz(type: QuizType | null, slug: string | null, data: any): void {
  const key = getQuizCacheKey(type, slug)
  quizCache.set(key, { timestamp: Date.now(), data })
  // Evict oldest if over capacity
  if (quizCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = [...quizCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0]?.[0]
    if (oldestKey) quizCache.delete(oldestKey)
  }
}

function persistProgress(slug: string | null, quizType: QuizType | null, currentQuestionIndex: number) {
  if (typeof window === 'undefined' || !slug || !quizType) return
  try {
    const key = `${STORAGE_KEYS.QUIZ_STATE}:${quizType}:${slug}`
    const value = JSON.stringify({ slug, quizType, currentQuestionIndex, updatedAt: Date.now() })
    localStorage.setItem(key, value)
  } catch {}
}

function readProgress(slug: string | null, quizType: QuizType | null): number | null {
  if (typeof window === 'undefined' || !slug || !quizType) return null
  try {
    const key = `${STORAGE_KEYS.QUIZ_STATE}:${quizType}:${slug}`
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return typeof parsed.currentQuestionIndex === 'number' ? parsed.currentQuestionIndex : null
  } catch {
    return null
  }
}

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
  error: null,
  requiresAuth: false,
  redirectAfterLogin: null,
  userId: null,
  questionStartTimes: {},
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
    let loaderId: string | null = null
    try {
      if (!payload) {
        return rejectWithValue('No payload provided')
     
      }

      const slug = payload.slug?.trim() || ""
      const type = payload.quizType as QuizType

      // Serve from cache if available and no inline data provided
      if (!payload.data) {
        const cached = getCachedQuiz(type, slug)
        if (cached) {
          return {
            ...cached,
            slug,
            quizType: type,
            id: slug,
          }
        }
      }

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
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Using unified API endpoint: ${url}`);
        }
      } else {
        // Fallback to legacy approach only if unified approach isn't available
        const endpoint = API_ENDPOINTS[type as keyof typeof API_ENDPOINTS];
        if (!endpoint) {
          return rejectWithValue({ error: `Invalid quiz type: ${type}` });
        }
        url = `${endpoint}/${slug}`;
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Using legacy API endpoint: ${url}`);
        }
      }
      
  // Start loader (browser only)
  // Loader removed

      const response = await fetch(url)
      if (!response.ok) {
        const errorText = await response.text()
        
        // Handle 404 specifically as not found
        if (response.status === 404) {
          // Loader removed
          return rejectWithValue({
            error: `Quiz not found`,
            status: 'not-found',
            details: `Quiz with slug "${slug}" and type "${type}" does not exist.`,
          })
        }
        stopQuizLoader(loaderId, false, String(response.status))
        return rejectWithValue({
          error: `Error loading quiz: ${response.status}`,
          details: errorText,
        })
      }

  const data = await response.json()
  // Loader removed

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

      // Cache normalized quiz
      setCachedQuiz(type, slug, normalized)

      return normalized
  } catch (err: any) {
  // Loader removed
      return rejectWithValue({ error: err?.message || 'Unknown error' })
    }
  }
)

/**
 * Submit quiz to backend and save results
 */
export const submitQuiz = createAsyncThunk(
  'quiz/submit',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState
      const quiz = state.quiz as unknown as QuizState
      const { questions, answers, slug, quizType } = quiz

      if (!slug || !quizType) {
        throw new Error("Missing quiz slug or type")
      }

      // Calculate client-side results first
      let score = 0
      const tempResults: QuizResults['results'] = []
      const totalTimeSpent = Object.values(answers).reduce((total, answer) => {
        return total + (answer?.timeSpent || 0)
      }, 0)

      // Prepare answers for API submission
      const answersForAPI: any[] = []

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
            
            // Format for API
            answersForAPI.push({
              questionId: String(question.id),
              answer: selected,
              timeSpent: answer?.timeSpent || 0,
              isCorrect: isCorrect
            })
            break
          }

          case 'blanks': {
            correctAnswer = String(question.answer ?? '').trim().toLowerCase()
            const filled = String(answer?.userAnswer ?? '').trim().toLowerCase()
            userAnswer = filled || null
            isCorrect = filled === correctAnswer
            
            // Format for API
            answersForAPI.push({
              questionId: String(question.id),
              userAnswer: answer?.userAnswer || '',
              timeSpent: answer?.timeSpent || 0,
              isCorrect: isCorrect
            })
            break
          }

          case 'openended': {
            correctAnswer = String(question.answer ?? '')
            userAnswer = answer?.userAnswer ?? null
            isCorrect = answer?.isCorrect === true
            
            // Format for API
            answersForAPI.push({
              questionId: String(question.id),
              answer: answer?.userAnswer || '',
              timeSpent: answer?.timeSpent || 0,
              isCorrect: isCorrect
            })
            break
          }

          case 'flashcard': {
            // For flashcards, we track time spent and basic correctness
            isCorrect = answer?.isCorrect === true
            userAnswer = answer?.userAnswer || null
            
            answersForAPI.push({
              questionId: String(question.id),
              answer: userAnswer || '',
              timeSpent: answer?.timeSpent || 0,
              isCorrect: isCorrect
            })
            break
          }

          default:
            correctAnswer = ''
            userAnswer = null
            isCorrect = false
            
            answersForAPI.push({
              questionId: String(question.id),
              answer: '',
              timeSpent: 0,
              isCorrect: false
            })
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

      // Submit to backend API
      if (process.env.NODE_ENV !== 'production') {
        console.log('Submitting quiz to backend:', {
        quizId: slug,
        score,
        totalTime: totalTimeSpent,
        type: quizType,
        answersCount: answersForAPI.length
        })
      }

      const response = await fetch(`/api/quizzes/${quizType}/${slug}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: slug,
          answers: answersForAPI,
          totalTime: totalTimeSpent,
          score: score,
          type: quizType,
          totalQuestions: total,
          correctAnswers: score,
          completedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Quiz submission failed:', errorData)
        throw new Error(errorData.error || 'Failed to submit quiz')
      }

      const responseData = await response.json()
      if (process.env.NODE_ENV !== 'production') {
        console.log('Quiz submitted successfully:', responseData)
      }

      // Return client-side calculated results for immediate UI feedback
      const results: QuizResults = {
        slug: slug!,
        quizType: quizType!,
        score,
        maxScore: total,
        percentage: responseData.result?.percentageScore || (total > 0 ? Math.round((score / total) * 100) : 0),
        submittedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        answers: Object.values(answers),
        results: tempResults,
        // Include additional data from API response
        totalTime: totalTimeSpent,
        accuracy: responseData.result?.accuracy,
      }

      return results
    } catch (error: any) {
      console.error('Quiz submission error:', error)
      return rejectWithValue({
        error: error.message || 'Failed to submit quiz',
      })
    }
  }
)

/**
 * Check authentication and load results if authenticated
 */
export const checkAuthAndLoadResults = createAsyncThunk(
  'quiz/checkAuthAndLoadResults',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const quiz = state.quiz as unknown as QuizState

    // If results already loaded, no need to check auth
    if (quiz.results) return quiz.results

    // If auth is required, mark it and return
    if (quiz.requiresAuth) {
      return rejectWithValue({ requiresAuth: true, redirectUrl: quiz.redirectAfterLogin })
    }

    // Try to fetch saved results from the API
    if (quiz.slug && quiz.quizType) {
      try {
        if (process.env.NODE_ENV !== 'production') {
          console.log('Fetching saved quiz results for:', quiz.slug, quiz.quizType)
        }
        
        // First, try to get the quiz data to check if it's been completed
        const quizResponse = await fetch(`/api/quizzes/${quiz.quizType}/${quiz.slug}`)
        if (quizResponse.ok) {
          const quizData = await quizResponse.json()
          
          // Check if quiz has been completed (has timeEnded)
          if (quizData.timeEnded && quizData.bestScore !== null) {
            // Create results object from saved quiz data
            const savedResults: QuizResults = {
              slug: quiz.slug,
              quizType: quiz.quizType,
              score: quizData.bestScore || 0,
              maxScore: quizData.questions?.length || 0,
              percentage: quizData.bestScore || 0, // Already a percentage from calculatePercentageScore
              submittedAt: quizData.timeEnded,
              completedAt: quizData.timeEnded,
              answers: [], // We don't have the detailed answers, but that's OK for results display
              results: [], // We don't have detailed results, but that's OK for basic display
              totalTime: 0, // We don't have this saved
              accuracy: 0, // We don't have this saved
            }
            
            if (process.env.NODE_ENV !== 'production') {
              console.log('Found saved quiz results:', savedResults)
            }
            return savedResults
          } else {
            if (process.env.NODE_ENV !== 'production') {
              console.log('Quiz not completed yet, no results to load')
            }
            return rejectWithValue({ error: 'Quiz not completed' })
          }
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.log('Failed to fetch quiz data:', quizResponse.status)
          }
          return rejectWithValue({ error: 'Failed to fetch quiz data' })
        }
      } catch (error) {
        console.error("Failed to load quiz results:", error)
        return rejectWithValue({ error: 'Failed to load results' })
      }
    }

    return rejectWithValue({ error: "No quiz data available" })
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
      selectedOptionId?: string;
      timeSpent?: number;
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

      // Calculate time spent for this question
      const currentTime = Date.now()
      const startTime = state.questionStartTimes[action.payload.questionId] || currentTime
      const timeSpent = action.payload.timeSpent || Math.max(1, Math.round((currentTime - startTime) / 1000))

      state.answers[action.payload.questionId] = {
        questionId: action.payload.questionId,
        userAnswer: typeof action.payload.answer === 'object' ? '' : action.payload.answer,
        selectedOptionId,
        isCorrect,
        type: question.type,
        timestamp: currentTime,
        timeSpent: timeSpent, // Already in seconds
      }
    },

    setCurrentQuestionIndex(state, action: PayloadAction<number>) {
      const index = action.payload
      if (index >= 0 && index < state.questions.length) {
        state.currentQuestionIndex = index
        persistProgress(state.slug, state.quizType, state.currentQuestionIndex)
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
      state.questionStartTimes = {}
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
    },

    /**
     * Track when a question is first viewed to calculate time spent
     */
    startQuestionTimer(state, action: PayloadAction<{ questionId: string }>) {
      const questionId = action.payload.questionId
      if (!state.questionStartTimes[questionId]) {
        state.questionStartTimes[questionId] = Date.now()
      }
    },

    /**
     * Reset question timers (useful when retaking quiz)
     */
    resetQuestionTimers(state) {
      state.questionStartTimes = {}
    },
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
      .addCase(fetchQuiz.fulfilled, (state, action: PayloadAction<any>) => {
        state.status = 'succeeded'
        state.slug = action.payload.slug
        state.quizType = action.payload.quizType
        state.title = action.payload.title || ''
        state.questions = action.payload.questions || []
        state.currentQuestionIndex = action.payload.currentQuestionIndex || 0
        state.answers = {}
        state.results = null
        state.isCompleted = false
        persistProgress(state.slug, state.quizType, state.currentQuestionIndex)
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
      .addCase(checkAuthAndLoadResults.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(checkAuthAndLoadResults.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.results = action.payload
        state.isCompleted = true
        state.error = null
      })
      .addCase(checkAuthAndLoadResults.rejected, (state, action) => {
        const payload = action.payload as any
        if (payload?.requiresAuth) {
          state.requiresAuth = true
          state.redirectAfterLogin = payload.redirectUrl
        } else {
          state.status = 'failed'
          state.error = payload?.error || action.error.message || 'Failed to load results'
        }
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
  setQuizResults,
  startQuestionTimer,
  resetQuestionTimers
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
