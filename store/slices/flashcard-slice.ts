import { createSlice, createAsyncThunk, type PayloadAction, createSelector } from "@reduxjs/toolkit"
import type { FlashCard } from "@/app/types/types"
import type { RootState } from ".."
import { hydrateFromStorage } from "../middleware/persistMiddleware"

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
  status: "idle" | "loading" | "succeeded" | "failed" | "submitting" | "completed_with_errors"
  requiresAuth: boolean
  pendingAuthRequired: boolean
  cards: any[]
  savedCardIds: string[]
  ownerId: string | null
  loading: boolean
  shouldRedirectToResults?: boolean
  // Additional properties for flashcard management
  score?: number
  totalQuestions?: number
  correctAnswers?: number
  totalTime?: number
  // Processing state flags like quiz-slice
  isProcessingResults?: boolean
  pendingResults?: any | null
}

// Load persisted state from storage for hydration - enhanced with multiple fallbacks
const loadPersistedState = (): Partial<FlashcardQuizState> => {
  if (typeof window === 'undefined') return {}
  
  try {
    // Try multiple sources in order of preference
    let state: Partial<FlashcardQuizState> | null = null
    
    // 1. First try to load direct flashcard state from Redux persist
    const persisted = hydrateFromStorage<Partial<FlashcardQuizState>>("flashcard_state")
    if (persisted) {
      console.log("Restored flashcard state from Redux persist")
      return persisted
    }
    
    // 2. Try localStorage complete state (primary storage)
    try {
      const completeStateJson = localStorage.getItem('flashcard_complete_state')
      if (completeStateJson) {
        const completeState = JSON.parse(completeStateJson)
        if (completeState && completeState.quizResults) {
          console.log("Restored complete state from localStorage")
          return {
            isCompleted: true,
            results: completeState.quizResults,
            slug: completeState.slug || null,
            quizId: completeState.slug || null,
            title: completeState.title || "Flashcard Quiz",
            questions: completeState.questions || [],
            answers: completeState.answers || [],
            status: "succeeded",
            shouldRedirectToResults: false // Don't redirect if we're already hydrating from storage
          }
        }
      }
    } catch (e) {
      console.warn("Error restoring from localStorage complete state", e)
    }
    
    // 3. Try sessionStorage complete state (backup)
    try {
      const completeStateJson = sessionStorage.getItem('flashcard_complete_state')
      if (completeStateJson) {
        const completeState = JSON.parse(completeStateJson)
        if (completeState && completeState.quizResults) {
          console.log("Restored complete state from sessionStorage")
          return {
            isCompleted: true,
            results: completeState.quizResults,
            slug: completeState.slug || null,
            quizId: completeState.slug || null,
            title: completeState.title || "Flashcard Quiz",
            questions: completeState.questions || [],
            answers: completeState.answers || [],
            status: "succeeded"
          }
        }
      }
    } catch (e) {
      console.warn("Error restoring from sessionStorage complete state", e)
    }
    
    // 4. Try the generic pendingQuizResults (both session and local)
    try {
      const pendingJson = sessionStorage.getItem('pendingQuizResults') || localStorage.getItem('pendingQuizResults')
      if (pendingJson) {
        const pendingState = JSON.parse(pendingJson)
        if (pendingState && pendingState.results && pendingState.quizType === "flashcard") {
          console.log("Restored from pendingQuizResults")
          return {
            isCompleted: true,
            results: pendingState.results,
            slug: pendingState.slug || null,
            quizId: pendingState.slug || null,
            status: "succeeded"
          }
        }
      }
    } catch (e) {
      console.warn("Error restoring from pendingQuizResults", e)
    }
    
    // 5. Try the old results format as last resort
    try {
      const resultsJson = localStorage.getItem('flashcard_results') || sessionStorage.getItem('flashcard_results')
      if (resultsJson) {
        const results = JSON.parse(resultsJson)
        if (results && results.quizResults) {
          console.log("Restored from legacy flashcard_results")
          return {
            isCompleted: true,
            results: results.quizResults,
            slug: results.slug || null,
            status: "succeeded"
          }
        }
      }
    } catch (e) {
      console.warn("Error restoring from flashcard_results", e)
    }
  } catch (e) {
    console.warn("Error loading persisted flashcard state:", e)
  }
  
  return {}
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
  shouldRedirectToResults: false,
  isProcessingResults: false,
  pendingResults: null,
  // Load any persisted state
  ...loadPersistedState()
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
  async ({ slug, data }: { slug: string; data: any }, { rejectWithValue, getState }) => {
    try {
      const response = await fetch(`/api/quizzes/flashcard/${slug}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        console.error(`Failed to save results for ${slug}. Status: ${response.status}`)
        
        // Don't block the flow on API errors, return the data we were trying to save
        // This ensures we can still show results even if saving failed
        const state = getState() as RootState
        return {
          savedLocally: true, 
          error: `API error: ${response.status}`,
          ...state.flashcard.results
        }
      }

      return await response.json()
    } catch (error: any) {
      console.error('Error saving flashcard results:', error)
      // Still return something useful so the app can continue
      const state = getState() as RootState
      return {
        savedLocally: true,
        error: error.message,
        ...state.flashcard.results
      }
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

      // Handle rating answers - now supports three states: correct, incorrect, still_learning
      if (answer === "correct" || answer === "incorrect" || answer === "still_learning") {
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
    },    completeFlashCardQuiz: (state, action: PayloadAction<any>) => {
      state.isCompleted = true
      state.isProcessingResults = true
      
      // Create complete results object with all necessary data
      const completeResults = {
        ...action.payload,
        completedAt: new Date().toISOString(),
        quizId: state.quizId,
        slug: state.slug,
        title: state.title,
        questions: state.questions,
        answers: state.answers,
      }
      
      state.results = completeResults
      state.shouldRedirectToResults = true
      
      // Enhanced persistence - save to multiple places with redundancy
      if (typeof window !== 'undefined') {
        try {
          // Create a comprehensive state object with EVERYTHING
          const completeState = {
            quizResults: completeResults,
            slug: state.slug,
            title: state.title,
            questions: state.questions,
            answers: state.answers,
            isCompleted: true,
            currentQuestion: state.currentQuestion,
            timestamp: Date.now()
          }
          
          // SAVE IN MULTIPLE FORMATS AND LOCATIONS FOR MAXIMUM RELIABILITY
          
          // 1. Main complete state in localStorage (primary)
          localStorage.setItem('flashcard_complete_state', JSON.stringify(completeState))
          
          // 2. Main complete state in sessionStorage (backup)
          sessionStorage.setItem('flashcard_complete_state', JSON.stringify(completeState))
          
          // 3. Legacy format in localStorage (backward compatibility)
          localStorage.setItem('flashcard_results', JSON.stringify({
            quizResults: completeResults,
            slug: state.slug,
            timestamp: Date.now()
          }))
          
          // 4. Legacy format in sessionStorage (backup for backward compatibility)
          sessionStorage.setItem('flashcard_results', JSON.stringify({
            quizResults: completeResults,
            slug: state.slug,
            timestamp: Date.now()
          }))
          
          // 5. General pendingQuizResults format used across quiz types
          const pendingData = {
            slug: state.slug,
            quizType: "flashcard",
            results: completeResults,
            timestamp: Date.now(),
            questions: state.questions,
            title: state.title || "Flashcard Quiz",
            isCompleted: true
          }
          
          localStorage.setItem("pendingQuizResults", JSON.stringify(pendingData))
          sessionStorage.setItem("pendingQuizResults", JSON.stringify(pendingData))
          
          console.log("Successfully persisted flashcard state to ALL storage mechanisms");
        } catch (e) {
          console.warn("Error saving flashcard state to storage:", e)
          
          // Attempt emergency backup to at least one storage
          try {
            sessionStorage.setItem('flashcard_emergency_backup', JSON.stringify({
              quizResults: completeResults,
              slug: state.slug,
              timestamp: Date.now()
            }))
          } catch (err) {
            console.error("Failed emergency backup", err)
          }
        }
      }
    },resetFlashCards: (state) => {
      // Only reset if we're not processing results
      if (!state.isProcessingResults) {
        state.currentQuestion = 0
        state.answers = []
        state.isCompleted = false
        state.results = null
        state.error = null
        state.status = "idle"
        state.requiresAuth = false
        state.pendingAuthRequired = false
        state.shouldRedirectToResults = false
        
        // Clear storage when resetting
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('flashcard_complete_state')
            localStorage.removeItem('flashcard_results')
            sessionStorage.removeItem('flashcard_complete_state')
            sessionStorage.removeItem('flashcard_results')
            console.log("Successfully cleared flashcard state from storage")
          } catch (e) {
            console.warn("Error clearing flashcard state from storage:", e)
          }
        }
      }
    },
      forceResetFlashCards: (state) => {
      // Force reset regardless of processing state
      state.currentQuestion = 0
      state.answers = []
      state.isCompleted = false
      state.results = null
      state.error = null
      state.status = "idle"
      state.requiresAuth = false
      state.pendingAuthRequired = false
      state.shouldRedirectToResults = false
      state.isProcessingResults = false
      
      // ULTRA AGGRESSIVE storage clearing - remove everything related to flashcards
      if (typeof window !== 'undefined') {
        try {
          // Clear all known flashcard storage keys
          const keysToRemove = [
            // Main storage keys
            'flashcard_complete_state',
            'flashcard_results',
            
            // Emergency backup keys
            'flashcard_emergency_backup',
            
            // Generic quiz keys that might have flashcard data
            'pendingQuizResults',
            
            // Any other keys that might contain flashcard data
            'flashcard_state',
            'redux_state_flashcard'
          ]
          
          // Try to remove from both localStorage and sessionStorage
          keysToRemove.forEach(key => {
            try { localStorage.removeItem(key) } catch (e) {}
            try { sessionStorage.removeItem(key) } catch (e) {}
          })
          
          // Also try to find and remove any keys that might contain the slug
          if (state.slug) {
            try {
              // Look for any keys containing the slug
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key && key.includes(state.slug)) {
                  localStorage.removeItem(key)
                }
              }
              
              // Do the same for sessionStorage
              for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i)
                if (key && key.includes(state.slug)) {
                  sessionStorage.removeItem(key)
                }
              }
            } catch (e) {
              console.warn("Error clearing storage by slug", e)
            }
          }
          
          console.log("Successfully cleared ALL flashcard state from storage")
        } catch (e) {
          console.warn("Error clearing flashcard state from storage:", e)
        }
      }
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

    setQuizResults: (state, action: PayloadAction<any>) => {
      state.results = action.payload
      state.isCompleted = true
      state.status = "succeeded"
    },

    resetRedirectFlag: (state) => {
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
        state.error = action.payload as string
      })
      .addCase(saveFlashCardResults.pending, (state) => {
        state.status = "submitting"
      })      .addCase(saveFlashCardResults.fulfilled, (state, action) => {
        // If we got a response, even with an error flag, we still want to show results
        state.status = action.payload?.error ? "completed_with_errors" : "succeeded"
        
        if (action.payload) {
          state.results = {
            ...state.results,  // Keep existing results
            ...action.payload, // Add any new data
          }
        }
      })
      .addCase(saveFlashCardResults.rejected, (state, action) => {
        // Don't set status to failed if we still have results to show
        if (state.isCompleted && state.answers.length > 0) {
          state.status = "completed_with_errors" 
          state.error = action.payload as string
        } else {
          state.status = "failed"
          state.error = action.payload as string
        }
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
  setQuizResults,
  resetRedirectFlag,
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
export const selectShouldRedirectToResults = (state: RootState) => state.flashcard.shouldRedirectToResults
export const selectHasFlashcardQuestions = (state: RootState) =>
  state.flashcard.questions && state.flashcard.questions.length > 0

// Score selectors
export const selectFlashcardScore = (state: RootState) => {
  const results = state.flashcard.results
  if (!results) return 0
  return results.percentage || results.score || 0
}

export const selectFlashcardTotalQuestions = (state: RootState) => {
  const results = state.flashcard.results
  if (!results) return state.flashcard.questions.length || 0
  return results.totalQuestions || results.maxScore || results.questions?.length || 0
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

// Additional selectors for the three-state system
export const selectFlashcardStillLearningCount = (state: RootState) => {
  return state.flashcard.answers.filter((answer) => answer.answer === "still_learning").length
}

export const selectFlashcardIncorrectCount = (state: RootState) => {
  return state.flashcard.answers.filter((answer) => answer.answer === "incorrect").length
}

export const selectFlashcardAnswerBreakdown = (state: RootState) => {
  const answers = state.flashcard.answers
  return {
    correct: answers.filter((answer) => answer.answer === "correct").length,
    stillLearning: answers.filter((answer) => answer.answer === "still_learning").length,
    incorrect: answers.filter((answer) => answer.answer === "incorrect").length,
  }
}

export default flashcardSlice.reducer
