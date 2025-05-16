// store/slices/quizSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { QuizData, UserAnswer, QuizResult, QuizHistoryItem, QuizType } from "@/app/types/quiz-types"

export const API_ENDPOINTS: Record<QuizType, string> = {
  mcq: "/api/quizzes/mcq",
  code: "/api/quizzes/code",
  blanks: "/api/quizzes/blanks",
  openended: "/api/quizzes/openended",
}

const normalizeQuizData = (raw: any, slug: string, type: QuizType): QuizData => ({
  id: raw.quizId || raw.id || "",
  title: raw.quizData?.title || "Quiz",
  slug,
  type,
  questions: Array.isArray(raw.quizData?.questions)
    ? raw.quizData.questions.map((q, index) => ({
        id: q.id || `q-${index}-${Math.random().toString(36).substring(2, 8)}`,
        question: q.question || "",
        codeSnippet: q.codeSnippet || "",
        options: Array.isArray(q.options) ? [...q.options] : [],
        answer: q.answer || q.correctAnswer || "",
        correctAnswer: q.correctAnswer || q.answer || "",
        language: q.language || "javascript",
      }))
    : [],
  isPublic: !!raw.isPublic,
  isFavorite: !!raw.isFavorite,
  ownerId: raw.ownerId || "",
  timeLimit: raw.quizData?.timeLimit || null,
})

// -----------------------------------------
// Initial State
// -----------------------------------------
interface QuizState {
  quizData: QuizData | null
  currentQuestion: number
  userAnswers: UserAnswer[]
  isLoading: boolean
  isSubmitting: boolean
  isCompleted: boolean
  timerActive: boolean
  timeRemaining: number | null
  currentQuizId: string | null
  results: QuizResult | null
  quizHistory: QuizHistoryItem[]

  quizError: string | null
  submissionError: string | null
  resultsError: string | null
  historyError: string | null
}

const initialState: QuizState = {
  quizData: null,
  currentQuestion: 0,
  userAnswers: [],
  isLoading: false,
  isSubmitting: false,
  isCompleted: false,
  timerActive: false,
  timeRemaining: null,
  currentQuizId: null,
  results: null,
  quizHistory: [],
  quizError: null,
  submissionError: null,
  resultsError: null,
  historyError: null,
}

// -----------------------------------------
// Async Thunks
// -----------------------------------------
export const fetchQuiz = createAsyncThunk(
  "quiz/fetchQuiz",
  async ({ slug, type }: { slug: string; type: QuizType }, { rejectWithValue }) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ""
      const endpoint = API_ENDPOINTS[type]
      const url = new URL(`${endpoint}/${slug}`, baseUrl).toString()

      const response = await fetch(url)
      if (!response.ok) {
        const err = await response.json()
        return rejectWithValue(err.message || `Failed to fetch ${type} quiz`)
      }

      const data = await response.json()
      return normalizeQuizData(data, slug, type)
    } catch {
      return rejectWithValue("Failed to load quiz. Please try again.")
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
    }: { slug: string; quizId?: string; type?: QuizType; answers: UserAnswer[]; timeTaken?: number },
    { rejectWithValue },
  ) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ""
      const response = await fetch(`${baseUrl}/api/quizzes/common/${slug}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          quizId,
          type,
          answers: answers.map((a) => ({
            questionId: a.questionId,
            answer: a.answer,
          })),
          timeTaken,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        return rejectWithValue(err.message || "Failed to submit quiz")
      }

      return await response.json()
    } catch (error) {
      console.error("Error submitting quiz:", error)
      return rejectWithValue("Unexpected error submitting quiz.")
    }
  },
)

export const getQuizResults = createAsyncThunk("quiz/getResults", async (slug: string, { rejectWithValue }) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ""
    const response = await fetch(`${baseUrl}/api/quizzes/results?slug=${slug}`)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to retrieve results" }))
      return rejectWithValue(errorData.message || "Could not retrieve results")
    }
    
    const data = await response.json()
    
    // Validate that we received proper results data
    if (!data || typeof data !== 'object') {
      return rejectWithValue("Invalid results data received")
    }
    
    // Ensure we have the necessary fields for the quiz results
    const processedData = {
      ...data,
      title: data.title || "Quiz",
      slug: data.slug || slug,
      score: typeof data.score === 'number' ? data.score : 0,
      maxScore: typeof data.maxScore === 'number' ? data.maxScore : 0,
      completedAt: data.completedAt || new Date().toISOString(),
      questions: Array.isArray(data.questions) ? data.questions.map(q => ({
        ...q,
        question: q.question || "Question",
        userAnswer: q.userAnswer || "",
        correctAnswer: q.correctAnswer || "",
        isCorrect: !!q.isCorrect
      })) : []
    }
    
    return processedData
  } catch (error) {
    console.error("Error fetching quiz results:", error)
    return rejectWithValue("Unexpected error fetching results.")
  }
})

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
// Slice
// -----------------------------------------
const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    resetQuizState: (state) => {
      const preservedHistory = state.quizHistory
      Object.assign(state, { ...initialState, quizHistory: preservedHistory })
    },
    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestion = action.payload
    },
    setUserAnswer: (state, action: PayloadAction<UserAnswer>) => {
      const i = state.userAnswers.findIndex((a) => a.questionId === action.payload.questionId)
      if (i !== -1) state.userAnswers[i] = action.payload
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
      // Ensure timeRemaining is preserved for result calculations
      if (state.timeRemaining !== null) {
        state.timeRemaining = 0
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuiz.pending, (state) => {
        state.isLoading = true
        state.quizError = null
      })
      .addCase(fetchQuiz.fulfilled, (state, action) => {
        state.quizData = action.payload
        state.currentQuizId = action.payload.id
        state.userAnswers = []
        state.currentQuestion = 0
        state.isLoading = false
        state.isCompleted = false
        state.timeRemaining = action.payload.timeLimit ? action.payload.timeLimit * 60 : null
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        state.isLoading = false
        state.quizError = action.payload as string
      })

      .addCase(submitQuiz.pending, (state) => {
        state.isSubmitting = true
        state.submissionError = null
      })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        state.results = action.payload
        state.isCompleted = true
        state.isSubmitting = false
        state.timerActive = false

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
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.isSubmitting = false
        state.submissionError = action.payload as string
      })

      .addCase(getQuizResults.pending, (state) => {
        state.isLoading = true
        state.resultsError = null
      })
      .addCase(getQuizResults.fulfilled, (state, action) => {
        state.results = action.payload
        state.isCompleted = true
        state.isLoading = false
      })
      .addCase(getQuizResults.rejected, (state, action) => {
        state.isLoading = false
        state.resultsError = action.payload as string
      })

      .addCase(fetchQuizHistory.pending, (state) => {
        state.isLoading = true
        state.historyError = null
      })
      .addCase(fetchQuizHistory.fulfilled, (state, action) => {
        state.quizHistory = action.payload
        state.isLoading = false
      })
      .addCase(fetchQuizHistory.rejected, (state, action) => {
        state.isLoading = false
        state.historyError = action.payload as string
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
} = quizSlice.actions

export default quizSlice.reducer
