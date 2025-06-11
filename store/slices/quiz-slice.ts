import { createSlice, createAsyncThunk, type PayloadAction, createSelector } from "@reduxjs/toolkit"
import type { RootState } from "../index"
import type { QuizType } from "@/types/quiz"
import { hydrateFromStorage } from "../middleware/persistMiddleware"
import { apiClient } from "@/lib/api-client"
import { StorageService } from "@/lib/storage-service"

// Export API endpoints for consistency across the app
export const API_ENDPOINTS = {
  mcq: "/api/quizzes/mcq",
  code: "/api/quizzes/code",
  blanks: "/api/quizzes/blanks",
  openended: "/api/quizzes/openended",
  flashcard: "/api/quizzes/flashcard",
  common: "/api/quizzes/common",
}

export interface QuizState {
  quizId: string | null
  quizType: QuizType | null
  title: string
  questions: any[]
  currentQuestionIndex: number
  answers: { [questionId: string]: any }
  isCompleted: boolean
  results: any | null
  error: string | null
  status: "idle" | "loading" | "succeeded" | "failed" | "submitting"
  sessionId: string | null
  pendingQuiz: { slug: string; quizData: any; currentState?: any } | null
  authRedirectState: { callbackUrl: string; quizState: any } | null
  shouldRedirectToAuth: boolean
  shouldRedirectToResults: boolean
  authStatus: "checking" | "authenticated" | "unauthenticated" | "idle"
  slug: string | null
  wasReset?: boolean
  isSaving: boolean
  isSaved: boolean
  saveError: string | null
  isProcessingResults: boolean
}

// Load persisted state from storage for hydration
const loadPersistedState = (): Partial<QuizState> => {
  const persisted = hydrateFromStorage<Partial<QuizState>>("quiz_state")
  return persisted || {}
}

const initialState: QuizState = {
  slug: null,
  quizId: null,
  quizType: "mcq",
  title: "",
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  isCompleted: false,
  results: null,
  error: null,
  status: "idle",
  sessionId: null,
  pendingQuiz: null,
  authRedirectState: null,
  shouldRedirectToAuth: false,
  shouldRedirectToResults: false,
  authStatus: "idle",
  isSaving: false,
  isSaved: false,
  saveError: null,
  isProcessingResults: false,
  ...loadPersistedState(),
}

// Modified fetchQuiz thunk to use apiClient
export const fetchQuiz = createAsyncThunk(
  "quiz/fetchQuiz",
  async ({ slug, data, type }: { slug: string; data?: any; type: QuizType }, { rejectWithValue }) => {
    try {
      const questions = data?.questions?.map((q: any) => ({ ...q, type })) || []
      if (data) {
        return {
          slug,
          id: slug,
          type: data.type || type,
          title: data.title || "Untitled Quiz",
          questions,
        }
      }

      const quizData = await apiClient.get(`/api/quizzes/${type}/${slug}`)

      return {
        slug: quizData.slug || slug,
        id: quizData.id || slug,
        type: quizData.type || type,
        title: quizData.title || "Untitled Quiz",
        questions: quizData.questions || [],
      }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

// Enhanced submitQuiz thunk that preserves state
export const submitQuiz = createAsyncThunk("quiz/submitQuiz", async (_, { getState, rejectWithValue }) => {
  const state = getState() as RootState
  const { quizId, slug, quizType, questions, answers, title } = state.quiz

  try {
    let score = 0
    let totalAnswered = 0

    const questionResults = questions.map((question) => {
      const qid = String(question.id)
      const answer = answers[qid]
      const correctAnswer = question.correctOptionId || question.correctAnswer || question.answer || ""
      let userAnswer: string | null = null
      let isCorrect = false

      if (!answer) {
        return {
          questionId: qid,
          question: question.question || question.text,
          isCorrect: false,
          userAnswer: null,
          correctAnswer,
          skipped: true,
          type: question.type || quizType,
        }
      }

      switch (question.type || quizType) {
        case "mcq":
        case "code":
          userAnswer = answer.selectedOptionId || answer.selectedOption || ""
          isCorrect = answer.isCorrect === true
          break

        case "blanks":
          userAnswer = answer.userAnswer || answer.text || ""
          isCorrect = answer.isCorrect === true
          break

        case "openended":
          userAnswer = answer.text || answer.userAnswer || ""
          isCorrect = answer.isCorrect === true
          break

        default:
          userAnswer = answer.userAnswer || answer.text || ""
          isCorrect = answer.isCorrect === true
      }

      if (userAnswer) totalAnswered++
      if (isCorrect) score++

      return {
        questionId: qid,
        question: question.question || question.text,
        isCorrect,
        userAnswer,
        correctAnswer,
        skipped: false,
        type: question.type || quizType,
      }
    })

    const results = {
      quizId: quizId || slug,
      slug: slug,
      title: title || "Quiz Results",
      quizType,
      score,
      maxScore: questions.length,
      totalAnswered,
      percentage: Math.round((score / questions.length) * 100),
      submittedAt: new Date().toISOString(),
      questionResults,
      questions: questionResults,
      answers: Object.values(answers),
    }

    return results
  } catch (error: any) {
    return rejectWithValue(error.message)
  }
})

// Helper function to normalize slug
export const normalizeSlug = (slugInput: any): string => {
  if (typeof slugInput === "object" && slugInput !== null) {
    return slugInput.slug || slugInput.id || String(slugInput)
  }
  return String(slugInput)
}

// Other thunks remain the same...
export const initializeQuiz = createAsyncThunk(
  "quiz/initializeQuiz",
  async (
    { slug, quizData, authStatus, quizType }: { slug: string; quizData?: any; authStatus: string; quizType: QuizType },
    { dispatch, getState },
  ) => {
    const state = getState() as RootState

    if (authStatus !== "authenticated") {
      const currentState = {
        currentQuestionIndex: state.quiz.currentQuestionIndex,
        answers: state.quiz.answers,
        isCompleted: state.quiz.isCompleted,
      }

      dispatch(setPendingQuiz({ slug, quizData, currentState }))
      dispatch(setAuthRedirect(`/dashboard/common/${quizType}/${slug}`))
      return { requiresAuth: true }
    }

    if (quizData) {
      return {
        quizData: {
          id: slug,
          type: quizType,
          title: quizData.title || `${quizType.toUpperCase()} Quiz`,
          questions: quizData.questions || [],
        },
      }
    }

    const response = await fetch(`/api/quizzes/${quizType}/${slug}`)
    if (!response.ok) {
      throw new Error(`Failed to load quiz: ${response.status}`)
    }
    const data = await response.json()

    return {
      quizData: {
        id: slug,
        type: quizType,
        title: data.title || `${quizType.toUpperCase()} Quiz`,
        questions: data.questions || [],
      },
    }
  },
)

export const restoreQuizAfterAuth = createAsyncThunk("quiz/restoreQuizAfterAuth", async (_, { getState, dispatch }) => {
  const state = getState() as RootState

  let pendingQuiz = state.quiz.pendingQuiz
  let pendingResults = null

  if (typeof window !== "undefined") {
    try {
      const resultJson = localStorage.getItem("pendingQuizResults")
      if (resultJson) {
        pendingResults = JSON.parse(resultJson)
        console.log("Restored pending quiz results:", pendingResults)
      }

      if (!pendingQuiz) {
        const stored = sessionStorage.getItem("pendingQuiz")
        if (stored) {
          pendingQuiz = JSON.parse(stored)
        }
      }
    } catch (err) {
      console.error("Failed to restore pending quiz data:", err)
    }
  }

  if (pendingResults?.results) {
    localStorage.removeItem("pendingQuizResults")

    const normalizedSlug = normalizeSlug(pendingResults.slug)

    return {
      slug: normalizedSlug,
      quizData: {
        type: pendingResults.quizType || "mcq",
        title: pendingResults.title || "Quiz Results",
        questions: pendingResults.questions || [],
      },
      currentState: {
        results: pendingResults.results,
        showResults: true,
      },
    }
  }

  if (pendingQuiz) {
    dispatch(clearAuthRedirect())

    if (pendingQuiz.slug) {
      pendingQuiz.slug = normalizeSlug(pendingQuiz.slug)
    }

    return pendingQuiz
  }

  throw new Error("No pending quiz to restore")
})

// Other thunks...
export const submitQuizAndPrepareResults = createAsyncThunk(
  "quiz/submitQuizAndPrepareResults",
  async ({ slug }: { slug: string }, { getState }) => {
    const state = getState() as RootState
    const { questions, answers, title } = state.quiz

    let score = 0
    const questionResults = questions.map((question) => {
      const answer = answers[String(question.id)]
      const isCorrect = answer?.isCorrect === true
      if (isCorrect) score++

      return {
        questionId: question.id,
        isCorrect,
        userAnswer: answer?.selectedOptionId || null,
        correctAnswer: question.correctOptionId || question.answer,
      }
    })

    const results = {
      quizId: state.quiz.quizId,
      slug: slug,
      title: title || "Quiz Results",
      score,
      maxScore: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      completedAt: new Date().toISOString(),
      questions,
      answers: Object.values(answers),
      questionResults,
    }

    return results
  },
)

export const checkAuthAndLoadResults = createAsyncThunk(
  "quiz/checkAuthAndLoadResults",
  async ({ slug, authStatus }: { slug: string; authStatus: string }, { getState, dispatch }) => {
    if (authStatus !== "authenticated") {
      dispatch(setAuthRedirect(`/dashboard/mcq/${slug}/results`))
      return { requiresAuth: true }
    }

    const state = getState() as RootState

    if (state.quiz.results) {
      return { results: state.quiz.results }
    }

    const { questions, answers, title } = state.quiz
    if (questions.length > 0 && Object.keys(answers).length > 0) {
      let score = 0
      const questionResults = questions.map((question) => {
        const answer = answers[String(question.id)]
        const isCorrect = answer?.isCorrect === true
        if (isCorrect) score++

        return {
          questionId: question.id,
          isCorrect,
          userAnswer: answer?.selectedOptionId || null,
          correctAnswer: question.correctOptionId || question.answer,
        }
      })

      const results = {
        quizId: state.quiz.quizId,
        slug,
        title: title || "Quiz Results",
        score,
        maxScore: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        completedAt: new Date().toISOString(),
        questions,
        answers: Object.values(answers),
        questionResults,
      }

      return { results }
    }

    throw new Error("No quiz results available")
  },
)

export const fetchQuizResults = createAsyncThunk(
  "quiz/fetchResults",
  async (slug: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState
      const results = state.quiz?.results
      if (!results) {
        return rejectWithValue("NO_RESULTS_REDIRECT_TO_QUIZ")
      }
      return results
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to get quiz results")
    }
  },
)

export const rehydrateQuizState = createAsyncThunk(
  "quiz/rehydrateState",
  async (pendingQuiz: { slug: string; quizData: any; currentState: any }, { getState, dispatch }) => {
    try {
      const state = getState() as RootState
      const { slug, quizData, currentState } = pendingQuiz

      if (quizData?.questions?.length > 0) {
        dispatch(
          setQuiz({
            quizId: slug,
            title: quizData.title || "Quiz",
            questions: quizData.questions,
            type: quizData.type || "code",
          }),
        )

        if (currentState?.answers && Object.keys(currentState.answers).length > 0) {
          Object.entries(currentState.answers).forEach(([questionId, answer]) => {
            dispatch(
              saveAnswer({
                questionId,
                answer,
              }),
            )
          })
        }

        if (currentState?.showResults) {
          dispatch(setQuizCompleted())
        }

        if (currentState?.results) {
          dispatch(setQuizResults(currentState.results))
        }

        return pendingQuiz
      }

      const response = await fetch(`/api/quizzes/${pendingQuiz.quizData.type}/${slug}`)
      if (!response.ok) {
        throw new Error(`Failed to load quiz: ${response.status}`)
      }
      const data = await response.json()

      dispatch(
        setQuiz({
          quizId: slug,
          title: data.title || "Quiz",
          questions: data.questions,
          type: data.type || "code",
        }),
      )

      return pendingQuiz
    } catch (error) {
      console.error("Error rehydrating quiz:", error)
      return null
    }
  },
)

export const persistQuizState = createAsyncThunk(
  "quiz/persistState",
  async (
    {
      stateType,
      data,
      useLocalStorage = false,
    }: { stateType: "results" | "progress" | "pendingQuiz"; data: any; useLocalStorage?: boolean },
    { dispatch },
  ) => {
    const storageService = StorageService.getInstance()

    switch (stateType) {
      case "results":
        dispatch(setQuizResults(data))
        break
      case "pendingQuiz":
        dispatch(setPendingQuiz(data))
        break
    }

    const key = `quiz_${stateType}_${data.slug || "current"}`

    if (useLocalStorage) {
      storageService.setPersistentQuizState(key, data)
    } else {
      storageService.setTemporaryQuizState(key, data)
    }

    return { key, data }
  },
)

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
      state.currentQuestionIndex = action.payload
    },

    resetQuiz: (state) => {
      if (!state.isProcessingResults) {
        state.questions = []
        state.answers = {}
        state.results = null
        state.status = "idle"
        state.currentQuestionIndex = 0
        state.isCompleted = false
        state.error = null
        state.slug = null
        state.quizId = null
        state.title = ""
        state.wasReset = true
      }
    },

    safeResetQuiz: (state) => {
      state.questions = []
      state.answers = {}
      state.results = null
      state.status = "idle"
      state.currentQuestionIndex = 0
      state.isCompleted = false
      state.error = null
      state.slug = null
      state.quizId = null
      state.title = ""
      state.isProcessingResults = false
      state.wasReset = true
    },

    hydrateQuiz: (state, action: PayloadAction<any>) => {
      const { slug, quizData, currentState } = action.payload
      state.slug = slug
      state.questions = quizData.questions || []
      state.answers = currentState?.answers || {}
    },

    setQuizResults: (state, action: PayloadAction<any>) => {
      state.results = action.payload
      state.isProcessingResults = false

      if (action.payload?.slug && typeof action.payload.slug === "object") {
        state.slug = normalizeSlug(action.payload.slug)
      }

      state.status = "succeeded"
    },

    resetPendingQuiz: (state) => {
      // Clear redirect cache
    },

    // Fixed saveAnswer to properly handle completion logic
    saveAnswer: (state, action: PayloadAction<{ questionId: string; answer: any }>) => {
      const { questionId, answer } = action.payload
      const qid = String(questionId)
      const question = state.questions.find((q) => String(q.id) === qid)

      if (!question) return

      let isCorrect = false
      let userAnswer = null

      switch (question.type) {
        case "mcq":
        case "code": {
          const selected = answer.selectedOptionId || answer.selectedOption
          const correct = question.correctOptionId || question.correctAnswer || question.answer
          isCorrect = selected === correct
          userAnswer = selected
          break
        }

        case "blanks": {
          const userInput = answer.userAnswer || answer.text || ""
          const correctAnswer = question.answer?.trim().toLowerCase() || ""
          isCorrect = userInput.trim().toLowerCase() === correctAnswer
          userAnswer = userInput
          break
        }

        case "openended": {
          const text = answer.text || answer.userAnswer || ""
          isCorrect = answer.isCorrect === true // Use provided isCorrect for openended
          userAnswer = text
          break
        }

        default:
          userAnswer = answer.userAnswer || answer.text || ""
          isCorrect = answer.isCorrect === true
      }

      state.answers[qid] = {
        ...answer,
        userAnswer,
        isCorrect,
        type: question.type,
        timestamp: Date.now(),
      }

      // Fixed completion logic - only mark complete when explicitly called
      // Don't auto-complete based on answered questions
    },

    clearResetFlag: (state) => {
      state.wasReset = false
    },

    setPendingQuiz: (state, action: PayloadAction<{ slug: string; quizData: any; currentState?: any }>) => {
      state.pendingQuiz = action.payload
    },

    clearPendingQuiz: (state) => {
      state.pendingQuiz = null
    },

    hydrateStateFromStorage: (state) => {
      const persisted = hydrateFromStorage<Partial<QuizState>>("quiz_state")
      if (persisted) {
        Object.entries(persisted).forEach(([key, value]) => {
          if (value !== undefined) {
            ;(state as any)[key] = value
          }
        })
      }
    },

    setAuthRedirect: (state, action: PayloadAction<string>) => {
      state.shouldRedirectToAuth = true
      state.authRedirectState = { callbackUrl: action.payload, quizState: null }
    },

    clearAuthRedirect: (state) => {
      state.shouldRedirectToAuth = false
      state.authRedirectState = null
    },

    setResultsRedirect: (state) => {
      state.shouldRedirectToResults = true
    },

    clearResultsRedirect: (state) => {
      state.shouldRedirectToResults = false
    },

    setQuizCompleted: (state) => {
      state.isCompleted = true
      state.isProcessingResults = true
    },

    setQuizId: (state, action: PayloadAction<string | number>) => {
      const id = String(action.payload)
      state.quizId = id
      state.slug = id
    },

    setQuizType: (state, action: PayloadAction<string>) => {
      state.quizType = action.payload as QuizType
    },

    setSessionId: (state, action: PayloadAction<string | null>) => {
      state.sessionId = action.payload
    },

    setQuizLoading(state) {
      state.status = "loading"
      state.error = null
    },
    setQuizSuccess(state) {
      state.status = "succeeded"
    },
    setQuizFailed(state, action: PayloadAction<string>) {
      state.status = "failed"
      state.error = action.payload
    },
    resetSaveStatus(state) {
      state.isSaving = false
      state.isSaved = false
      state.saveError = null
    },

    setQuiz: (state, action: PayloadAction<{ quizId: string; title: string; questions: any[]; type: string }>) => {
      const { quizId, title, questions, type } = action.payload
      state.quizId = quizId
      state.slug = quizId
      state.title = title
      state.questions = questions
      state.quizType = type as QuizType
      state.status = "succeeded"
    },

    resetState: () => {
      return initialState
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchQuiz.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchQuiz.fulfilled, (state, action) => {
        if (!action.payload) {
          console.warn("fetchQuiz fulfilled: payload is undefined", action)
          state.status = "failed"
          state.error = "Failed to load quiz data."
          return
        }

        const { slug, id, type, title, questions } = action.payload

        state.status = "succeeded"
        state.slug = slug || "unknown"
        state.quizId = id || slug || "unknown"
        state.quizType = type || "mcq"
        state.title = title || "Untitled Quiz"
        state.questions = questions || []
        state.currentQuestionIndex = 0
        state.answers = {}
        state.isCompleted = false
        state.results = null

        console.info("Quiz loaded successfully:", { slug, id, type, title, questions })
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload as string
      })

      .addCase(submitQuiz.pending, (state) => {
        state.status = "submitting"
        state.error = null
        state.isProcessingResults = true
      })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.results = action.payload
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload as string
        state.isProcessingResults = false
      })

      .addCase(fetchQuizResults.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchQuizResults.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.results = action.payload
      })
      .addCase(fetchQuizResults.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload as string
      })

      .addCase(initializeQuiz.pending, (state) => {
        state.status = "loading"
        state.error = null
        state.authStatus = "checking"
      })
      .addCase(initializeQuiz.fulfilled, (state, action) => {
        if (action.payload.requiresAuth) {
          state.status = "idle"
          state.authStatus = "unauthenticated"
        } else if (action.payload.quizData) {
          state.status = "succeeded"
          state.authStatus = "authenticated"
          state.quizId = action.payload.quizData.id
          state.quizType = action.payload.quizData.type
          state.title = action.payload.quizData.title
          state.questions = action.payload.quizData.questions
        }
      })
      .addCase(initializeQuiz.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to initialize quiz"
      })

      .addCase(restoreQuizAfterAuth.fulfilled, (state, action) => {
        const { slug, quizData, currentState } = action.payload
        state.quizId = slug
        state.slug = slug
        state.quizType = "mcq"
        state.title = quizData?.title || ""
        state.questions = quizData?.questions || []

        if (currentState) {
          state.currentQuestionIndex = currentState.currentQuestionIndex || 0
          state.answers = currentState.answers || {}
          state.isCompleted = currentState.isCompleted || false
        }

        state.pendingQuiz = null
        state.shouldRedirectToAuth = false
        state.status = "succeeded"
      })

      .addCase(submitQuizAndPrepareResults.pending, (state) => {
        state.status = "submitting"
        state.isProcessingResults = true
      })
      .addCase(submitQuizAndPrepareResults.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.results = action.payload
        state.shouldRedirectToResults = true
      })
      .addCase(submitQuizAndPrepareResults.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to submit quiz"
        state.isProcessingResults = false
      })

      .addCase(checkAuthAndLoadResults.pending, (state) => {
        state.status = "loading"
        state.authStatus = "checking"
      })
      .addCase(checkAuthAndLoadResults.fulfilled, (state, action) => {
        if (action.payload.requiresAuth) {
          state.authStatus = "unauthenticated"
          state.status = "idle"
        } else if (action.payload.results) {
          state.authStatus = "authenticated"
          state.status = "succeeded"
          state.results = action.payload.results
        }
      })
      .addCase(checkAuthAndLoadResults.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to load results"
      })

      .addCase(saveQuizResultsToDatabase.pending, (state) => {
        state.isSaving = true
        state.saveError = null
      })
      .addCase(saveQuizResultsToDatabase.fulfilled, (state) => {
        state.isSaving = false
        state.isSaved = true
      })
      .addCase(saveQuizResultsToDatabase.rejected, (state, action) => {
        state.isSaving = false
        state.saveError = action.payload as string
      })
  },
})

export const {
  setCurrentQuestionIndex,
  saveAnswer,
  resetQuiz,
  safeResetQuiz,
  clearResetFlag,
  setQuizResults,
  setPendingQuiz,
  resetPendingQuiz,
  hydrateQuiz,
  clearPendingQuiz,
  setAuthRedirect,
  clearAuthRedirect,
  setResultsRedirect,
  clearResultsRedirect,
  setQuizCompleted,
  setQuizId,
  setQuizType,
  setSessionId,
  resetSaveStatus,
  setQuiz,
  resetState,
  hydrateStateFromStorage,
} = quizSlice.actions

// Selectors
export const selectQuizState = (state: RootState | any) => state?.quiz ?? {}
export const selectQuestions = createSelector([selectQuizState], (quiz) => quiz?.questions ?? [])
export const selectAnswers = createSelector([selectQuizState], (quiz) => quiz?.answers ?? {})
export const selectQuizStatus = createSelector([selectQuizState], (quiz) => quiz?.status ?? "idle")
export const selectQuizError = createSelector([selectQuizState], (quiz) => quiz?.error ?? null)
export const selectCurrentQuestionIndex = createSelector([selectQuizState], (quiz) => quiz?.currentQuestionIndex ?? 0)
export const selectIsQuizComplete = createSelector([selectQuizState], (quiz) => quiz?.isCompleted ?? false)
export const selectQuizResults = createSelector([selectQuizState], (quiz) => quiz?.results ?? null)
export const selectQuizTitle = createSelector([selectQuizState], (quiz) => quiz?.title ?? "")
export const selectQuizId = createSelector([selectQuizState], (quiz) => quiz?.slug)
export const selectIsProcessingResults = createSelector([selectQuizState], (quiz) => quiz?.isProcessingResults ?? false)

export const selectCurrentQuestion = createSelector(
  [selectQuestions, selectCurrentQuestionIndex],
  (questions, index) => questions[index] || null,
)

export const clearAuthState = (state: RootState) => {
  const quiz = selectQuizState(state)
  quiz.shouldRedirectToAuth = false
  quiz.authRedirectState = null
  quiz.authStatus = "idle"
}

export const selectShouldRedirectToAuth = createSelector([selectQuizState], (quiz) => quiz.shouldRedirectToAuth)
export const selectShouldRedirectToResults = createSelector([selectQuizState], (quiz) => quiz.shouldRedirectToResults)
export const selectAuthRedirectUrl = createSelector([selectQuizState], (quiz) => quiz.authRedirectState?.callbackUrl)

export const selectOrGenerateQuizResults = createSelector(
  [selectQuestions, selectAnswers, selectQuizTitle, selectQuizId],
  (questions, answers, title, quizId) => {
    if (Object.keys(answers).length === 0 || questions.length === 0) {
      return null
    }

    const questionResults = Object.entries(answers).map(([questionId, answerData]) => {
      const question = questions.find((q) => q.id.toString() === questionId)
      let isCorrect = false

      if (question && answerData.selectedOptionId) {
        if (question.answer === answerData.selectedOptionId) {
          isCorrect = true
        }
      }

      return {
        questionId,
        userAnswer: answerData.selectedOptionId || "Not answered",
        selectedOptionId: answerData.selectedOptionId,
        isCorrect,
      }
    })

    const correctCount = questionResults.filter((qr) => qr.isCorrect).length
    const totalCount = questions.length
    const percentage = Math.round((correctCount / totalCount) * 100)

    return {
      quizId,
      slug: quizId,
      title: title || `Quiz ${quizId}`,
      completedAt: new Date().toISOString(),
      maxScore: totalCount,
      score: correctCount,
      percentage,
      questionResults,
      questions,
    }
  },
)

export const selectPendingQuiz = (state: RootState | any) => state?.quiz?.pendingQuiz ?? null

export const selectAnswerForQuestion = (state: RootState | any, questionId: string | number) => {
  const normalizedId = String(questionId)
  return state?.quiz?.answers?.[normalizedId] ?? null
}

export const restoreAuthRedirectState = (state: RootState | any) => {
  if (!state || !state.quiz) return null
  return state.quiz.authRedirectState || null
}

export const selectIsSaving = createSelector([selectQuizState], (quiz) => quiz.isSaving)
export const selectIsSaved = createSelector([selectQuizState], (quiz) => quiz.isSaved)
export const selectSaveError = createSelector([selectQuizState], (quiz) => quiz.saveError)

export default quizSlice.reducer

export const saveAuthRedirectState = (state: RootState, payload: { callbackUrl: string; quizState: any }) => {
  const quiz = selectQuizState(state)
  quiz.authRedirectState = payload
}

export const saveQuizResultsToDatabase = createAsyncThunk(
  "quiz/saveResultsToDatabase",
  async ({ slug, quizType }: { slug: string; quizType: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState
      const { results, title, questions } = state.quiz

      if (!results) {
        return rejectWithValue("No results to save")
      }

      const resultData = {
        quizId: state.quiz.quizId,
        type: state.quiz.quizType,
        totalTime: 60,
        score: results.score || results.userScore || 0,
        maxScore: results.maxScore || questions.length || 0,
        percentage: results.percentage || 0,
        totalQuestions: questions.length || 0,
        title: results.title || title || `${quizType} Quiz`,
        answers: (results.questionResults || []).map((qr: { questionId: any; isCorrect: any; userAnswer: any }) => ({
          questionId: qr.questionId,
          timeSpent: 30,
          isCorrect: qr.isCorrect || false,
          userAnswer: qr.userAnswer || "",
          answer: qr.userAnswer || "",
        })),
        slug: slug,
      }

      return await apiClient.post(`/api/quizzes/common/${slug}/complete`, resultData)
    } catch (error: any) {
      console.error("Error in saveQuizResultsToDatabase:", error)
      return rejectWithValue(error.message || "Failed to save results")
    }
  },
)
