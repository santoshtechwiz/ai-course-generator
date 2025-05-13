import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { QuizType } from "@/app/types/quiz-types"
import type { Question } from "@/lib/quiz-store"
import { quizApi } from "@/lib/utils/quiz-index"

// === Types ===
export interface Answer {
  answer: string
  timeSpent: number
  isCorrect: boolean
  questionId?: string | number
  userAnswer?: string
  index?: number
  hintsUsed?: boolean
  similarity?: number
  codeSnippet?: string
  language?: string
}

export interface QuizState {
  quizId: string
  slug: string
  title: string
  quizType: QuizType | string
  questions: Question[]
  currentQuestionIndex: number
  answers: (Answer | null)[]
  timeSpent: number[]
  isCompleted: boolean
  score: number
  requiresAuth: boolean
  pendingAuthRequired: boolean
  authCheckComplete: boolean
  error: string | null
  animationState: "idle" | "answering" | "completed"
  isSavingResults: boolean
  resultsSaved: boolean
  completedAt: string | null
  startTime: number
  savedState: Partial<QuizState> | null
  isLoading: boolean
}

interface InitQuizPayload {
  id?: string
  quizId?: string
  slug?: string
  title?: string
  quizType?: QuizType | string
  questions?: Question[]
  initialAnswers?: Answer[]
  initialTimeSpent?: number[]
  isCompleted?: boolean
  score?: number
  requiresAuth?: boolean
  pendingAuthRequired?: boolean
  authCheckComplete?: boolean
}

export interface CompleteQuizPayload {
  answers?: Answer[]
  score?: number
  completedAt?: string
}

interface SaveStateBeforeAuthPayload {
  quizId?: string
  slug?: string
  quizType?: string
  currentQuestionIndex?: number
  answers?: Answer[]
  isCompleted?: boolean
  score?: number
  completedAt?: string
}

// === Initial State ===
const initialState: QuizState = {
  quizId: "",
  slug: "",
  title: "",
  quizType: "",
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  timeSpent: [],
  isCompleted: false,
  score: 0,
  requiresAuth: false,
  pendingAuthRequired: false,
  authCheckComplete: false,
  error: null,
  animationState: "idle",
  isSavingResults: false,
  resultsSaved: false,
  completedAt: null,
  startTime: Date.now(),
  savedState: null,
  isLoading: false,
}

// === Async Thunks ===
export const fetchQuizResults = createAsyncThunk<any, { quizId: string; slug: string; quizType: string }, { rejectValue: string }>(
  "quiz/fetchResults",
  async ({ quizId, slug, quizType }, { rejectWithValue }) => {
    try {
      const result = await quizApi.getQuizData(slug, quizType)
      return result
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch quiz results")
    }
  }
)

export const submitQuizResults = createAsyncThunk<any, {
  quizId: string
  slug: string
  quizType: string
  answers: Answer[]
  score: number
  totalTime: number
  totalQuestions: number
}, { rejectValue: string }>(
  "quiz/submitResults",
  async (payload, { rejectWithValue }) => {
    try {
      return await quizApi.submitQuiz(
        payload.quizId,
        payload.slug,
        payload.quizType,
        payload.answers,
        payload.score,
        payload.totalTime,
        payload.totalQuestions
      )
    } catch (error: any) {
      console.error("Submit quiz error:", error)
      return rejectWithValue(error.message || "Submit failed")
    }
  }
)

// === Slice ===
const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    initQuiz: (state, { payload }: PayloadAction<InitQuizPayload>) => {
      const questions = payload.questions ?? state.questions ?? []
      const questionCount = questions.length

      state.quizId = payload.id || payload.quizId || ""
      state.slug = payload.slug || ""
      state.title = payload.title || ""
      state.quizType = payload.quizType || ""
      state.questions = questions
      state.currentQuestionIndex = 0
      state.startTime = Date.now()
      state.answers = payload.initialAnswers ?? Array(questionCount).fill(null)
      state.timeSpent = payload.initialTimeSpent ?? Array(questionCount).fill(0)
      state.isCompleted = !!payload.isCompleted
      state.score = payload.score ?? 0
      state.requiresAuth = !!payload.requiresAuth
      state.pendingAuthRequired = !!payload.pendingAuthRequired
      state.authCheckComplete = payload.authCheckComplete ?? true
      state.isLoading = false
      state.animationState = "idle"
      state.isSavingResults = false
      state.resultsSaved = false
      state.completedAt = null
      state.savedState = null
      state.error = null
    },

    submitAnswer: (state, { payload }: PayloadAction<Answer>) => {
      const idx = payload.index ?? state.currentQuestionIndex
      if (!Array.isArray(state.answers)) state.answers = Array(state.questions.length).fill(null)
      if (!Array.isArray(state.timeSpent)) state.timeSpent = Array(state.questions.length).fill(0)

      state.answers[idx] = {
        answer: payload.answer,
        userAnswer: payload.userAnswer ?? payload.answer,
        isCorrect: payload.isCorrect,
        timeSpent: payload.timeSpent,
        questionId: payload.questionId,
        hintsUsed: payload.hintsUsed,
        similarity: payload.similarity,
        codeSnippet: payload.codeSnippet,
        language: payload.language,
      }
      state.timeSpent[idx] = payload.timeSpent
      state.animationState = "answering"
    },

    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex++
        state.animationState = "idle"
      }
    },

    prevQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--
        state.animationState = "idle"
      }
    },

    completeQuiz: (state, { payload }: PayloadAction<CompleteQuizPayload>) => {
      const answers = payload.answers ?? state.answers
      const validAnswers = answers.filter(Boolean)
      const correct = validAnswers.filter((a) => a?.isCorrect).length
      const score = payload.score ?? Math.round((correct / (validAnswers.length || 1)) * 100)

      state.isCompleted = true
      state.score = score
      state.completedAt = payload.completedAt ?? new Date().toISOString()
      state.answers = answers
      state.animationState = "completed"
      state.pendingAuthRequired = state.requiresAuth
    },

    resetQuiz: (state) => {
      const { quizId, slug, title, quizType, questions, requiresAuth } = state
      Object.assign(state, initialState, {
        quizId,
        slug,
        title,
        quizType,
        questions,
        requiresAuth,
        authCheckComplete: true,
        startTime: Date.now(),
      })
    },

    setCurrentQuestion: (state, { payload }: PayloadAction<number>) => {
      state.currentQuestionIndex = payload
      state.animationState = "idle"
    },

    setRequiresAuth: (state, { payload }: PayloadAction<boolean>) => {
      state.requiresAuth = payload
    },

    setPendingAuthRequired: (state, { payload }: PayloadAction<boolean>) => {
      state.pendingAuthRequired = payload
    },

    setAuthCheckComplete: (state, { payload }: PayloadAction<boolean>) => {
      state.authCheckComplete = payload
    },

    setAnimationState: (state, { payload }: PayloadAction<"idle" | "answering" | "completed">) => {
      state.animationState = payload
    },

    setError: (state, { payload }: PayloadAction<string | null>) => {
      state.error = payload
      state.isLoading = false
    },

    setLoading: (state, { payload }: PayloadAction<boolean>) => {
      state.isLoading = payload
    },

    saveStateBeforeAuth: (state, { payload }: PayloadAction<SaveStateBeforeAuthPayload>) => {
      state.savedState = payload
    },

    clearSavedState: (state) => {
      state.savedState = null
      state.pendingAuthRequired = false
    },

    restoreFromSavedState: (state) => {
      if (!state.savedState) return

      const saved = state.savedState
      state.quizId = saved.quizId ?? state.quizId
      state.slug = saved.slug ?? state.slug
      state.quizType = saved.quizType ?? state.quizType
      state.currentQuestionIndex = saved.currentQuestionIndex ?? state.currentQuestionIndex
      state.answers = saved.answers ?? state.answers
      state.isCompleted = saved.isCompleted ?? state.isCompleted
      state.score = saved.score ?? state.score
      state.completedAt = saved.completedAt ?? state.completedAt
      state.animationState = saved.isCompleted ? "completed" : "idle"
      state.savedState = null
      state.pendingAuthRequired = false
      state.isLoading = false
      state.error = null
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchQuizResults.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.isSavingResults = true
      })
      .addCase(fetchQuizResults.fulfilled, (state, action) => {
        state.isSavingResults = false
        state.isLoading = false
        state.resultsSaved = true
        state.score = action.payload?.score ?? state.score
        state.completedAt = action.payload?.completedAt ?? new Date().toISOString()
        state.isCompleted = true
      })
      .addCase(fetchQuizResults.rejected, (state, action) => {
        state.isSavingResults = false
        state.isLoading = false
        state.error = action.payload ?? "Failed to fetch quiz results"
      })
      .addCase(submitQuizResults.pending, (state) => {
        state.isSavingResults = true
        state.error = null
      })
      .addCase(submitQuizResults.fulfilled, (state) => {
        state.isSavingResults = false
        state.resultsSaved = true
        state.isLoading = false
      })
      .addCase(submitQuizResults.rejected, (state, action) => {
        state.isSavingResults = false
        state.isLoading = false
        state.error = action.payload ?? "Failed to submit quiz results"
      })
  }
})

// === Exports ===
export const {
  initQuiz,
  submitAnswer,
  nextQuestion,
  prevQuestion,
  completeQuiz,
  resetQuiz,
  setRequiresAuth,
  setPendingAuthRequired,
  setAuthCheckComplete,
  setError,
  setAnimationState,
  setCurrentQuestion,
  saveStateBeforeAuth,
  clearSavedState,
  restoreFromSavedState,
  setLoading,
} = quizSlice.actions

export default quizSlice.reducer
