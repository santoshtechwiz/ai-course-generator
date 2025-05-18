import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { createAction } from '@reduxjs/toolkit';
import type { QuizData, UserAnswer, QuizResult, QuizHistoryItem, QuizType } from "@/app/types/quiz-types"

// Constants - move to separate file in larger applications
export const API_ENDPOINTS: Record<QuizType, string> = {
  mcq: "/api/quizzes/mcq",
  code: "/api/quizzes/code",
  blanks: "/api/quizzes/blanks",
  openended: "/api/quizzes/openended",
}

// Helpers - move to utils in larger applications
const normalizeQuizData = (raw: any, slug: string, type: QuizType): QuizData => ({
  id: raw.quizId || raw.id || "",
  title: raw.quizData?.title || "Quiz",
  slug,
  type,
  questions: Array.isArray(raw.quizData?.questions)
    ? raw.quizData.questions.map((q: any, index: number) => ({
        // Preserve the original question ID instead of generating a random one
        // For MCQ questions, ensure we maintain numeric IDs if they exist
        id: q.id || q.questionId || `q-${index}-${Math.random().toString(36).substring(2, 8)}`,
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
// State Interface
// -----------------------------------------
export interface QuizState {
  // Quiz data
  quizData: QuizData | null
  currentQuestion: number
  userAnswers: UserAnswer[]
  
  // Quiz status
  isLoading: boolean
  isSubmitting: boolean
  isCompleted: boolean
  timerActive: boolean
  submissionStateInProgress: boolean
  
  // Quiz results & history
  results: QuizResult | null
  quizHistory: QuizHistoryItem[]
  currentQuizId: string | null
  timeRemaining: number | null

  // Keep individual error fields for backward compatibility with tests
  error: string | null
  quizError: string | null
  submissionError: string | null
  resultsError: string | null
  historyError: string | null
  
  // Error state - consolidated for better management
  errors: {
    quiz: string | null
    submission: string | null
    results: string | null
    history: string | null
  }
}

const initialState: QuizState = {
  // Quiz data
  quizData: null,
  currentQuestion: 0,
  userAnswers: [],
  
  // Quiz status
  isLoading: false,
  isSubmitting: false,
  isCompleted: false,
  timerActive: false,
  submissionStateInProgress: false,
  
  // Quiz results & history
  results: null,
  quizHistory: [],
  currentQuizId: null,
  timeRemaining: null,
  
  // Keep individual error fields for backward compatibility with tests
  error: null,
  quizError: null,
  submissionError: null,
  resultsError: null,
  historyError: null,
  
  // Error state
  errors: {
    quiz: null,
    submission: null,
    results: null,
    history: null
  }
}

// -----------------------------------------
// Async Thunks - better organized
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
    } catch (error) {
      return rejectWithValue("Failed to load quiz. Please try again.")
    }
  },
)

export const submitQuiz = createAsyncThunk(
  'quiz/submitQuiz',
  async (payload: { 
    slug: string; 
    quizId?: string; 
    type: QuizType; 
    answers: UserAnswer[];
    timeTaken?: number;
    score?: number;
    totalQuestions?: number;
  }, { dispatch, rejectWithValue }) => {
    try {
      // For MCQ quizzes, we should use the common API endpoint since the MCQ-specific one doesn't exist
      const endpoint = `/api/quizzes/common/${payload.slug}/complete`;
      
      console.log(`Submitting quiz to endpoint: ${endpoint}`);
      
      // Ensure all required fields are present
      const correctAnswers = payload.answers.filter(a => a.isCorrect === true).length;
      const totalQuestions = payload.totalQuestions || payload.answers.length;
      
      const submissionData = {
        quizId: payload.quizId || payload.slug,
        answers: payload.answers.map(a => ({
          questionId: a.questionId,
          answer: a.answer,
          isCorrect: typeof a.isCorrect === 'boolean' ? a.isCorrect : undefined,
          timeSpent: Math.floor((payload.timeTaken || 600) / Math.max(payload.answers.length, 1))
        })),
        type: payload.type,
        score: payload.score !== undefined ? payload.score : correctAnswers,
        totalTime: payload.timeTaken || 600,
        totalQuestions,
        correctAnswers
      };
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        credentials: "include",
        body: JSON.stringify(submissionData),
      });

      // Handle 401 auth errors
      if (response.status === 401) {
        // Dispatch the authentication required action
        dispatch(authenticationRequired({ 
          fromSubmission: true,
          callbackUrl: `/dashboard/${payload.type}/${payload.slug}`
        }));
        
        // Throw error with status for test detection
        const error = new Error('Authentication required');
        Object.defineProperty(error, 'status', {
          value: 401,
          writable: true,
          configurable: true
        });
        throw error;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(errorData || response.statusText);
      }

      return await response.json();
    } catch (error: any) {
      // Add check for auth errors in catch block
      if (error.status === 401 || error.message === 'Unauthorized') {
        dispatch(authenticationRequired({ 
          fromSubmission: true,
          callbackUrl: `/dashboard/${payload.type}/${payload.slug}`
        }));
      }

      return rejectWithValue(error.message || "An unexpected error occurred");
    }
  }
);

export const getQuizResults = createAsyncThunk(
  "quiz/getResults", 
  async (slug: string, { rejectWithValue }) => {
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
      return rejectWithValue("Unexpected error fetching results.")
    }
  }
);

export const fetchQuizHistory = createAsyncThunk(
  "quiz/fetchQuizHistory", 
  async (_, { rejectWithValue }) => {
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
  }
);

// -----------------------------------------
// Persistence Thunks - now handled by middleware
// -----------------------------------------
export const saveQuizSubmissionState = createAsyncThunk(
  "quiz/saveQuizSubmissionState",
  async ({ slug, state }: { slug: string; state: string }, { rejectWithValue }) => {
    try {
      // Return the state info for the reducer to handle
      return { slug, state };
    } catch (error) {
      return rejectWithValue("Failed to save quiz state");
    }
  }
);

export const clearQuizSubmissionState = createAsyncThunk(
  "quiz/clearQuizSubmissionState",
  async (slug: string, { rejectWithValue }) => {
    try {
      return slug;
    } catch (error) {
      return rejectWithValue("Failed to clear quiz state");
    }
  }
);

export const getQuizSubmissionState = createAsyncThunk(
  "quiz/getQuizSubmissionState",
  async (slug: string, { rejectWithValue }) => {
    try {
      return { slug, state: null };
    } catch (error) {
      return rejectWithValue("Failed to get quiz state");
    }
  }
);

// Helper function to safely get correctAnswer from any question type
function getQuestionCorrectAnswer(q: any): string {
  if (q.correctAnswer) return q.correctAnswer;
  if (q.answer) return q.answer;
  return "";
}

// Add a new action for auth requirements
export const authenticationRequired = createAction<{
  fromSubmission?: boolean,
  callbackUrl?: string
}>('quiz/authenticationRequired');

// -----------------------------------------
// Slice Definition
// -----------------------------------------
const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    resetQuizState: (state) => {
      const preservedHistory = state.quizHistory
      Object.assign(state, { 
        ...initialState, 
        quizHistory: preservedHistory 
      })
    },
    
    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestion = action.payload
    },
    
    setUserAnswer: (state, action: PayloadAction<UserAnswer>) => {
      const i = state.userAnswers.findIndex((a) => a.questionId === action.payload.questionId)
      if (i !== -1) state.userAnswers[i] = action.payload
      else state.userAnswers.push(action.payload)
    },
    
    // Timer controls
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
      state.timeRemaining = 0
    },
    
    // Error handling
    setError: (state, action: PayloadAction<{type: 'quiz'|'submission'|'results'|'history', message: string}>) => {
      // Update both the consolidated and individual error fields for compatibility
      state.errors[action.payload.type] = action.payload.message;
      
      // Set the individual error fields for backward compatibility
      switch (action.payload.type) {
        case 'quiz':
          state.quizError = action.payload.message;
          state.error = action.payload.message; // Also update the general error
          break;
        case 'submission':
          state.submissionError = action.payload.message;
          state.error = action.payload.message; // Also update the general error
          break;
        case 'results':
          state.resultsError = action.payload.message;
          break;
        case 'history':
          state.historyError = action.payload.message;
          break;
      }
    },
    
    clearErrors: (state) => {
      state.errors = {
        quiz: null,
        submission: null,
        results: null,
        history: null
      };
      // Also clear individual error fields
      state.error = null;
      state.quizError = null;
      state.submissionError = null;
      state.resultsError = null;
      state.historyError = null;
    },
    
    // Submission state tracking
    setSubmissionInProgress: (state, action: PayloadAction<boolean>) => {
      state.submissionStateInProgress = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Quiz fetching
      .addCase(fetchQuiz.pending, (state) => {
        state.isLoading = true
        state.errors.quiz = null
        state.quizError = null
        state.error = null
      })
      .addCase(fetchQuiz.fulfilled, (state, action) => {
        state.quizData = action.payload
        state.currentQuizId = action.payload.id
        state.userAnswers = []
        state.currentQuestion = 0
        state.isLoading = false
        state.isCompleted = false
        state.timeRemaining = action.payload.timeLimit ? action.payload.timeLimit * 60 : null
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        state.isLoading = false
        state.errors.quiz = action.payload as string
        state.quizError = action.payload as string
        state.error = action.payload as string
      })

      // Quiz submission
      .addCase(submitQuiz.pending, (state) => {
        state.isSubmitting = true
        state.errors.submission = null
        state.submissionError = null
      })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        // Ensure we have a valid result
        if (action.payload && (typeof action.payload.score === 'number')) {
          state.results = action.payload
          state.isCompleted = true
          state.isSubmitting = false
          state.timerActive = false

          // Update history if we have quiz data
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
          // Fallback for missing fields
          const data = state.quizData
          if (data) {
            const questionsWithAnswers = data.questions.map(q => ({
              id: q.id,
              question: q.question,
              userAnswer: "",
              correctAnswer: getQuestionCorrectAnswer(q),
              isCorrect: true
            }));
            
            state.results = {
              quizId: data.id || "",
              slug: data.slug || "",
              title: data.title || "",
              score: state.userAnswers.length,
              maxScore: data.questions.length || state.userAnswers.length,
              percentage: 100,
              completedAt: new Date().toISOString(),
              questions: questionsWithAnswers
            }
          } else {
            state.results = {
              quizId: "",
              slug: "",
              title: "",
              score: 0,
              maxScore: 0,
              percentage: 0,
              completedAt: new Date().toISOString(),
              questions: []
            }
          }
          
          state.isCompleted = true
          state.isSubmitting = false
          state.timerActive = false
        }
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.isSubmitting = false
        state.errors.submission = action.payload as string
        state.submissionError = action.payload as string
        state.error = action.payload as string

        // Even if submission fails, we can still show local results
        if (state.quizData && state.userAnswers.length > 0) {
          state.errors.submission = "Server submission failed. Displaying local results."

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
                userAnswer: userAns?.answer?.toString() || "",
                correctAnswer: getQuestionCorrectAnswer(q),
                isCorrect: true
              };
            })
          };
          
          state.results = localResult;
          state.isCompleted = true;
        }
      })

      // Quiz results fetching
      .addCase(getQuizResults.pending, (state) => {
        state.isLoading = true
        state.errors.results = null
        state.resultsError = null
      })
      .addCase(getQuizResults.fulfilled, (state, action) => {
        state.results = action.payload
        state.isCompleted = true
        state.isLoading = false
      })
      .addCase(getQuizResults.rejected, (state, action) => {
        state.isLoading = false
        state.errors.results = action.payload as string
        state.resultsError = action.payload as string
      })

      // Quiz history fetching
      .addCase(fetchQuizHistory.pending, (state) => {
        state.isLoading = true
        state.errors.history = null
        state.historyError = null
      })
      .addCase(fetchQuizHistory.fulfilled, (state, action) => {
        state.quizHistory = action.payload
        state.isLoading = false
      })
      .addCase(fetchQuizHistory.rejected, (state, action) => {
        state.isLoading = false
        state.errors.history = action.payload as string
        state.historyError = action.payload as string
      })

      // Submission state persistence
      .addCase(saveQuizSubmissionState.fulfilled, (state, action) => {
        if (action.payload?.slug === state.quizData?.slug) {
          state.submissionStateInProgress = action.payload.state === "in-progress";
        }
      })
      
      .addCase(clearQuizSubmissionState.fulfilled, (state, action) => {
        if (action.payload === state.quizData?.slug) {
          state.submissionStateInProgress = false;
        }
      })
      
      .addCase(getQuizSubmissionState.fulfilled, (state, action) => {
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
  clearErrors,
  setSubmissionInProgress,
} = quizSlice.actions

export default quizSlice.reducer
