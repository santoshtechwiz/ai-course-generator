// Redux slice for quiz state management with improved authentication handling
import { createSlice, createAsyncThunk, PayloadAction, createAction } from "@reduxjs/toolkit";
import { createSelector } from "reselect";

import { RootState } from "../index";

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
  quizData: undefined,
  description: null,
  totalQuestions: 0,
  lastSaved: null,
  authRedirectState: null,
  pendingQuiz: null // { slug, quizData }
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
      const { quizType, results, questions, answers, quizId, title } = state.quiz;

      // If we already have results in the state, return them
      if (results) {
        return results;
      }

      // If we have questions and answers but no results, generate results
      if (questions.length > 0 && Object.keys(answers).length > 0) {
        // Calculate score based on correct answers
        let score = 0;
        let totalAnswered = 0;

        const questionResults = questions.map((question) => {
          const answer = answers[String(question.id)]; // Normalize ID to string
          let isCorrect = false;
          let userAnswer = null;

          if (!answer) {
            return {
              questionId: question.id,
              isCorrect: false,
              userAnswer: null,
              correctAnswer: question.correctOptionId || question.answer,
              skipped: true
            };
          }

          totalAnswered++;

          if (answer && 'selectedOptionId' in answer) {
            // For MCQ questions
            isCorrect = answer.isCorrect === true;
            userAnswer = answer.selectedOptionId;
            if (isCorrect) score++;
          }

          return {
            questionId: question.id,
            isCorrect,
            userAnswer,
            correctAnswer: question.correctOptionId || question.answer,
            skipped: false
          };
        });

        return {
          quizId,
          slug,
          title: title || "Quiz Results",
          quizType,
          score,
          maxScore: questions.length,
          totalAnswered,
          percentage: Math.round((score / questions.length) * 100),
          submittedAt: new Date().toISOString(),
          questionResults,
          questions,
          answers: Object.values(answers)
        };
      }

      // No results or data to generate results
      return rejectWithValue("No quiz results available. Please take the quiz first.");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to get quiz results");
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
      let totalAnswered = 0;

      const questionResults = questions.map((question) => {
        const answer = answers[String(question.id)]; // Normalize ID to string
        let isCorrect = false;
        let userAnswer = null;

        if (!answer) {
          return {
            questionId: question.id,
            isCorrect: false,
            userAnswer: null,
            correctAnswer: question.answer,
            skipped: true
          };
        }

        totalAnswered++;

        if (question.type === 'blanks' && answer && 'filledBlanks' in answer) {
          // For blanks quiz, check if the main blank is correct
          const mainBlankId = Object.keys(answer.filledBlanks)[0];
          const userAnswerText = answer.filledBlanks[mainBlankId]?.toLowerCase().trim();
          const correctAnswer = question.answer.toLowerCase().trim();

          isCorrect = userAnswerText === correctAnswer;
          if (isCorrect) score++;

          userAnswer = answer.filledBlanks;
        }
        else if (question.type === 'openended' && answer && 'text' in answer) {
          // For open-ended, we consider it correct if they submitted something
          // In a real app, this would be evaluated by an API
          isCorrect = Boolean(answer.text.trim());
          if (isCorrect) score++;

          userAnswer = answer.text;
        }
        else if (answer && 'selectedOption' in answer) {
          // For mcq type questions
          isCorrect = answer.isCorrect === true;
          if (isCorrect) score++;

          userAnswer = answer.selectedOption;
        }

        return {
          questionId: question.id,
          isCorrect,
          userAnswer,
          correctAnswer: question.answer,
          skipped: false
        };
      });

      // Add metrics about completion
      const results = {
        quizId,
        quizType,
        score,
        maxScore: questions.length,
        totalAnswered, // New field
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

// Enhance the navigation thunk with better error handling and debug logging
export const navigateToQuestion = createAsyncThunk(
  "quiz/navigateToQuestion",
  async (index: number, { dispatch, getState }) => {
    const state = getState() as RootState;
    const currentIndex = state.quiz.currentQuestionIndex;
    const questionsLength = state.quiz.questions.length;

    // Validation with guard clauses
    if (index < 0 || (questionsLength > 0 && index >= questionsLength)) {
      console.error(`Invalid navigation index: ${index}. Valid range: 0-${questionsLength - 1}`);
      return currentIndex; // Return current index unchanged
    }

    console.log(`Navigation requested: ${currentIndex} → ${index}`);

    try {
      // Force update the index via direct action
      dispatch(setCurrentQuestionIndex(index));

      // Create a timestamp to help track this specific navigation action
      const timestamp = Date.now();

      // For debugging - log navigation with timestamp
      console.log(`[${new Date(timestamp).toLocaleTimeString()}] Navigation action dispatched: ${currentIndex} → ${index}`);

      return { index, timestamp };
    } catch (error) {
      console.error("Navigation error:", error);
      return currentIndex;
    }
  }
);

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
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('quiz_session_id', action.payload);
      }
    },
    setQuizType: (state, action: PayloadAction<string>) => {
      state.quizType = action.payload;
    },
    setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
      const newIndex = action.payload;

      // Detailed logging to help diagnose issues
      console.log(`Redux: Setting question index to ${newIndex} (current: ${state.currentQuestionIndex})`);

      // ALWAYS set the index regardless of validation
      state.currentQuestionIndex = newIndex;

      // If we save to session storage, include this updated index
      if (typeof window !== "undefined" && state.sessionId && state.quizId) {
        try {
          saveQuizSession(
            state.sessionId,
            state.quizId.toString(),
            state.quizType || 'mcq',
            state.answers,
            {
              currentQuestionIndex: newIndex, // Use the new index
              isCompleted: state.isCompleted,
              title: state.title,
              lastSaved: Date.now()
            }
          );
        } catch (err) {
          console.error('Failed to update question index in session storage:', err);
        }
      }
    },
    saveAnswer: (state, action: PayloadAction<{ questionId: string | number, answer: QuizAnswer }>) => {
      const { questionId, answer } = action.payload;
      const normalizedId = String(questionId); // Convert to string for consistency

      // Handle different quiz types and validate answers in the reducer
      if (answer.type === 'mcq' && 'selectedOptionId' in answer) {
        // Find the question to check if the answer is correct
        const question = state.questions.find(q => String(q.id) === normalizedId);
        if (question) {
          // Update the isCorrect property based on the correct answer in the question
          const correctAnswer = question.correctOptionId || question.answer;
          answer.isCorrect = answer.selectedOptionId === correctAnswer;
        }
      } else if (answer.type === 'blanks' && 'filledBlanks' in answer) {
        const question = state.questions.find(q => String(q.id) === normalizedId);
        if (question) {
          // Validate blanks answers
          const mainBlankId = Object.keys(answer.filledBlanks)[0];
          const userAnswerText = answer.filledBlanks[mainBlankId]?.toLowerCase().trim();
          const correctAnswer = question.answer?.toLowerCase().trim() || "";
          answer.isCorrect = userAnswerText === correctAnswer;
        }
      } else if (answer.type === 'openended' && 'text' in answer) {
        // For open-ended, we don't auto-validate in real-time, but consider it answered
        answer.isCorrect = answer.text.trim().length > 0;
      }

      state.answers[normalizedId] = answer;

      // Check if all questions have been answered
      const allAnswered = state.questions.every(q => !!state.answers[String(q.id)]);

      // If we're on the last question and this answer completes all questions, mark as complete
      const isLastQuestion = state.currentQuestionIndex === state.questions.length - 1;
      const answeredCount = Object.keys(state.answers).length;
      const isComplete = allAnswered || (isLastQuestion && answeredCount === state.questions.length);

      state.isCompleted = isComplete;

      // Persist answers to sessionStorage
      if (typeof window !== "undefined" && state.sessionId && state.quizId) {
        try {
          saveQuizSession(
            state.sessionId,
            state.quizId.toString(),
            state.quizType || 'mcq',
            state.answers,
            {
              currentQuestionIndex: state.currentQuestionIndex,
              isCompleted: state.isCompleted,
              title: state.title,
              lastSaved: Date.now()
            }
          );
        } catch (err) {
          console.error('Failed to save quiz progress:', err);
        }
      }
    },
    resetQuiz: (state) => {
      state.currentQuestionIndex = 0;
      state.answers = {};
      state.isCompleted = false;
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
    },
    setPendingQuiz(state, action) {
      state.pendingQuiz = action.payload
    },
    resetPendingQuiz(state) {
      state.pendingQuiz = null
    },
    rehydrateQuiz(state, action) {
      // action.payload: { slug, quizData }
      state.currentQuestionIndex = 0
      state.answers = {}
      state.isCompleted = false
      state.quizId = action.payload?.slug || null
      state.quizType = "mcq"
      state.questions = action.payload?.quizData?.questions || []
      state.title = action.payload?.quizData?.title || ""
      state.pendingQuiz = null
    },
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
            state.currentQuestionIndex = session.currentQuestionIndex || 0;
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
      })

      // Handle the navigation thunk
      .addCase(navigateToQuestion.fulfilled, (state, action) => {
        // The payload is now an object with index and timestamp
        const { index, timestamp } = action.payload || { index: state.currentQuestionIndex, timestamp: Date.now() };

        // Forced update with explicit assignment
        state.currentQuestionIndex = index;

        // For debugging purposes, add a navigation history field if it doesn't exist
        if (!state.navigationHistory) {
          state.navigationHistory = [];
        }

        // Store this navigation in history (limited to last 10)
        state.navigationHistory = [
          { from: state.currentQuestionIndex, to: index, timestamp },
          ...((state.navigationHistory || []).slice(0, 9))
        ];

        console.log(`[${new Date(timestamp).toLocaleTimeString()}] Navigation confirmed in reducer: index set to ${index}`);
      });
  },
});

// Actions
export const {
  setQuizId,
  setQuizType,
  saveAnswer,
  resetQuiz,
  setQuizResults,
  setPendingQuiz,
  resetPendingQuiz,
  rehydrateQuiz,
  setSessionId
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
  [selectQuizState, selectQuestions, selectAnswers],
  (quizState, questions, answers) => {
    if (!Array.isArray(questions) || questions.length === 0) return false;

    // Consider complete if all questions are answered
    const allAnswered = questions.every(q => answers[String(q.id)]);

    // OR if we're on the last question and all questions have answers
    const isLastQuestion = quizState.currentQuestionIndex === questions.length - 1;
    const answeredCount = Object.keys(answers).length;
    const lastQuestionComplete = isLastQuestion && answeredCount === questions.length;

    return allAnswered || lastQuestionComplete || quizState.isCompleted;
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

export const selectOrGenerateQuizResults = createSelector(
  [selectQuizState, selectQuestions, selectAnswers],
  (quizState, questions, answers) => {
    // If we already have results in state, return them
    if (quizState.results) {
      return quizState.results;
    }

    // If we have questions and answers, generate results on-the-fly
    if (questions.length > 0) {
      // Calculate score based on correct answers
      let score = 0;
      let totalAnswered = 0;

      const questionResults = questions.map((question) => {
        const answer = answers[String(question.id)];
        let isCorrect = false;
        let userAnswer = null;
        let skipped = true;

        if (answer) {
          totalAnswered++;
          skipped = false;

          if ('isCorrect' in answer) {
            isCorrect = answer.isCorrect === true;
            if (isCorrect) score++;
          }

          if ('selectedOptionId' in answer) {
            userAnswer = answer.selectedOptionId;
          } else if ('filledBlanks' in answer) {
            userAnswer = answer.filledBlanks;
          } else if ('text' in answer) {
            userAnswer = answer.text;
          }
        }

        return {
          questionId: question.id,
          isCorrect,
          userAnswer,
          correctAnswer: question.correctOptionId || question.answer,
          skipped
        };
      });

      // Calculate percentage safely
      const maxScore = questions.length;
      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

      return {
        quizId: quizState.quizId,
        slug: quizState.slug || "unknown",
        title: quizState.title || "Quiz Results",
        quizType: quizState.quizType,
        score,
        maxScore,
        totalAnswered,
        percentage,
        completedAt: new Date().toISOString(),
        questionResults,
        questions,
        answers: Object.values(answers)
      };
    }

    return null;
  }
);

export default quizSlice.reducer;
