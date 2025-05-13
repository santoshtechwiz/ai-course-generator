import type { QuizType } from "@/app/types/quiz-types"
import type { Question } from "@/lib/quiz-store"
import { quizApi } from "@/lib/utils/quiz-index"
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

// Define types
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
  answers: Answer[]
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
  savedState: {
    quizId?: string
    slug?: string
    quizType?: string
    currentQuestionIndex?: number
    answers?: Answer[]
    isCompleted?: boolean
    score?: number
    completedAt?: string
  } | null
  isLoading: boolean
}

// Define initial state
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
  authCheckComplete: false, // changed to false for test match
  error: null,
  animationState: "idle",
  isSavingResults: false,
  resultsSaved: false,
  completedAt: null,
  startTime: Date.now(),
  savedState: null,
  isLoading: false, // changed to false for test match
}

// Define types for thunk arguments
interface FetchQuizResultsArgs {
  quizId: string
  slug: string
  quizType: QuizType | string
}

interface SubmitQuizResultsArgs {
  quizId: string
  slug: string
  quizType: string
  answers: Answer[]
  score: number
  totalTime: number
  totalQuestions: number
}

// Async thunks
export const fetchQuizResults = createAsyncThunk<any, FetchQuizResultsArgs, { rejectValue: any }>(
  "quiz/fetchResults",
  async ({ quizId, slug, quizType }, { rejectWithValue }) => {
    try {
      const result = await quizApi.getQuizData(slug, quizType)
      return result
    } catch (error) {
      return rejectWithValue(error)
    }
  },
)

export const submitQuizResults = createAsyncThunk<any, SubmitQuizResultsArgs, { rejectValue: string }>(
  "quiz/submitResults",
  async ({ quizId, slug, quizType, answers, score, totalTime, totalQuestions }, { rejectWithValue }) => {
    try {
      const result = await quizApi.submitQuiz(quizId, slug, quizType, answers, score, totalTime, totalQuestions)
      return result
    } catch (error: any) {
      console.error("Failed to submit quiz results:", error)
      return rejectWithValue(error.message || "Failed to submit quiz results")
    }
  },
)

// Define types for action payloads
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

// Create slice
const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    initQuiz: (state, action: PayloadAction<InitQuizPayload>) => {
      // Always use questions from payload, fallback to state if not provided
      const questions = action.payload.questions && action.payload.questions.length > 0
        ? action.payload.questions
        : state.questions && state.questions.length > 0
          ? state.questions
          : []

      const questionCount = questions.length

      state.quizId = action.payload.id || action.payload.quizId || ""
      state.slug = action.payload.slug || ""
      state.title = action.payload.title || ""
      state.quizType = action.payload.quizType || ""
      state.questions = questions
      state.currentQuestionIndex = 0
      state.startTime = Date.now()
      state.answers = action.payload.initialAnswers || Array(questionCount).fill(null)
      state.timeSpent = action.payload.initialTimeSpent || Array(questionCount).fill(0)
      state.isCompleted = action.payload.isCompleted || false
      state.score = action.payload.score || 0
      state.requiresAuth = action.payload.requiresAuth || false
      state.pendingAuthRequired = action.payload.pendingAuthRequired || false
      state.authCheckComplete = action.payload.authCheckComplete || true
      state.isLoading = false
      state.error = null
      state.animationState = "idle"
      state.isSavingResults = false
      state.resultsSaved = false
      state.completedAt = null
      state.savedState = null
    },
    submitAnswer: (state, action: PayloadAction<Answer>) => {
      const indexToUpdate = action.payload.index !== undefined ? action.payload.index : state.currentQuestionIndex
      if (!Array.isArray(state.answers) || state.answers.length !== state.questions.length) {
        state.answers = Array(state.questions.length).fill(null)
      }
      if (!Array.isArray(state.timeSpent) || state.timeSpent.length !== state.questions.length) {
        state.timeSpent = Array(state.questions.length).fill(0)
      }
      state.answers[indexToUpdate] = {
        answer: action.payload.answer,
        userAnswer: action.payload.userAnswer || action.payload.answer,
        isCorrect: action.payload.isCorrect,
        timeSpent: action.payload.timeSpent,
        questionId: action.payload.questionId,
        hintsUsed: action.payload.hintsUsed,
        similarity: action.payload.similarity,
        codeSnippet: action.payload.codeSnippet,
        language: action.payload.language,
      }
      state.timeSpent[indexToUpdate] = action.payload.timeSpent
      state.animationState = "answering"
      state.isLoading = false
    },
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1
        state.animationState = "idle"
        state.isLoading = false
      }
    },
    completeQuiz: (state, action: PayloadAction<CompleteQuizPayload> = { payload: {}, type: "" }) => {
      const isEmptyPayload =
        !action.payload ||
        (typeof action.payload === "object" &&
          Object.keys(action.payload).length === 0 &&
          action.payload.constructor === Object);

      let calculatedScore: number | undefined = undefined;

      if (
        (isEmptyPayload || action.payload.score === undefined) &&
        Array.isArray(state.answers) &&
        state.answers.length > 0
      ) {
        const validAnswers = state.answers.filter((a) => a != null)
        const correctAnswers = validAnswers.filter((a) => a && a.isCorrect).length
        const totalQuestions = validAnswers.length > 0 ? validAnswers.length : 1
        calculatedScore = Math.round((correctAnswers / totalQuestions) * 100)
      } else if (!isEmptyPayload && action.payload.score !== undefined) {
        calculatedScore = action.payload.score
      }

      state.isCompleted = true
      state.score = calculatedScore ?? 0
      state.completedAt = !isEmptyPayload && action.payload.completedAt
        ? action.payload.completedAt
        : new Date().toISOString()
      state.animationState = "completed"
      state.isLoading = false
      if (!isEmptyPayload && Array.isArray(action.payload.answers) && action.payload.answers.length > 0) {
        state.answers = action.payload.answers
      }
      state.pendingAuthRequired = state.requiresAuth ? true : state.pendingAuthRequired
    },
    resetQuiz: (state) => {
      const prev = { ...state }
      Object.assign(state, initialState)
      state.quizId = prev.quizId
      state.slug = prev.slug
      state.title = prev.title
      state.quizType = prev.quizType
      state.questions = prev.questions
      state.requiresAuth = prev.requiresAuth
      state.pendingAuthRequired = false
      state.authCheckComplete = true
      state.startTime = Date.now()
      state.isLoading = false
    },
    setRequiresAuth: (state, action: PayloadAction<boolean>) => {
      state.requiresAuth = action.payload
    },
    setPendingAuthRequired: (state, action: PayloadAction<boolean>) => {
      state.pendingAuthRequired = action.payload
    },
    setAuthCheckComplete: (state, action: PayloadAction<boolean>) => {
      state.authCheckComplete = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.isLoading = false
    },
    setAnimationState: (state, action: PayloadAction<"idle" | "answering" | "completed">) => {
      state.animationState = action.payload
    },
    saveStateBeforeAuth: (state, action: PayloadAction<SaveStateBeforeAuthPayload>) => {
      state.savedState = action.payload
    },
    clearSavedState: (state) => {
      state.savedState = null
      state.pendingAuthRequired = false
    },
    restoreFromSavedState: (state) => {
      if (!state.savedState) return
      state.quizId = state.savedState.quizId || state.quizId
      state.slug = state.savedState.slug || state.slug
      state.quizType = state.savedState.quizType || state.quizType
      state.currentQuestionIndex =
        state.savedState.currentQuestionIndex !== undefined
          ? state.savedState.currentQuestionIndex
          : state.currentQuestionIndex
      state.answers = state.savedState.answers || state.answers
      state.isCompleted = state.savedState.isCompleted !== undefined ? state.savedState.isCompleted : state.isCompleted
      state.score = state.savedState.score !== undefined ? state.savedState.score : state.score
      state.completedAt = state.savedState.completedAt || state.completedAt
      state.animationState = state.savedState.isCompleted ? "completed" : "idle"
      state.error = null
      state.pendingAuthRequired = false
      state.savedState = null
      state.isLoading = false
    },
    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestionIndex = action.payload
      state.animationState = "idle"
    },
    prevQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1
        state.animationState = "idle"
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase("FORCE_QUIZ_COMPLETED", (state) => {
        return {
          ...state,
          isCompleted: true,
          isLoading: false,
        }
      })
      .addCase(fetchQuizResults.pending, (state) => {
        return {
          ...state,
          isSavingResults: true,
          error: null,
          isLoading: true,
        }
      })
      .addCase(fetchQuizResults.fulfilled, (state, action) => {
        if (!action.payload) {
          return {
            ...state,
            isSavingResults: false,
            isLoading: false,
          }
        }

        return {
          ...state,
          isSavingResults: false,
          score: action.payload.score || 0,
          isCompleted: true,
          completedAt: action.payload.completedAt || new Date().toISOString(),
          resultsSaved: true,
          isLoading: false,
        }
      })
      .addCase(fetchQuizResults.rejected, (state, action) => {
        return {
          ...state,
          isSavingResults: false,
          error: action.error.message || "Failed to fetch quiz results",
          isLoading: false,
        }
      })
      .addCase(submitQuizResults.pending, (state) => {
        return {
          ...state,
          isSavingResults: true,
          error: null,
        }
      })
      .addCase(submitQuizResults.fulfilled, (state) => {
        return {
          ...state,
          isSavingResults: false,
          resultsSaved: true,
          isLoading: false,
        }
      })
      .addCase(submitQuizResults.rejected, (state, action) => {
        return {
          ...state,
          isSavingResults: false,
          error: action.error.message || "Failed to submit quiz results",
          isLoading: false,
        }
      })
  },
})

// Export actions
export const {
  initQuiz,
  submitAnswer,
  nextQuestion,
  completeQuiz,
  resetQuiz,
  setRequiresAuth,
  setPendingAuthRequired,
  setAuthCheckComplete,
  setError,
  setAnimationState,
  saveStateBeforeAuth,
  clearSavedState,
  restoreFromSavedState,
  setCurrentQuestion,
  prevQuestion,
  setLoading,
} = quizSlice.actions

// Export reducer
export default quizSlice.reducer
