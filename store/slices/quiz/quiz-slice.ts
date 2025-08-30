import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { API_ENDPOINTS } from './quiz-helpers'
import { QuizQuestion, QuizResults, QuizState } from './quiz-types'
import { QuizType } from '@/app/types/quiz-types'
import { STORAGE_KEYS } from '@/constants/global'
import { 
  shouldUpdateState, 
  createPendingUpdate, 
  createFulfilledUpdate, 
  createRejectedUpdate,
  RequestManager,
  getErrorMessage
} from '../../utils/async-state'

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
  } catch (error) {
    console.warn('Failed to persist quiz progress:', error)
  }
}

function loadPersistedProgress(slug: string | null, quizType: QuizType | null): number | null {
  if (typeof window === 'undefined' || !slug || !quizType) return null
  try {
    const key = `${STORAGE_KEYS.QUIZ_STATE}:${quizType}:${slug}`
    const stored = localStorage.getItem(key)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    // Check if data is recent (within 24 hours)
    if (Date.now() - parsed.updatedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key)
      return null
    }
    return parsed.currentQuestionIndex || 0
  } catch (error) {
    console.warn('Failed to load persisted quiz progress:', error)
    return null
  }
}

/**
 * Enhanced fetchQuiz with better error handling and cancellation
 */
export const fetchQuiz = createAsyncThunk(
  "quiz/fetch",
  async (
    payload: {
      slug?: string
      quizType?: QuizType
      data?: any
    },
    { rejectWithValue, signal, getState }
  ) => {
    if (!payload) {
      return rejectWithValue({ error: 'No payload provided', code: 'INVALID_PAYLOAD' })
    }

    const slug = payload.slug?.trim() || ""
    const type = payload.quizType as QuizType
    const requestKey = `quiz-${type}-${slug}`

    try {
      // Check if request was already cancelled
      if (signal?.aborted) {
        return rejectWithValue({ error: 'Request was cancelled', code: 'CANCELLED' })
      }

      // Cancel any existing request for this quiz
      RequestManager.cancel(requestKey)

      // Create new abort controller
      const abortController = RequestManager.create(requestKey)

      // Combine signals
      const combinedSignal = abortController.signal
      if (signal) {
        signal.addEventListener('abort', () => {
          RequestManager.cancel(requestKey)
        })
      }

      // Check for cached data first (unless inline data is provided)
      if (!payload.data) {
        const cached = getCachedQuiz(type, slug)
        if (cached) {
          RequestManager.cancel(requestKey)
          return {
            ...cached,
            slug,
            quizType: type,
            id: slug,
            __lastUpdated: Date.now(),
            __fromCache: true
          }
        }
      }

      // Handle inline data
      if (payload.data && Array.isArray(payload.data.questions)) {
        RequestManager.cancel(requestKey)
        const processedData = {
          ...payload.data,
          slug,
          quizType: type,
          id: slug,
          __lastUpdated: Date.now(),
          __fromCache: false
        }
        setCachedQuiz(type, slug, processedData)
        return processedData
      }

      // Validate required parameters
      if (!slug || !type) {
        RequestManager.cancel(requestKey)
        return rejectWithValue({
          error: "Missing required parameters: slug and quizType are required",
          code: 'MISSING_PARAMS'
        })
      }

      // Determine API endpoint
      let url: string
      if (API_ENDPOINTS.byTypeAndSlug) {
        url = API_ENDPOINTS.byTypeAndSlug(type, slug)
      } else {
        const endpoint = API_ENDPOINTS[type as keyof typeof API_ENDPOINTS]
        if (!endpoint) {
          RequestManager.cancel(requestKey)
          return rejectWithValue({
            error: `Invalid quiz type: ${type}`,
            code: 'INVALID_QUIZ_TYPE'
          })
        }
        url = `${endpoint}/${slug}`
      }

      // Check if request is still valid before making API call
      if (combinedSignal.aborted) {
        return rejectWithValue({ error: 'Request was cancelled', code: 'CANCELLED' })
      }

      // Make API request with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        RequestManager.cancel(requestKey)

        // Handle specific HTTP status codes
        if (response.status === 404) {
          return rejectWithValue({
            error: 'Quiz not found',
            code: 'NOT_FOUND',
            status: response.status
          })
        }

        if (response.status === 403) {
          return rejectWithValue({
            error: 'Access denied to this quiz',
            code: 'FORBIDDEN',
            status: response.status
          })
        }

        if (response.status >= 500) {
          return rejectWithValue({
            error: 'Server error. Please try again later.',
            code: 'SERVER_ERROR',
            status: response.status
          })
        }

        return rejectWithValue({
          error: errorText || `HTTP ${response.status}: ${response.statusText}`,
          code: 'HTTP_ERROR',
          status: response.status
        })
      }

      const data = await response.json()

      // Validate response data
      if (!data || typeof data !== 'object') {
        RequestManager.cancel(requestKey)
        return rejectWithValue({
          error: 'Invalid response format',
          code: 'INVALID_RESPONSE'
        })
      }

      if (!Array.isArray(data.questions)) {
        RequestManager.cancel(requestKey)
        return rejectWithValue({
          error: 'Invalid quiz data: questions array is required',
          code: 'INVALID_QUIZ_DATA'
        })
      }

      // Process and cache the data
      const processedData = {
        ...data,
        slug,
        quizType: type,
        id: slug,
        __lastUpdated: Date.now(),
        __fromCache: false
      }

      setCachedQuiz(type, slug, processedData)
      RequestManager.cancel(requestKey)

      return processedData

    } catch (error: any) {
      RequestManager.cancel(requestKey)

      // Handle different types of errors
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        return rejectWithValue({ error: 'Request was cancelled', code: 'CANCELLED' })
      }

      if (error.message?.includes('fetch')) {
        return rejectWithValue({
          error: 'Network error. Please check your connection.',
          code: 'NETWORK_ERROR'
        })
      }

      return rejectWithValue({
        error: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      })
    }
  }
)

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
  lastUpdated: null,
  isInitialized: false,
  pendingRedirect: false,
}

// Async Thunks

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

      return {
        ...results,
        __lastUpdated: Date.now(),
      }
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
            return {
              ...savedResults,
              __lastUpdated: Date.now(),
            }
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
      __lastUpdated: Date.now(),
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
  state.lastUpdated = Date.now()
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

      const computedUserAnswer = typeof action.payload.answer === 'object'
        ? (action.payload.answer.userAnswer ?? '')
        : (action.payload.answer as string)

      state.answers[action.payload.questionId] = {
        questionId: action.payload.questionId,
        selectedOptionId: selectedOptionId,
        userAnswer: computedUserAnswer,
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

    // Handle navigation between quiz pages
    handleNavigation(state, action: PayloadAction<{ keepData?: boolean }>) {
      const keepData = action.payload?.keepData ?? false
      
      // Cancel all pending requests during navigation
      RequestManager.cancelAll()
      
      if (!keepData) {
        // Clear quiz data on navigation unless explicitly told to keep it
        state.questions = []
        state.answers = {}
        state.results = null
        state.slug = null
        state.quizType = null
        state.title = ''
        state.currentQuestionIndex = 0
        state.isCompleted = false
        state.lastUpdated = null
        state.isInitialized = false
        state.pendingRedirect = false
      }
      
      // Always reset status and error on navigation
      state.status = 'idle'
      state.error = null
    },

    resetQuiz(state, action: PayloadAction<{ keepResults?: boolean } | undefined>) {
      const keep = action.payload?.keepResults ?? false
      
      // Cancel all pending requests when resetting quiz
      RequestManager.cancelAll()
      
      state.questions = []
      state.answers = {}
      state.currentQuestionIndex = 0
      state.isCompleted = false
      state.status = 'idle'
      state.error = null
      state.requiresAuth = false
      state.redirectAfterLogin = null
      state.questionStartTimes = {}
      state.isInitialized = false
      state.pendingRedirect = false
      
      if (!keep) {
        state.results = null
        state.slug = null
        state.quizType = null
        state.title = ''
        state.lastUpdated = null
      }
    },

    clearResults(state) {
      state.results = null
      state.isCompleted = false
  state.lastUpdated = Date.now()
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
  state.lastUpdated = null
    },

    setQuizCompleted(state, action: PayloadAction<boolean>) {
      state.isCompleted = action.payload
    },

    setQuizResults(state, action: PayloadAction<QuizResults>) {
      state.results = action.payload
      state.isCompleted = true
  state.lastUpdated = Date.now()
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
        const incomingTs = (action.payload as any)?.__lastUpdated || Date.now()
        if (!state.lastUpdated || incomingTs >= state.lastUpdated) {
          state.status = 'succeeded'
          state.results = action.payload
          state.isCompleted = true
          state.lastUpdated = incomingTs
        }
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message || 'Quiz submission failed'
      })
      .addCase(fetchQuiz.pending, (state) => {
        // Only update status if not already loading (prevents flickering)
        if (state.status !== 'loading') {
          state.status = 'loading'
          state.error = null
          state.isInitialized = false
        }
        // Don't clear existing data to prevent blank screens during refetch
      })
      .addCase(fetchQuiz.fulfilled, (state, action: PayloadAction<any>) => {
        const incomingTs = action.payload.__lastUpdated || Date.now()

        // Only update if this is newer data or we're in a fresh state
        if (!state.lastUpdated || incomingTs >= state.lastUpdated || state.status !== 'succeeded') {
          state.status = 'succeeded'
          state.error = null
          state.slug = action.payload.slug
          state.quizType = action.payload.quizType
          state.title = action.payload.title || action.payload.data?.title || ''
          state.questions = action.payload.questions || []
          state.isInitialized = true

          // Load persisted progress if available
          const persistedIndex = loadPersistedProgress(state.slug, state.quizType)
          state.currentQuestionIndex = persistedIndex !== null ? persistedIndex :
            (typeof action.payload.currentQuestionIndex === 'number' && action.payload.currentQuestionIndex >= 0
              ? action.payload.currentQuestionIndex
              : 0)

          // Reset answers for fresh quiz attempt
          state.answers = {}

          // Clear results if this is a fresh load
          if (!action.payload.__fromCache) {
            state.results = null
            state.isCompleted = false
          }

          state.lastUpdated = incomingTs
          persistProgress(state.slug, state.quizType, state.currentQuestionIndex)
        }
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        const payload = action.payload as any
        const errorCode = payload?.code

        // Handle different error types appropriately
        switch (errorCode) {
          case 'CANCELLED':
            // Don't change status or show error for cancelled requests
            // This prevents blank screens when navigating quickly
            console.log('Quiz request was cancelled, preserving current state')
            return

          case 'NOT_FOUND':
            state.status = 'not-found'
            state.error = payload?.error || 'Quiz not found'
            state.isInitialized = true
            break

          case 'FORBIDDEN':
            state.status = 'failed'
            state.error = payload?.error || 'Access denied'
            state.isInitialized = true
            break

          case 'NETWORK_ERROR':
          case 'SERVER_ERROR':
            state.status = 'failed'
            state.error = payload?.error || 'Network error. Please check your connection.'
            state.isInitialized = true
            break

          default:
            state.status = 'failed'
            state.error = payload?.error || action.error.message || 'Failed to load quiz'
            state.isInitialized = true
        }

        // Clear any pending operations
        state.pendingRedirect = false
      })
      .addCase(checkAuthAndLoadResults.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(checkAuthAndLoadResults.fulfilled, (state, action) => {
        const incomingTs = (action.payload as any)?.__lastUpdated || Date.now()
        if (!state.lastUpdated || incomingTs >= state.lastUpdated) {
          state.status = 'succeeded'
          state.results = action.payload
          state.isCompleted = true
          state.error = null
          state.lastUpdated = incomingTs
        }
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
export const {
  // Quiz setup and reset
  setQuiz,
  resetQuiz,
  handleNavigation,
  resetSubmissionState,
  clearResults,

  // Question navigation and answers
  saveAnswer,
  setCurrentQuestionIndex,
  startQuestionTimer,
  resetQuestionTimers,

  // Auth and completion
  markRequiresAuth,
  clearRequiresAuth,
  setQuizCompleted,
  setQuizResults,
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
