import { createSlice, createAsyncThunk, createSelector, PayloadAction } from "@reduxjs/toolkit"

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
  flashcard: "",
}

/**
 * Normalizes raw quiz data into a consistent format
 */
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
            `${quizUniqueId}-q-${index}-${uuidv4()}`,
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

export interface ErrorState {
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
  errors: ErrorState
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
    { rejectWithValue }
  ) => {
    try {
      const cleanSlug = slug.replace(/Question$/, "")
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ""
      const endpoint = API_ENDPOINTS[type]
      const url = new URL(`${endpoint}/${cleanSlug}`, baseUrl).toString()

      const response = await fetch(url)

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: response.statusText }))
        return rejectWithValue(err.message || `Failed to fetch quiz: ${response.status}`)
      }

      const data = await response.json()
      return normalizeQuizData(data, cleanSlug, type)
    } catch (error: any) {
      if (error.name === "AbortError") {
        return rejectWithValue("Quiz fetch was aborted")
      }
      if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
        return rejectWithValue("Network error: Please check your connection")
      }
      return rejectWithValue(error.message || "Unexpected error loading quiz")
    }
  }
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
    { rejectWithValue }
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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(submissionData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        return rejectWithValue(errorData?.message || `Submission failed: ${response.status}`)
      }

      return await response.json()
    } catch (error: any) {
      if (error.name === "AbortError") {
        return rejectWithValue("Quiz submission was aborted")
      }
      if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
        return rejectWithValue("Network error: Please check your connection")
      }
      return rejectWithValue(error.message || "Unexpected submission error")
    }
  }
)

// -------------------- Slice --------------------

export const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    resetQuizState: (state) => ({ ...initialState, quizHistory: state.quizHistory }),
    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      if (action.payload >= 0 && (!state.quizData || action.payload < state.quizData.questions.length)) {
        state.currentQuestion = action.payload
      }
    },
    setUserAnswer: (state, action: PayloadAction<UserAnswer>) => {
      const i = state.userAnswers.findIndex((a) => a.questionId === action.payload.questionId)
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
    pauseTimer: (state) => { state.timerActive = false },
    resumeTimer: (state) => { state.timerActive = true },
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
    setError: (state, action: PayloadAction<{ type: keyof ErrorState; message: string }>) => {
      const { type, message } = action.payload
      state.errors[type] = message
    },
    clearErrors: (state) => {
      state.errors = { quiz: null, submission: null, results: null, history: null }
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
      state.errors = { quiz: null, submission: null, results: null, history: null }
    },
    storeQuizResults: (state, action: PayloadAction<QuizResult>) => {
      state.results = action.payload
      state.tempResults = action.payload
      state.isCompleted = true
      state.isSubmitting = false
      state.timerActive = false
    },
    saveQuizState: (state, action: PayloadAction<{ currentQuestion: number; userAnswers: UserAnswer[]; quizData: QuizData | null }>) => {
      const { currentQuestion, userAnswers, quizData } = action.payload
      state.currentQuestion = currentQuestion
      state.userAnswers = userAnswers
      state.quizData = quizData
    },
    saveAuthRedirectState: (state, action: PayloadAction<CodeQuizRedirectState>) => {
      state.authRedirectState = action.payload
      state.currentQuizType = action.payload.type
      state.currentQuizSlug = action.payload.slug
    },
    restoreFromAuthRedirect: (state) => {
      if (state.authRedirectState) {
        state.currentQuizSlug = state.authRedirectState.slug || null
        state.currentQuizId = state.authRedirectState.quizId || null
        state.currentQuizType = state.authRedirectState.type || null
        state.userAnswers = state.authRedirectState.userAnswers || []
        state.currentQuestion = state.authRedirectState.currentQuestion || 0
        state.tempResults = state.authRedirectState.tempResults || null
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
        state.errors.submission = action.payload as string
      })
  }
})

// Actions
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

// Selectors
export const selectCurrentQuestionData = createSelector(
  [(state: { quiz: QuizState }) => state.quiz.quizData, (state: { quiz: QuizState }) => state.quiz.currentQuestion],
  (quizData, currentQuestion) => {
    if (!quizData || !Array.isArray(quizData.questions)) return null
    return quizData.questions[currentQuestion] || null
  }
)

export const selectQuizProgress = createSelector(
  [(state: { quiz: QuizState }) => state.quiz.quizData, (state: { quiz: QuizState }) => state.quiz.currentQuestion],
  (quizData, currentQuestion) => {
    if (!quizData?.questions?.length) return 0
    return Math.round((currentQuestion / quizData.questions.length) * 100)
  }
)

export const selectIsLastQuestion = createSelector(
  [(state: { quiz: QuizState }) => state.quiz.quizData, (state: { quiz: QuizState }) => state.quiz.currentQuestion],
  (quizData, currentQuestion) => {
    if (!quizData?.questions?.length) return false
    return currentQuestion === quizData.questions.length - 1
  }
)

// Reducer
export default quizSlice.reducer
