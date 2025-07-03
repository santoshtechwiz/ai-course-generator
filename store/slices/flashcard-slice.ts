import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import type { QuizType } from '@/types/quiz'

export const ANSWER_TYPES = {
  CORRECT: 'correct',
  INCORRECT: 'incorrect',
  STILL_LEARNING: 'still_learning',
} as const

export interface RatingAnswer {
  questionId: string
  answer: typeof ANSWER_TYPES[keyof typeof ANSWER_TYPES]
  timeSpent: number
  userAnswer: string
  isCorrect: boolean
  streak?: number
}

export interface SavedAnswer {
  questionId: string
  saved: boolean
  timestamp?: number
}

export type AnswerEntry = RatingAnswer | SavedAnswer

export interface FlashCard {
  id: string
  question: string
  answer: string
  options?: string[]
  keywords?: string[]
  imageUrl?: string
  audioUrl?: string
}

export interface QuizResultsState {
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
  submittedAt: string
  questions: FlashCard[]
  answers: AnswerEntry[]
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
  isLoading: boolean
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
  isLoading: false,
}

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
  async ({ slug, data }: { slug: string; data: any }, { rejectWithValue }) => {
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

export const checkAuthAndLoadResults = createAsyncThunk(
  'flashcard/checkAuthAndLoadResults',
  async (_, { getState }) => {
    const state = getState() as RootState
    const { isCompleted, results } = state.flashcard

    if (!isCompleted || !results) return null

    return results
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
    },

    resetRedirectFlag: (state) => {
      state.shouldRedirectToResults = false
    },    submitFlashCardAnswer: (state, action: PayloadAction<{
      questionId: string | number
      answer: "correct" | "incorrect" | "still_learning"
      timeSpent?: number
      streak?: number
      priority?: number
    }>) => {
      const { questionId, answer, timeSpent, streak, priority } = action.payload
      const questionIdStr = String(questionId)

      const existingIndex = state.answers.findIndex(
        (a): a is RatingAnswer => 'answer' in a && a.questionId === questionIdStr
      )

      const newAnswer: RatingAnswer = {
        questionId: questionIdStr,
        answer,
        userAnswer: answer,
        isCorrect: answer === ANSWER_TYPES.CORRECT,
        timeSpent: timeSpent || 0,
        streak: streak
      }

      if (existingIndex >= 0) {
        state.answers[existingIndex] = newAnswer
      } else {
        state.answers.push(newAnswer)
      }
      
      // If we have results already calculated, update them
      if (state.results) {
        // Recalculate the counts for the different answer types
        const ratingAnswers = state.answers.filter((a): a is RatingAnswer => 'answer' in a);
        const correctCount = ratingAnswers.filter(a => a.answer === ANSWER_TYPES.CORRECT).length;
        const stillLearningCount = ratingAnswers.filter(a => a.answer === ANSWER_TYPES.STILL_LEARNING).length;
        const incorrectCount = ratingAnswers.filter(a => a.answer === ANSWER_TYPES.INCORRECT).length;
        const totalQuestions = state.questions.length;
        const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        
        // Update the review cards lists
        const reviewCards = ratingAnswers
          .filter(a => a.answer === ANSWER_TYPES.INCORRECT)
          .map(a => parseInt(a.questionId))
          .filter(id => !isNaN(id));
          
        const stillLearningCards = ratingAnswers
          .filter(a => a.answer === ANSWER_TYPES.STILL_LEARNING)
          .map(a => parseInt(a.questionId))
          .filter(id => !isNaN(id));
        
        // Update the results
        state.results = {
          ...state.results,
          correctCount,
          incorrectCount,
          stillLearningCount,
          reviewCards,
          stillLearningCards,
          percentage,
          correctAnswers: correctCount,
          incorrectAnswers: incorrectCount,
          stillLearningAnswers: stillLearningCount,
          score: correctCount,
          answers: state.answers
        };
      }
    },

    completeFlashCardQuiz: (state, action: PayloadAction<QuizResultsState>) => {
      const timestamp = new Date().toISOString()
      state.results = {
        ...action.payload,
        completedAt: timestamp,
        submittedAt: timestamp,
        answers: state.answers,
      }
      state.isCompleted = true
      state.status = 'completed'
      state.shouldRedirectToResults = true
    },

    setQuizResults: (state, action: PayloadAction<QuizResultsState>) => {
      state.results = action.payload
      state.isCompleted = true
      state.status = "succeeded"
    },

    resetFlashCards: (state) => {
      if (state.status !== "submitting" && state.status !== "loading") {
        Object.assign(state, initialState)
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
  Object.assign(state, initialState)
},


    completeQuiz: (state, action: PayloadAction<{ totalTime?: number }>) => {
      const answers = state.answers || []
      const timestamp = new Date().toISOString()
      const totalQuestions = state.questions.length

      const ratingAnswers = answers.filter((a): a is RatingAnswer => 'answer' in a)

      const correctCount = ratingAnswers.filter(a => a.answer === ANSWER_TYPES.CORRECT).length
      const stillLearningCount = ratingAnswers.filter(a => a.answer === ANSWER_TYPES.STILL_LEARNING).length
      const incorrectCount = ratingAnswers.filter(a => a.answer === ANSWER_TYPES.INCORRECT).length

      const totalAnswered = correctCount + stillLearningCount + incorrectCount
      const unansweredCount = Math.max(0, totalQuestions - totalAnswered)
      const adjustedIncorrectCount = incorrectCount + unansweredCount

      const percentage = totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0

      const quizId = state.quizId || `quiz-${Date.now()}`
      const slug = state.slug || `quiz-${Date.now()}`

      const reviewCards = ratingAnswers
        .map((a, i) => (a.answer === ANSWER_TYPES.INCORRECT ? i : -1))
        .filter(i => i >= 0)

      const stillLearningCards = ratingAnswers
        .map((a, i) => (a.answer === ANSWER_TYPES.STILL_LEARNING ? i : -1))
        .filter(i => i >= 0)

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
        completedAt: timestamp,
        submittedAt: timestamp,
        questions: state.questions,
        answers: state.answers,
        correctAnswers: correctCount,
        incorrectAnswers: adjustedIncorrectCount,
        stillLearningAnswers: stillLearningCount,
        maxScore: totalQuestions,
        userScore: correctCount,
      }

      state.isCompleted = true
      state.status = "completed"
      state.shouldRedirectToResults = true
    },

    clearRedirectFlag: (state) => {
      state.shouldRedirectToResults = false
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
    .addCase(checkAuthAndLoadResults.fulfilled, (state, action) => {
      if (action.payload) {
        state.results = action.payload
      }
    })
}

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
  clearRedirectFlag,
  completeQuiz,
} = flashcardSlice.actions

// Selectors (unchanged – still valid)
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

export const selectProcessedResults = createSelector(
  [selectQuizAnswers, selectQuizResults],
  (answers, results) => {
    if (!answers || !answers.length) return null;

    const correct = answers.filter(a => 'isCorrect' in a && a.isCorrect).length;
    const stillLearning = answers.filter(a => 'answer' in a && a.answer === ANSWER_TYPES.STILL_LEARNING).length;
    const incorrect = answers.filter(a => 'isCorrect' in a && !a.isCorrect && ('answer' in a && a.answer !== ANSWER_TYPES.STILL_LEARNING)).length;

    const totalQuestions = answers.length;
    const percentage = Math.round((correct / totalQuestions) * 100);
    
    // Separate incorrect and still learning cards
    const reviewCards = answers
      .filter((a): a is RatingAnswer => 'questionId' in a && 'answer' in a)
      .filter(a => a.answer === ANSWER_TYPES.INCORRECT)
      .map(a => parseInt(a.questionId));
    
    const stillLearningCards = answers
      .filter((a): a is RatingAnswer => 'questionId' in a && 'answer' in a)
      .filter(a => a.answer === ANSWER_TYPES.STILL_LEARNING)
      .map(a => parseInt(a.questionId));

    return {
      correct,
      incorrect,
      stillLearning,
      totalQuestions,
      percentage,
      reviewCards,
      stillLearningCards,
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      stillLearningAnswers: stillLearning,
      ...results,
    };
  }
)

export default flashcardSlice.reducer
