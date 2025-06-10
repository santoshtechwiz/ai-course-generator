import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import type { FlashCard } from "@/app/types/types"
import type { RootState } from ".."

interface FlashcardQuizState {
  quizId: string | null;
  slug: string | null;
  title: string;
  questions: FlashCard[];
  currentQuestion: number;
  answers: any[];
  isCompleted: boolean;
  results: any | null;
  error: string | null;
  status: "idle" | "loading" | "succeeded" | "failed" | "submitting";
  requiresAuth: boolean;
  pendingAuthRequired: boolean;
  cards: any[];
  savedCardIds: string[];
  ownerId: string | null;
  loading: boolean;
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
};

export const fetchFlashCardQuiz = createAsyncThunk(
  "flashcard/fetchQuiz",
  async (slug: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/quizzes/flashcard/${slug}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch flashcard quiz: ${response.status}`);
      }

      const data = await response.json();
      return {
        slug,
        id: data.id || slug,
        title: data.title || "Flashcard Quiz",
        questions: data.cards || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

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
      });

      if (!response.ok) {
        throw new Error(`Failed to save results: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Add missing fetch flashcards thunk
export const fetchFlashCards = createAsyncThunk(
  "flashcard/fetchCards",
  async ({ slug }: { slug: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/quizzes/flashcard/${slug}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch flashcards: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        cards: data.cards || [],
        title: data.title || "Flashcards",
        quizId: data.id || slug,
        slug,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Add missing toggle save card thunk
export const toggleSaveCard = createAsyncThunk(
  "flashcard/toggleSave",
  async ({ cardId, isSaved }: { cardId: string; isSaved: boolean }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/user/cards/${cardId}`, {
        method: isSaved ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isSaved: !isSaved })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isSaved ? 'unsave' : 'save'} card: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        cardId,
        isSaved: !isSaved,
        savedCardIds: data.savedCardIds || []
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const flashcardSlice = createSlice({
  name: "flashcard",
  initialState,
  reducers: {
    initFlashCardQuiz: (state, action: PayloadAction<{ id: string; slug: string; title: string; questions: FlashCard[] }>) => {
      state.quizId = action.payload.id;
      state.slug = action.payload.slug;
      state.title = action.payload.title;
      state.questions = action.payload.questions;
      state.currentQuestion = 0;
      state.answers = [];
      state.isCompleted = false;
      state.results = null;
      state.error = null;
      state.status = "succeeded";
    },
    
    submitFlashCardAnswer: (state, action: PayloadAction<any>) => {
      const existingAnswerIndex = state.answers.findIndex(
        (a) => a.questionId === action.payload.questionId
      );
      
      if (existingAnswerIndex >= 0) {
        state.answers[existingAnswerIndex] = action.payload;
      } else {
        state.answers.push(action.payload);
      }
    },
    
    completeFlashCardQuiz: (state, action: PayloadAction<any>) => {
      state.isCompleted = true;
      state.results = {
        ...action.payload,
        answers: state.answers,
        totalQuestions: state.questions.length,
      };
    },
    
    resetFlashCards: (state) => {
      state.currentQuestion = 0;
      state.answers = [];
      state.isCompleted = false;
      state.results = null;
      state.error = null;
      state.status = "idle";
      state.requiresAuth = false;
      state.pendingAuthRequired = false;
    },
    
    setCurrentFlashCard: (state, action: PayloadAction<number>) => {
      state.currentQuestion = action.payload;
    },
    
    nextFlashCard: (state) => {
      if (state.currentQuestion < state.questions.length - 1) {
        state.currentQuestion += 1;
      }
    },
    
    setRequiresFlashCardAuth: (state, action: PayloadAction<boolean>) => {
      state.requiresAuth = action.payload;
    },
    
    setPendingFlashCardAuth: (state, action: PayloadAction<boolean>) => {
      state.pendingAuthRequired = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFlashCardQuiz.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchFlashCardQuiz.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.quizId = action.payload.id;
        state.slug = action.payload.slug;
        state.title = action.payload.title;
        state.questions = action.payload.questions;
      })
      .addCase(fetchFlashCardQuiz.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(saveFlashCardResults.pending, (state) => {
        state.status = "submitting";
      })
      .addCase(saveFlashCardResults.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.results = action.payload;
      })
      .addCase(saveFlashCardResults.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchFlashCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFlashCards.fulfilled, (state, action) => {
        state.loading = false;
        state.cards = action.payload.cards;
        state.title = action.payload.title;
        state.quizId = action.payload.quizId;
        state.slug = action.payload.slug;
      })
      .addCase(fetchFlashCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(toggleSaveCard.fulfilled, (state, action) => {
        const { cardId, isSaved } = action.payload;
        if (isSaved) {
          state.savedCardIds = [...state.savedCardIds, cardId];
        } else {
          state.savedCardIds = state.savedCardIds.filter(id => id !== cardId);
        }
      });
  },
});

export const {
  initFlashCardQuiz,
  submitFlashCardAnswer,
  completeFlashCardQuiz,
  resetFlashCards,
  setCurrentFlashCard,
  nextFlashCard,
  setRequiresFlashCardAuth,
  setPendingFlashCardAuth,
} = flashcardSlice.actions;

export const selectFlashcardQuiz = (state: RootState) => state.flashcard;
export const selectFlashcardQuestions = (state: RootState) => state.flashcard.questions;
export const selectFlashcardCurrentIndex = (state: RootState) => state.flashcard.currentQuestion;
export const selectFlashcardAnswers = (state: RootState) => state.flashcard.answers;
export const selectFlashcardIsComplete = (state: RootState) => state.flashcard.isCompleted;
export const selectFlashcardResults = (state: RootState) => state.flashcard.results;
export const selectFlashcardError = (state: RootState) => state.flashcard.error;
export const selectFlashcardStatus = (state: RootState) => state.flashcard.status;
export const selectFlashCards = (state: RootState) => state.flashcard.cards;
export const selectSavedCardIds = (state: RootState) => state.flashcard.savedCardIds;
export const selectFlashCardsLoading = (state: RootState) => state.flashcard.loading;
export const selectFlashCardsError = (state: RootState) => state.flashcard.error;
export const selectOwnerId = (state: RootState) => state.flashcard.ownerId;
export const selectQuizId = (state: RootState) => state.flashcard.quizId;
export default flashcardSlice.reducer;
