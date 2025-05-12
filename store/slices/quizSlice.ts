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
  authCheckComplete: true,
  error: null,
  animationState: "idle",
  isSavingResults: false,
  resultsSaved: false,
  completedAt: null,
  startTime: Date.now(),
  savedState: null,
  isLoading: true,
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

interface CompleteQuizPayload {
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
      const questionCount = action.payload.questions?.length || 0

      // Use a more immutable approach to state updates
      return {
        ...initialState,
        quizId: action.payload.id || action.payload.quizId || "",
        slug: action.payload.slug || "",
        title: action.payload.title || "",
        quizType: action.payload.quizType || "",
        questions: action.payload.questions || [],
        currentQuestionIndex: 0,
        startTime: Date.now(),
        answers: action.payload.initialAnswers || Array(questionCount).fill(null),
        timeSpent: action.payload.initialTimeSpent || Array(questionCount).fill(0),
        isCompleted: action.payload.isCompleted || false,
        score: action.payload.score || 0,
        requiresAuth: action.payload.requiresAuth || false,
        pendingAuthRequired: action.payload.pendingAuthRequired || false,
        authCheckComplete: action.payload.authCheckComplete || true,
        isLoading: false, // Set to false after initialization
      }
    },
    submitAnswer: (state, action: PayloadAction<Answer>) => {
      // Get the index to update (either from the action payload or use currentQuestionIndex)
      const indexToUpdate = action.payload.index !== undefined ? action.payload.index : state.currentQuestionIndex

      // Create new arrays instead of mutating existing ones
      const newAnswers = Array.isArray(state.answers) ? [...state.answers] : Array(state.questions.length).fill(null)

      const newTimeSpent = Array.isArray(state.timeSpent) ? [...state.timeSpent] : Array(state.questions.length).fill(0)

      // Update the answer at the specified index
      newAnswers[indexToUpdate] = {
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

      // Update the timeSpent at the specified index
      newTimeSpent[indexToUpdate] = action.payload.timeSpent

      // Return a new state object
      return {
        ...state,
        answers: newAnswers,
        timeSpent: newTimeSpent,
        animationState: "answering",
        isLoading: false,
      }
    },
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        return {
          ...state,
          currentQuestionIndex: state.currentQuestionIndex + 1,
          animationState: "idle",
          isLoading: false,
        }
      }
      return state
    },
    completeQuiz: (state, action: PayloadAction<CompleteQuizPayload> = { payload: {} }) => {
      // Calculate score if not provided
      let calculatedScore = action.payload?.score

      if (calculatedScore === undefined && Array.isArray(state.answers)) {
        const correctAnswers = state.answers.filter((a) => a?.isCorrect).length
        const totalQuestions = state.questions.length || 1 // Avoid division by zero
        calculatedScore = Math.round((correctAnswers / totalQuestions) * 100)
      }

      // Return a new state object with all updates
      return {
        ...state,
        isCompleted: true,
        score: calculatedScore || 0,
        completedAt: action.payload?.completedAt || new Date().toISOString(),
        animationState: "completed",
        isLoading: false,
        // If answers are provided, update them
        answers:
          Array.isArray(action.payload?.answers) && action.payload.answers.length > 0
            ? action.payload.answers
            : state.answers,
        // If quiz requires auth and user is not authenticated, set pendingAuthRequired
        pendingAuthRequired: state.requiresAuth ? true : state.pendingAuthRequired,
      }
    },
    resetQuiz: (state) => {
      return {
        ...initialState,
        quizId: state.quizId,
        slug: state.slug,
        title: state.title,
        quizType: state.quizType,
        questions: state.questions,
        requiresAuth: state.requiresAuth,
        pendingAuthRequired: false,
        authCheckComplete: true,
        startTime: Date.now(),
        isLoading: false,
      }
    },
    setRequiresAuth: (state, action: PayloadAction<boolean>) => {
      return {
        ...state,
        requiresAuth: action.payload,
      }
    },
    setPendingAuthRequired: (state, action: PayloadAction<boolean>) => {
      return {
        ...state,
        pendingAuthRequired: action.payload,
      }
    },
    setAuthCheckComplete: (state, action: PayloadAction<boolean>) => {
      return {
        ...state,
        authCheckComplete: action.payload,
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      }
    },
    setAnimationState: (state, action: PayloadAction<"idle" | "answering" | "completed">) => {
      return {
        ...state,
        animationState: action.payload,
      }
    },
    saveStateBeforeAuth: (state, action: PayloadAction<SaveStateBeforeAuthPayload>) => {
      return {
        ...state,
        savedState: action.payload,
      }
    },
    clearSavedState: (state) => {
      return {
        ...state,
        savedState: null,
        pendingAuthRequired: false,
      }
    },
    restoreFromSavedState: (state) => {
      if (!state.savedState) return state

      // Create a new state object with restored values
      const restoredState = {
        ...state,
        quizId: state.savedState.quizId || state.quizId,
        slug: state.savedState.slug || state.slug,
        quizType: state.savedState.quizType || state.quizType,
        currentQuestionIndex:
          state.savedState.currentQuestionIndex !== undefined
            ? state.savedState.currentQuestionIndex
            : state.currentQuestionIndex,
        answers: state.savedState.answers || state.answers,
        isCompleted: state.savedState.isCompleted !== undefined ? state.savedState.isCompleted : state.isCompleted,
        score: state.savedState.score !== undefined ? state.savedState.score : state.score,
        completedAt: state.savedState.completedAt || state.completedAt,
        animationState: state.savedState.isCompleted ? "completed" : "idle",
        error: null,
        pendingAuthRequired: false,
        savedState: null, // Clear saved state after restoration
        isLoading: false,
      }

      return restoredState
    },
    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      return {
        ...state,
        currentQuestionIndex: action.payload,
        animationState: "idle",
      }
    },
    prevQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        return {
          ...state,
          currentQuestionIndex: state.currentQuestionIndex - 1,
          animationState: "idle",
        }
      }
      return state
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      return {
        ...state,
        isLoading: action.payload,
      }
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
