import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { createAction } from "@reduxjs/toolkit"
import type { QuizData, UserAnswer, QuizResult, QuizHistoryItem, QuizType } from "@/app/types/quiz-types"

// Constants - move to separate file in larger applications
export const API_ENDPOINTS: Record<QuizType, string> = {
  mcq: "/api/quizzes/mcq",
  code: "/api/quizzes/code",
  blanks: "/api/quizzes/blanks",
  openended: "/api/quizzes/openended",
}

// Helpers - move to utils in larger applications
const normalizeQuizData = (raw: any, slug: string, type: QuizType): QuizData => {
  // Generate a consistent unique ID for the quiz that combines type and slug
  const quizUniqueId = raw.quizId || raw.id || `${type}-${slug}-${Date.now()}`

  return {
    id: quizUniqueId,
    title: raw.quizData?.title || "Quiz",
    slug,
    type,
    questions: Array.isArray(raw.quizData?.questions)
      ? raw.quizData.questions.map((q: any, index: number) => {
          // Generate truly unique IDs for questions by combining quiz ID, type, slug, and index
          const questionId =
            q.id || q.questionId || `${quizUniqueId}-q-${index}-${Math.random().toString(36).substring(2, 8)}`

          return {
            id: questionId,
            question: q.question || "",
            codeSnippet: q.codeSnippet || "",
            options: Array.isArray(q.options) ? [...q.options] : [],
            answer: q.answer || q.correctAnswer || "",
            correctAnswer: q.correctAnswer || q.answer || "",
            language: q.language || "javascript",
            type, // Add the type property to ensure compatibility
          }
        })
      : [],
    isPublic: !!raw.isPublic,
    isFavorite: !!raw.isFavorite,
    ownerId: raw.ownerId || "",
    timeLimit: raw.quizData?.timeLimit || null,
  }
}

// -----------------------------------------
// State Interface
// -----------------------------------------
export interface QuizState {
  // Quiz data
  quizData: QuizData | null
  currentQuestion: number
  userAnswers: UserAnswer[]

  // Quiz status
  isLoading: boolean
  isSubmitting: boolean
  isCompleted: boolean
  timerActive: boolean
  submissionStateInProgress: boolean

  // Quiz results & history
  results: QuizResult | null
  tempResults: QuizResult | null // Add tempResults to state interface
  quizHistory: QuizHistoryItem[]
  currentQuizId: string | null
  timeRemaining: number | null

  // Keep individual error fields for backward compatibility with tests
  error: string | null
  quizError: string | null
  submissionError: string | null
  resultsError: string | null
  historyError: string | null

  // Error state - consolidated for better management
  errors: {
    quiz: string | null
    submission: string | null
    results: string | null
    history: string | null
  }

  // Track the current quiz type and slug for state isolation
  currentQuizType: QuizType | null
  currentQuizSlug: string | null
}

const initialState: QuizState = {
  // Quiz data
  quizData: null,
  currentQuestion: 0,
  userAnswers: [],

  // Quiz status
  isLoading: false,
  isSubmitting: false,
  isCompleted: false,
  timerActive: false,
  submissionStateInProgress: false,

  // Quiz results & history
  results: null,
  tempResults: null, // Add to initial state
  quizHistory: [],
  currentQuizId: null,
  timeRemaining: null,

  // Keep individual error fields for backward compatibility with tests
  error: null,
  quizError: null,
  submissionError: null,
  resultsError: null,
  historyError: null,

  // Error state
  errors: {
    quiz: null,
    submission: null,
    results: null,
    history: null,
  },

  // Track the current quiz type and slug
  currentQuizType: null,
  currentQuizSlug: null,
}

// -----------------------------------------
// Async Thunks - better organized
// -----------------------------------------
export const fetchQuiz = createAsyncThunk(
  "quiz/fetchQuiz",
  async ({ slug, type }: { slug: string; type: QuizType }, { rejectWithValue, getState }) => {
    try {
      // Clean the slug if it contains "Question" at the end
      const cleanSlug = slug.includes("Question") ? slug.split("Question")[0] : slug

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ""
      const endpoint = API_ENDPOINTS[type]
      const url = new URL(`${endpoint}/${cleanSlug}`, baseUrl).toString()

      // Check if we're already loading this exact quiz
      const state = getState() as { quiz: QuizState }
      if (state.quiz.currentQuizType === type && state.quiz.currentQuizSlug === cleanSlug && state.quiz.quizData) {
        console.log(`Already loaded quiz: ${type}/${cleanSlug}, reusing data`)
        return state.quiz.quizData
      }

      const response = await fetch(url)
      if (!response.ok) {
        const err = await response.json()
        return rejectWithValue(err.message || `Failed to fetch ${type} quiz`)
      }

      const data = await response.json()
      return normalizeQuizData(data, cleanSlug, type)
    } catch (error) {
      return rejectWithValue("Failed to load quiz. Please try again.")
    }
  },
)

export const submitQuiz = createAsyncThunk(
  "quiz/submitQuiz",
  async (
    payload: {
      slug: string
      quizId?: string | number
      type: QuizType
      answers: UserAnswer[]
      timeTaken?: number
      score?: number
      totalQuestions?: number
    },
    { dispatch, rejectWithValue },
  ) => {
    try {
      // Clean the slug if it contains "Question" at the end
      const cleanSlug = payload.slug.includes("Question") ? payload.slug.split("Question")[0] : payload.slug

      // For MCQ quizzes, we should use the common API endpoint since the MCQ-specific one doesn't exist
      const endpoint = `/api/quizzes/common/${cleanSlug}/complete`

      console.log(`Submitting quiz to endpoint: ${endpoint}`)

      // Ensure all required fields are present
      const correctAnswers = payload.answers.filter((a) => a.isCorrect === true).length
      const totalQuestions = payload.totalQuestions || payload.answers.length

      // Ensure quizId is numeric when submitting
      let numericQuizId: number | undefined
      if (payload.quizId) {
        if (typeof payload.quizId === "number") {
          numericQuizId = payload.quizId
        } else if (typeof payload.quizId === "string" && /^\d+$/.test(payload.quizId)) {
          numericQuizId = Number.parseInt(payload.quizId, 10)
        } else {
          console.warn("Invalid quizId format, might cause backend issues:", payload.quizId)
        }
      }

      // Log the processed quizId for debugging
      console.log("Processed quizId for submission:", numericQuizId)

      const submissionData = {
        quizId: numericQuizId || payload.quizId,
        answers: payload.answers.map((a) => ({
          questionId: a.questionId,
          answer: a.answer,
          isCorrect: typeof a.isCorrect === "boolean" ? a.isCorrect : undefined,
          timeSpent: Math.floor((payload.timeTaken || 600) / Math.max(payload.answers.length, 1)),
        })),
        type: payload.type,
        score: payload.score !== undefined ? payload.score : correctAnswers,
        totalTime: payload.timeTaken || 600,
        totalQuestions,
        correctAnswers,
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        credentials: "include",
        body: JSON.stringify(submissionData),
      })

      // Handle 401 auth errors
      if (response.status === 401) {
        // Dispatch the authentication required action
        dispatch(
          authenticationRequired({
            fromSubmission: true,
            callbackUrl: `/dashboard/${payload.type}/${cleanSlug}`,
          }),
        )

        // Throw error with status for test detection
        const error = new Error("Authentication required")
        Object.defineProperty(error, "status", {
          value: 401,
          writable: true,
          configurable: true,
        })
        throw error
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        return rejectWithValue(errorData || response.statusText)
      }

      return await response.json()
    } catch (error: any) {
      // Add check for auth errors in catch block
      if (error.status === 401 || error.message === "Unauthorized") {
        dispatch(
          authenticationRequired({
            fromSubmission: true,
            callbackUrl: `/dashboard/${payload.type}/${payload.slug}`,
          }),
        )
      }

      return rejectWithValue(error.message || "An unexpected error occurred")
    }
  },
)

export const getQuizResults = createAsyncThunk(
  "quiz/getResults",
  async (slug: string, { rejectWithValue, getState }) => {
    try {
      // Clean the slug from any query parameters and "Question" suffix
      const hasParams = slug.includes("?")
      const queryParams = hasParams ? slug.split("?")[1] : ""
      let cleanSlug = hasParams ? slug.split("?")[0] : slug

      // Remove "Question" suffix if present
      if (cleanSlug.includes("Question")) {
        cleanSlug = cleanSlug.split("Question")[0]
      }

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ""

      // Use appropriate URL format with or without query params
      const url = hasParams
        ? `${baseUrl}/api/quizzes/results?slug=${cleanSlug}&${queryParams}`
        : `${baseUrl}/api/quizzes/results?slug=${cleanSlug}`

      console.log("Fetching quiz results from:", url)
      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to retrieve results" }))
        return rejectWithValue(errorData.message || "Could not retrieve results")
      }

      const data = await response.json()
      console.log("Raw quiz results data:", data)

      // Check if the response has a nested 'result' array (API format)
      if (Array.isArray(data?.result) && data.result.length > 0) {
        const firstResult = data.result[0]

        // Transform the API format to our standard format
        return {
          ...data,
          quizId: String(firstResult.quizId),
          slug: cleanSlug,
          title: firstResult.quizTitle || data.title || "Quiz",
          score: firstResult.score || 0,
          maxScore: firstResult.questions?.length || 0,
          percentage: firstResult.accuracy || 0,
          completedAt: firstResult.attemptedAt || data.completedAt || new Date().toISOString(),
          questions:
            firstResult.questions?.map((q) => ({
              id: String(q.questionId),
              question: q.question || "Question",
              userAnswer: q.userAnswer || "",
              correctAnswer: q.correctAnswer || "",
              isCorrect: !!q.isCorrect,
            })) || [],
        }
      }

      // Original processing logic for standard format
      // Validate that we received proper results data
      if (!data || typeof data !== "object") {
        return rejectWithValue("Invalid results data received")
      }

      // Ensure we have the necessary fields for the quiz results
      const processedData = {
        ...data,
        title: data.title || "Quiz",
        slug: data.slug || cleanSlug,
        score: typeof data.score === "number" ? data.score : 0,
        maxScore: typeof data.maxScore === "number" ? data.maxScore : 0,
        completedAt: data.completedAt || new Date().toISOString(),
        questions: Array.isArray(data.questions)
          ? data.questions.map((q) => ({
              ...q,
              question: q.question || "Question",
              userAnswer: q.userAnswer || "",
              correctAnswer: q.correctAnswer || "",
              isCorrect: !!q.isCorrect,
            }))
          : [],
      }

      return processedData
    } catch (error) {
      console.error("Error fetching quiz results:", error)
      return rejectWithValue("Unexpected error fetching results.")
    }
  },
)

export const fetchQuizHistory = createAsyncThunk("quiz/fetchQuizHistory", async (_, { rejectWithValue }) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ""
    const response = await fetch(`${baseUrl}/api/quiz/history`)
    if (!response.ok) {
      const err = await response.json()
      return rejectWithValue(err.message || "Failed to fetch quiz history")
    }
    return await response.json()
  } catch {
    return rejectWithValue("Unexpected error fetching history.")
  }
})

// -----------------------------------------
// Persistence Thunks - now handled by middleware
// -----------------------------------------
export const saveQuizSubmissionState = createAsyncThunk(
  "quiz/saveQuizSubmissionState",
  async ({ slug, state }: { slug: string; state: string }, { rejectWithValue }) => {
    try {
      // Clean the slug if it contains "Question" at the end
      const cleanSlug = slug.includes("Question") ? slug.split("Question")[0] : slug

      // Return the state info for the reducer to handle
      return { slug: cleanSlug, state }
    } catch (error) {
      return rejectWithValue("Failed to save quiz state")
    }
  },
)

export const clearQuizSubmissionState = createAsyncThunk(
  "quiz/clearQuizSubmissionState",
  async (slug: string, { rejectWithValue }) => {
    try {
      // Clean the slug if it contains "Question" at the end
      const cleanSlug = slug.includes("Question") ? slug.split("Question")[0] : slug
      return cleanSlug
    } catch (error) {
      return rejectWithValue("Failed to clear quiz state")
    }
  },
)

export const getQuizSubmissionState = createAsyncThunk(
  "quiz/getQuizSubmissionState",
  async (slug: string, { rejectWithValue }) => {
    try {
      // Clean the slug if it contains "Question" at the end
      const cleanSlug = slug.includes("Question") ? slug.split("Question")[0] : slug
      return { slug: cleanSlug, state: null }
    } catch (error) {
      return rejectWithValue("Failed to get quiz state")
    }
  },
)

// Helper function to safely get correctAnswer from any question type
function getQuestionCorrectAnswer(q: any): string {
  if (q.correctAnswer) return q.correctAnswer
  if (q.answer) return q.answer
  return ""
}

// Add a new action for auth requirements
export const authenticationRequired = createAction<{
  fromSubmission?: boolean
  callbackUrl?: string
}>("quiz/authenticationRequired")

// -----------------------------------------
// Slice Definition
// -----------------------------------------
const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    resetQuizState: (state) => {
      // Preserve only the quiz history and loading state
      const preservedHistory = [...state.quizHistory]
      const isCurrentlyLoading = state.isLoading

      // Reset to initial state
      Object.assign(state, {
        ...initialState,
        quizHistory: preservedHistory,
        isLoading: isCurrentlyLoading, // Preserve loading state
      })

      // Explicitly clear these fields to ensure complete reset
      state.quizData = null
      state.currentQuestion = 0
      state.userAnswers = []
      state.results = null
      state.tempResults = null
      state.isCompleted = false
      state.timerActive = false
      state.timeRemaining = null
      state.submissionStateInProgress = false
      state.currentQuizType = null
      state.currentQuizSlug = null
    },

    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestion = action.payload
    },

    setUserAnswer: (state, action: PayloadAction<UserAnswer>) => {
      const i = state.userAnswers.findIndex((a) => a.questionId === action.payload.questionId)
      if (i !== -1) state.userAnswers[i] = action.payload
      else state.userAnswers.push(action.payload)
    },

    // Timer controls
    startTimer: (state) => {
      const limit = state.quizData?.timeLimit
      if (limit) {
        state.timeRemaining = limit * 60
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
      if (state.timeRemaining && state.timeRemaining > 0) {
        state.timeRemaining -= 1
      }
    },

    markQuizCompleted: (state, action: PayloadAction<QuizResult>) => {
      state.results = action.payload
      state.isCompleted = true
      state.timerActive = false
      state.timeRemaining = 0
    },

    // Error handling
    setError: (
      state,
      action: PayloadAction<{ type: "quiz" | "submission" | "results" | "history"; message: string }>,
    ) => {
      // Update both the consolidated and individual error fields for compatibility
      state.errors[action.payload.type] = action.payload.message

      // Set the individual error fields for backward compatibility
      switch (action.payload.type) {
        case "quiz":
          state.quizError = action.payload.message
          state.error = action.payload.message // Also update the general error
          break
        case "submission":
          state.submissionError = action.payload.message
          state.error = action.payload.message // Also update the general error
          break
        case "results":
          state.resultsError = action.payload.message
          break
        case "history":
          state.historyError = action.payload.message
          break
      }
    },

    clearErrors: (state) => {
      state.errors = {
        quiz: null,
        submission: null,
        results: null,
        history: null,
      }
      // Also clear individual error fields
      state.error = null
      state.quizError = null
      state.submissionError = null
      state.resultsError = null
      state.historyError = null
    },

    // Submission state tracking
    setSubmissionInProgress: (state, action: PayloadAction<boolean>) => {
      state.submissionStateInProgress = action.payload
    },

    // Add these new reducers for temp results management
    setTempResults: (state, action: PayloadAction<QuizResult>) => {
      // Normalize/validate the data to ensure it has the required fields
      const result = action.payload
      state.tempResults = {
        ...result,
        quizId: result.quizId || "",
        slug: result.slug || "",
        title: result.title || "Quiz",
        score: typeof result.score === "number" ? result.score : 0,
        maxScore:
          typeof result.maxScore === "number"
            ? result.maxScore
            : typeof result.totalQuestions === "number"
              ? result.totalQuestions
              : Array.isArray(result.questions)
                ? result.questions.length
                : 0,
        percentage:
          typeof result.percentage === "number"
            ? result.percentage
            : result.maxScore > 0
              ? Math.round((result.score / result.maxScore) * 100)
              : 0,
        completedAt: result.completedAt || new Date().toISOString(),
        questions: Array.isArray(result.questions)
          ? result.questions.map((q) => ({
              id: q.id || "",
              question: q.question || "",
              userAnswer: q.userAnswer || "",
              correctAnswer: q.correctAnswer || "",
              isCorrect: Boolean(q.isCorrect),
            }))
          : [],
      }

      console.log("Set temp results in store:", state.tempResults)
    },

    clearTempResults: (state) => {
      state.tempResults = null
    },
    clearQuizStateAfterSubmission: (state) => {
      // Clear quiz-specific state but preserve user session data
      state.quizData = null
      state.currentQuestion = 0
      state.userAnswers = []
      state.isCompleted = false
      state.timerActive = false
      state.timeRemaining = null
      state.currentQuizType = null
      state.currentQuizSlug = null
      state.submissionStateInProgress = false

      // Clear errors
      state.errors = {
        quiz: null,
        submission: null,
        results: null,
        history: null,
      }
      state.error = null
      state.quizError = null
      state.submissionError = null
      state.resultsError = null
      state.historyError = null
    },
    storeQuizResults: (state, action: PayloadAction<QuizResult>) => {
      state.results = action.payload
      state.tempResults = action.payload
      state.isCompleted = true
      state.isSubmitting = false
      state.timerActive = false
    },
  },
  extraReducers: (builder) => {
    builder
      // Quiz fetching
      .addCase(fetchQuiz.pending, (state, action) => {
        // Extract type and slug from the action meta
        const { arg } = action.meta
        const type = arg.type
        const slug = arg.slug.includes("Question") ? arg.slug.split("Question")[0] : arg.slug

        // Only reset state if we're loading a different quiz
        if (state.currentQuizType !== type || state.currentQuizSlug !== slug) {
          // Clear previous quiz data when loading a new quiz
          state.quizData = null
          state.userAnswers = []
          state.currentQuestion = 0
          state.results = null
          state.tempResults = null
          state.isCompleted = false

          // Update current quiz identifiers
          state.currentQuizType = type
          state.currentQuizSlug = slug
        }

        // Set loading state
        state.isLoading = true
        state.errors.quiz = null
        state.quizError = null
        state.error = null
      })
      .addCase(fetchQuiz.fulfilled, (state, action) => {
        state.quizData = action.payload
        state.currentQuizId = action.payload.id

        // Only reset answers if this is a new quiz
        if (!state.userAnswers.length) {
          state.userAnswers = []
          state.currentQuestion = 0
        }

        state.isLoading = false
        state.isCompleted = false
        state.timeRemaining = action.payload.timeLimit ? action.payload.timeLimit * 60 : null

        // Store the quiz type and slug for state isolation
        state.currentQuizType = action.payload.type
        state.currentQuizSlug = action.payload.slug
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        state.isLoading = false
        state.errors.quiz = action.payload as string
        state.quizError = action.payload as string
        state.error = action.payload as string
      })

      // Quiz submission
      .addCase(submitQuiz.pending, (state) => {
        state.isSubmitting = true
        state.errors.submission = null
        state.submissionError = null
      })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        // Store the results first
        if (action.payload && typeof action.payload.score === "number") {
          state.results = action.payload
          state.tempResults = action.payload

          // Update history if we have quiz data
          const data = state.quizData
          if (data) {
            const history: QuizHistoryItem = {
              id: data.id,
              quizTitle: data.title,
              quizType: data.type,
              score: action.payload.score,
              maxScore: action.payload.maxScore,
              completedAt: new Date().toISOString(),
              slug: data.slug,
            }

            const idx = state.quizHistory.findIndex((q) => q.id === data.id)
            if (idx >= 0) state.quizHistory[idx] = history
            else state.quizHistory.push(history)
          }
        }

        // Mark as completed and stop submission
        state.isCompleted = true
        state.isSubmitting = false
        state.timerActive = false

        // Clear the quiz state after successful submission
        // This prevents state pollution between different quizzes
        setTimeout(() => {
          // The actual clearing will be handled by a separate action
        }, 100)
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.isSubmitting = false
        state.errors.submission = action.payload as string
        state.submissionError = action.payload as string
        state.error = action.payload as string

        // Even if submission fails, we can still show local results
        if (state.quizData && state.userAnswers.length > 0) {
          state.errors.submission = "Server submission failed. Displaying local results."

          const localResult = {
            quizId: state.quizData.id,
            slug: state.quizData.slug,
            title: state.quizData.title,
            score: state.userAnswers.length,
            maxScore: state.quizData.questions.length,
            percentage: Math.round((state.userAnswers.length / state.quizData.questions.length) * 100),
            completedAt: new Date().toISOString(),
            questions: state.quizData.questions.map((q) => {
              const userAns = state.userAnswers.find((a) => a.questionId === q.id)
              return {
                id: q.id,
                question: q.question,
                userAnswer: userAns?.answer?.toString() || "",
                correctAnswer: getQuestionCorrectAnswer(q),
                isCorrect: true,
              }
            }),
          }

          state.results = localResult
          state.isCompleted = true
        }
      })

      // Quiz results fetching
      .addCase(getQuizResults.pending, (state) => {
        state.isLoading = true
        state.errors.results = null
        state.resultsError = null
      })
      .addCase(getQuizResults.fulfilled, (state, action) => {
        state.results = action.payload
        state.isCompleted = true
        state.isLoading = false
      })
      .addCase(getQuizResults.rejected, (state, action) => {
        state.isLoading = false
        state.errors.results = action.payload as string
        state.resultsError = action.payload as string

        // If we have quiz data and user answers, generate local results
        if (state.quizData && state.userAnswers.length > 0) {
          // Calculate correct answers
          const correctAnswers = state.userAnswers.filter((a) => a.isCorrect === true).length

          // Create local results
          const localResult = {
            quizId: state.quizData.id,
            slug: state.quizData.slug,
            title: state.quizData.title,
            score: correctAnswers,
            maxScore: state.quizData.questions.length,
            percentage: Math.round((correctAnswers / state.quizData.questions.length) * 100),
            completedAt: new Date().toISOString(),
            questions: state.quizData.questions.map((q) => {
              const userAns = state.userAnswers.find((a) => a.questionId === q.id)
              return {
                id: q.id,
                question: q.question,
                userAnswer: userAns?.answer?.toString() || "",
                correctAnswer: getQuestionCorrectAnswer(q),
                isCorrect: !!userAns?.isCorrect,
              }
            }),
          }

          state.results = localResult
          state.tempResults = localResult
          state.isCompleted = true
        }
      })

      // Quiz history fetching
      .addCase(fetchQuizHistory.pending, (state) => {
        state.isLoading = true
        state.errors.history = null
        state.historyError = null
      })
      .addCase(fetchQuizHistory.fulfilled, (state, action) => {
        state.quizHistory = action.payload
        state.isLoading = false
      })
      .addCase(fetchQuizHistory.rejected, (state, action) => {
        state.isLoading = false
        state.errors.history = action.payload as string
        state.historyError = action.payload as string
      })

      // Submission state persistence
      .addCase(saveQuizSubmissionState.fulfilled, (state, action) => {
        if (action.payload?.slug === state.quizData?.slug) {
          state.submissionStateInProgress = action.payload.state === "in-progress"
        }
      })

      .addCase(clearQuizSubmissionState.fulfilled, (state, action) => {
        if (action.payload === state.quizData?.slug) {
          state.submissionStateInProgress = false
        }
      })

      .addCase(getQuizSubmissionState.fulfilled, (state, action) => {
        if (action.payload?.slug === state.quizData?.slug) {
          state.submissionStateInProgress = action.payload.state === "in-progress"
        }
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
  setError,
  clearErrors,
  setSubmissionInProgress,
  setTempResults,
  clearTempResults,
  clearQuizStateAfterSubmission,
  storeQuizResults,
} = quizSlice.actions

export default quizSlice.reducer
