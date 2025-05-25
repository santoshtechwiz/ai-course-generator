// Redux slice for quiz state management with improved authentication handling
import { createSlice, createAsyncThunk, PayloadAction, createAction } from "@reduxjs/toolkit";
import { createSelector } from "reselect";

import { RootState } from "../index";
import { BlankQuizQuestion, OpenEndedQuizQuestion, QuizAnswer } from "@/app/types/quiz-types";

import { QuizState } from "@/types/quiz";
import {
  generateSessionId,
  saveQuizSession,
  getQuizSession,
  saveQuizResults,
  getQuizResults,
  clearQuizSession,
} from "../utils/session";

// Initial state
const initialState: QuizState = {
  quizId: null,
  quizType: null,
  title: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  status: "idle",
  error: null,
  isCompleted: false, // Make sure this matches the type in QuizState
  results: null,
  sessionId: typeof window !== "undefined" && sessionStorage.getItem("quiz_session_id")
    ? sessionStorage.getItem("quiz_session_id")!
    : generateSessionId(),
};

// Async thunks
export const fetchQuiz = createAsyncThunk(
  "quiz/fetchQuiz",
  async ({ id, data, type }: { id: string | number, data?: any, type: string }, { rejectWithValue }) => {
    try {
      // If data is provided directly, use it
      if (data) {
        // Ensure each question has a type property
        const questions = (data.questions || []).map((q: any) => ({
          ...q,
          type: type
        }));
        return {
          id: data.id,
          type: data.type || type,
          title: data.title,
          questions,
        };
      }

      // Otherwise fetch from API
      const response = await fetch(`/api/quizzes/${type}/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch quiz: ${response.status}`);
      }
      const quizData = await response.json();
      // Ensure each question has a type property
      const questions = (quizData.questions || []).map((q: any) => ({
        ...q,
        type: quizData.type || type
      }));
      return {
        id: quizData.id,
        type: quizData.type || type,
        title: quizData.title,
        questions,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchQuizResults = createAsyncThunk(
  "quiz/fetchQuizResults",
  async (slug: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { quizType } = state.quiz;
      
      const response = await fetch(`/api/quizzes/${quizType}/${slug}/results`);
      if (!response.ok) {
        throw new Error(`Failed to fetch results: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitQuiz = createAsyncThunk(
  "quiz/submitQuiz",
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { quizId, quizType, questions, answers } = state.quiz;
    
    try {
      // Calculate score based on correct answers
      let score = 0;
      const questionResults = questions.map((question) => {
        const answer = answers[question.id];
        let isCorrect = false;

        if (question.type === 'blanks' && answer && 'filledBlanks' in answer) {
          // For blanks quiz, check if the main blank is correct
          const mainBlankId = Object.keys(answer.filledBlanks)[0];
          const userAnswer = answer.filledBlanks[mainBlankId]?.toLowerCase().trim();
          const correctAnswer = question.answer.toLowerCase().trim();

          isCorrect = userAnswer === correctAnswer;
          if (isCorrect) score++;

          return {
            questionId: question.id,
            isCorrect,
            userAnswer: answer.filledBlanks,
            correctAnswer: question.answer,
          };
        } 
        else if (question.type === 'openended' && answer && 'text' in answer) {
          // For open-ended, we consider it correct if they submitted something
          // In a real app, this would be evaluated by an API
          isCorrect = Boolean(answer.text.trim());
          if (isCorrect) score++;

          return {
            questionId: question.id,
            isCorrect,
            userAnswer: answer.text,
            correctAnswer: question.answer,
          };
        }

        return {
          questionId: question.id,
          isCorrect: false,
          userAnswer: null,
          correctAnswer: question.answer,
        };
      });
      
      const results = {
        quizId,
        quizType,
        score,
        maxScore: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        submittedAt: new Date().toISOString(),
        questionResults,
      };
      
      // In a real app, you would submit to an API here
      // const response = await fetch('/api/submit-quiz', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     quizId,
      //     answers: Object.values(answers),
      //   }),
      // });
      
      // if (!response.ok) {
      //   throw new Error(`Failed to submit quiz: ${response.status}`);
      // }
      
      // const data = await response.json();
      // return data;
      
      // For now, just return the calculated results
      return results;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Action to set current question index
export const setCurrentQuestionIndex = createAction<number>("quiz/setCurrentQuestionIndex");

// Quiz slice
const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    setQuizId: (state, action: PayloadAction<string | number>) => {
      state.quizId = action.payload;
      // Save sessionId to sessionStorage for persistence
      if (typeof window !== "undefined") {
        sessionStorage.setItem("quiz_session_id", state.sessionId || "");
      }
    },
    setQuizType: (state, action: PayloadAction<string>) => {
      state.quizType = action.payload;
    },
    setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
      const newIndex = action.payload;
      
      // Detailed logging to help diagnose issues
      console.log(`Redux: Setting question index to ${newIndex} (current: ${state.currentQuestionIndex}, max: ${state.questions.length - 1})`);
      
      // Validate and set the index with better bounds checking
      if (newIndex >= 0 && newIndex < state.questions.length) {
        state.currentQuestionIndex = newIndex;
        console.log(`Redux: Question index set to ${newIndex}`);
      } else {
        console.warn(`Redux: Invalid question index: ${newIndex}. Valid range is 0 to ${state.questions.length - 1}`);
      }
    },
    saveAnswer: (state, action: PayloadAction<{ questionId: string | number, answer: QuizAnswer }>) => {
      const { questionId, answer } = action.payload;
      state.answers[questionId] = answer;
      
      // Check if all questions have been answered
      const allAnswered = state.questions.every(q => !!state.answers[q.id]);
      state.isCompleted = allAnswered; // <-- Change this line from isQuizComplete to isCompleted

      // Persist answers to sessionStorage
      if (typeof window !== "undefined" && state.sessionId && state.quizId) {
        saveQuizSession(state.sessionId, state.quizId.toString(), state.answers);
      }
    },
    resetQuiz: (state) => {
      state.currentQuestionIndex = 0;
      state.answers = {};
      state.isCompleted = false; // <-- Change this line from isQuizComplete to isCompleted
      state.results = null;

      // Clear session on reset
      if (typeof window !== "undefined" && state.sessionId) {
        clearQuizSession(state.sessionId);
      }
    },
    setQuizResults: (state, action: PayloadAction<any>) => {
      state.results = action.payload;

      // Persist results to sessionStorage
      if (typeof window !== "undefined" && state.sessionId) {
        saveQuizResults(state.sessionId, action.payload);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchQuiz
      .addCase(fetchQuiz.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchQuiz.fulfilled, (state, action) => {
        state.status = "idle";
        state.quizId = action.payload.id;
        state.quizType = action.payload.type;
        state.title = action.payload.title;
        state.questions = action.payload.questions;
        state.currentQuestionIndex = 0;
        state.answers = {};
        state.isCompleted = false;
        state.results = null;

        // Try to restore from sessionStorage
        if (typeof window !== "undefined" && state.sessionId) {
          const session = getQuizSession(state.sessionId);
          if (session && session.quizId == action.payload.id) {
            state.answers = session.answers || {};
            state.isCompleted = action.payload.questions.every((q: any) => session.answers && session.answers[q.id]);
          }
          const results = getQuizResults(state.sessionId);
          if (results) {
            state.results = results;
          }
        }
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload as string;
      })
      
      // fetchQuizResults
      .addCase(fetchQuizResults.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchQuizResults.fulfilled, (state, action) => {
        state.status = "idle";
        state.results = action.payload;
      })
      .addCase(fetchQuizResults.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload as string;
      })
      
      // submitQuiz
      .addCase(submitQuiz.pending, (state) => {
        state.status = "submitting";
        state.error = null;
      })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        state.status = "idle";
        state.results = action.payload;
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload as string;
      });
  },
});

// Actions
export const { 
  setQuizId, 
  setQuizType, 
  saveAnswer, 
  resetQuiz,
  setQuizResults
} = quizSlice.actions;

// Selectors
export const selectQuizState = (state: RootState) => state.quiz;

export const selectQuestions = createSelector(
  [selectQuizState], 
  (quizState) => quizState.questions || []
);

export const selectAnswers = createSelector(
  [selectQuizState], 
  (quizState) => quizState.answers || {}
);

export const selectQuizStatus = createSelector(
  [selectQuizState], 
  (quizState) => quizState.status || 'idle'
);

export const selectQuizError = createSelector(
  [selectQuizState], 
  (quizState) => quizState.error || null
);

export const selectQuizTitle = createSelector(
  [selectQuizState], 
  (quizState) => quizState.title || ''
);

export const selectCurrentQuestionIndex = createSelector(
  [selectQuizState], 
  (quizState) => quizState.currentQuestionIndex || 0
);

export const selectCurrentQuestion = createSelector(
  [selectQuestions, selectCurrentQuestionIndex], 
  (questions, currentIndex) => questions[currentIndex] || null
);

export const selectIsQuizComplete = createSelector(
  [selectQuestions, selectAnswers], 
  (questions, answers) => {
    if (!Array.isArray(questions) || questions.length === 0) return false;
    return questions.every(q => answers[q.id]);
  }
);

export const selectQuizId = createSelector(
  [selectQuizState], 
  (quizState) => quizState.quizId || null
);

export const selectQuizResults = createSelector(
  [selectQuizState], 
  (quizState) => quizState.results || null
);

export const selectQuizInProgress = createSelector(
  [selectQuizState, selectQuestions], 
  (quizState, questions) => {
    const answeredCount = Object.keys(quizState.answers || {}).length;
    const totalCount = (questions || []).length;
    return answeredCount > 0 && answeredCount < totalCount;
  }
);

export default quizSlice.reducer;
