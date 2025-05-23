import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
} from "@reduxjs/toolkit"
import type {
  QuizData,
  QuizHistoryItem,
  QuizResult,
  QuizType,
  UserAnswer,
} from "@/app/types/quiz-types"
import type { CodeQuizRedirectState } from "@/app/types/code-quiz-types"

const API_ENDPOINTS: Record<QuizType, string> = {
  mcq: "/api/quizzes/mcq",
  code: "/api/quizzes/code",
  blanks: "/api/quizzes/blanks",
  openended: "/api/quizzes/openended",
  flashcard: ""
}

const normalizeQuizData = (raw: any, slug: string, type: QuizType): QuizData => {
  const quizUniqueId = raw.quizId
  return {
    id: quizUniqueId,
    title: raw.quizData?.title || "Quiz",
    slug,
    type,
    questions: Array.isArray(raw.quizData?.questions)
      ? raw.quizData.questions.map((q: any, index: number) => ({
          id:
            q.id ||
            q.questionId ||
            `${quizUniqueId}-q-${index}-${Math.random()
              .toString(36)
              .substring(2, 8)}`,
          question: q.question || "",
          codeSnippet: q.codeSnippet || "",
          options: Array.isArray(q.options) ? [...q.options] : [],
          answer: q.answer || q.correctAnswer || "",
          correctAnswer: q.correctAnswer || q.answer || "",
          language: q.language || "javascript",
          type,
        }))
      : [],
    isPublic: !!raw.isPublic,
    isFavorite: !!raw.isFavorite,
    ownerId: raw.ownerId || "",
    timeLimit: raw.quizData?.timeLimit || null,
  }
}

interface ErrorMap {
  quiz: string | null
  submission: string | null
  results: string | null
  history: string | null
}

export interface QuizState {
  quizData: QuizData | null
  currentQuestion: number
  userAnswers: UserAnswer[]
  isLoading: boolean
  isSubmitting: boolean
  isCompleted: boolean
  timerActive: boolean
  submissionStateInProgress: boolean
  results: QuizResult | null
  tempResults: QuizResult | null
  quizHistory: QuizHistoryItem[]
  currentQuizId: string | null
  timeRemaining: number | null
  error: string | null
  quizError: string | null
  submissionError: string | null
  resultsError: string | null
  historyError: string | null
  errors: ErrorMap
  currentQuizType: QuizType | null
  currentQuizSlug: string | null
  hasMoreHistory: boolean
  authRedirectState: {
    slug: string | null
    quizId: string | null
    type: QuizType | null
    userAnswers: UserAnswer[]
    currentQuestion: number
    tempResults: QuizResult | null
  } | null
}

export const initialState: QuizState = {
  quizData: null,
  currentQuestion: 0,
  userAnswers: [],
  isLoading: false,
  isSubmitting: false,
  isCompleted: false,
  timerActive: false,
  submissionStateInProgress: false,
  results: null,
  tempResults: null,
  quizHistory: [],
  currentQuizId: null,
  timeRemaining: null,
  error: null,
  quizError: null,
  submissionError: null,
  resultsError: null,
  historyError: null,
  errors: {
    quiz: null,
    submission: null,
    results: null,
    history: null,
  },
  currentQuizType: null,
  currentQuizSlug: null,
  hasMoreHistory: true,
  authRedirectState: null,
}

// -------------------- Async Thunks --------------------

export const fetchQuiz = createAsyncThunk(
  "quiz/fetchQuiz",
  async (
    { slug, type }: { slug: string; type: QuizType },
    { rejectWithValue },
  ) => {
    try {
      const cleanSlug = slug.replace(/Question$/, "")
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ""
      const endpoint = API_ENDPOINTS[type]
      const url = new URL(`${endpoint}/${cleanSlug}`, baseUrl).toString()
      const response = await fetch(url)
      if (!response.ok) {
        const err = await response.json()
        return rejectWithValue(err.message || "Failed to fetch quiz")
      }
      const data = await response.json()
      return normalizeQuizData(data, cleanSlug, type)
    } catch (error) {
      return rejectWithValue("Network error loading quiz")
    }
  },
)

export const submitQuiz = createAsyncThunk(
  "quiz/submitQuiz",
  async (
    {
      slug,
      quizId,
      type,
      answers,
      timeTaken,
      score,
      totalQuestions,
    }: {
      slug: string
      quizId?: string | number
      type: QuizType
      answers: UserAnswer[]
      timeTaken?: number
      score?: number
      totalQuestions?: number
    },
    { rejectWithValue },
  ) => {
    try {
      const cleanSlug = slug.replace(/Question$/, "")
      const endpoint = `/api/quizzes/common/${cleanSlug}/complete`

      const correctAnswers = answers.filter((a) => a.isCorrect).length
      const submissionData = {
        quizId,
        answers: answers.map((a) => ({
          questionId: a.questionId,
          answer: a.answer,
          isCorrect: a.isCorrect,
          timeSpent: Math.floor((timeTaken || 600) / answers.length),
        })),
        type,
        score: score ?? correctAnswers,
        totalTime: timeTaken || 600,
        totalQuestions: totalQuestions || answers.length,
        correctAnswers,
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(submissionData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        return rejectWithValue(errorData || response.statusText)
      }

      return await response.json()
    } catch (error: any) {
      return rejectWithValue(error.message || "Unexpected submission error")
    }
  },
)

// -------------------- Slice --------------------

export const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    resetQuizState: (state) => {
      return {
        ...initialState,
        quizHistory: state.quizHistory,
      }
    },
    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestion = action.payload
    },
    setUserAnswer: (state, action: PayloadAction<UserAnswer>) => {
      const i = state.userAnswers.findIndex(
        (a) => a.questionId === action.payload.questionId,
      )
      if (i >= 0) state.userAnswers[i] = action.payload
      else state.userAnswers.push(action.payload)
    },
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
    setError: (
      state,
      action: PayloadAction<{ type: keyof ErrorMap; message: string }>,
    ) => {
      const { type, message } = action.payload
      state.errors[type] = message
      switch (type) {
        case "quiz":
          state.quizError = message
          state.error = message
          break
        case "submission":
          state.submissionError = message
          state.error = message
          break
        case "results":
          state.resultsError = message
          break
        case "history":
          state.historyError = message
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
      state.error = null
      state.quizError = null
      state.submissionError = null
      state.resultsError = null
      state.historyError = null
    },
    setSubmissionInProgress: (state, action: PayloadAction<boolean>) => {
      state.submissionStateInProgress = action.payload
    },
    setTempResults: (state, action: PayloadAction<QuizResult>) => {
      state.tempResults = action.payload
    },
    clearTempResults: (state) => {
      state.tempResults = null
    },
    clearQuizStateAfterSubmission: (state) => {
      state.quizData = null
      state.currentQuestion = 0
      state.userAnswers = []
      state.isCompleted = false
      state.timerActive = false
      state.timeRemaining = null
      state.currentQuizType = null
      state.currentQuizSlug = null
      state.submissionStateInProgress = false
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
    // Add new reducer to handle saving quiz state
    saveQuizState: (state, action) => {
      const { currentQuestion, userAnswers, quizData } = action.payload
      state.currentQuestion = currentQuestion
      state.userAnswers = userAnswers
      state.quizData = quizData
    },
    saveAuthRedirectState: (state, action: PayloadAction<CodeQuizRedirectState>) => {
      state.authRedirectState = action.payload
      // Also persist the current quiz state
      state.currentQuizType = action.payload.type
      state.currentQuizSlug = action.payload.slug
    },
    restoreFromAuthRedirect: (state) => {
      if (state.authRedirectState) {
        state.currentQuizSlug = state.authRedirectState.slug
        state.currentQuizId = state.authRedirectState.quizId
        state.currentQuizType = state.authRedirectState.type
        state.userAnswers = state.authRedirectState.userAnswers
        state.currentQuestion = state.authRedirectState.currentQuestion
        state.tempResults = state.authRedirectState.tempResults
        state.authRedirectState = null
      }
    },
    clearAuthRedirectState: (state) => {
      state.authRedirectState = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuiz.pending, (state, action) => {
        const { slug, type } = action.meta.arg
        state.currentQuizSlug = slug.replace(/Question$/, "")
        state.currentQuizType = type
        state.isLoading = true
        state.errors.quiz = null
      })
      .addCase(fetchQuiz.fulfilled, (state, action) => {
        state.quizData = action.payload
        state.currentQuizId = action.payload.id
        state.currentQuizSlug = action.payload.slug
        state.currentQuizType = action.payload.type
        state.isLoading = false
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        state.isLoading = false
        state.quizError = action.payload as string
        state.errors.quiz = action.payload as string
      })
      .addCase(submitQuiz.pending, (state) => {
        state.isSubmitting = true
        state.errors.submission = null
      })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        state.isSubmitting = false
        state.isCompleted = true
        state.results = action.payload
        state.tempResults = null
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.isSubmitting = false
        state.submissionError = action.payload as string
        state.errors.submission = action.payload as string
      })
  },
})

// -------------------- Exports --------------------

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
  saveQuizState,
  saveAuthRedirectState,
  restoreFromAuthRedirect,
  clearAuthRedirectState,
} = quizSlice.actions

export const quizInitialState = initialState
export default quizSlice.reducer
