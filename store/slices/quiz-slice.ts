import { createSlice, createAsyncThunk, type PayloadAction, createSelector } from "@reduxjs/toolkit"
import type { RootState } from "../index"
import type { QuizType } from "@/types/quiz"
import { hydrateFromStorage } from "../middleware/persistMiddleware"
import { apiClient } from "@/lib/api-client" // Fixed import path
import { StorageService } from "@/lib/storage-service"

// Export API endpoints for consistency across the app
export const API_ENDPOINTS = {
  mcq: "/api/quizzes/mcq",
  code: "/api/quizzes/code",
  blanks: "/api/quizzes/blanks",
  openended: "/api/quizzes/openended",

  // Add a common endpoint for consistent API access
  common: "/api/quizzes/common",
}

export interface QuizState {
  navigationHistory: never[]
  quizId: string | null // Keep for database compatibility
  quizType: QuizType | null // Keep for database compatibility
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
  slug: string | null // Primary identifier for UI operations
  wasReset?: boolean // Track if the quiz was reset
  isSaving: boolean
  isSaved: boolean
  saveError: string | null
  // Add flag to prevent premature resets
  isProcessingResults: boolean
}

// Load persisted state from storage for hydration
const loadPersistedState = (): Partial<QuizState> => {
  const persisted = hydrateFromStorage<Partial<QuizState>>("quiz_state")
  return persisted || {}
}

const initialState: QuizState = {
  navigationHistory: [], // Explicitly initialize as an empty array
  slug: null, // Primary identifier for UI operations
  quizId: null, // Keep for database compatibility
  quizType:null,
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
  // Restore persisted state during initialization
  ...loadPersistedState(),
}

// Add this safe type checking utility at the top of the file
const safeString = (value: any): string => {
  return typeof value === 'string' ? value : '';
};

// Modified fetchQuiz thunk to use apiClient
export const fetchQuiz = createAsyncThunk(
  "quiz/fetch",
  async (payload: any, { rejectWithValue }) => {
    try {
      // Handle case where payload or slug is null/undefined
      if (!payload) {
        return rejectWithValue({
          error: "Invalid quiz request: No payload provided"
        });
      }

      const slug = safeString(payload.slug);
      const type: QuizType = safeString(payload.quizType) as QuizType;

      // If we already have the data, use it directly
      if (payload.data && Array.isArray(payload.data.questions)) {
        return {
          ...payload.data,
          slug: slug,
          quizType: type // Ensure quizType is set correctly
        };
      }

      // Otherwise fetch from API
      if (!slug) {
        return rejectWithValue({
          error: "Invalid quiz request: Missing slug"
        });
      }

      const response = await fetch(API_ENDPOINTS[type as keyof typeof API_ENDPOINTS] + `/${slug}`);

      if (!response.ok) {
        const errorText = await response.text();
        return rejectWithValue({
          error: `Error loading quiz: ${response.status} ${response.statusText}`,
          details: errorText
        });
      }

      const data = await response.json();
      return {
        ...data,
        slug: slug,
        quizType: type // Ensure quizType is set correctly from the payload
      };
    } catch (error: any) {
      console.error("Quiz fetch error:", error);
      return rejectWithValue({
        error: error.message || "Failed to load quiz"
      });
    }
  }
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
      const answer = answers[qid] || null
      const correctAnswer = question.correctOptionId || question.correctAnswer || question.answer || ""
      let userAnswer: string | null = null
      let isCorrect = false

      if (!answer) {
        return {
          questionId: qid,
          isCorrect: false,
          userAnswer: null,
          correctAnswer,
          skipped: true,
        }
      }

      switch (question.type) {
        case "mcq":
        case "code":
          // Safely access properties with null checks
          userAnswer = answer && (answer.selectedOptionId || answer.selectedOption || "") || ""
          isCorrect = answer && answer.isCorrect === true
          break

        case "blanks":
          const blankAnswer = answer.filledBlanks?.[qid]?.trim().toLowerCase() || ""
          userAnswer = blankAnswer
          isCorrect = blankAnswer === correctAnswer.trim().toLowerCase()
          break

        case "openended":
          const text = answer.text?.trim()
          userAnswer = text || ""
          isCorrect = Boolean(userAnswer)
          break

        default:
          userAnswer = ""
      }
      
      if (userAnswer) totalAnswered++
      if (isCorrect) score++

      return {
        questionId: qid,
        isCorrect,
        userAnswer,
        correctAnswer,
        skipped: false,
      };
    });

    const results = {
      quizId: slug,
      slug: slug,
      title: title || "Quiz Results",
      quizType,
      score,
      maxScore: questions.length,
      totalAnswered,
      percentage: Math.round((score / questions.length) * 100),
      submittedAt: new Date().toISOString(),
      questionResults,
      questions, // Include questions in results
      answers: Object.values(answers), // Include answers in results
    }

    return results
  } catch (error: any) {
    return rejectWithValue(error.message)
  }
})

// Thunk: Initialize quiz with auth check
export const initializeQuiz = createAsyncThunk(
  "quiz/initializeQuiz",
  async (
    { slug, quizData, authStatus, quizType }: { slug: string; quizData?: any; authStatus: string; quizType: QuizType },
    { dispatch, getState },
  ) => {
    const state = getState() as RootState

    // If not authenticated, prepare for auth redirect
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

    // If authenticated, load quiz
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

    // Fetch from API if no data provided
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

// Helper function to normalize slug (added)
export const normalizeSlug = (slugInput: any): string => {
  if (typeof slugInput === "object" && slugInput !== null) {
    return slugInput.slug || slugInput.id || String(slugInput)
  }
  return String(slugInput)
}

// Thunk: Restore quiz after authentication
export const restoreQuizAfterAuth = createAsyncThunk("quiz/restoreQuizAfterAuth", async (_, { getState, dispatch }) => {
  const state = getState() as RootState

  // Try to get pending quiz from state or localStorage
  let pendingQuiz = state.quiz.pendingQuiz
  let pendingResults = null

  if (typeof window !== "undefined") {
    try {
      // First check for any specific quiz results
      const resultJson = localStorage.getItem("pendingQuizResults")
      if (resultJson) {
        pendingResults = JSON.parse(resultJson)
        
      }

      // Then check for general pending quiz state
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

  // If we found pending results, return those directly
  if (pendingResults?.results) {
    // When we find results, clear the storage
    localStorage.removeItem("pendingQuizResults")

    // Normalize the slug
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

  // Otherwise use the pending quiz if available
  if (pendingQuiz) {
    dispatch(clearAuthRedirect())

    // Normalize the slug
    if (pendingQuiz.slug) {
      pendingQuiz.slug = normalizeSlug(pendingQuiz.slug)
    }

    return pendingQuiz
  }

  throw new Error("No pending quiz to restore")
})

// Thunk: Submit quiz and prepare results
export const submitQuizAndPrepareResults = createAsyncThunk(
  "quiz/submitQuizAndPrepareResults",
  async ({ slug }: { slug: string }, { getState }) => {
    const state = getState() as RootState
    const { questions, answers, title } = state.quiz

    // Calculate results
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
      quizId: state.quiz.quizId, // Keep for database compatibility
      slug: slug, // Primary identifier for UI
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

// Thunk: Check auth and load results
export const checkAuthAndLoadResults = createAsyncThunk(
  "quiz/checkAuthAndLoadResults",
  async ({ slug, authStatus }: { slug: string; authStatus: string }, { getState, dispatch }) => {
    // If not authenticated, trigger auth redirect
    if (authStatus !== "authenticated") {
      dispatch(setAuthRedirect(`/dashboard/mcq/${slug}/results`))
      return { requiresAuth: true }
    }

    const state = getState() as RootState

    // If we have results, return them
    if (state.quiz.results) {
      return { results: state.quiz.results }
    }

    // Generate results from current state if possible
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

// Backward compatible: Keep existing fetchQuizResults thunk
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

// Improved rehydrateQuiz action to handle results properly
export const rehydrateQuizState = createAsyncThunk(
  "quiz/rehydrateState",
  async (pendingQuiz: { slug: string; quizData: any; currentState: any }, { getState, dispatch }) => {
    try {
      const state = getState() as RootState
      const { slug, quizData, currentState } = pendingQuiz

      // If we have data directly, use it
      if (quizData?.questions?.length > 0) {
        // Set questions and quiz data
        dispatch(
          setQuiz({
            quizId: slug,
            quizType: quizData.type || "mcq",
            title: quizData.title || "Quiz",
            questions: quizData.questions,
            type: quizData.type || "code",
          }),
        )

        // If we have saved answers, restore them
        if (currentState?.answers && Object.keys(currentState.answers).length > 0) {
          // Restore each answer
          Object.entries(currentState.answers).forEach(([questionId, answer]) => {
            dispatch(
              saveAnswer({
                questionId,
                answer,
              }),
            )
          })
        }

        // If showResults is true, set the completion flag
        if (currentState?.showResults) {
          dispatch(setQuizCompleted())
        }

        // If we have results, set them
        if (currentState?.results) {
          dispatch(setQuizResults(currentState.results))
        }

        return pendingQuiz
      }

      // If we don't have data directly, need to fetch the quiz
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

// Enhanced quiz state persistence function
export const persistQuizState = createAsyncThunk(
  "quiz/persistState",
  async (
    {
      stateType,
      data,
      useLocalStorage = false,
    }: { stateType: "results" | "progress" | "pendingQuiz"; data: any; useLocalStorage?: boolean },
    { dispatch }
  ) => {
    // Skip on server
    if (typeof window === 'undefined') return null;
    
    try {
      // First update Redux (single source of truth)
      switch (stateType) {
        case "results":
          dispatch(setQuizResults(data));
          break;
        case "pendingQuiz":
          dispatch(setPendingQuiz(data));
          break;
      }
      
      // Then persist to browser storage as needed
      try {
        const storageKey = `quiz_${stateType}_${data.slug || "current"}`;
        const storageData = JSON.stringify({
          ...data,
          timestamp: Date.now(), // Add timestamp for TTL purposes
        });
        
        // Always try to store in both storage types for redundancy
        if (useLocalStorage || stateType === "results") {
          try {
            localStorage.setItem(storageKey, storageData);
            
            // Store special keys for quiz results
            if (stateType === "results") {
              localStorage.setItem("pendingQuizResults", storageData);
            }
          } catch (e) {
            console.warn("Error storing in localStorage:", e);
          }
        }
        
        // Always store in sessionStorage for current session reliability
        try {
          sessionStorage.setItem(storageKey, storageData);
          
          // Store special keys for quiz results
          if (stateType === "results") {
            sessionStorage.setItem("pendingQuizResults", storageData);
          }
        } catch (e) {
          console.warn("Error storing in sessionStorage:", e);
        }
      } catch (e) {
        console.warn("Error persisting quiz state:", e);
      }
      
      return { success: true, data };
    } catch (error) {
      console.error("Failed to persist quiz state:", error);
      return { success: false, error };
    }
  }
);

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
      state.currentQuestionIndex = action.payload
    },

    // Modified resetQuiz to be more selective
    resetQuiz: (state) => {
      // Only reset if we're not processing results
      if (!state.isProcessingResults) {
        // Store current results in case they need to be preserved during auth flow
        let preservedResults = null;
        let preservedSlug = state.slug;
        
        // Check if we should preserve results during auth flow
        if (typeof window !== 'undefined') {
          try {
            // If there's a pending auth flow, preserve the results
            const authTimestamp = localStorage.getItem("quizAuthTimestamp");
            if (authTimestamp && Date.now() - parseInt(authTimestamp) < 5 * 60 * 1000) {
              preservedResults = state.results;
            }
          } catch (e) {
            console.warn("Error checking auth timestamp:", e);
          }
        }
        
        // Reset state
        state.questions = []
        state.answers = {}
        state.results = preservedResults // Keep results if during auth flow
        state.status = "idle"
        state.currentQuestionIndex = 0
        state.isCompleted = preservedResults !== null // Keep completed if results preserved
        state.error = null
        state.slug = preservedResults ? preservedSlug : null // Keep slug if results preserved
        state.quizId = preservedResults ? preservedSlug : null // Keep quizId if results preserved
        state.quizType = preservedResults ? state.quizType : null
        state.title = preservedResults ? state.title : ""
        state.wasReset = true

        // Clear any pending flags
        state.isSaving = false
        state.isSaved = false
        state.saveError = null
        
        // Don't clear storage if we're preserving results
        if (!preservedResults && typeof window !== 'undefined') {
          try {
            // Only clear session-specific storage, not persistent items
            sessionStorage.removeItem("pendingQuizState");
            sessionStorage.removeItem("quiz_state_backup");
            
            // Don't remove pendingQuizResults if we're in auth flow
            const authTimestamp = localStorage.getItem("quizAuthTimestamp");
            if (!authTimestamp || Date.now() - parseInt(authTimestamp) >= 5 * 60 * 1000) {
              sessionStorage.removeItem("pendingQuizResults");
            }
          } catch (e) {
            console.warn("Error selectively clearing storage:", e);
          }
        }
      }
    },

    // New action to safely reset quiz after results are processed
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

    // Add a dedicated method for users to force reset regardless of processing state
    forceResetQuiz: (state) => {
      state.questions = []
      state.answers = {}
      state.results = null
      state.status = "idle"
      state.currentQuestionIndex = 0
      state.isCompleted = false
      state.error = null
      state.slug = null
      state.quizId = null
      state.quizType = null
      state.title = ""
      state.wasReset = true
      state.isProcessingResults = false
      state.isSaving = false
      state.isSaved = false
      state.saveError = null
      state.pendingQuiz = null
      state.shouldRedirectToAuth = false
      state.shouldRedirectToResults = false
      state.authRedirectState = null
    },

    hydrateQuiz: (state, action: PayloadAction<any>) => {
      const { slug, quizData, currentState } = action.payload
      state.slug = slug
      state.quizType = quizData.quizType || state.quizType; // Ensure quizType is set correctly
      state.quizId = quizData.id;
      state.questions = quizData.questions || [];
      state.answers = currentState?.answers || {};
    },

    // Update setQuizResults to handle potential slug object structures
    setQuizResults: (state, action: PayloadAction<any>) => {
      state.results = action.payload
      state.isProcessingResults = false // Mark processing as complete

      // If we have nested slug in the results, normalize it
      if (action.payload?.slug && typeof action.payload.slug === "object") {
        state.slug = normalizeSlug(action.payload.slug)
      }

      state.status = "succeeded"
    },

    resetPendingQuiz: (state) => {
      // Clear redirect cache
    },    saveAnswer: (state, action: PayloadAction<{ questionId: string; answer: any }>) => {
      const { questionId, answer } = action.payload
      // Handle null/undefined answer with better defensive coding
      if (!answer || typeof answer !== 'object') {
        console.warn(`Skipping invalid answer for question ${questionId}:`, answer);
        return;
      }
      
      const qid = String(questionId || '')
      if (!qid) {
        console.warn('Skipping answer with invalid question ID');
        return;
      }
      
      const question = state.questions.find((q) => String(q?.id || '') === qid)
      if (!question) {
        console.warn(`Question not found for ID: ${qid}`);
        return;
      }      let isCorrect = false
      let userAnswer: string | null = null
      let selectedOptionId: string | null = null // Track this separately for robust storage

      // Enhanced switch with better type handling and validation
      switch (question.type) {
        case "mcq":
        case "code": {
          // Use a try/catch for extra safety when accessing potentially null properties
          try {
            // First try to get selectedOptionId with multiple fallbacks
            selectedOptionId = answer.selectedOptionId ?? 
                              answer.selectedOption ?? 
                              answer.optionId ?? 
                              answer.answerId ?? 
                              answer.userAnswer ?? 
                              null;
                              
            // Convert to string for consistent comparison and storage
            if (selectedOptionId !== null) {
              selectedOptionId = String(selectedOptionId);
            }
            
            // Also extract the user answer text if available
            userAnswer = selectedOptionId;
            
            // Handle the MCQ option text extraction if options are available
            if (selectedOptionId && question.options && Array.isArray(question.options)) {
              const selectedOption = question.options.find((o: any) => 
                String(o?.id || '') === String(selectedOptionId)
              );
              if (selectedOption?.text) {
                userAnswer = selectedOption.text;
              }
            }
            
            // Get correct answer with multiple fallbacks
            const correct = question.correctOptionId || question.correctAnswer || question.answer || '';
            
            // Compare for correctness (with type safety)
            if (selectedOptionId !== null && correct) {
              isCorrect = String(selectedOptionId) === String(correct);
            } else {
              isCorrect = false;
            }
          } catch (e) {
            console.error(`Error processing ${question.type} answer:`, e);
            userAnswer = '';
            selectedOptionId = null;
            isCorrect = false;
          }
          break;
        }

        case "blanks": {
          const userInput = answer?.userAnswer || answer?.text || ""
          const correctAnswer = question.answer?.trim().toLowerCase() || ""
          isCorrect = userInput.trim().toLowerCase() === correctAnswer
          userAnswer = userInput
          break
        }

        case "openended": {
          const text = answer?.text || answer?.userAnswer || ""
          isCorrect = answer?.isCorrect === true // Use provided isCorrect for openended
          userAnswer = text
          break
        }

        default:
          userAnswer = answer?.userAnswer || answer?.text || ""
          isCorrect = answer?.isCorrect === true
      }      // Ensure we don't store null/undefined values that could cause issues
      state.answers[qid] = {
        ...answer,
        // Always store selectedOptionId safely even if it's null
        selectedOptionId: selectedOptionId, 
        // Always use a string for userAnswer to prevent null reference issues
        userAnswer: userAnswer || "", 
        // Explicit boolean for isCorrect
        isCorrect: Boolean(isCorrect), 
        type: question.type || "unknown",
        timestamp: Date.now(),
        // Additional metadata for debugging
        questionType: question.type,
        questionId: qid,
      }

      // Remove auto-completion logic - let the user decide when to submit
      // The quiz should only be marked complete when explicitly submitted
    },

    clearResetFlag: (state) => {
      state.wasReset = false
    },

    setPendingQuiz: (state, action: PayloadAction<{ slug: string; quizData: any; currentState?: any }>) => {
      state.pendingQuiz = action.payload
      // Remove direct storage interaction - handled by middleware now
    },    clearPendingQuiz: (state) => {
      state.pendingQuiz = null
      // No direct storage manipulation needed
    },
    
    // Enhanced action to hydrate state from storage with improved reliability
    hydrateStateFromStorage: (state) => {
      // Try multiple sources for state hydration
      let foundState = null;
      
      // Skip if we're on the server
      if (typeof window === 'undefined') return;
      
      try {
        // 1. First check for pending quiz results (highest priority)
        try {
          const pendingResultsJson = localStorage.getItem("pendingQuizResults") || 
                                   sessionStorage.getItem("pendingQuizResults");
                                   
          if (pendingResultsJson) {
            const pendingResults = JSON.parse(pendingResultsJson);
            
            if (pendingResults.results) {
              // Directly update quiz results
              state.results = pendingResults.results;
              
              // Set quiz metadata if available
              if (pendingResults.slug) {
                state.slug = pendingResults.slug;
                state.quizId = pendingResults.slug;
                state.title = pendingResults.title || "Quiz Results";
                state.questions = pendingResults.questions || [];
                state.quizType = pendingResults.quizType as QuizType || "mcq";
              }
              
              // Set completion state if needed
              if (pendingResults.isCompleted) {
                state.isCompleted = true;
              }
              
              // Mark as successful hydration
              foundState = true;
            }
          }
        } catch (e) {
          console.warn("Error checking pending quiz results:", e);
        }
        
        // 2. Fall back to standard redux persist state if no results found
        if (!foundState) {
          const persisted = hydrateFromStorage<Partial<QuizState>>("quiz_state");
          if (persisted) {
            Object.entries(persisted).forEach(([key, value]) => {
              if (value !== undefined) {
                (state as any)[key] = value;
              }
            });
            foundState = true;
          }
        }
        
        // 3. Try backup in session storage as last resort
        if (!foundState) {
          try {
            const backupJson = sessionStorage.getItem("quiz_state_backup");
            if (backupJson) {
              const backup = JSON.parse(backupJson);
              if (backup) {
                Object.entries(backup).forEach(([key, value]) => {
                  if (value !== undefined) {
                    (state as any)[key] = value;
                  }
                });
              }
            }
          } catch (e) {
            console.warn("Error hydrating from backup state:", e);
          }
        }
      } catch (error) {
        console.error("Failed to hydrate state from storage:", error);
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
      // Only set isCompleted if it's not already true to prevent infinite updates
      if (!state.isCompleted) {
        state.isCompleted = true
        state.isProcessingResults = true // Mark as processing results
      }
    },

    // Backward compatible: Keep existing actions
    setQuizId: (state, action: PayloadAction<string | number>) => {
      // Convert numeric IDs to strings
      const id = String(action.payload)
      state.quizId = id // Keep for database compatibility
      state.slug = id // Primary identifier for UI
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

    // Add missing setQuiz action
    setQuiz: (state, action: PayloadAction<{ quizId: string; slug: string; quizType: QuizType; title: string; questions: any[]; type: string }>) => {
      const { quizId, title, questions, type, quizType } = action.payload
      state.quizId = quizId
      state.slug = quizId // Always set slug!
      state.title = title
      state.questions = questions
      state.quizType = quizType as QuizType
      state.status = "succeeded"
    },

    // Add a reset state action
    resetState: () => {
      return initialState
    },    // Reset the submission state
    resetSubmissionState: (state) => {
      state.status = state.status === "submitting" ? "succeeded" : state.status
      state.isProcessingResults = false
      state.isCompleted = false
    },

    clearQuizState: (state) => {
      Object.assign(state, initialState); // Reset state to initial values
    },
  },

  extraReducers: (builder) => {
    builder
      // Backward compatible: Handle existing fetchQuiz
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

        const { slug, id, quizType, title, questions } = action.payload

        state.status = "succeeded"
        state.slug = slug || id || state.slug || ""; // Use existing slug or empty string instead of "unknown"
        state.quizId = id || slug || state.quizId || ""; // Keep id for compatibility
        state.quizType = quizType || state.quizType; // Ensure quizType is set correctly
        state.title = title || "Untitled Quiz"; // Fallback to "Untitled Quiz"
        state.questions = questions || []; // Default to empty array if questions are missing
        state.currentQuestionIndex = 0
        state.answers = {}
        state.isCompleted = false
        state.results = null

        console.info("Quiz loaded successfully:", { slug, id, quizType, title, questions })
      })      .addCase(fetchQuiz.rejected, (state, action: any) => {
        state.status = "failed"
        state.error = action.payload?.error || action.error?.message || "Failed to load quiz"
        
        // Provide default values to prevent null reference errors in the UI
        state.slug = "";
        state.title = "Quiz Not Available";
        state.questions = [];
        state.currentQuestionIndex = 0;
        state.isCompleted = false;
        state.answers = {};
      })

      // Enhanced submitQuiz handling - preserve state
      .addCase(submitQuiz.pending, (state) => {
        state.status = "submitting"
        state.error = null
        state.isProcessingResults = true // Mark as processing
      })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.results = action.payload
        // Keep all other state intact - don't reset anything
        // isProcessingResults will be set to false when setQuizResults is called
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload as string
        state.isProcessingResults = false
      })

      // Backward compatible: Handle existing fetchQuizResults
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

      // Initialize quiz
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
          // Ensure both ID fields are strings
          const id = String(action.payload.quizData.id || "");
          state.slug = id;
          state.quizId = id;
          state.quizType = action.payload.quizData.type
          state.title = action.payload.quizData.title
          state.questions = action.payload.quizData.questions
        }
      })
      .addCase(initializeQuiz.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to initialize quiz"
      })

      // Restore after auth
      .addCase(restoreQuizAfterAuth.fulfilled, (state, action) => {
        const { slug, quizData, currentState } = action.payload
        // Ensure both ID fields are strings
        const normalizedSlug = String(slug || "");
        state.quizId = normalizedSlug;
        state.slug = normalizedSlug; // Set slug
        state.quizType = quizData?.type || "mcq" // Default to "mcq" if type is missing
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

      // Submit quiz and prepare results
      .addCase(submitQuizAndPrepareResults.pending, (state) => {
        state.status = "submitting"
        state.isProcessingResults = true
      })
      .addCase(submitQuizAndPrepareResults.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.results = action.payload
        state.shouldRedirectToResults = true
        // Keep processing flag until results are displayed
      })
      .addCase(submitQuizAndPrepareResults.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to submit quiz"
        state.isProcessingResults = false
      })

      // Check auth and load results
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

      // Handle save results to database
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
  forceResetQuiz,
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
  // Backward compatible exports
  setQuizId,
  setQuizType,
  setSessionId,
  resetSaveStatus,
  setQuiz,
  resetState,
  hydrateStateFromStorage,
  resetSubmissionState, // Add the missing export here
  clearQuizState,
} = quizSlice.actions

// Selectors - keeping all existing ones for backward compatibility
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
export const selectQuizType = createSelector([selectQuizState], (quiz) => quiz?.quizType ?? "mcq")
export const selectCurrentQuestion = createSelector(
  [selectQuestions, selectCurrentQuestionIndex],
  (questions, currentIndex) => {
    // Safety checks to prevent errors
    if (!Array.isArray(questions) || questions.length === 0) {
      return null;
    }
    
    // Ensure index is within bounds
    if (currentIndex < 0 || currentIndex >= questions.length) {
      return questions[0]; // Default to first question if index is out of bounds
    }
    
    return questions[currentIndex];
  }
)

export const clearAuthState = (state: RootState) => {
  const quiz = selectQuizState(state)
  quiz.shouldRedirectToAuth = false
  quiz.authRedirectState = null
  quiz.authStatus = "idle"
}
// New selectors for auth flow
export const selectShouldRedirectToAuth = createSelector([selectQuizState], (quiz) => quiz.shouldRedirectToAuth)
export const selectShouldRedirectToResults = createSelector([selectQuizState], (quiz) => quiz.shouldRedirectToResults)
export const selectAuthRedirectUrl = createSelector([selectQuizState], (quiz) => quiz.authRedirectState?.callbackUrl)

// Backward compatible: Keep existing selectors
export const selectOrGenerateQuizResults = createSelector(
  [selectQuestions, selectAnswers, selectQuizTitle, selectQuizId],
  (questions, answers, title, quizId) => {
    // Protect against null/undefined values and ensure we have data
    if (!answers || !questions || Object.keys(answers).length === 0 || questions.length === 0) {
      return null
    }
    
    // Filter out any null answers to prevent errors
    const validAnswers = Object.entries(answers).reduce((acc, [key, val]) => {
      if (val !== null && val !== undefined) {
        acc[key] = val;
      }
      return acc;
    }, {} as Record<string, any>);    // Generate questionResults from answers
    const questionResults = Object.entries(validAnswers).map(([questionId, answerData]: [string, any]) => {
      // First make sure answerData is not null
      if (!answerData) {
        return {
          questionId,
          userAnswer: "Not answered",
          selectedOptionId: null,
          isCorrect: false,
        }
      }
      
      // Find the matching question to determine if the answer was correct
      const question = questions.find((q: any) => q.id.toString() === questionId)
      let isCorrect = false

      // Safely access selectedOptionId
      const selectedOptionId = answerData.selectedOptionId || null
      
      if (question && selectedOptionId) {
        if (question.answer === selectedOptionId) {
          isCorrect = true
        }
      }

      return {
        questionId,
        userAnswer: selectedOptionId || "Not answered",
        selectedOptionId: selectedOptionId,
        isCorrect,
      }
    })

    // Calculate score metrics
    const correctCount = questionResults.filter((qr) => qr.isCorrect).length
    const totalCount = questions.length
    const percentage = Math.round((correctCount / totalCount) * 100)

    // Return a complete result object
    return {
      quizId,
      slug: quizId, // Fixed: Use quizId as slug since it's what we have available
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

// Selector to get answer for a specific question
export const selectAnswerForQuestion = (state: RootState | any, questionId: string | number) => {
  const normalizedId = String(questionId)
  return state?.quiz?.answers?.[normalizedId] ?? null
}

// Restore auth redirect state selector
export const restoreAuthRedirectState = (state: RootState | any) => {
  if (!state || !state.quiz) return null
  return state.quiz.authRedirectState || null
}

// Additional selectors for save state
export const selectIsSaving = createSelector([selectQuizState], (quiz) => quiz.isSaving)
export const selectIsSaved = createSelector([selectQuizState], (quiz) => quiz.isSaved)
export const selectSaveError = createSelector([selectQuizState], (quiz) => quiz.saveError)

export default quizSlice.reducer

export const saveAuthRedirectState = (state: RootState, payload: { callbackUrl: string; quizState: any }) => {
  const quiz = selectQuizState(state)
  quiz.authRedirectState = payload
}

// Enhanced saveQuizResultsToDatabase thunk with better data transformation
export const saveQuizResultsToDatabase = createAsyncThunk(
  "quiz/saveResultsToDatabase",
  async ({ slug, quizType }: { slug: string; quizType: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState
      const { results, title, questions } = state.quiz

      if (!results) {
        return rejectWithValue("No results to save")
      }      // Get question results from various possible locations in the results structure
      // with improved source prioritization
      const questionResults = results.questionResults || 
                             (Array.isArray(results.questions) ? results.questions : []);
      
      // Create a comprehensive answer map for easier question-answer matching
      const answerMap = new Map();
      if (Array.isArray(results.answers)) {
        results.answers.forEach((ans: any) => {
          if (ans && (ans.questionId || ans.id)) {
            answerMap.set(String(ans.questionId || ans.id), ans);
          }
        });
      }
      
      // Create a comprehensive question map for easier reference
      const questionMap = new Map();
      if (Array.isArray(questions)) {
        questions.forEach((q: any) => {
          if (q && (q.id || q.questionId)) {
            questionMap.set(String(q.id || q.questionId), q);
          }
        });
      }
      
      // Create normalized answers array with consistent property naming and enhanced extraction
      const normalizedAnswers = questionResults.map((qr: any) => {
        // Ensure we have all required fields with proper fallbacks
        const qid = String(qr.questionId || qr.id || '');
        
        // Find question data with enhanced lookup (using map for better performance)
        const question = questionMap.get(qid) || 
                        questions.find((q: any) => String(q.id) === qid || String(q.questionId) === qid);
        
        // Find answer data with enhanced lookup
        const answer = answerMap.get(qid) || 
                      results.answers?.find((a: any) => 
                        String(a.questionId || a.id) === qid
                      );
        
        // Extract question text with comprehensive fallbacks
        const questionText = qr.question || qr.text || 
                            question?.question || question?.text || 
                            `Question ${qid}`;
        
        // Extract user answer with comprehensive fallbacks
        const userAnswer = qr.userAnswer || qr.answer || 
                          answer?.userAnswer || answer?.answer || answer?.text || 
                          '';
        
        // Extract correct answer with comprehensive fallbacks
        const correctAnswer = qr.correctAnswer || 
                             question?.answer || question?.correctAnswer || question?.correctOptionId || 
                             '';
        
        // Extract answer type with fallbacks
        const answerType = qr.type || question?.type || quizType;
        
        // Handle correctness with proper boolean conversion and fallbacks
        const isCorrect = typeof qr.isCorrect === 'boolean' ? qr.isCorrect : 
                         typeof answer?.isCorrect === 'boolean' ? answer.isCorrect : 
                         false;
        
        // Return a comprehensive normalized answer object
        return {
          questionId: qid,
          timeSpent: qr.timeSpent || answer?.timeSpent || answer?.time || 30, // Default value
          isCorrect: isCorrect,
          // Ensure we have the user's answer in a reliable format
          userAnswer: userAnswer,
          answer: userAnswer, // Duplicate for compatibility 
          // Include question text and correct answer for completeness
          questionText: questionText,
          question: questionText, // Duplicate for compatibility
          correctAnswer: correctAnswer,
          type: answerType,
          // Include additional metadata if available
          similarity: qr.similarity || answer?.similarity,
          points: qr.points || answer?.points || (isCorrect ? 1 : 0),
          options: question?.options || qr.options,
        };
      });      // Prepare enhanced data for API including required fields and normalized structures
      const resultData = {
        // Use the normalized slug as quizId for consistency
        quizId: slug,
        type: quizType, // Use the provided quizType for consistency
        totalTime: results.totalTime || 60, // Required field with default value
        score: results.score || results.userScore || 0,
        maxScore: results.maxScore || questions.length || 0,
        percentage: results.percentage || Math.round(((results.score || 0) / (results.maxScore || questions.length || 1)) * 100) || 0,
        totalQuestions: questions.length || 0,
        title: results.title || title || `${quizType} Quiz`,
        // Use normalized answers array
        answers: normalizedAnswers,
        
        // Include enhanced question results for result display
        questionResults: normalizedAnswers.map((answer: any) => ({
          questionId: answer.questionId,
          question: answer.questionText || answer.question,
          userAnswer: answer.userAnswer,
          correctAnswer: answer.correctAnswer,
          isCorrect: answer.isCorrect,
          type: answer.type,
          similarity: answer.similarity,
          timeSpent: answer.timeSpent
        })),
        
        // Include all necessary fields for potential future use
        slug: slug,
        // Include both normalized questions and original questions for completeness
        questions: questions.map((q: any) => ({
          id: String(q.id || q.questionId || ""),
          questionId: String(q.id || q.questionId || ""),
          question: q.question || q.text || "",
          answer: q.answer || q.correctAnswer || q.correctOptionId || "",
          correctAnswer: q.answer || q.correctAnswer || q.correctOptionId || "",
          options: q.options || [],
          type: q.type || quizType
        })),
        originalQuestions: questions,
        completedAt: results.completedAt || new Date().toISOString(),
        
        // Include metadata for improved tracking
        metadata: {
          version: "1.0",
          normalized: true,
          generatedAt: new Date().toISOString(),
          answerCount: normalizedAnswers.length,
          questionCount: questions.length,
          // Store quiz type for potential filtering
          quizType: quizType, 
          // Track correct answer count for quick access
          correctAnswerCount: normalizedAnswers.filter((a: any) => a.isCorrect).length
        }
      }

      // Log success for debugging purposes
      console.log('Saving quiz results:', { 
        slug, quizType, questionCount: normalizedAnswers.length 
      });
      
      // Use apiClient instead of direct fetch
      return await apiClient.post(`/api/quizzes/common/${slug}/complete`, resultData)
    } catch (error: any) {
      console.error("Error in saveQuizResultsToDatabase:", error)
      return rejectWithValue(error.message || "Failed to save results")
    }
  }
)
