import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { 
  shouldUpdateState, 
  getErrorMessage
} from '../utils/async-state'

export const checkAuthAndLoadResults = createAsyncThunk<QuizResultsState | null, void, { rejectValue: string }>(
  'flashcards/checkAuthAndLoadResults',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/quiz/results', {
        method: 'GET',
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Failed to load quiz results')
      }

      const data = await res.json()
      return data
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

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
  userId?: string
  options?: string[]
  keywords?: string[]
  imageUrl?: string
  audioUrl?: string
  saved?: boolean
}

export interface QuizResultsState {
  quizId: string
  slug: string
  title: string
  userId?: string
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
  userId?: string | null
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
  lastUpdated: number | null
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
  lastUpdated: null,
}

export const fetchFlashCardQuiz = createAsyncThunk(
  "flashcard/fetchQuiz",
  async (slug: string, { rejectWithValue, signal }) => {
    const requestKey = `flashcard-${slug}`
    
    try {
      // Check if request was already cancelled
      if (signal?.aborted) {
        return rejectWithValue('Request was cancelled')
      }

      // Set up abort controller for this specific request
      const abortController = new AbortController();
      const { signal: controllerSignal } = abortController;

      // Combine signals
      if (signal?.aborted) {
        abortController.abort()
        return rejectWithValue('Request was cancelled')
      }
      
      signal?.addEventListener('abort', () => {
        abortController.abort()
      })

      const response = await fetch(`/api/quizzes/flashcard/${slug}`, {
        signal: controllerSignal,
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Ensure we don't get cached responses
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        abortController.abort()
        return rejectWithValue(errorData.message || `Failed to fetch flashcard quiz: ${response.status}`)
      }
      
      const data = await response.json()
      abortController.abort()
      console.log('Fetched flashcard quiz data:', data);
      
      if (!data) {
        console.error('Empty response data');
        return rejectWithValue('Empty quiz response');
      }
      
      if (!data.questions) {
        console.error('No questions found in response:', data);
        return rejectWithValue('No questions found in quiz data');
      }
      
      if (!Array.isArray(data.questions)) {
        console.error('Questions is not an array:', data.questions);
        return rejectWithValue('Invalid questions format');
      }
      
      if (data.questions.length === 0) {
        console.warn('Quiz has no questions:', data);
        return rejectWithValue('This quiz has no questions');
      }
      
      const result = {
        slug,
        id: data.id || slug,
        title: data.title || "Flashcard Quiz",
        userId: data.userId || null,
        questions: data.questions || [], // Use questions instead of flashCards
        quizType: "flashcard",
        __lastUpdated: Date.now(),
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log("Fetched flashcard quiz:", result)
      }
      return result;
    } catch (error: any) {
      // Handle abort errors gracefully
      if (error?.name === 'AbortError') {
        return rejectWithValue('Request was cancelled')
      }
      
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const saveFlashCard = createAsyncThunk(
  "flashcard/saveCard",
  async ({ cardId, saved }: { cardId: number; saved: boolean }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/flashcards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return rejectWithValue(errorData.message || `Failed to save flashcard: ${response.status}`)
      }

      return { cardId, saved }
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

export const loadFlashcardResults = createAsyncThunk(
  'flashcard/loadResults',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const { isCompleted, results } = state.flashcard

    if (!isCompleted || !results) {
      return rejectWithValue('No results available')
    }

    return results
  }
)


const flashcardSlice = createSlice({
  name: "flashcard",
  initialState,
  reducers: {
    clearFlashcardResults: (state) => {
      state.results = null;
      state.isCompleted = false;
      state.shouldRedirectToResults = false;
      state.status = "idle";
    },
    initFlashCardQuiz: (
      state,
      action: PayloadAction<{ id: string; userId:string, slug: string; title: string; questions: FlashCard[] }>
    ) => {
      state.quizId = action.payload.id
      state.slug = action.payload.slug
      state.userId = action.payload.userId || null
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
        // Reset to initial state while preserving some metadata
        const preservedData = {
          requiresAuth: state.requiresAuth,
          pendingAuthRequired: state.pendingAuthRequired,
        };
        Object.assign(state, { ...initialState, ...preservedData, status: "idle" });
      }
    },

    forceResetFlashCards: (state) => {
      // Force reset everything to initial state
      const timestamp = Date.now();
      Object.assign(state, { 
        ...initialState,
        status: "idle",
        lastUpdated: timestamp, // Set new timestamp to ensure fresh fetch
      });
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
      state.status = "loading";
      state.error = null;
      
      // Clear only if we don't have valid data for this quiz
      if (!state.questions.length || state.slug !== state.quizId) {
        state.questions = [];
        state.answers = [];
      }
    })
    .addCase(fetchFlashCardQuiz.fulfilled, (state, action) => {
      const incomingTs = (action.payload as any)?.__lastUpdated || Date.now();
      
      if (!action.payload.questions || !Array.isArray(action.payload.questions)) {
        state.status = "failed";
        state.error = "Invalid quiz data received";
        return;
      }
      
      if (!state.lastUpdated || incomingTs > state.lastUpdated) {
        // Debug log the incoming payload
        console.log('Processing flashcard quiz payload:', {
          id: action.payload.id,
          slug: action.payload.slug,
          title: action.payload.title,
          questionCount: action.payload.questions?.length,
          firstQuestion: action.payload.questions?.[0],
        });

        state.status = "succeeded";
        state.quizId = action.payload.id;
        state.slug = action.payload.slug;
        state.title = action.payload.title;
        state.questions = action.payload.questions;
        state.lastUpdated = incomingTs;
        state.currentQuestion = 0;
        state.error = null;
        
        // Log final state for debugging
        console.log(`Loaded flashcard quiz state:`, {
          title: state.title,
          questionCount: state.questions.length,
          status: state.status,
          error: state.error
        });
      }
    })
    .addCase(fetchFlashCardQuiz.rejected, (state, action) => {
      const payload = action.payload as string;
      
      // Don't change status or clear data for cancelled requests
      if (payload === 'Request was cancelled') {
        return;
      }
      
      state.status = "failed";
      state.error = payload;
      state.lastUpdated = Date.now();
      
      // Clear data only if we don't have valid questions
      if (!state.questions.length) {
        state.questions = [];
        state.answers = [];
      }
      
      // Log error for debugging
      console.error("Failed to load flashcard quiz:", payload);
      
      state.status = "failed"
      state.error = payload || action.error.message || "An unknown error occurred."
      
      // Only clear data if no existing data or this was an initial load
      if (!state.questions.length || !state.slug) {
        state.questions = []
        state.results = null
        state.isCompleted = false
        state.shouldRedirectToResults = false
      }
    })
    .addCase(saveFlashCard.fulfilled, (state, action) => {
      // Update the saved status of the flashcard in the questions array
      const { cardId, saved } = action.payload
      const questionIndex = state.questions.findIndex(q => q.id === cardId.toString())
      if (questionIndex >= 0) {
        state.questions[questionIndex] = {
          ...state.questions[questionIndex],
          saved
        }
      }
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
export const selectQuizOwnerId = (state: RootState) => state.flashcard.userId
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
