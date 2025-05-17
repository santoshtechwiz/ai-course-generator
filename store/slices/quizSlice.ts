// store/slices/quizSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { QuizData, UserAnswer, QuizResult, QuizHistoryItem, QuizType } from "@/app/types/quiz-types"

export const API_ENDPOINTS: Record<QuizType, string> = {
  mcq: "/api/quizzes/mcq",
  code: "/api/quizzes/code",
  blanks: "/api/quizzes/blanks",
  openended: "/api/quizzes/openended",
}

const normalizeQuizData = (raw: any, slug: string, type: QuizType): QuizData => ({
  id: raw.quizId || raw.id || "",
  title: raw.quizData?.title || "Quiz",
  slug,
  type,
  questions: Array.isArray(raw.quizData?.questions)
    ? raw.quizData.questions.map((q: any, index: number) => ({
        id: q.id || `q-${index}-${Math.random().toString(36).substring(2, 8)}`,
        question: q.question || "",
        codeSnippet: q.codeSnippet || "",
        options: Array.isArray(q.options) ? [...q.options] : [],
        answer: q.answer || q.correctAnswer || "",
        correctAnswer: q.correctAnswer || q.answer || "",
        language: q.language || "javascript",
        type // Add the type property to ensure compatibility
      }))
    : [],
  isPublic: !!raw.isPublic,
  isFavorite: !!raw.isFavorite,
  ownerId: raw.ownerId || "",
  timeLimit: raw.quizData?.timeLimit || null,
})

// -----------------------------------------
// Initial State
// -----------------------------------------
interface QuizState {
  quizData: QuizData | null
  currentQuestion: number
  userAnswers: UserAnswer[]
  isLoading: boolean
  isSubmitting: boolean
  isCompleted: boolean
  timerActive: boolean
  timeRemaining: number | null
  currentQuizId: string | null
  results: QuizResult | null
  quizHistory: QuizHistoryItem[]

  quizError: string | null
  submissionError: string | null
  resultsError: string | null
  historyError: string | null

  // For legacy/test compatibility
  error?: string | null

  submissionStateInProgress: boolean
}

const initialState: QuizState = {
  quizData: null,
  currentQuestion: 0,
  userAnswers: [],
  isLoading: false,
  isSubmitting: false,
  isCompleted: false,
  timerActive: false,
  timeRemaining: null,
  currentQuizId: null,
  results: null,
  quizHistory: [],
  quizError: null,
  submissionError: null,
  resultsError: null,
  historyError: null,
  error: null, // legacy/test compatibility
  submissionStateInProgress: false,
}

// -----------------------------------------
// Async Thunks
// -----------------------------------------
export const fetchQuiz = createAsyncThunk(
  "quiz/fetchQuiz",
  async ({ slug, type }: { slug: string; type: QuizType }, { rejectWithValue }) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ""
      const endpoint = API_ENDPOINTS[type]
      const url = new URL(`${endpoint}/${slug}`, baseUrl).toString()

      const response = await fetch(url)
      if (!response.ok) {
        const err = await response.json()
        return rejectWithValue(err.message || `Failed to fetch ${type} quiz`)
      }

      const data = await response.json()
      return normalizeQuizData(data, slug, type)
    } catch {
      return rejectWithValue("Failed to load quiz. Please try again.")
    }
  },
)

export const submitQuiz = createAsyncThunk(
  "quiz/submitQuiz",
  async (payload: { 
    slug: string; 
    quizId?: string; 
    type: QuizType; 
    answers: UserAnswer[];
    timeTaken?: number;
  }, { rejectWithValue }) => {
    try {
      // Use the correct API endpoint for quiz submission
      const response = await fetch(`/api/quizzes/common/${payload.slug}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        credentials: "include",
        body: JSON.stringify({
          quizId: payload.quizId,
          answers: payload.answers,
          type: payload.type,
          timeTaken: payload.timeTaken
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(errorData || response.statusText);
      }

      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const getQuizResults = createAsyncThunk("quiz/getResults", async (slug: string, { rejectWithValue }) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ""
    const response = await fetch(`${baseUrl}/api/quizzes/results?slug=${slug}`)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to retrieve results" }))
      return rejectWithValue(errorData.message || "Could not retrieve results")
    }
    
    const data = await response.json()
    
    // Validate that we received proper results data
    if (!data || typeof data !== 'object') {
      return rejectWithValue("Invalid results data received")
    }
    
    // Ensure we have the necessary fields for the quiz results
    const processedData = {
      ...data,
      title: data.title || "Quiz",
      slug: data.slug || slug,
      score: typeof data.score === 'number' ? data.score : 0,
      maxScore: typeof data.maxScore === 'number' ? data.maxScore : 0,
      completedAt: data.completedAt || new Date().toISOString(),
      questions: Array.isArray(data.questions) ? data.questions.map(q => ({
        ...q,
        question: q.question || "Question",
        userAnswer: q.userAnswer || "",
        correctAnswer: q.correctAnswer || "",
        isCorrect: !!q.isCorrect
      })) : []
    }
    
    return processedData
  } catch (error) {
    console.error("Error fetching quiz results:", error)
    return rejectWithValue("Unexpected error fetching results.")
  }
})

export const fetchQuizHistory = createAsyncThunk("quiz/fetchQuizHistory", async (_, { rejectWithValue }) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ""
    const response = await fetch(`${baseUrl}/api/quiz/history`)
    if (!response.ok) {
      const err = await response.json()
      return rejectWithValue(err.message || "Failed to fetch quiz history")
    }
    return await response.json()
  } catch {
    return rejectWithValue("Unexpected error fetching history.")
  }
})

// Add new action for saving quiz submission state
export const saveQuizSubmissionState = createAsyncThunk(
  "quiz/saveQuizSubmissionState",
  async ({ slug, state }: { slug: string; state: string }, { rejectWithValue }) => {
    try {
      if (typeof window !== 'undefined') {
        const key = `quiz-submission-${slug}`;
        localStorage.setItem(key, state);
        return { slug, state };
      }
      return null;
    } catch (error) {
      return rejectWithValue("Failed to save quiz state to local storage");
    }
  }
);

// Add action to clear quiz submission state
export const clearQuizSubmissionState = createAsyncThunk(
  "quiz/clearQuizSubmissionState",
  async (slug: string, { rejectWithValue }) => {
    try {
      if (typeof window !== 'undefined') {
        const key = `quiz-submission-${slug}`;
        localStorage.removeItem(key);
        return slug;
      }
      return null;
    } catch (error) {
      return rejectWithValue("Failed to clear quiz state from local storage");
    }
  }
);

// Add action to get quiz submission state
export const getQuizSubmissionState = createAsyncThunk(
  "quiz/getQuizSubmissionState",
  async (slug: string, { rejectWithValue }) => {
    try {
      if (typeof window !== 'undefined') {
        const key = `quiz-submission-${slug}`;
        const state = localStorage.getItem(key);
        return { slug, state };
      }
      return { slug, state: null };
    } catch (error) {
      return rejectWithValue("Failed to get quiz state from local storage");
    }
  }
);

// -----------------------------------------
// Slice
// -----------------------------------------
const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    resetQuizState: (state) => {
      const preservedHistory = state.quizHistory
      Object.assign(state, { ...initialState, quizHistory: preservedHistory })
      state.error = null // legacy/test compatibility
    },
    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestion = action.payload
    },
    setUserAnswer: (state, action: PayloadAction<UserAnswer>) => {
      const i = state.userAnswers.findIndex((a) => a.questionId === action.payload.questionId)
      if (i !== -1) state.userAnswers[i] = action.payload
      else state.userAnswers.push(action.payload)
    },
    startTimer: (state) => {
      const limit = state.quizData?.timeLimit
      if (limit) {
        state.timeRemaining = limit * 60
        state.timerActive = true
      }
    },
    pauseTimer: (state) => {
      state.timerActive = false
    },
    resumeTimer: (state) => {
      state.timerActive = true
    },
    decrementTimer: (state) => {
      if (state.timeRemaining && state.timeRemaining > 0) {
        state.timeRemaining -= 1
      }
    },
    markQuizCompleted: (state, action: PayloadAction<QuizResult>) => {
      state.results = action.payload
      state.isCompleted = true
      state.timerActive = false
      if (state.timeRemaining !== null) {
        state.timeRemaining = 0
      }
    },
    // Add a setError action for handling authentication errors
    setError: (state, action: PayloadAction<string>) => {
      state.quizError = action.payload;
      state.error = action.payload; // For backward compatibility
    },
    // Add a reducer to track submission state
    setSubmissionInProgress: (state, action: PayloadAction<boolean>) => {
      state.submissionStateInProgress = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuiz.pending, (state) => {
        state.isLoading = true
        state.quizError = null
        state.error = null // legacy/test compatibility
      })
      .addCase(fetchQuiz.fulfilled, (state, action) => {
        state.quizData = action.payload
        state.currentQuizId = action.payload.id
        state.userAnswers = []
        state.currentQuestion = 0
        state.isLoading = false
        state.isCompleted = false
        state.timeRemaining = action.payload.timeLimit ? action.payload.timeLimit * 60 : null
        state.error = null // legacy/test compatibility
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        state.isLoading = false
        state.quizError = action.payload as string
        state.error = action.payload as string // legacy/test compatibility
      })

      .addCase(submitQuiz.pending, (state) => {
        state.isSubmitting = true
        state.submissionError = null
      })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        // Ensure we have a valid result
        if (action.payload && (typeof action.payload.score === 'number')) {
          // Merge all fields from the API result
          state.results = { ...action.payload }
          state.isCompleted = true
          state.isSubmitting = false
          state.timerActive = false

          const data = state.quizData
          if (data) {
            const history: QuizHistoryItem = {
              id: data.id,
              quizTitle: data.title,
              quizType: data.type,
              score: action.payload.score,
              maxScore: action.payload.maxScore,
              completedAt: new Date().toISOString(),
              slug: data.slug,
            }

            const idx = state.quizHistory.findIndex((q) => q.id === data.id)
            if (idx >= 0) state.quizHistory[idx] = history
            else state.quizHistory.push(history)
          }
        } else {
          // fallback for missing fields
          const data = state.quizData
          state.results = {
            quizId: data?.id || "",
            slug: data?.slug || "",
            title: data?.title || "",
            score: state.userAnswers.length,
            maxScore: data?.questions?.length || state.userAnswers.length,
            percentage: 100,
            completedAt: new Date().toISOString(),
            questions: data?.questions?.map(q => ({
              id: q.id,
              question: q.question,
              userAnswer: "",
              correctAnswer: q.correctAnswer || q.answer || "",
              isCorrect: true
            })) || []
          } as any
          state.isCompleted = true
          state.isSubmitting = false
          state.timerActive = false
        }
        state.error = null // legacy/test compatibility
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.isSubmitting = false;
        state.submissionError = action.payload as string;
        state.error = action.payload as string; // legacy/test compatibility

        // Even if submission to server fails, we can still show local results
        if (state.quizData && state.userAnswers.length > 0) {
          state.submissionError = "Server submission failed. Displaying local results.";
          state.error = "Server submission failed. Displaying local results."; // legacy/test compatibility

          const localResult = {
            quizId: state.quizData.id,
            slug: state.quizData.slug,
            title: state.quizData.title,
            score: state.userAnswers.length,
            maxScore: state.quizData.questions.length,
            percentage: Math.round((state.userAnswers.length / state.quizData.questions.length) * 100),
            completedAt: new Date().toISOString(),
            questions: state.quizData.questions.map(q => {
              const userAns = state.userAnswers.find(a => a.questionId === q.id);
              return {
                id: q.id,
                question: q.question,
                userAnswer: userAns?.answer || "",
                correctAnswer: q.correctAnswer || q.answer || "",
                isCorrect: true
              };
            })
          };
          state.results = localResult;
          state.isCompleted = true;
        }
      })

      .addCase(getQuizResults.pending, (state) => {
        state.isLoading = true
        state.resultsError = null
      })
      .addCase(getQuizResults.fulfilled, (state, action) => {
        state.results = action.payload
        state.isCompleted = true
        state.isLoading = false
      })
      .addCase(getQuizResults.rejected, (state, action) => {
        state.isLoading = false
        state.resultsError = action.payload as string
      })

      .addCase(fetchQuizHistory.pending, (state) => {
        state.isLoading = true
        state.historyError = null
      })
      .addCase(fetchQuizHistory.fulfilled, (state, action) => {
        state.quizHistory = action.payload
        state.isLoading = false
      })
      .addCase(fetchQuizHistory.rejected, (state, action) => {
        state.isLoading = false
        state.historyError = action.payload as string
      })

      // Handle submission state persistence
      builder.addCase(saveQuizSubmissionState.fulfilled, (state, action) => {
        if (action.payload?.slug === state.quizData?.slug) {
          state.submissionStateInProgress = action.payload.state === "in-progress";
        }
      });
      
      builder.addCase(clearQuizSubmissionState.fulfilled, (state, action) => {
        if (action.payload === state.quizData?.slug) {
          state.submissionStateInProgress = false;
        }
      });
      
      builder.addCase(getQuizSubmissionState.fulfilled, (state, action) => {
        if (action.payload?.slug === state.quizData?.slug) {
          state.submissionStateInProgress = action.payload.state === "in-progress";
        }
      });
  },
})

export const {
  resetQuizState,
  setCurrentQuestion,
  setUserAnswer,
  startTimer,
  pauseTimer,
  resumeTimer,
  decrementTimer,
  markQuizCompleted,
  setError,
  setSubmissionInProgress,
} = quizSlice.actions

export default quizSlice.reducer
