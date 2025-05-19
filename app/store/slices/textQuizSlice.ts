import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { getTextSimilarity } from "@/lib/utils/text-similarity";
import type { RootState } from "@/store";

export interface TextQuizState {
  quizData: {
    id: string;
    title: string;
    questions: Array<{
      id: string;
      question: string;
      answer?: string;
      hints?: string[];
    }>;
    type?: 'blanks' | 'openended';
    slug?: string;
  } | null;
  currentQuestionIndex: number;
  answers: Array<{
    questionId: string | number;
    question: string;
    answer: string;
    correctAnswer?: string;
    similarity?: number;
    isCorrect?: boolean;
    timeSpent: number;
    hintsUsed: boolean;
    index: number;
  }>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  isCompleted: boolean;
  score: number;
  resultsSaved: boolean;
  savedState: null | {
    answers: Array<{
      questionId: string | number;
      question: string;
      answer: string;
      correctAnswer?: string;
      similarity?: number;
      isCorrect?: boolean;
      timeSpent: number;
      hintsUsed: boolean;
      index: number;
    }>;
    currentQuestionIndex: number;
    isCompleted: boolean;
    quizData: {
      id: string;
      title: string;
      questions: Array<{
        id: string;
        question: string;
        answer?: string;
        hints?: string[];
      }>;
      type?: 'blanks' | 'openended';
      slug?: string;
    } | null;
  };
}

const initialState: TextQuizState = {
  quizData: null,
  currentQuestionIndex: 0,
  answers: [],
  status: 'idle',
  error: null,
  isCompleted: false,
  score: 0,
  resultsSaved: false,
  savedState: null,
};

export const submitTextQuizResults = createAsyncThunk(
  'textQuiz/submit',
  async (data: { 
    answers: any[], 
    quizId: string,
    type: 'blanks' | 'openended',
    slug: string
  }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to save results');
      }

      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitAnswer = createAsyncThunk(
  'textQuiz/submitAnswer',
  async (answer: any) => {
    return answer
  }
)

export const fetchQuizResults = createAsyncThunk(
  'textQuiz/fetchResults',
  async ({ slug, type }: { slug: string; type: 'blanks' | 'openended' }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/quiz/${type}/${slug}/results`)
      if (!response.ok) {
        throw new Error('Failed to fetch results')
      }
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue('Failed to load quiz results')
    }
  }
)

export const textQuizSlice = createSlice({
  name: 'textQuiz',
  initialState,
  reducers: {
    initializeQuiz: (state, action) => {
      state.quizData = action.payload;
      state.answers = [];
      state.currentQuestionIndex = 0;
      state.isCompleted = false;
      state.score = 0;
      state.status = 'idle';
    },

    completeQuiz: (state, action) => {
      state.isCompleted = true;
      state.status = 'succeeded';
      if (action.payload?.answers) {
        state.answers = action.payload.answers;
      }
    },

    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestionIndex = action.payload;
      // Set completed if we've answered all questions
      if (state.quizData && action.payload >= state.quizData.questions.length) {
        state.isCompleted = true;
      }
    },

    saveQuizState: (state) => {
      state.savedState = {
        answers: state.answers,
        currentQuestionIndex: state.currentQuestionIndex,
        isCompleted: state.isCompleted,
        quizData: state.quizData
      }
    },
    
    restoreQuizState: (state) => {
      if (state.savedState) {
        state.answers = state.savedState.answers
        state.currentQuestionIndex = state.savedState.currentQuestionIndex
        state.isCompleted = state.savedState.isCompleted
        state.quizData = state.savedState.quizData
      }
    },
    
    clearSavedState: (state) => {
      state.savedState = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitTextQuizResults.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(submitTextQuizResults.fulfilled, (state) => {
        state.status = 'succeeded';
        state.resultsSaved = true;
      })
      .addCase(submitTextQuizResults.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        const answer = action.payload;
        const existingIndex = state.answers.findIndex(
          a => a.index === answer.index || a.questionId === answer.questionId
        );

        if (existingIndex >= 0) {
          state.answers[existingIndex] = answer;
        } else {
          state.answers.push(answer);
        }
      })
      .addCase(fetchQuizResults.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchQuizResults.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.answers = action.payload.answers
        state.isCompleted = true
        state.score = action.payload.score
      })
      .addCase(fetchQuizResults.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
  }
});

// Export actions
export const { 
  initializeQuiz, 
  completeQuiz,
  setCurrentQuestion,
  saveQuizState,
  restoreQuizState,
  clearSavedState
} = textQuizSlice.actions;

// Export the reducer with both named and default export
const textQuizReducer = textQuizSlice.reducer;
export { textQuizReducer };
export default textQuizReducer;
