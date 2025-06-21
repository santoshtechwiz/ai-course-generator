import { createSlice, createAsyncThunk, type PayloadAction, createSelector } from "@reduxjs/toolkit"
import type { FlashCard } from "@/app/types/types"
import type { RootState } from ".."
import { STORAGE_KEYS, ANSWER_TYPES } from "@/constants/global"

// Define a union type for answers to correctly reflect the different structures stored
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
  questions: FlashCard[]  // Optional properties for enhanced functionality
  savedLocally?: boolean
  error?: string
  correctAnswers?: number  // For backward compatibility
  stillLearningAnswers?: number  // For backward compatibility
  incorrectAnswers?: number  // For backward compatibility
  maxScore?: number  // Maximum possible score
  userScore?: number  // User's actual score
}

interface FlashcardQuizState {
  // Basic quiz info
  quizId: string | null
  slug: string | null
  title: string

  // Quiz content and progress
  questions: FlashCard[]
  currentQuestion: number
  answers: AnswerEntry[] // Use the new union type

  // Quiz state
  status: "idle" | "loading" | "succeeded" | "failed" | "submitting" | "completed" | "completed_with_errors"
  error: string | null
  isCompleted: boolean

  // Results state
  results: QuizResultsState | null

  // UI state (minimal)
  shouldRedirectToResults: boolean
  requiresAuth: boolean
  pendingAuthRequired: boolean
}

// Initial state for the flashcard quiz module
const initialState: FlashcardQuizState = {
  // Basic info
  quizId: null,
  slug: null,
  title: "",

  // Quiz content
  questions: [],
  currentQuestion: 0,
  answers: [],

  // State
  status: "idle",
  error: null,
  isCompleted: false,
  results: null,

  // UI state
  shouldRedirectToResults: false,
  requiresAuth: false,
  pendingAuthRequired: false,
}

export const fetchFlashCardQuiz = createAsyncThunk("flashcard/fetchQuiz", async (slug: string, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/quizzes/flashcard/${slug}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`Failed to fetch flashcard quiz: ${response.status}`, errorData)
      return rejectWithValue(errorData.message || `Failed to fetch flashcard quiz: ${response.status}`)
    }

    const data = await response.json()

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
export const saveFlashCardResultsLocally = createAsyncThunk(
  "flashcard/saveResultsLocally",
  async ({ slug, data }: { slug: string; data: any }, { rejectWithValue }) => {
    try {
      if (typeof window === 'undefined') {
        return rejectWithValue("Local storage is not available in this environment.")
      }

      const pendingData = {
        slug,
        quizType: "flashcard",
        results: data,
        timestamp: Date.now(),
      }

      localStorage.setItem(STORAGE_KEYS.PENDING_QUIZ_RESULTS.toString(), JSON.stringify(pendingData))

      return {
        ...data,
        savedLocally: true, // Indicate that results are saved locally
      }
    } catch (error: any) {
      console.error('Error saving flashcard results locally:', error)
      return rejectWithValue(error.message)
    }
  },
)
export const saveFlashCardResults = createAsyncThunk(
  "flashcard/saveResults",
  async ({ slug, data }: { slug: string; data: any }, { rejectWithValue, getState }) => {
    try {
      const response = await fetch(`/api/quizzes/common/${slug}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        console.error(`Failed to save results for ${slug}. Status: ${response.status}`)
        const errorData = await response.json().catch(() => ({}))

        const state = getState() as RootState
        return rejectWithValue({
          savedLocally: true, // Indicate that results are only saved locally
          error: errorData.message || `API error: ${response.status}`,
          ...state.flashcard.results // Include existing results to merge
        })
      }

      return await response.json()
    } catch (error: any) {
      console.error('Error saving flashcard results:', error)
      const state = getState() as RootState
      return rejectWithValue({
        savedLocally: true, // Indicate that results are only saved locally
        error: error.message,
        ...state.flashcard.results // Include existing results to merge
      })
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

   submitFlashCardAnswer: (state, action: PayloadAction<{
      questionId: string | number
      answer: "correct" | "incorrect" | "still_learning"
      timeSpent?: number
    }>) => {
      const { questionId, answer, timeSpent } = action.payload;
      
      const existingIndex = state.answers.findIndex(a => 
        (a as RatingAnswer).questionId === questionId
      );
      
      const newAnswer: RatingAnswer = {
        questionId: String(questionId),
        answer,
        isCorrect: answer === "correct",
        timeSpent: timeSpent || 0
      };
      
      if (existingIndex >= 0) {
        state.answers[existingIndex] = newAnswer;
      } else {
        state.answers.push(newAnswer);
      }
    },
    completeFlashCardQuiz: (state, action: PayloadAction<QuizResultsState>) => {
      state.isCompleted = true
      state.status = "completed" // Set status to completed
      state.results = {
        ...action.payload,
        completedAt: new Date().toISOString(),        quizId: state.quizId || "",
        slug: state.slug || "",
        title: state.title,
        questions: state.questions,
      }
      state.shouldRedirectToResults = true
    },
    resetFlashCards: (state) => {
      // Only reset if not in a processing state
      if (state.status !== "submitting" && state.status !== "loading") {
        Object.assign(state, initialState) // Reset to initial state
        // Clear only the specific pending results storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.PENDING_QUIZ_RESULTS)
          sessionStorage.removeItem(STORAGE_KEYS.PENDING_QUIZ_RESULTS)
        }
      }
    },
    forceResetFlashCards: (state) => {
      Object.assign(state, initialState) // Force reset to initial state
      // Aggressively clear all relevant storage keys
      if (typeof window !== 'undefined') {
        const keysToRemove = [
          STORAGE_KEYS.PENDING_QUIZ_RESULTS,
          // Add any other legacy keys that might exist and need clearing
          'flashcard_complete_state',
          'flashcard_results',
          'flashcard_emergency_backup',
          'flashcard_state',
          'redux_state_flashcard'
        ]
        keysToRemove.forEach(key => {
          try { localStorage.removeItem(key) } catch (e) { /* ignore */ }
          try { sessionStorage.removeItem(key) } catch (e) { /* ignore */ }
        })
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
      return { ...initialState }    },
      completeQuiz: (state, action: PayloadAction<{
      totalTime?: number
    }>) => {
      // Safely process answers, handling potential type issues
      const processAnswers = () => {
        try {
          // Default to empty array if state.answers is undefined
          const answers = state.answers || [];
          
          const correctCount = answers.filter(a => 
            (a as RatingAnswer).answer === "correct"
          ).length;
          
          const stillLearningCount = answers.filter(a => 
            (a as RatingAnswer).answer === "still_learning"
          ).length;
          
          const incorrectCount = answers.filter(a => 
            (a as RatingAnswer).answer === "incorrect"
          ).length;

          // Calculate unanswered questions
          const totalAnswered = correctCount + stillLearningCount + incorrectCount;
          const unansweredCount = Math.max(0, state.questions.length - totalAnswered);
          
          // If we have unanswered questions, include them as incorrect
          const adjustedIncorrectCount = incorrectCount + unansweredCount;

          return { 
            correctCount, 
            stillLearningCount, 
            incorrectCount: adjustedIncorrectCount,
            totalAnswered
          };
        } catch (error) {
          console.error("Error processing answers:", error);
          // Fallback to default counts if we encounter errors
          return { 
            correctCount: 0, 
            stillLearningCount: 0, 
            incorrectCount: state.questions.length,
            totalAnswered: 0
          };
        }
      };
      
      // Get answer counts
      const { correctCount, stillLearningCount, incorrectCount, totalAnswered } = processAnswers();
      
      const totalQuestions = state.questions.length;
      const percentage = totalQuestions > 0 
        ? Math.round((correctCount / totalQuestions) * 100) 
        : 0;
      
      // Ensure we have a complete quiz ID and slug
      const quizId = state.quizId || `quiz-${Date.now()}`;
      const slug = state.slug || `quiz-${Date.now()}`;

      // Validate that we have a proper state
      if (!state.questions || state.questions.length === 0) {
        console.error('Cannot complete quiz without questions');
        return;
      }

      // Create review cards - ensure we don't have out-of-range indices
      const reviewCards = state.answers
        .map((a, i) => ((a as RatingAnswer).answer === "incorrect" ? i : -1))
        .filter(i => i >= 0 && i < state.questions.length);

      const stillLearningCards = state.answers
        .map((a, i) => ((a as RatingAnswer).answer === "still_learning" ? i : -1))
        .filter(i => i >= 0 && i < state.questions.length);

      // Create results object with all required fields
      state.results = {
        quizId,
        slug,
        title: state.title || "Flashcard Quiz",
        correctCount,
        incorrectCount,
        stillLearningCount,
        totalTime: action.payload.totalTime || 0,
        totalQuestions,
        score: correctCount,
        percentage,
        reviewCards,
        stillLearningCards,
        completedAt: new Date().toISOString(),
        questions: state.questions,
        // Add additional fields for compatibility
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        stillLearningAnswers: stillLearningCount,
        maxScore: totalQuestions,
        userScore: correctCount
      };
      
      // Always mark as completed regardless of results
      state.isCompleted = true;
      state.status = "completed";
      state.shouldRedirectToResults = true;
      
      // Store in localStorage as backup
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            STORAGE_KEYS.FLASHCARD_RESULTS,
            JSON.stringify(state.results)
          );        } catch (e) {
          console.warn("Could not save quiz results to localStorage");
        }
      }
    },
    setQuizResults: (state, action: PayloadAction<QuizResultsState>) => {
      state.results = action.payload
      state.isCompleted = true
      state.status = "succeeded"
    },

    resetRedirectFlag: (state) => {
      state.shouldRedirectToResults = false
    },

    savePendingResults: (state) => {
      console.log("Saving pending results to localStorage...", state);
      if (!state.results || !state.slug) return

      const pendingData = {
        slug: state.slug,
        quizType: "flashcard",
        results: state.results,
        timestamp: Date.now(),
        questions: state.questions,
        title: state.title,
        answers: state.answers, // Save answers for full restoration
        currentQuestion: state.currentQuestion, // Save current question
        isCompleted: state.isCompleted, // Save completion status
      }

      // Save to localStorage for persistence across sessions
      if (typeof window !== 'undefined') {

        localStorage.setItem(STORAGE_KEYS.PENDING_QUIZ_RESULTS.toString(), JSON.stringify(pendingData))
      }
      //Fix update the state to indicate results are saved
      state.results = {
        ...state.results,
        savedLocally: true, // Indicate that results are saved locally
      } as QuizResultsState
    },

    restoreResultsAfterAuth: (state, action: PayloadAction<{ slug: string }>) => {
      try {
        if (typeof window === 'undefined') return;

        const storedData = localStorage.getItem(STORAGE_KEYS.PENDING_QUIZ_RESULTS)
        if (storedData) {
          const parsedData = JSON.parse(storedData)

          if (parsedData?.slug === action.payload.slug) {
            // Ensure the results object has all required fields
            if (parsedData.results) {
              state.results = {
                quizId: parsedData.results.quizId || parsedData.slug || "",
                slug: parsedData.slug || "",
                title: parsedData.results.title || parsedData.title || "Flashcard Quiz",
                correctCount: parsedData.results.correctCount || parsedData.results.correctAnswers || 0,
                incorrectCount: parsedData.results.incorrectCount || parsedData.results.incorrectAnswers || 0,
                stillLearningCount: parsedData.results.stillLearningCount || parsedData.results.stillLearningAnswers || 0,
                totalTime: parsedData.results.totalTime || 0,
                totalQuestions: parsedData.results.totalQuestions || parsedData.questions?.length || 0,
                score: parsedData.results.score || 0,
                percentage: parsedData.results.percentage || 0,
                reviewCards: parsedData.results.reviewCards || [],
                stillLearningCards: parsedData.results.stillLearningCards || [],
                completedAt: parsedData.results.completedAt || new Date().toISOString(),                questions: parsedData.questions || []
              }
            }

            state.isCompleted = parsedData.isCompleted || true // Ensure completed
            state.status = "succeeded"
            state.questions = parsedData.questions || []
            state.answers = parsedData.answers || []
            state.currentQuestion = parsedData.currentQuestion || 0
            state.title = parsedData.title || state.title
            state.slug = parsedData.slug || state.slug
            state.quizId = parsedData.quizId || state.quizId

            // Reset auth-related flags after successful restoration
            state.requiresAuth = false;
            state.pendingAuthRequired = false;

            // Clear pending results after successful restoration
            localStorage.removeItem(STORAGE_KEYS.PENDING_QUIZ_RESULTS)
          }
        }
      } catch (error) {
        console.warn("Failed to restore results after auth:", error)
        // Ensure pending results are cleared even on error to prevent infinite loops
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.PENDING_QUIZ_RESULTS)
        }
      }
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
        state.status = action.payload?.error ? "completed_with_errors" : "succeeded";
        if (action.payload) {
          state.results = {
            ...state.results,
            ...action.payload,
            savedLocally: false, // Clear local save flag when API succeeds
          } as QuizResultsState;
        }
      })
      .addCase(saveFlashCardResults.rejected, (state, action) => {
        const payload = action.payload as any;
        if (payload?.savedLocally) {
          // If we have locally saved results, merge them
          state.results = {
            ...state.results,
            ...payload,
            savedLocally: true,
            error: payload.error,
          } as QuizResultsState;
          state.status = "completed_with_errors";
        } else {
          state.status = "failed";
          state.error = payload?.error || action.error.message || "Failed to save results.";
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
  savePendingResults,
  restoreResultsAfterAuth,
  completeQuiz
} = flashcardSlice.actions

// Selectors
export const selectQuizId = (state: RootState) => state.flashcard.quizId
export const selectQuizSlug = (state: RootState) => state.flashcard.slug
export const selectQuizTitle = (state: RootState) => state.flashcard.title
export const selectQuizQuestions = (state: RootState) => state.flashcard.questions

export const selectIsQuizComplete = (state: RootState) => state.flashcard.isCompleted
export const selectQuizStatus = (state: RootState) => state.flashcard.status
export const selectQuizError = (state: RootState) => state.flashcard.error

// Add the missing selectors for auth flags
export const selectRequiresAuth = (state: RootState) => state.flashcard.requiresAuth;
export const selectPendingAuthRequired = (state: RootState) => state.flashcard.pendingAuthRequired;

// Selector for the entire flashcard state - useful for debugging
export const selectFlashcardState = (state: RootState) => state.flashcard;

export const selectQuizResults = (state: RootState) => state.flashcard.results
export const selectQuizScore = (state: RootState) => state.flashcard.results?.score ?? 0
export const selectQuizTotalQuestions = (state: RootState) => state.flashcard.results?.totalQuestions ?? 0
export const selectQuizTotalTime = (state: RootState) => state.flashcard.results?.totalTime ?? 0

export const selectCurrentQuestionIndex = (state: RootState) => state.flashcard.currentQuestion
export const selectAnswers = (state: RootState) => state.flashcard.answers

export const selectShouldRedirectToResults = (state: RootState) => state.flashcard.shouldRedirectToResults

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
  [selectAnswers],
  (answers) => {
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

    return {
      correctCount,
      stillLearningCount,
      incorrectCount,
      totalCount: answers.length,
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
    if (results) return results;

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
    };
  }
);

export default flashcardSlice.reducer
