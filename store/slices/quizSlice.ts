import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { QuizType } from "@/app/types/quiz-types"
import type { Question } from "@/lib/quiz-store"
import { quizApi } from "@/lib/utils/quiz-index"
import { formatQuizTime } from "@/lib/utils/quiz-performance"

// === Types ===
export interface Answer {
  answer: string
  timeSpent: number
  isCorrect: boolean
  questionId?: string | number
  question?: string
  userAnswer?: string
  index?: number
  hintsUsed?: boolean
  similarity?: number
  codeSnippet?: string
  language?: string
  correctAnswer?: string
}

export interface QuizResultsData {
  quizId: string
  slug: string
  title: string
  quizType: string
  score: number
  totalQuestions: number
  correctAnswers: number
  totalTimeSpent: number
  formattedTimeSpent: string
  completedAt: string
  answers: Answer[]
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
  resultsData: QuizResultsData | null
  resultsReady: boolean
}

export interface InitQuizPayload {
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
  quizId?: string
  slug?: string
  quizType?: string
  answers?: Answer[]
  score?: number
  completedAt?: string
}

export interface SaveStateBeforeAuthPayload {
  quizId?: string
  slug?: string
  quizType?: string
  currentQuestionIndex?: number
  answers?: Answer[]
  isCompleted?: boolean
  score?: number
  completedAt?: string
}

export interface PrepareResultsPayload {
  quizId: string
  slug: string
  title: string
  quizType: string
  score: number
  totalQuestions: number
  correctAnswers: number
  answers: Answer[]
  completedAt: string
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
  resultsData: null,
  resultsReady: false,
}

// === Async Thunks ===
/**
 * Fetches quiz results from the API
 */
export const fetchQuizResults = createAsyncThunk<
  any,
  { quizId: string; slug: string; quizType: string },
  { rejectValue: string }
>("quiz/fetchResults", async ({ quizId, slug, quizType }, { rejectWithValue }) => {
  try {
    // Validate input parameters
    if (!quizId) throw new Error("quizId is required")
    if (!slug) throw new Error("slug is required")
    if (!quizType) throw new Error("quizType is required")

    const result = await quizApi.getQuizData(slug, quizType)

    // Validate response
    if (!result) {
      throw new Error("Failed to fetch quiz results: Empty response")
    }

    return result
  } catch (error: any) {
    console.error("Error fetching quiz results:", error)
    return rejectWithValue(error.message || "Failed to fetch quiz results")
  }
})

/**
 * Submits quiz results to the API
 */
export const submitQuizResults = createAsyncThunk<
  any,
  {
    quizId: string
    slug: string
    quizType: string
    answers: Answer[]
    score: number
    totalTime: number
    totalQuestions: number
  },
  { rejectValue: string }
>("quiz/submitResults", async (payload, { rejectWithValue }) => {
  try {
    // Validate payload
    if (!payload.quizId) throw new Error("quizId is required")
    if (!payload.slug) throw new Error("slug is required")
    if (!payload.quizType) throw new Error("quizType is required")
    if (!Array.isArray(payload.answers)) throw new Error("answers must be an array")
    if (typeof payload.score !== "number") throw new Error("score must be a number")
    if (typeof payload.totalTime !== "number") throw new Error("totalTime must be a number")
    if (typeof payload.totalQuestions !== "number") throw new Error("totalQuestions must be a number")

    // Log submission details
    console.log("Submitting quiz results:", {
      quizId: payload.quizId,
      slug: payload.slug,
      score: payload.score,
      totalQuestions: payload.totalQuestions,
      answerCount: payload.answers.length,
    })

    return await quizApi.submitQuiz(
      payload.quizId,
      payload.slug,
      payload.quizType,
      payload.answers,
      payload.score,
      payload.totalTime,
      payload.totalQuestions,
    )
  } catch (error: any) {
    console.error("Submit quiz error:", error)
    return rejectWithValue(error.message || "Failed to submit quiz results")
  }
})

// === Slice ===
const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    /**
     * Initializes the quiz state with the provided data
     */
    initQuiz: (state, { payload }: PayloadAction<InitQuizPayload>) => {
      // Validate and process questions
      const questions = payload.questions ?? state.questions ?? []
      const questionCount = questions.length

      // Log initialization
      console.log(`Initializing quiz with ${questionCount} questions`)

      if (questionCount === 0) {
        console.warn("Initializing quiz with empty questions array")
      }

      // Set quiz properties
      state.quizId = payload.id || payload.quizId || ""
      state.slug = payload.slug || ""
      state.title = payload.title || ""
      state.quizType = payload.quizType || ""
      state.questions = questions
      state.currentQuestionIndex = 0
      state.startTime = Date.now()

      // Initialize answers and time arrays
      state.answers = payload.initialAnswers ?? Array(questionCount).fill(null)
      state.timeSpent = payload.initialTimeSpent ?? Array(questionCount).fill(0)

      // Set quiz state
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
      state.resultsData = null
      state.resultsReady = false
    },

    /**
     * Submits an answer for the current question
     */
    submitAnswer: (state, { payload }: PayloadAction<Answer>) => {
      // Get the question index (current or specified)
      const idx = payload.index ?? state.currentQuestionIndex

      // Ensure arrays are properly initialized
      if (!Array.isArray(state.answers) || state.answers.length === 0) {
        state.answers = Array(state.questions.length).fill(null)
      }

      if (!Array.isArray(state.timeSpent) || state.timeSpent.length === 0) {
        state.timeSpent = Array(state.questions.length).fill(0)
      }

      // Validate index is within bounds
      if (idx < 0 || idx >= state.questions.length) {
        console.error(`Invalid question index: ${idx}. Must be between 0 and ${state.questions.length - 1}`)
        return
      }

      // Get the current question for additional context
      const currentQuestion = state.questions[idx]
      const correctAnswer = currentQuestion?.correctAnswer || currentQuestion?.answer || ""

      // Store the answer
      state.answers[idx] = {
        answer: payload.answer,
        userAnswer: payload.userAnswer ?? payload.answer,
        isCorrect: payload.isCorrect,
        timeSpent: payload.timeSpent,
        questionId: payload.questionId || `question-${idx}`,
        question: payload.question || currentQuestion?.question || "",
        hintsUsed: payload.hintsUsed,
        similarity: payload.similarity,
        codeSnippet: payload.codeSnippet,
        language: payload.language,
        correctAnswer: correctAnswer,
      }

      // Store time spent
      state.timeSpent[idx] = payload.timeSpent

      // Update animation state
      state.animationState = "answering"
    },

    /**
     * Moves to the next question
     */
    nextQuestion: (state) => {
      // Check if we can move to the next question
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex++
        state.animationState = "idle"
      } else {
        console.warn("Already at the last question")
      }
    },

    /**
     * Moves to the previous question
     */
    prevQuestion: (state) => {
      // Check if we can move to the previous question
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--
        state.animationState = "idle"
      } else {
        console.warn("Already at the first question")
      }
    },

    /**
     * Completes the quiz and calculates the score
     */
    completeQuiz: (state, { payload }: PayloadAction<CompleteQuizPayload>) => {
      // Get answers from payload or state
      const answers = payload.answers ?? state.answers

      // Filter valid answers for score calculation
      const validAnswers = Array.isArray(answers) ? answers.filter(Boolean) : []

      // Log completion
      console.log(`Completing quiz with ${validAnswers.length} answers`)

      if (validAnswers.length === 0) {
        console.warn("No valid answers found when completing quiz")
      }

      // Calculate score
      const correct = validAnswers.filter((a) => a?.isCorrect).length
      const score = payload.score ?? Math.round((correct / (validAnswers.length || 1)) * 100)

      // Set completion state
      state.isCompleted = true
      state.score = score
      state.completedAt = payload.completedAt ?? new Date().toISOString()
      state.answers = answers
      state.animationState = "completed"
      state.pendingAuthRequired = state.requiresAuth
    },

    /**
     * Prepares results data for the results page
     */
    prepareResults: (state, { payload }: PayloadAction<PrepareResultsPayload>) => {
      // Calculate total time spent
      const totalTimeSpent = payload.answers.reduce((total, answer) => total + (answer.timeSpent || 0), 0)

      // Create results data object
      state.resultsData = {
        quizId: payload.quizId,
        slug: payload.slug,
        title: payload.title,
        quizType: payload.quizType,
        score: payload.score,
        totalQuestions: payload.totalQuestions,
        correctAnswers: payload.correctAnswers,
        totalTimeSpent,
        formattedTimeSpent: formatQuizTime(totalTimeSpent),
        completedAt: payload.completedAt,
        answers: payload.answers.map((answer) => ({
          ...answer,
          // Ensure each answer has the correct question data
          question: answer.question || "",
          correctAnswer: answer.correctAnswer || "",
        })),
      }

      state.resultsReady = true
    },

    /**
     * Resets the quiz to its initial state
     */
    resetQuiz: (state) => {
      // Preserve these values when resetting
      const { quizId, slug, title, quizType, questions, requiresAuth } = state

      // Reset all state properties
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

    /**
     * Sets the current question index
     */
    setCurrentQuestion: (state, { payload }: PayloadAction<number>) => {
      if (payload < 0 || payload >= state.questions.length) {
        console.error(`Invalid question index: ${payload}`)
        return
      }

      state.currentQuestionIndex = payload
      state.animationState = "idle"
    },

    /**
     * Sets whether authentication is required for the quiz
     */
    setRequiresAuth: (state, { payload }: PayloadAction<boolean>) => {
      state.requiresAuth = payload
    },

    /**
     * Sets whether authentication is pending
     */
    setPendingAuthRequired: (state, { payload }: PayloadAction<boolean>) => {
      state.pendingAuthRequired = payload
    },

    /**
     * Sets whether the authentication check is complete
     */
    setAuthCheckComplete: (state, { payload }: PayloadAction<boolean>) => {
      state.authCheckComplete = payload
    },

    /**
     * Sets the animation state
     */
    setAnimationState: (state, { payload }: PayloadAction<"idle" | "answering" | "completed">) => {
      state.animationState = payload
    },

    /**
     * Sets an error message
     */
    setError: (state, { payload }: PayloadAction<string | null>) => {
      state.error = payload
      state.isLoading = false
    },

    /**
     * Sets the loading state
     */
    setLoading: (state, { payload }: PayloadAction<boolean>) => {
      state.isLoading = payload
    },

    /**
     * Saves the quiz state before authentication
     */
    saveStateBeforeAuth: (state, { payload }: PayloadAction<SaveStateBeforeAuthPayload>) => {
      // Log state saving
      console.log("Saving quiz state before authentication")

      state.savedState = payload
    },

    /**
     * Clears the saved state
     */
    clearSavedState: (state) => {
      state.savedState = null
      state.pendingAuthRequired = false
    },

    /**
     * Restores the quiz state from saved state
     */
    restoreFromSavedState: (state) => {
      // Check if we have a saved state
      if (!state.savedState) {
        console.warn("No saved state to restore")
        return
      }

      // Log restoration
      console.log("Restoring quiz state from saved state")

      const saved = state.savedState

      // Restore state properties
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
      // fetchQuizResults reducers
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

      // submitQuizResults reducers
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
  },
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
  prepareResults,
} = quizSlice.actions

export default quizSlice.reducer
