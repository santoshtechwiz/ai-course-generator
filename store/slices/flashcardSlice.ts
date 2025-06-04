import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import axios from "axios"
import type { FlashCard } from "@/app/types/types"
import type { RootState } from "@/store"
import { createSelector } from "reselect"

// Define the answer format
interface FlashCardAnswer {
  questionId: string
  answer: string | "correct" | "incorrect"
  userAnswer?: string
  isCorrect?: boolean
  timeSpent?: number
}

// Define the state structure
interface FlashcardState {
  flashCards: FlashCard[]
  savedCardIds: string[]
  loading: boolean
  error: string | null
  ownerId: string
  quizId: string
  
  // Quiz related fields
  currentQuestion: number
  answers: FlashCardAnswer[]
  isCompleted: boolean
  requiresAuth: boolean
  pendingAuthRequired: boolean
  title: string
  slug: string
  results: {
    score?: number
    answers?: FlashCardAnswer[]
    completedAt?: string
  } | null
}

const initialState: FlashcardState = {
  flashCards: [],
  savedCardIds: [],
  loading: false,
  error: null,
  ownerId: "",
  quizId: "",
  
  // Quiz related initial state
  currentQuestion: 0,
  answers: [],
  isCompleted: false,
  requiresAuth: false,
  pendingAuthRequired: false,
  title: "",
  slug: "",
  results: null
}

// Fetch flashcards
export const fetchFlashCards = createAsyncThunk(
  "flashcard/fetchFlashCards",
  async (slug: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/flashcard?slug=${slug}`)
      return response.data.data
    } catch (error: any) {
      console.warn("Error fetching flash cards:", error)
      return rejectWithValue(
        error.response?.data?.message || "Failed to load your flash cards"
      )
    }
  }
)

// Toggle save card
export const toggleSaveCard = createAsyncThunk(
  "flashcard/toggleSaveCard",
  async (
    { cardId, isSaved, toast }: { cardId: string, isSaved: boolean, toast: any }, 
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.patch(`/api/flashcard`, {
        id: cardId,
        isSaved: isSaved,
      })

      toast({
        title: isSaved ? "Card saved" : "Card unsaved",
        description: isSaved 
          ? "Card added to your saved collection" 
          : "Card removed from your saved collection",
      })

      return { cardId, isSaved }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save the card. Please try again.",
        variant: "destructive",
      })
      return rejectWithValue("Failed to update card saved status")
    }
  }
)

// Quiz related thunks
export const initFlashCardQuiz = createAsyncThunk(
  "flashcard/initFlashCardQuiz",
  async (payload: { 
    id: string, 
    slug: string, 
    title: string, 
    questions: FlashCard[] 
  }) => {
    return payload
  }
)

export const submitFlashCardAnswer = createAsyncThunk(
  "flashcard/submitFlashCardAnswer",
  async (answer: { 
    answer: any, 
    userAnswer: any, 
    timeSpent: number, 
    isCorrect: boolean, 
    questionId: string 
  }) => {
    return answer
  }
)

export const completeFlashCardQuiz = createAsyncThunk(
  "flashcard/completeFlashCardQuiz",
  async (payload: { 
    score: number, 
    answers: FlashCardAnswer[], 
    completedAt: string 
  }) => {
    return payload
  }
)

// Create the slice
const flashcardSlice = createSlice({
  name: "flashcard",
  initialState,
  reducers: {
    resetFlashCards: (state) => {
      state.currentQuestion = 0
      state.answers = []
      state.isCompleted = false
      state.results = null
    },
    setCurrentFlashCard: (state, action: PayloadAction<number>) => {
      state.currentQuestion = action.payload
    },
    nextFlashCard: (state) => {
      if (state.currentQuestion < state.flashCards.length - 1) {
        state.currentQuestion += 1
      }
    },
    setRequiresFlashCardAuth: (state, action: PayloadAction<boolean>) => {
      state.requiresAuth = action.payload
    },
    setPendingFlashCardAuth: (state, action: PayloadAction<boolean>) => {
      state.pendingAuthRequired = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchFlashCards
      .addCase(fetchFlashCards.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFlashCards.fulfilled, (state, action) => {
        state.loading = false
        
        if (action.payload?.flashCards) {
          state.flashCards = action.payload.flashCards
          state.ownerId = action.payload.quiz?.userId || ""
          state.quizId = action.payload.quiz?.id || ""
          state.title = action.payload.quiz?.title || ""
          state.slug = action.payload.quiz?.slug || ""
          
          // Extract saved card IDs
          state.savedCardIds = action.payload.flashCards
            .filter((card: FlashCard) => card.isSaved)
            .map((card: FlashCard) => card.id || "")
        } else {
          state.flashCards = []
          state.savedCardIds = []
        }
      })
      .addCase(fetchFlashCards.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Handle toggleSaveCard
      .addCase(toggleSaveCard.fulfilled, (state, action) => {
        const { cardId, isSaved } = action.payload
        
        // Update the saved status in flashCards
        const cardIndex = state.flashCards.findIndex(card => card.id === cardId)
        if (cardIndex !== -1) {
          state.flashCards[cardIndex].isSaved = isSaved
        }
        
        // Update savedCardIds
        if (isSaved) {
          state.savedCardIds.push(cardId)
        } else {
          state.savedCardIds = state.savedCardIds.filter(id => id !== cardId)
        }
      })
      
      // Handle quiz-related actions
      .addCase(initFlashCardQuiz.fulfilled, (state, action) => {
        state.quizId = action.payload.id
        state.slug = action.payload.slug
        state.title = action.payload.title
        state.flashCards = action.payload.questions
        state.currentQuestion = 0
        state.answers = []
        state.isCompleted = false
        state.results = null
      })
      
      .addCase(submitFlashCardAnswer.fulfilled, (state, action) => {
        const answer = action.payload
        
        // Find existing answer index
        const existingIndex = state.answers.findIndex(
          a => a && a.questionId === answer.questionId
        )
        
        // Update or add the answer
        if (existingIndex >= 0) {
          state.answers[existingIndex] = answer
        } else {
          state.answers.push(answer)
        }
      })
      
      .addCase(completeFlashCardQuiz.fulfilled, (state, action) => {
        state.isCompleted = true
        state.results = {
          score: action.payload.score,
          answers: action.payload.answers,
          completedAt: action.payload.completedAt
        }
      })
  },
})

export const { 
  resetFlashCards, 
  setCurrentFlashCard, 
  nextFlashCard,
  setRequiresFlashCardAuth,
  setPendingFlashCardAuth
} = flashcardSlice.actions

// Selectors
export const selectFlashCards = (state: RootState) => state.flashcard.flashCards;
export const selectSavedCardIds = (state: RootState) => state.flashcard.savedCardIds;
export const selectFlashCardsLoading = (state: RootState) => state.flashcard.loading;
export const selectFlashCardsError = (state: RootState) => state.flashcard.error;
export const selectOwnerId = (state: RootState) => state.flashcard.ownerId;
export const selectFlashcardState = (state: RootState) => state.flashcard;

// Fix the identity selector - transform the data
export const selectQuizId = createSelector(
  [selectFlashcardState], 
  (flashcardState) => {
    const id = flashcardState.quizId;
    return {
      id: id || null,
      isValid: !!id && id.length > 0,
      formattedId: id ? `quiz-${id}` : 'no-quiz'
    };
  }
);

// Add enhanced selectors
export const selectCurrentFlashcard = createSelector(
  [selectFlashcardState],
  (state) => {
    const currentCard = state.flashCards[state.currentQuestion] || null;
    
    if (!currentCard) return null;
    
    return {
      ...currentCard,
      isSaved: state.savedCardIds.includes(currentCard.id || ''),
      isAnswered: state.answers.some(a => a.questionId === currentCard.id),
      position: {
        current: state.currentQuestion + 1,
        total: state.flashCards.length,
        isFirst: state.currentQuestion === 0,
        isLast: state.currentQuestion === state.flashCards.length - 1
      }
    };
  }
);

export const selectFlashcardStats = createSelector(
  [selectFlashcardState],
  (state) => ({
    totalCards: state.flashCards.length,
    savedCards: state.savedCardIds.length,
    completedCards: state.answers.length,
    progress: state.flashCards.length ? Math.round((state.answers.length / state.flashCards.length) * 100) : 0,
    remainingCards: state.flashCards.length - state.answers.length,
    isComplete: state.answers.length >= state.flashCards.length,
    progressFormatted: `${state.answers.length}/${state.flashCards.length}`,
  })
);

export default flashcardSlice.reducer
