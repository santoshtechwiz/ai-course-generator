import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';


import { RootState } from '..';
import { generateSessionId } from '../utils/session';

// Types
export interface QuizState {
  // Quiz metadata
  quizId: string | null;
  quizType: 'mcq' | 'code' | 'blanks' | 'openended' | null;
  title: string | null;
  description: string | null;
  
  // Quiz content
  questions: Question[];
  totalQuestions: number;
  
  // Quiz progress
  currentQuestionIndex: number;
  answers: Record<string, Answer>;
  
  // Quiz status
  status: 'idle' | 'loading' | 'submitting' | 'submitted' | 'error';
  error: string | null;
  
  // Quiz results
  results: QuizResults | null;
  
  // Session management
  sessionId: string | null;
  lastSaved: number | null;
  
  // Auth redirect state
  authRedirectState: AuthRedirectState | null;
}

// Question types
export interface BaseQuestion {
  id: string;
  text: string;
  type: 'mcq' | 'code' | 'blanks' | 'openended';
}

export interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: Array<{
    id: string;
    text: string;
  }>;
  correctOptionId: string;
}

export interface CodeQuestion extends BaseQuestion {
  type: 'code';
  question: string;
  codeSnippet?: string;
  language: string;
  correctAnswer: string;
  explanation?: string;
}

export interface BlanksQuestion extends BaseQuestion {
  type: 'blanks';
  textWithBlanks: string;
  blanks: Array<{
    id: string;
    correctAnswer: string;
  }>;
}

export interface OpenEndedQuestion extends BaseQuestion {
  type: 'openended';
  modelAnswer?: string;
  keywords?: string[];
}

export type Question = MCQQuestion | CodeQuestion | BlanksQuestion | OpenEndedQuestion;

// Answer types
export interface BaseAnswer {
  questionId: string;
  timestamp: number;
}

export interface MCQAnswer extends BaseAnswer {
  selectedOptionId: string;
}

export interface CodeAnswer extends BaseAnswer {
  answer: string;
  isCorrect?: boolean;
  timeSpent?: number;
}

export interface BlanksAnswer extends BaseAnswer {
  filledBlanks: Record<string, string>;
}

export interface OpenEndedAnswer extends BaseAnswer {
  text: string;
}

export type Answer = MCQAnswer | CodeAnswer | BlanksAnswer | OpenEndedAnswer;

// Results type
export interface QuizResults {
  score: number;
  maxScore: number;
  percentage: number;
  questionResults: Array<{
    questionId: string;
    correct: boolean;
    feedback?: string;
    score?: number;
  }>;
  submittedAt: number;
}

// New interface for auth redirect state
interface AuthRedirectState {
  slug: string;
  quizId: string;
  type: string;
  answers: Record<string, Answer>;
  currentQuestionIndex: number;
  tempResults: any;
}

// Async thunks
export const fetchQuiz = createAsyncThunk(
  'quiz/fetchQuiz',
  async ({ id, data }: { id: string, data?: any }, { rejectWithValue }) => {
    try {
      // If data is provided directly, use it
      if (data) {
        console.log("Using provided quiz data:", data);
        return data;
      }
      
      // Otherwise fetch from API
      console.log("Fetching quiz data from API for ID:", id);
      const response = await fetch(`/api/quizzes/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quiz');
      }
      return await response.json();
    } catch (error: any) {
      console.error("Error in fetchQuiz:", error);
      return rejectWithValue(error.message || 'Failed to fetch quiz');
    }
  }
);

export const saveAnswer = createAsyncThunk(
  'quiz/saveAnswer',
  async ({ questionId, answer }: { questionId: string, answer: Answer }, { getState, dispatch }) => {
    const state = getState() as RootState;
    const isAuthenticated = state.auth.isAuthenticated;
    
    // Save answer to state
    dispatch(quizSlice.actions.setAnswer({ questionId, answer }));
    
    // If authenticated, save to backend
    if (isAuthenticated) {
      try {
        // In a real app, this would be an API call
        await fetch(`/api/quizzes/${state.quiz.quizId}/answers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ questionId, answer }),
        });
      } catch (error) {
        // Handle error but don't fail the action
        console.error('Failed to save answer to server:', error);
      }
    } else {
      // Save to session storage
      const sessionId = state.quiz.sessionId || generateSessionId();
      const answers = { ...state.quiz.answers, [questionId]: answer };
      
      sessionStorage.setItem(`quiz_session_${sessionId}`, JSON.stringify({
        quizId: state.quiz.quizId,
        answers,
        lastSaved: Date.now()
      }));
      
      dispatch(quizSlice.actions.setSessionId(sessionId));
      dispatch(quizSlice.actions.setLastSaved(Date.now()));
    }
    
    return { questionId, answer };
  }
);

export const submitQuiz = createAsyncThunk(
  'quiz/submitQuiz',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const isAuthenticated = state.auth.isAuthenticated;
    const quizId = state.quiz.quizId;
    const answers = state.quiz.answers;
    
    if (!quizId) {
      return rejectWithValue('No quiz ID found');
    }
    
    try {
      if (isAuthenticated) {
        // Submit to backend and get results
        const response = await fetch(`/api/quizzes/${quizId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ answers }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to submit quiz');
        }
        
        return await response.json();
      } else {
        // Calculate results locally for unauthenticated users
        const questions = state.quiz.questions;
        const results = calculateLocalResults(questions, answers);
        
        // Store in session storage
        const sessionId = state.quiz.sessionId || generateSessionId();
        sessionStorage.setItem(`quiz_results_${sessionId}`, JSON.stringify(results));
        
        return results;
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to submit quiz');
    }
  }
);

export const recoverSession = createAsyncThunk(
  'quiz/recoverSession',
  async (sessionId: string, { dispatch }) => {
    const sessionData = sessionStorage.getItem(`quiz_session_${sessionId}`);
    
    if (sessionData) {
      const { quizId, answers, lastSaved } = JSON.parse(sessionData);
      
      // Fetch the quiz if needed
      if (quizId) {
        await dispatch(fetchQuiz(quizId));
      }
      
      return { sessionId, answers, lastSaved };
    }
    
    return null;
  }
);

export const recoverSessionAfterAuth = createAsyncThunk(
  'quiz/recoverSessionAfterAuth',
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    const sessionId = state.quiz.sessionId;
    
    if (sessionId) {
      const sessionData = await dispatch(recoverSession(sessionId)).unwrap();
      
      if (sessionData) {
        // Submit recovered answers to backend
        await dispatch(submitQuiz());
        
        // Clear session storage
        sessionStorage.removeItem(`quiz_session_${sessionId}`);
        sessionStorage.removeItem(`quiz_results_${sessionId}`);
      }
    }
    
    return null;
  }
);

// Helper function to calculate local results
const calculateLocalResults = (questions: Question[], answers: Record<string, Answer>): QuizResults => {
  let score = 0;
  const maxScore = questions.length;
  const questionResults = questions.map(question => {
    const answer = answers[question.id];
    let correct = false;
    let feedback = '';
    
    if (!answer) {
      feedback = 'No answer provided';
      return { questionId: question.id, correct, feedback };
    }
    
    switch (question.type) {
      case 'mcq':
        correct = (answer as MCQAnswer).selectedOptionId === (question as MCQQuestion).correctOptionId;
        feedback = correct ? 'Correct answer!' : 'Incorrect answer';
        break;
        
      case 'code':
        // Use isCorrect flag if available (from CodeAnswer)
        const codeAnswer = answer as CodeAnswer;
        if (codeAnswer.isCorrect !== undefined) {
          correct = codeAnswer.isCorrect;
        } else {
          // Simple string match if isCorrect not provided
          const codeQuestion = question as CodeQuestion;
          correct = codeAnswer.answer.trim().toLowerCase() === codeQuestion.correctAnswer.trim().toLowerCase();
        }
        feedback = correct ? 'Code solution is correct!' : 'Code solution needs improvement';
        break;
        
      case 'blanks':
        const blanksAnswer = answer as BlanksAnswer;
        const blanksQuestion = question as BlanksQuestion;
        
        // Check if all blanks are filled correctly
        correct = blanksQuestion.blanks.every(blank => 
          blanksAnswer.filledBlanks[blank.id]?.toLowerCase() === blank.correctAnswer.toLowerCase()
        );
        
        feedback = correct ? 'All blanks filled correctly!' : 'Some blanks are incorrect';
        break;
        
      case 'openended':
        // For open-ended questions, we can't accurately grade locally
        // We could do keyword matching, but for simplicity, we'll mark as "needs review"
        correct = false; // Assume needs review
        feedback = 'Your answer has been recorded and needs review';
        break;
    }
    
    if (correct) score++;
    
    return { questionId: question.id, correct, feedback };
  });
  
  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    questionResults,
    submittedAt: Date.now()
  };
};

// Create the quiz slice
const quizSlice = createSlice({
  name: 'quiz',
  initialState: {
    quizId: null,
    quizType: null,
    title: null,
    description: null,
    questions: [],
    totalQuestions: 0,
    currentQuestionIndex: 0,
    answers: {},
    status: 'idle',
    error: null,
    results: null,
    sessionId: null,
    lastSaved: null,
    authRedirectState: null
  } as QuizState,
  reducers: {
    setQuizId: (state, action: PayloadAction<string>) => {
      state.quizId = action.payload;
    },
    setQuizType: (state, action: PayloadAction<QuizState['quizType']>) => {
      state.quizType = action.payload;
    },
    setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
      state.currentQuestionIndex = action.payload;
    },
    setAnswer: (state, action: PayloadAction<{ questionId: string, answer: Answer }>) => {
      const { questionId, answer } = action.payload;
      state.answers[questionId] = answer;
    },
    clearAnswers: (state) => {
      state.answers = {};
    },
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
    },
    setLastSaved: (state, action: PayloadAction<number>) => {
      state.lastSaved = action.payload;
    },
    resetQuiz: (state) => {
      state.currentQuestionIndex = 0;
      state.answers = {};
      state.status = 'idle';
      state.error = null;
      state.results = null;
    },
    clearQuiz: (state) => {
      return {
        ...state,
        quizId: null,
        quizType: null,
        title: null,
        description: null,
        questions: [],
        totalQuestions: 0,
        currentQuestionIndex: 0,
        answers: {},
        status: 'idle',
        error: null,
        results: null
      };
    },
    saveAuthRedirectState: (state, action: PayloadAction<AuthRedirectState>) => {
      state.authRedirectState = action.payload;
    },
    clearAuthRedirectState: (state) => {
      state.authRedirectState = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchQuiz reducers
      .addCase(fetchQuiz.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchQuiz.fulfilled, (state, action) => {
        if (!action.payload) {
          state.status = 'error';
          state.error = 'No data received from server';
          return;
        }
        
        const { id, type, title, description, questions } = action.payload;
        
        state.quizId = id || state.quizId;
        state.quizType = type || state.quizType;
        state.title = title || state.title;
        state.description = description || state.description;
        
        if (Array.isArray(questions)) {
          state.questions = questions;
          state.totalQuestions = questions.length;
        } else {
          console.error("Questions is not an array:", questions);
          state.questions = [];
          state.totalQuestions = 0;
        }
        
        state.status = 'idle';
        state.error = null;
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
      })
      
      // submitQuiz reducers
      .addCase(submitQuiz.pending, (state) => {
        state.status = 'submitting';
      })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        state.status = 'submitted';
        state.results = action.payload;
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
      })
      
      // recoverSession reducers
      .addCase(recoverSession.fulfilled, (state, action) => {
        if (action.payload) {
          const { sessionId, answers, lastSaved } = action.payload;
          state.sessionId = sessionId;
          state.answers = answers;
          state.lastSaved = lastSaved;
        }
      });
  }
});

// Export actions and reducer
export const {
  setQuizId,
  setQuizType,
  setCurrentQuestionIndex,
  setAnswer,
  clearAnswers,
  setSessionId,
  setLastSaved,
  resetQuiz,
  clearQuiz,
  saveAuthRedirectState,
  clearAuthRedirectState
} = quizSlice.actions;

export default quizSlice.reducer;

// Selectors
export const selectQuizId = (state: RootState) => state.quiz.quizId;
export const selectQuizType = (state: RootState) => state.quiz.quizType;
export const selectQuizTitle = (state: RootState) => state.quiz.title;
export const selectQuizDescription = (state: RootState) => state.quiz.description;

export const selectQuestions = (state: RootState) => state.quiz.questions;
export const selectTotalQuestions = (state: RootState) => state.quiz.totalQuestions;

export const selectCurrentQuestionIndex = (state: RootState) => state.quiz.currentQuestionIndex;
export const selectCurrentQuestion = (state: RootState) => {
  const index = state.quiz.currentQuestionIndex;
  return index >= 0 && index < state.quiz.questions.length 
    ? state.quiz.questions[index] 
    : null;
};

export const selectAnswers = (state: RootState) => state.quiz.answers;
export const selectAnswerForQuestion = (state: RootState, questionId: string) => 
  state.quiz.answers[questionId] || null;

export const selectQuizStatus = (state: RootState) => state.quiz.status;
export const selectQuizError = (state: RootState) => state.quiz.error;

export const selectQuizResults = (state: RootState) => state.quiz.results;
export const selectQuizScore = (state: RootState) => state.quiz.results?.score || 0;
export const selectQuizPercentage = (state: RootState) => state.quiz.results?.percentage || 0;

export const selectQuizInProgress = (state: RootState) => 
  state.quiz.status !== 'idle' && state.quiz.status !== 'submitted';

export const selectQuizSessionId = (state: RootState) => state.quiz.sessionId;
export const selectQuizLastSaved = (state: RootState) => state.quiz.lastSaved;

// Auth redirect state selector
export const selectAuthRedirectState = (state: RootState) => state.quiz.authRedirectState;

// Derived selectors
export const selectQuizProgress = (state: RootState) => {
  const total = state.quiz.totalQuestions;
  const answered = Object.keys(state.quiz.answers).length;
  return {
    answered,
    total,
    percentage: total > 0 ? (answered / total) * 100 : 0
  };
};

export const selectIsQuizComplete = (state: RootState) => {
  const { answered, total } = selectQuizProgress(state);
  return answered === total && total > 0;
};
