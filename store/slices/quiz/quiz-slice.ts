import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit'
// Use a local RootState alias for focused type-checking of the quiz slice
import type { RootState } from '@/store'
import { API_ENDPOINTS } from './quiz-helpers'
import { QuizQuestion, QuizResults, QuizState, QuestionResult, QuizType } from './quiz-types'

import { storage } from '@/lib/storage'
import type { QuizProgress } from '@/types/quiz'

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
    const entriesArr = Array.from(quizCache.entries())
    const oldestKey = entriesArr.sort((a, b) => a[1].timestamp - b[1].timestamp)[0]?.[0]
    if (oldestKey) quizCache.delete(oldestKey)
  }
}





/**
 * fetchQuiz with error handling and cancellation
 */
export const fetchQuiz = createAsyncThunk<
  any,
  {
    slug?: string
    quizType?: QuizType
    data?: any
  },
  {
    state: RootState
    rejectValue: any
  }
>(
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
    
    // Determine API endpoint early
    let url: string = ''

    try {
      // Check if request was already cancelled
      if (signal?.aborted) {
        return rejectWithValue({ error: 'Request was cancelled', code: 'CANCELLED' })
      }

      // Create new abort controller
      const abortController = new AbortController()

      // Combine signals
      const combinedSignal = abortController.signal
      if (signal) {
        signal.addEventListener('abort', () => {
          abortController.abort('Parent signal aborted')
        })
      }

      // Check for cached data first (unless inline data is provided)
      if (!payload.data) {
        const cached = getCachedQuiz(type, slug)
        if (cached) {
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
        return rejectWithValue({
          error: "Missing required parameters: slug and quizType are required",
          code: 'MISSING_PARAMS'
        })
      }

      // Determine API endpoint
      if (API_ENDPOINTS.byTypeAndSlug) {
        url = API_ENDPOINTS.byTypeAndSlug(type, slug)
      } else {
        const endpoint = API_ENDPOINTS[type as keyof typeof API_ENDPOINTS]
        if (!endpoint) {
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
      const timeoutId = setTimeout(() => {
        if (!controller.signal.aborted) {
          controller.abort('Request timeout')
        }
      }, 30000) // 30 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorData: any = {}
        const errorText = await response.text()
        
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }

        // Handle specific HTTP status codes
        if (response.status === 404) {
          return rejectWithValue({
            error: errorData.error || 'Quiz not found',
            code: 'NOT_FOUND',
            status: response.status
          })
        }

        if (response.status === 403 || errorData.code === 'PRIVATE_QUIZ') {
          return rejectWithValue({
            error: errorData.error || errorData.message || 'Access denied to this quiz',
            code: 'PRIVATE_QUIZ',
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
          error: errorData.error || errorText || `HTTP ${response.status}: ${response.statusText}`,
          code: 'HTTP_ERROR',
          status: response.status
        })
      }

      const data = await response.json()

      // Debug: Log the API response
      console.log('Quiz API Response received:', {
        url,
        status: response.status,
        ok: response.ok,
        dataKeys: data ? Object.keys(data) : 'No data',
        hasQuestions: data?.questions ? Array.isArray(data.questions) : false,
        questionsLength: data?.questions?.length || 0
      })

      // Validate response data
      if (!data || typeof data !== 'object') {
        return rejectWithValue({
          error: 'Invalid response format',
          code: 'INVALID_RESPONSE'
        })
      }

      if (!Array.isArray(data.questions)) {
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

      return processedData

    } catch (error: any) {
      // Handle different types of errors
      console.error('Quiz fetch error details:', {
        error,
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        code: error?.code,
        status: error?.status,
        requestUrl: url,
        type,
        slug,
        typeOfError: typeof error,
        errorKeys: error ? Object.keys(error) : [],
        isEmptyObject: error && typeof error === 'object' && Object.keys(error).length === 0
      })

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
      const tempResults: QuestionResult[] = []
      const totalTimeSpent = Object.values(answers).reduce((total, answer) => {
        return total + (answer?.timeSpent || 0)
      }, 0)

      // Prepare answers for API submission
      const answersForAPI: any[] = []

      for (const question of questions) {
        // answers keys are stored as strings (see saveAnswer) so normalize id to string
  const answer = answers[String(question.id)]
  let isCorrect = false
        let correctAnswer = ''
        let userAnswer: string | null = null
  // Consider answer skipped if no answer object or none of the known answer fields are present
  const aCheck: any = answer ?? {}
  const skipped = !answer || (!aCheck.selectedOptionId && !aCheck.userAnswer && !aCheck.code)

  // Derive question-level metadata (use any casts to handle union shapes)
  const qAny: any = question as any
  const qCorrect = String((qAny.correctAnswer ?? qAny.answer ?? '') || '').trim()
  const qOptions = qAny.options || []

  switch (quizType) {
            case 'mcq':
            case 'code': {
              // For MCQ we usually have a selectedOptionId; for Code we usually have userAnswer/code text.
              // Accept either selectedOptionId or a userAnswer (or code) string.
              correctAnswer = String(question.answer ?? '').trim()
              const aAny: any = answer ?? {}
              const selectedOrText = String(
                (aAny && (aAny.selectedOptionId ?? aAny.userAnswer ?? aAny.code)) ?? ''
              ).trim()
              // Try to map selected value to a human-friendly label when options are provided
              let selectedOptionLabel: string | null = null
              let selectedOptionIndex: number | null = null
              if (Array.isArray(qOptions) && qOptions.length) {
                // qOptions may be array of strings or objects
                for (let i = 0; i < qOptions.length; i++) {
                  const opt = qOptions[i]
                  if (typeof opt === 'string') {
                    if (opt === selectedOrText) {
                      selectedOptionLabel = opt
                      selectedOptionIndex = i
                      break
                    }
                  } else if (opt && typeof opt === 'object') {
                    const optId = String((opt as any).id ?? (opt as any).value ?? (opt as any).key ?? '')
                    const optLabel = String((opt as any).label ?? (opt as any).text ?? (opt as any).title ?? (opt as any).value ?? (opt as any).id ?? '')
                    if (optId && optId === selectedOrText) {
                      selectedOptionLabel = optLabel
                      selectedOptionIndex = i
                      break
                    }
                    if (optLabel && optLabel === selectedOrText) {
                      selectedOptionLabel = optLabel
                      selectedOptionIndex = i
                      break
                    }
                  }
                }
              }

              userAnswer = selectedOrText || null
              // Coerce to boolean to avoid mixed-type issues
              isCorrect = Boolean((aAny && aAny.isCorrect === true) || (selectedOrText && selectedOrText === qCorrect))

              // Prefer explicit userAnswer/code if present for API payload
              const apiAnswer = (typeof aAny.userAnswer === 'string' && aAny.userAnswer.trim() !== '')
                ? aAny.userAnswer
                : ((typeof aAny.code === 'string' && aAny.code.trim() !== '') ? aAny.code : selectedOrText)

              // Format for API
              answersForAPI.push({
                questionId: String(question.id),
                answer: apiAnswer,
                timeSpent: aAny.timeSpent || 0,
                isCorrect: isCorrect,
                // include label/index for clarity
                selectedOptionLabel: selectedOptionLabel,
                selectedOptionIndex: selectedOptionIndex,
              })

              // Include label info in temp results below
              break
            }

            case 'blanks': {
            correctAnswer = String(question.answer ?? '').trim().toLowerCase()
            const aAny: any = answer ?? {}
            const filled = String(aAny.userAnswer ?? '').trim().toLowerCase()
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
            const aAny: any = answer ?? {}
            userAnswer = aAny.userAnswer ?? null
            isCorrect = aAny.isCorrect === true

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
            const aAny: any = answer ?? {}
            isCorrect = aAny.isCorrect === true
            userAnswer = aAny.userAnswer || null

            answersForAPI.push({
              questionId: String(question.id),
              answer: userAnswer || '',
              timeSpent: aAny.timeSpent || 0,
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

        // Build a temp result object and cast to QuestionResult to satisfy typing
        const tempResultAny: any = {
          questionId: String(question.id),
          userAnswer,
          // ensure correct answer is filled from question
          correctAnswer: qCorrect,
          isCorrect,
          skipped,
          // If the answer included a selectedOptionLabel, include it for clarity
          selectedOptionLabel: answersForAPI[answersForAPI.length - 1]?.selectedOptionLabel ?? null,
          selectedOptionIndex: answersForAPI[answersForAPI.length - 1]?.selectedOptionIndex ?? null,
        }

        tempResults.push(tempResultAny as QuestionResult)
      }

      const total = questions.length

      // Create the results object
      const quizResults: QuizResults = {
        slug: slug!,
        quizType: quizType!,
        score,
        maxScore: total,
        percentage: (total > 0 ? Math.round((score / total) * 100) : 0),
        submittedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        answers: Object.values(answers),
        results: tempResults,
        totalTime: totalTimeSpent,
        accuracy: 0,
      }

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

      // CRITICAL: Validate payload before sending to prevent JSON errors
      const submissionPayload = {
        quizId: slug,
        answers: answersForAPI,
        totalTime: totalTimeSpent,
        score: score,
        type: quizType,
        totalQuestions: total,
        correctAnswers: score,
        completedAt: new Date().toISOString(),
      }

      // Validate payload structure
      if (!submissionPayload.quizId || !submissionPayload.type) {
        throw new Error('Invalid submission: missing quizId or type')
      }

      if (!Array.isArray(submissionPayload.answers) || submissionPayload.answers.length === 0) {
        console.warn('No answers to submit, creating dummy answers')
        submissionPayload.answers = questions.map(q => ({
          questionId: String(q.id),
          answer: '',
          timeSpent: 0,
          isCorrect: false,
        }))
      }

      // Sanitize payload to remove any circular references or invalid JSON
      const sanitizedPayload = JSON.parse(JSON.stringify(submissionPayload))

      if (process.env.NODE_ENV !== 'production') {
        console.log('Submitting quiz payload:', {
          quizId: sanitizedPayload.quizId,
          type: sanitizedPayload.type,
          answersCount: sanitizedPayload.answers.length,
          score: sanitizedPayload.score,
        })
      }

      const response = await fetch(`/api/quizzes/${quizType}/${slug}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedPayload),
      })

      if (!response.ok) {
        // Check for authentication errors first, before parsing body
        if (response.status === 401 || response.status === 403) {
          // User not authenticated, save results temporarily and return results for local display
          storage.setItem(`quiz_temp_${slug}_${quizType}`, { quizResults, answers })
          
          // Return the calculated results instead of redirecting immediately
          // This allows the component to show results locally with signin prompt
          return {
            ...quizResults,
            requiresAuth: true,
            tempResults: true,
            __lastUpdated: Date.now(),
          }
        }

        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (parseError) {
          console.warn('Failed to parse error response:', parseError)
        }
        console.error('Quiz submission failed:', response.status, response.statusText, errorData)
        
        throw new Error(Object.keys(errorData).length > 0 ? errorData?.error || 'Failed to submit quiz' : `HTTP ${response.status}: ${response.statusText}`)
      }

      let responseData
      try {
        const responseText = await response.text()
        if (!responseText.trim()) {
          console.warn('Empty response from quiz submission, using local results')
          responseData = {}
        } else {
          responseData = JSON.parse(responseText)
        }
      } catch (parseError) {
        console.warn('Failed to parse quiz submission response:', parseError)
        responseData = {}
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Quiz submitted successfully:', responseData)
      }

      // COMMIT: Trigger cache invalidation for immediate dashboard updates
      // Import invalidateDashboardCache dynamically to avoid SSR issues
      if (typeof window !== 'undefined') {
        import('@/utils/cache-invalidation').then(({ invalidateDashboardCacheDelayed }) => {
          // Use delayed invalidation (500ms) to ensure database writes are complete
          invalidateDashboardCacheDelayed(500, 'QUIZ_COMPLETED')
          console.log('[QuizSlice] Triggered cache invalidation after quiz completion')
        }).catch(err => {
          console.warn('[QuizSlice] Failed to trigger cache invalidation:', err)
        })
      }

      // Return results with additional data from API response
      return {
        ...quizResults,
        percentage: responseData.result?.percentageScore || quizResults.percentage,
        accuracy: responseData.result?.accuracy,
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
export const loadQuizResults = createAsyncThunk(
  'quiz/loadResults',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const quiz = state.quiz as unknown as QuizState
    
    // If no results available
    if (!quiz.results) {
      return rejectWithValue('No results available')
    }

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
          let quizData
          try {
            const responseText = await quizResponse.text()
            if (!responseText.trim()) {
              return rejectWithValue({ error: 'Empty response from server' })
            }
            quizData = JSON.parse(responseText)
          } catch (parseError) {
            console.error('Failed to parse quiz data response:', parseError)
            return rejectWithValue({ error: 'Invalid response format from server' })
          }

          // Check if quiz has been completed (has timeEnded)
          if (quizData.timeEnded && quizData.bestScore !== null) {
            // Try to fetch detailed attempt data
            let detailedResults: any[] = []
            try {
              const attemptsResponse = await fetch('/api/user/quiz-attempts?limit=1')
              if (attemptsResponse.ok) {
                const attemptsData = await attemptsResponse.json()
                const latestAttempt = attemptsData.attempts?.find((a: any) => 
                  a.userQuiz.slug === quiz.slug && a.userQuiz.quizType === quiz.quizType
                )
                
                if (latestAttempt?.attemptQuestions) {
                  detailedResults = latestAttempt.attemptQuestions.map((aq: any) => ({
                    questionId: aq.questionId.toString(),
                    question: aq.question.question,
                    userAnswer: aq.userAnswer,
                    correctAnswer: aq.question.answer,
                    isCorrect: aq.isCorrect,
                    explanation: aq.question.explanation || '',
                    type: aq.question.questionType || 'mcq',
                    options: aq.question.options ? JSON.parse(aq.question.options) : [],
                    difficulty: '',
                    category: ''
                  }))
                }
              }
            } catch (attemptsError) {
              console.warn('Failed to fetch detailed attempt data:', attemptsError)
              // Continue without detailed results
            }

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
              results: detailedResults, // Include detailed question results
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
const hydrateQuiz = createAsyncThunk(
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

/**
 * Save quiz results to database (for authenticated users after showing results)
 */
const saveQuizResultsToDB = createAsyncThunk(
  'quiz/saveToDB',
  async (results: QuizResults, { rejectWithValue }) => {
    try {
      const { slug, quizType, answers, totalTime, score, maxScore } = results

      // Prepare answers for API submission
      const answersForAPI: any[] = answers.map((answer: any) => ({
        questionId: answer.questionId,
        answer: (answer && (answer.selectedOptionId || answer.userAnswer)) || '',
        timeSpent: (answer && answer.timeSpent) || 0,
        isCorrect: Boolean(answer && answer.isCorrect)
      }))

      const response = await fetch(`/api/quizzes/${quizType}/${slug}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: slug,
          answers: answersForAPI,
          totalTime: totalTime || 0,
          score: score,
          type: quizType,
          totalQuestions: maxScore,
          correctAnswers: score,
          completedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (parseError) {
          console.warn('Failed to parse error response:', parseError)
        }
        console.error('Failed to save quiz results to DB:', errorData)
        throw new Error(errorData?.error || 'Failed to save results')
      }

      const responseData = await response.json()
      return {
        ...results,
        percentage: responseData.result?.percentageScore || results.percentage,
        accuracy: responseData.result?.accuracy,
        __lastUpdated: Date.now(),
      }
    } catch (error: any) {
      console.error('Save to DB error:', error)
      return rejectWithValue({
        error: error.message || 'Failed to save results to database',
      })
    }
  }
)

/**
 * Load temporary quiz results and save to DB after authentication
 */
export const loadTempResultsAndSave = createAsyncThunk(
  'quiz/loadTempAndSave',
  async ({ slug, quizType }: { slug: string; quizType: string }, { rejectWithValue }) => {
    try {
      const tempData = storage.getItem(`quiz_temp_${slug}_${quizType}`)
      if (!tempData) {
        return rejectWithValue({ error: 'No temporary results found' })
      }

      // Set results in state
      const results = tempData.results

      // Clear temp data
      storage.removeItem(`quiz_temp_${slug}_${quizType}`)

      // Save to DB
      const { answers, totalTime, score, maxScore } = results

      const answersForAPI: any[] = answers.map((answer: any) => ({
        questionId: answer.questionId,
        answer: (answer && (answer.selectedOptionId || answer.userAnswer)) || '',
        timeSpent: (answer && answer.timeSpent) || 0,
        isCorrect: Boolean(answer && answer.isCorrect)
      }))

      const response = await fetch(`/api/quizzes/${quizType}/${slug}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: slug,
          answers: answersForAPI,
          totalTime: totalTime || 0,
          score: score,
          type: quizType,
          totalQuestions: maxScore,
          correctAnswers: score,
          completedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (parseError) {
          console.warn('Failed to parse error response:', parseError)
        }
        
        // If authentication failed, don't treat it as an error - just return the results
        if (response.status === 401 || response.status === 403) {
          console.log('User not authenticated for saving temp results, returning local results')
          return {
            ...results,
            requiresAuth: true,
            tempResults: true,
            __lastUpdated: Date.now(),
          }
        }
        
        console.error('Failed to save temp results to DB:', errorData)
        throw new Error(errorData?.error || 'Failed to save results')
      }

      let responseData
      try {
        const responseText = await response.text()
        if (!responseText.trim()) {
          console.warn('Empty response from temp results save, using local results')
          responseData = {}
        } else {
          responseData = JSON.parse(responseText)
        }
      } catch (parseError) {
        console.warn('Failed to parse temp results save response:', parseError)
        responseData = {}
      }
      
      return {
        ...results,
        percentage: responseData.result?.percentageScore || results.percentage,
        accuracy: responseData.result?.accuracy,
        __lastUpdated: Date.now(),
      }
    } catch (error: any) {
      console.error('Load temp and save error:', error)
      return rejectWithValue({
        error: error.message || 'Failed to load and save results',
      })
    }
  }
)

// Quiz Slice
const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setQuiz(state: QuizState, action: PayloadAction<{ slug: string; quizType: QuizType; title: string; questions: QuizQuestion[]; userId?: string }>) {
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

    saveAnswer(state: QuizState, action: PayloadAction<{
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

      // Derive a human-friendly option label when possible
      let selectedOptionLabel: string | null = null
      try {
        const optsAny: any = (question as any).options || []
        if (Array.isArray(optsAny) && selectedOptionId) {
          for (const opt of optsAny) {
            if (typeof opt === 'string') {
              if (String(opt) === String(selectedOptionId) || String(opt) === String(computedUserAnswer)) {
                selectedOptionLabel = String(opt)
                break
              }
            } else if (opt && typeof opt === 'object') {
              const optId = String((opt as any).id ?? (opt as any).value ?? (opt as any).key ?? '')
              const optLabel = String((opt as any).label ?? (opt as any).text ?? (opt as any).title ?? (opt as any).value ?? (opt as any).id ?? '')
              if (optId && String(optId) === String(selectedOptionId)) {
                selectedOptionLabel = optLabel || optId
                break
              }
              if (optLabel && String(optLabel) === String(selectedOptionId)) {
                selectedOptionLabel = optLabel
                break
              }
            }
          }
        }
      } catch (err) {
        // ignore mapping errors and leave label null
      }

      const normalizedCorrectAnswer = String((question as any).correctAnswer ?? (question as any).answer ?? '')

      state.answers[action.payload.questionId] = {
        questionId: action.payload.questionId,
        selectedOptionId: selectedOptionId,
        userAnswer: computedUserAnswer,
        isCorrect,
        type: question.type,
        timestamp: currentTime,
        timeSpent: timeSpent, // Already in seconds
        selectedOptionLabel: selectedOptionLabel,
        correctAnswer: normalizedCorrectAnswer,
      }
    },

    setCurrentQuestionIndex(state: QuizState, action: PayloadAction<number>) {
      const index = action.payload
      if (index >= 0 && index < state.questions.length) {
        state.currentQuestionIndex = index
        // Persist progress moved to a listener middleware to avoid side-effects inside reducers
      }
    },

    // Handle navigation between quiz pages
    handleNavigation(state: QuizState, action: PayloadAction<{ keepData?: boolean }>) {
      const keepData = action.payload?.keepData ?? false
      
      // Cancel all pending requests during navigation
      //RequestManager.cancelAll()
      
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

    resetQuiz(state: QuizState, action: PayloadAction<{ keepResults?: boolean } | undefined>) {
      const keep = action.payload?.keepResults ?? false
      
      // Reset quiz state
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
    markRequiresAuth(state: QuizState, action: PayloadAction<{ redirectUrl: string }>) {
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

    setQuizCompleted(state: QuizState, action: PayloadAction<boolean>) {
      state.isCompleted = action.payload
    },

    setQuizResults(state: QuizState, action: PayloadAction<QuizResults>) {
      state.results = action.payload
      state.isCompleted = true
  state.lastUpdated = Date.now()
    },

    /**
     * Track when a question is first viewed to calculate time spent
     */
    startQuestionTimer(state: QuizState, action: PayloadAction<{ questionId: string }>) {
      const questionId = action.payload.questionId
      if (!state.questionStartTimes[questionId]) {
        state.questionStartTimes[questionId] = Date.now()
      }
    },

    /**
     * Reset question timers (useful when retaking quiz)
     */
    resetQuestionTimers(state: QuizState) {
      state.questionStartTimes = {}
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuiz.pending, (state: QuizState) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchQuiz.fulfilled, (state: QuizState, action) => {
        console.log('fetchQuiz.fulfilled - updating state with:', {
          title: action.payload.title,
          questionsCount: action.payload.questions?.length || 0,
          slug: action.payload.slug,
          quizType: action.payload.quizType
        })

        state.slug = action.payload.slug
        state.quizType = action.payload.quizType
        state.title = action.payload.title
        state.questions = action.payload.questions
        state.status = 'succeeded'
        state.error = null
        state.isInitialized = true
        state.lastUpdated = Date.now()
      })
      .addCase(fetchQuiz.rejected, (state: QuizState, action) => {
        const payload = action.payload as any
        const errorCode = payload?.code || ''
        const errorMessage = payload?.error || action.error.message || 'Failed to load quiz'
        
        // Enhanced error logging with structured information
        console.error('fetchQuiz.rejected - error details:', {
          code: errorCode,
          message: errorMessage,
          status: payload?.status,
          payload
        });

        // Check for specific error types
        if (errorCode === 'PRIVATE_QUIZ' || payload?.status === 403 || errorMessage.toLowerCase().includes('private')) {
          state.status = 'not-found'
          state.error = 'This quiz is private and not accessible.'
        } else if (payload?.status === 404 || errorMessage.toLowerCase().includes('not found')) {
          state.status = 'not-found'
          state.error = 'Quiz not found.'
        } else {
          state.status = 'failed'
          state.error = errorMessage
        }
        
        state.isInitialized = true
      })
      .addCase(submitQuiz.pending, (state) => {
        state.status = 'submitting'
        state.error = null
      })
      .addCase(submitQuiz.fulfilled, (state: QuizState, action) => {
        const incomingTs = (action.payload as any)?.__lastUpdated || Date.now()
        if (!state.lastUpdated || incomingTs >= state.lastUpdated) {
          state.status = 'succeeded'
          state.results = action.payload
          state.isCompleted = true
          state.lastUpdated = incomingTs
          
          // Check if authentication is required for saving
          if ((action.payload as any)?.requiresAuth) {
            state.requiresAuth = true
            state.status = 'requires-auth'
          }
        }
      })
      .addCase(submitQuiz.rejected, (state: QuizState, action) => {
        const payload = action.payload as any
        if (payload?.requiresAuth) {
          state.requiresAuth = true
          state.redirectAfterLogin = payload.redirectUrl
          state.results = payload.tempResults
          state.isCompleted = true
          state.status = 'requires-auth'
        } else {
          state.status = 'failed'
          state.error = action.error.message || 'Quiz submission failed'
        }
      })
      .addCase(saveQuizResultsToDB.pending, (state) => {
        // Optional: could set a saving status
      })
      .addCase(saveQuizResultsToDB.fulfilled, (state: QuizState, action) => {
        // Update results with server response if needed
        if (action.payload) {
          state.results = action.payload
        }
      })
      .addCase(saveQuizResultsToDB.rejected, (state: QuizState, action) => {
        state.status = 'failed'
        state.error = action.error.message || 'Failed to save results'
      })
      .addCase(loadTempResultsAndSave.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loadTempResultsAndSave.fulfilled, (state: QuizState, action) => {
        state.status = 'succeeded'
        state.results = action.payload
        state.isCompleted = true
        state.error = null
        state.requiresAuth = false
        state.redirectAfterLogin = null
        state.lastUpdated = Date.now()
      })
      .addCase(loadTempResultsAndSave.rejected, (state: QuizState, action) => {
        const payload = action.payload as any
        state.status = 'failed'
        state.error = payload?.error || action.error.message || 'Failed to load results'
      })
  }
})

export const {
  
  saveAnswer,
  setCurrentQuestionIndex,
  
  resetQuiz,
  
  
  
  resetSubmissionState,
  
  setQuizResults,
  startQuestionTimer,
  
} = quizSlice.actions

const selectQuizState = (state: RootState) => state.quiz

const selectCurrentQuestion = createSelector(
  (state: RootState) => state.quiz,
  (quiz: QuizState) => {
    if (!quiz.slug || !quiz.questions.length) return null
    return quiz.questions[quiz.currentQuestionIndex] || null
  }
)

const selectQuizProgress = createSelector(
  (state: RootState) => state.quiz,
  (quiz: QuizState) => {
    const totalQuestions = quiz.questions.length
    const answeredQuestions = Object.keys(quiz.answers).length
    const completed = quiz.isCompleted || (answeredQuestions === totalQuestions)
    const currentQuestion = quiz.questions[quiz.currentQuestionIndex]

    return {
      totalQuestions,
      answeredQuestions,
      currentQuestionIndex: quiz.currentQuestionIndex,
      currentQuestion: currentQuestion ? {
        id: currentQuestion.id,
        type: currentQuestion.type,
        question: currentQuestion.question,
        options: currentQuestion.options,
        // Include only necessary fields for progress tracking
      } : null,
      completed,
      isInitialized: quiz.isInitialized,
      lastUpdated: quiz.lastUpdated,
    }
  }
)

export const selectQuizResults = createSelector(
  (state: RootState) => state.quiz,
  (quiz: QuizState) => quiz.results
)

const selectIsQuizCompleted = createSelector(
  (state: RootState) => state.quiz,
  (quiz: QuizState) => quiz.isCompleted
)

const selectQuizError = createSelector(
  (state: RootState) => state.quiz,
  (quiz: QuizState) => quiz.error
)

export const selectQuizStatus = createSelector(
  (state: RootState) => state.quiz,
  (quiz: QuizState) => quiz.status
)

export const selectRequiresAuth = createSelector(
  (state: RootState) => state.quiz,
  (quiz: QuizState) => quiz.requiresAuth
)

export const selectRedirectAfterLogin = createSelector(
  (state: RootState) => state.quiz,
  (quiz: QuizState) => quiz.redirectAfterLogin
)

export const selectQuizQuestions = createSelector(
  (state: RootState) => state.quiz,
  (quiz: QuizState) => quiz.questions
)

export const selectQuizAnswers = createSelector(
  (state: RootState) => state.quiz,
  (quiz: QuizState) => quiz.answers
)

export const selectCurrentQuestionIndex = createSelector(
  (state: RootState) => state.quiz,
  (quiz: QuizState) => quiz.currentQuestionIndex
)

export const selectQuizTitle = createSelector(
  (state: RootState) => state.quiz,
  (quiz: QuizState) => quiz.title
)

export const selectIsQuizComplete = createSelector(
  (state: RootState) => state.quiz,
  (quiz: QuizState) => quiz.isCompleted
)

export const selectQuizUserId = createSelector(
  (state: RootState) => state.quiz,
  (quiz: QuizState) => quiz.userId
)

// Added missing selector for quizType (fixes build error in OpenEndedQuizWrapper)
export const selectQuizType = createSelector(
  (state: RootState) => state.quiz,
  (quiz: QuizState) => quiz.quizType
)

export default quizSlice.reducer
