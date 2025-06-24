import { createSlice, createAsyncThunk, type PayloadAction, createSelector } from "@reduxjs/toolkit"
import type { FlashCard } from "@/app/types/types"
import type { RootState } from ".."
import { ANSWER_TYPES } from "@/constants/global"
import { createEntityAdapter } from "@reduxjs/toolkit"

interface RatingAnswer {
  questionId: string
  answer: typeof ANSWER_TYPES[keyof typeof ANSWER_TYPES]
  timeSpent?: number
  userAnswer?: any
  isCorrect?: boolean
}

interface SavedAnswer {
  questionId: string
  saved: boolean
  timestamp?: number
}

type AnswerEntry = RatingAnswer | SavedAnswer

interface QuizResultsState {
  quizId: string
  slug: string
  title: string
  correctCount: number
  incorrectCount: number
  stillLearningCount: number
  totalTime: number
  totalQuestions: number
  score: number
  percentage: number
  reviewCards: number[]
  stillLearningCards: number[]
  completedAt: string
  questions: FlashCard[]
  savedLocally?: boolean
  error?: string
  correctAnswers?: number
  stillLearningAnswers?: number
  incorrectAnswers?: number
  maxScore?: number
  userScore?: number
}

interface FlashcardQuizState {
  quizId: string | null
  slug: string | null
  title: string
  questions: FlashCard[]
  currentQuestion: number
  answers: AnswerEntry[]
  status: "idle" | "loading" | "succeeded" | "failed" | "submitting" | "completed" | "completed_with_errors"
  error: string | null
  isCompleted: boolean
  results: QuizResultsState | null
  shouldRedirectToResults: boolean
  requiresAuth: boolean
  pendingAuthRequired: boolean
}

const initialState: FlashcardQuizState = {
  quizId: null,
  slug: null,
  title: "",
  questions: [],
  currentQuestion: 0,
  answers: [],
  status: "idle",
  error: null,
  isCompleted: false,
  results: null,
  shouldRedirectToResults: false,
  requiresAuth: false,
  pendingAuthRequired: false,
}

// AUTOSAVE KEYS
const FLASHCARD_RESULTS_KEY = "flashcard_results"
const FLASHCARD_ANSWERS_KEY = "flashcard_answers"
const FLASHCARD_META_KEY = "flashcard_meta"

export const fetchFlashCardQuiz = createAsyncThunk(
  "flashcard/fetchQuiz",
  async (slug: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/quizzes/flashcard/${slug}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return rejectWithValue(errorData.message || `Failed to fetch flashcard quiz: ${response.status}`)
      }
      const data = await response.json()
      return {
        slug,
        id: data.id || slug,
        title: data.title || "Flashcard Quiz",
        questions: data.flashCards || [],
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Network error")
    }
  }
)

export const saveFlashCardResults = createAsyncThunk(
  "flashcard/saveResults",
  async ({ slug, data }: { slug: string; data: any }, { rejectWithValue, getState }) => {
    try {
      const response = await fetch(`/api/quizzes/common/${slug}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return rejectWithValue({
          error: errorData.message || `API error: ${response.status}`,
          ...data
        })
      }

      return await response.json()
    } catch (error: any) {
      return rejectWithValue({
        error: error.message || "Network error",
        ...data
      })
    }
  }
)

const flashcardSlice = createSlice({
  name: "flashcard",
  initialState,
  reducers: {
    initFlashCardQuiz: (
      state,
      action: PayloadAction<{ id: string; slug: string; title: string; questions: FlashCard[] }>
    ) => {
      state.quizId = action.payload.id
      state.slug = action.payload.slug
      state.title = action.payload.title
      state.questions = action.payload.questions
      state.currentQuestion = 0
      state.answers = []
      state.isCompleted = false
      state.results = null
      state.error = null
      state.status = "succeeded"

      try {
        localStorage.setItem(
          FLASHCARD_META_KEY,
          JSON.stringify({
            id: action.payload.id,
            slug: action.payload.slug,
            title: action.payload.title,
          })
        )
      } catch { }
    },
setFlashcardMeta: (state, action: PayloadAction<{ id: string; slug: string; title: string }>) => {
      const { id, slug, title } = action.payload
      state.quizId = id
      state.slug = slug
      state.title = title

      try {
        localStorage.setItem(
          FLASHCARD_META_KEY,
          JSON.stringify({ id, slug, title })
        )
      } catch { }
    },
    restoreFlashCardMeta: (state) => {
      try {
        const raw = localStorage.getItem(FLASHCARD_META_KEY)
        if (raw) {
          const { id, slug, title } = JSON.parse(raw)
          state.quizId = id || null
          state.slug = slug || null
          state.title = title || ""
        }
      } catch { }
    },
    resetRedirectFlag: (state) => {
      state.shouldRedirectToResults = false
    },
    submitFlashCardAnswer: (state, action: PayloadAction<{
      questionId: string | number
      answer: "correct" | "incorrect" | "still_learning"
      timeSpent?: number
    }>) => {
      const { questionId, answer, timeSpent } = action.payload
      const questionIdStr = String(questionId)

      const existingIndex = state.answers.findIndex(a =>
        (a as RatingAnswer).questionId === questionIdStr
      )

      const newAnswer: RatingAnswer = {
        questionId: questionIdStr,
        answer,
        isCorrect: answer === "correct",
        timeSpent: timeSpent || 0
      }

      if (existingIndex >= 0) {
        state.answers[existingIndex] = newAnswer
      } else {
        state.answers.push(newAnswer)
      }
      // Autosave answers after each answer
      try {
        localStorage.setItem(
          FLASHCARD_ANSWERS_KEY,
          JSON.stringify(state.answers)
        );
      } catch { }
    },

    completeFlashCardQuiz: (state, action: PayloadAction<QuizResultsState>) => {
      if (state.isCompleted) return;

      const results: QuizResultsState = {
        ...action.payload,
        completedAt: new Date().toISOString(),
        quizId: state.quizId || action.payload.quizId,
        slug: state.slug || action.payload.slug,
        title: state.title || action.payload.title,
        questions: [...state.questions],
        answers: [...state.answers],
        savedLocally: false,
      };

      state.results = results;
      state.isCompleted = true;
      state.status = "completed";
      state.shouldRedirectToResults = true;

      try {
        localStorage.setItem(FLASHCARD_RESULTS_KEY, JSON.stringify(results));
      } catch { }
    },

    setQuizResults: (state, action: PayloadAction<QuizResultsState>) => {
      state.results = action.payload;
      state.isCompleted = true;
      state.status = "succeeded";
      // Backup results to localStorage
      try {
        localStorage.setItem(
          FLASHCARD_RESULTS_KEY,
          JSON.stringify(action.payload)
        );
      } catch { }
    },

    resetFlashCards: (state) => {
      // Only reset if not submitting/loading
      if (state.status !== "submitting" && state.status !== "loading") {
        Object.assign(state, initialState);
        // Clear localStorage backup
        try {
          localStorage.removeItem(FLASHCARD_RESULTS_KEY);
          localStorage.removeItem(FLASHCARD_ANSWERS_KEY);
        } catch { }
      }
    },

    forceResetFlashCards: (state) => {
      Object.assign(state, initialState)
    },

    setCurrentFlashCard: (state, action: PayloadAction<number>) => {
      state.currentQuestion = action.payload
    },

    nextFlashCard: (state) => {
      if (state.currentQuestion < state.questions.length - 1) {
        state.currentQuestion += 1
      }
    },

    setRequiresFlashCardAuth: (state, action: PayloadAction<boolean>) => {
      state.requiresAuth = action.payload
    },

    setPendingFlashCardAuth: (state, action: PayloadAction<boolean>) => {
      state.pendingAuthRequired = action.payload
    },

    clearQuizState: (state) => {
      return { ...initialState }
    },

    completeQuiz: (state, action: PayloadAction<{ totalTime?: number }>) => {
      const answers = state.answers || []
      const totalQuestions = state.questions.length

      const correctCount = answers.filter(a =>
        (a as RatingAnswer).answer === "correct"
      ).length

      const stillLearningCount = answers.filter(a =>
        (a as RatingAnswer).answer === "still_learning"
      ).length

      const incorrectCount = answers.filter(a =>
        (a as RatingAnswer).answer === "incorrect"
      ).length

      const totalAnswered = correctCount + stillLearningCount + incorrectCount
      const unansweredCount = Math.max(0, totalQuestions - totalAnswered)
      const adjustedIncorrectCount = incorrectCount + unansweredCount

      const percentage = totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0

      const quizId = state.quizId || `quiz-${Date.now()}`
      const slug = state.slug || `quiz-${Date.now()}`

      const reviewCards = answers
        .map((a, i) => ((a as RatingAnswer).answer === "incorrect" ? i : -1))
        .filter(i => i >= 0 && i < totalQuestions)

      const stillLearningCards = answers
        .map((a, i) => ((a as RatingAnswer).answer === "still_learning" ? i : -1))
        .filter(i => i >= 0 && i < totalQuestions)

      state.results = {
        quizId,
        slug,
        title: state.title || "Flashcard Quiz",
        correctCount,
        incorrectCount: adjustedIncorrectCount,
        stillLearningCount,
        totalTime: action.payload.totalTime || 0,
        totalQuestions,
        score: correctCount,
        percentage,
        reviewCards,
        stillLearningCards,
        completedAt: new Date().toISOString(),
        questions: state.questions,
        correctAnswers: correctCount,
        incorrectAnswers: adjustedIncorrectCount,
        stillLearningAnswers: stillLearningCount,
        maxScore: totalQuestions,
        userScore: correctCount
      }

      state.isCompleted = true
      state.status = "completed"
      state.shouldRedirectToResults = true
    },

    restoreFlashcardStateFromStorage: (state) => {
      // Restore results and answers from localStorage if present
      try {
        const results = localStorage.getItem(FLASHCARD_RESULTS_KEY);
        if (results) {
          const parsed = JSON.parse(results);
          state.results = parsed;
          state.isCompleted = true;
          state.status = "succeeded";
        }
        const answers = localStorage.getItem(FLASHCARD_ANSWERS_KEY);
        if (answers) {
          state.answers = JSON.parse(answers);
        }
      } catch { }
    },

    resetRedirectFlag: (state) => {
      state.shouldRedirectToResults = false
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFlashCardQuiz.pending, (state) => {
        state.status = "loading"
        state.error = null
        state.questions = []
      })
      .addCase(fetchFlashCardQuiz.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.quizId = action.payload.id
        state.slug = action.payload.slug
        state.title = action.payload.title
        state.questions = action.payload.questions
      })
      .addCase(fetchFlashCardQuiz.rejected, (state, action) => {
        state.status = "failed"
        state.error = (action.payload as string) || action.error.message || "An unknown error occurred."
      })
      .addCase(saveFlashCardResults.pending, (state) => {
        state.status = "submitting"
      })
      .addCase(saveFlashCardResults.fulfilled, (state, action) => {
        state.status = "succeeded"
        if (action.payload) {
          state.results = {
            ...state.results,
            ...action.payload,
          } as QuizResultsState
        }
      })
      .addCase(saveFlashCardResults.rejected, (state, action) => {
        const payload = action.payload as any
        state.status = "completed_with_errors"
        if (payload) {
          state.results = {
            ...state.results,
            ...payload,
            error: payload.error,
          } as QuizResultsState
        } else {
          state.error = action.error.message || "Failed to save results."
        }
      })
  },
})

export const {
  initFlashCardQuiz,
  submitFlashCardAnswer,
  completeFlashCardQuiz,
  resetFlashCards,
  forceResetFlashCards,
  setCurrentFlashCard,
  nextFlashCard,
  setRequiresFlashCardAuth,
  setPendingFlashCardAuth,
  clearQuizState,
  setQuizResults,
  resetRedirectFlag,
  completeQuiz,
  restoreFlashcardStateFromStorage,
  setFlashcardMeta
} = flashcardSlice.actions

// Selectors
export const selectQuizId = (state: RootState) => state.flashcard.quizId
export const selectQuizSlug = (state: RootState) => state.flashcard.slug
export const selectQuizTitle = (state: RootState) => state.flashcard.title
export const selectQuizQuestions = (state: RootState) => state.flashcard.questions
export const selectIsQuizComplete = (state: RootState) => state.flashcard.isCompleted
export const selectQuizStatus = (state: RootState) => state.flashcard.status
export const selectQuizError = (state: RootState) => state.flashcard.error
export const selectRequiresAuth = (state: RootState) => state.flashcard.requiresAuth
export const selectPendingAuthRequired = (state: RootState) => state.flashcard.pendingAuthRequired
export const selectFlashcardState = (state: RootState) => state.flashcard
export const selectQuizResults = (state: RootState) => state.flashcard.results
export const selectQuizScore = (state: RootState) => state.flashcard.results?.score ?? 0
export const selectQuizTotalQuestions = (state: RootState) => state.flashcard.results?.totalQuestions ?? 0
export const selectQuizTotalTime = (state: RootState) => state.flashcard.results?.totalTime ?? 0
export const selectCurrentQuestionIndex = (state: RootState) => state.flashcard.currentQuestion
export const selectQuizAnswers = (state: RootState) => state.flashcard.answers
export const selectShouldRedirectToResults = (state: RootState) => state.flashcard.shouldRedirectToResults

export const selectFlashcardScore = (state: RootState) => {
  const results = state.flashcard.results
  if (!results) return 0
  return results.percentage || results.score || 0
}

export const selectFlashcardTotalQuestions = (state: RootState) => {
  const results = state.flashcard.results
  if (!results) return state.flashcard.questions.length || 0
  return results.totalQuestions || results.questions?.length || 0
}

export const selectFlashcardCorrectAnswers = (state: RootState) => {
  const results = state.flashcard.results
  if (!results) return 0
  return results.correctAnswers || results.userScore || 0
}

export const selectFlashcardTotalTime = (state: RootState) => {
  const results = state.flashcard.results
  if (!results) return 0
  return results.totalTime || 0
}

export const selectFlashcardStillLearningCount = (state: RootState) => {
  return state.flashcard.answers.filter((answer): answer is RatingAnswer =>
    (answer as RatingAnswer).answer === "still_learning"
  ).length
}

export const selectFlashcardIncorrectCount = (state: RootState) => {
  return state.flashcard.answers.filter((answer): answer is RatingAnswer =>
    (answer as RatingAnswer).answer === "incorrect"
  ).length
}

export const selectProcessedResults = createSelector(
  [selectQuizAnswers, selectQuizQuestions],
  (answers, questions) => {
    let correctCount = 0
    let stillLearningCount = 0
    let incorrectCount = 0
    const reviewCards: number[] = []
    const stillLearningCards: number[] = []

    answers.forEach((answer, index) => {
      if ('answer' in answer && (answer as RatingAnswer).answer) {
        if ((answer as RatingAnswer).answer === "correct") {
          correctCount++
        } else if ((answer as RatingAnswer).answer === "still_learning") {
          stillLearningCount++
          stillLearningCards.push(index)
        } else if ((answer as RatingAnswer).answer === "incorrect") {
          incorrectCount++
          reviewCards.push(index)
        }
      }
    })

    // Handle unanswered questions
    const unansweredCount = questions.length - answers.length
    const adjustedIncorrectCount = incorrectCount + unansweredCount

    return {
      correctCount,
      stillLearningCount,
      incorrectCount: adjustedIncorrectCount,
      totalCount: questions.length,
      reviewCards,
      stillLearningCards
    }
  }
)

export const selectFlashcardAnswerBreakdown = (state: RootState) => {
  const answers = state.flashcard.answers
  return {
    correct: answers.filter((answer): answer is RatingAnswer => (answer as RatingAnswer).answer === "correct").length,
    stillLearning: answers.filter((answer): answer is RatingAnswer => (answer as RatingAnswer).answer === "still_learning").length,
    incorrect: answers.filter((answer): answer is RatingAnswer => (answer as RatingAnswer).answer === "incorrect").length,
  }
}

export const selectCompleteResults = createSelector(
  [
    selectQuizResults,
    (state: RootState) => state.flashcard,
    selectProcessedResults,
    selectQuizQuestions,
    selectQuizTitle,
    selectQuizId,
    selectFlashcardTotalTime
  ],
  (results, quizState, processed, questions, title, quizId, totalTime) => {
    if (results) return results

    return {
      quizId: quizId || quizState.slug || "",
      slug: quizState.slug || "",
      title: title || "Flashcard Quiz",
      quizType: "flashcard",
      score: processed.correctCount,
      maxScore: processed.totalCount,
      percentage: processed.totalCount > 0
        ? Math.round((processed.correctCount / processed.totalCount) * 100)
        : 0,
      correctAnswers: processed.correctCount,
      stillLearningAnswers: processed.stillLearningCount,
      incorrectAnswers: processed.incorrectCount,
      totalQuestions: questions.length,
      stillLearningCards: processed.stillLearningCards,
      reviewCards: processed.reviewCards,
      questions,
      answers: quizState.answers,
      completedAt: new Date().toISOString(),
      totalTime: totalTime || 0,
    }
  }
)

export default flashcardSlice.reducer
