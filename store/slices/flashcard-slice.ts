import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { FlashCard } from "@/app/types/types"
import type { RootState } from ".."

interface FlashcardQuizState {
  quizId: string | null
  slug: string | null
  title: string
  questions: FlashCard[]
  currentQuestion: number
  answers: any[]
  isCompleted: boolean
  results: any | null
  error: string | null
  status: "idle" | "loading" | "succeeded" | "failed" | "submitting"
  requiresAuth: boolean
  pendingAuthRequired: boolean
  cards: any[]
  savedCardIds: string[]
  ownerId: string | null
  loading: boolean
}

const initialState: FlashcardQuizState = {
  quizId: null,
  slug: null,
  title: "",
  questions: [],
  currentQuestion: 0,
  answers: [],
  isCompleted: false,
  results: null,
  error: null,
  status: "idle",
  requiresAuth: false,
  pendingAuthRequired: false,
  cards: [],
  savedCardIds: [],
  ownerId: null,
  loading: false,
}

export const fetchFlashCardQuiz = createAsyncThunk("flashcard/fetchQuiz", async (slug: string, { rejectWithValue }) => {
  try {
    console.log("Fetching flashcard quiz with slug:", slug)
    const response = await fetch(`/api/quizzes/flashcard/${slug}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`Failed to fetch flashcard quiz: ${response.status}`, errorData)
      throw new Error(`Failed to fetch flashcard quiz: ${response.status}`)
    }

    const data = await response.json()
    console.log("Fetched flashcard quiz data:", data)

    if (!data.flashCards || !Array.isArray(data.flashCards) || data.flashCards.length === 0) {
      console.warn("No flashcards found in response:", data)
    }

    return {
      slug,
      id: data.id || slug,
      title: data.title || "Flashcard Quiz",
      questions: data.flashCards || [],
    }
  } catch (error: any) {
    console.error("Error in fetchFlashCardQuiz:", error)
    return rejectWithValue(error.message)
  }
})

export const saveFlashCardResults = createAsyncThunk(
  "flashcard/saveResults",
  async ({ slug, data }: { slug: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/quizzes/flashcard/${slug}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Failed to save results: ${response.status}`)
      }

      return await response.json()
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

const flashcardSlice = createSlice({
  name: "flashcard",
  initialState,
  reducers: {
    initFlashCardQuiz: (
      state,
      action: PayloadAction<{ id: string; slug: string; title: string; questions: FlashCard[] }>,
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
    },

    submitFlashCardAnswer: (state, action: PayloadAction<any>) => {
      const { questionId, answer, userAnswer, isCorrect, timeSpent } = action.payload

      // Handle save actions separately
      if (typeof action.payload.answer === "object" && action.payload.answer.saved !== undefined) {
        const existingAnswerIndex = state.answers.findIndex((a) => a.questionId === questionId)
        if (existingAnswerIndex >= 0) {
          state.answers[existingAnswerIndex] = {
            ...state.answers[existingAnswerIndex],
            saved: action.payload.answer.saved,
            timestamp: action.payload.answer.timestamp,
          }
        } else {
          state.answers.push({
            questionId,
            saved: action.payload.answer.saved,
            timestamp: action.payload.answer.timestamp,
          })
        }
        return
      }

      // Handle rating answers
      if (answer === "correct" || answer === "incorrect") {
        const existingAnswerIndex = state.answers.findIndex((a) => a.questionId === questionId)

        const answerData = {
          questionId,
          answer,
          userAnswer: userAnswer || answer,
          isCorrect: isCorrect !== undefined ? isCorrect : answer === "correct",
          timeSpent: timeSpent || 0,
        }

        if (existingAnswerIndex >= 0) {
          const existingAnswer = state.answers[existingAnswerIndex]
          state.answers[existingAnswerIndex] = {
            ...answerData,
            saved: existingAnswer.saved,
            timestamp: existingAnswer.timestamp,
          }
        } else {
          state.answers.push(answerData)
        }
      }
    },

    completeFlashCardQuiz: (state, action: PayloadAction<any>) => {
      state.isCompleted = true
      state.results = action.payload
      state.status = "succeeded"
    },

    resetFlashCards: (state) => {
      state.currentQuestion = 0
      state.answers = []
      state.isCompleted = false
      state.results = null
      state.error = null
      state.status = "idle"
      state.requiresAuth = false
      state.pendingAuthRequired = false
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
        state.error = action.payload as string
      })
      .addCase(saveFlashCardResults.pending, (state) => {
        state.status = "submitting"
      })
      .addCase(saveFlashCardResults.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.results = action.payload
      })
      .addCase(saveFlashCardResults.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload as string
      })
  },
})

export const {
  initFlashCardQuiz,
  submitFlashCardAnswer,
  completeFlashCardQuiz,
  resetFlashCards,
  setCurrentFlashCard,
  nextFlashCard,
  setRequiresFlashCardAuth,
  setPendingFlashCardAuth,
  clearQuizState,
} = flashcardSlice.actions

// Selectors
export const selectFlashcardQuiz = (state: RootState) => state.flashcard
export const selectFlashcardQuestions = (state: RootState) => state.flashcard.questions
export const selectFlashcardCurrentIndex = (state: RootState) => state.flashcard.currentQuestion
export const selectFlashcardAnswers = (state: RootState) => state.flashcard.answers
export const selectFlashcardIsComplete = (state: RootState) => state.flashcard.isCompleted
export const selectFlashcardResults = (state: RootState) => state.flashcard.results
export const selectFlashcardError = (state: RootState) => state.flashcard.error
export const selectFlashcardStatus = (state: RootState) => state.flashcard.status
export const selectFlashCards = (state: RootState) => state.flashcard.cards
export const selectSavedCardIds = (state: RootState) => state.flashcard.savedCardIds
export const selectFlashCardsLoading = (state: RootState) => state.flashcard.loading
export const selectFlashCardsError = (state: RootState) => state.flashcard.error
export const selectOwnerId = (state: RootState) => state.flashcard.ownerId
export const selectQuizId = (state: RootState) => state.flashcard.quizId
export const selectIsQuizComplete = (state: RootState) => state.flashcard.isCompleted
export const selectQuizTitle = (state: RootState) => state.flashcard.title
export const selectHasFlashcardQuestions = (state: RootState) =>
  state.flashcard.questions && state.flashcard.questions.length > 0

export default flashcardSlice.reducer
