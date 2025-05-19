import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "@/store"

// === TYPES ===
type QuestionType = {
  id: string
  question: string
  answer?: string
  hints?: string[]
}

type AnswerType = {
  questionId: string | number
  question: string
  answer: string
  correctAnswer?: string
  similarity?: number
  isCorrect?: boolean
  timeSpent: number
  hintsUsed: boolean
  index: number
}

interface QuizData {
  quizId?: string
  id: string
  title: string
  questions: QuestionType[]
  type?: 'blanks' | 'openended'
  slug?: string
}

export interface TextQuizState {
  quizData: QuizData | null
  currentQuestionIndex: number
  answers: AnswerType[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  isCompleted: boolean
  score: number
  resultsSaved: boolean
  completedAt?: string
  quizId?: string | null
  slug?: string
  questions?: QuestionType[]
  title?: string
  savedState: {
    answers: AnswerType[]
    currentQuestionIndex: number
    isCompleted: boolean
    quizData: QuizData | null
  } | null
}

// === INITIAL STATE ===
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
}

// === THUNKS ===
export const submitTextQuizResults = createAsyncThunk<
  any,
  { answers: AnswerType[]; quizId: string; type: 'blanks' | 'openended'; slug: string },
  { rejectValue: string }
>('textQuiz/submit', async (data, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to save results')
    return await response.json()
  } catch (error: any) {
    return rejectWithValue(error.message)
  }
})

export const fetchQuizResults = createAsyncThunk<
  { answers: AnswerType[]; score: number },
  { slug: string; type: 'blanks' | 'openended' },
  { rejectValue: string }
>('textQuiz/fetchResults', async ({ slug, type }, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/quiz/${type}/${slug}/results`)
    if (!response.ok) throw new Error('Failed to fetch results')
    return await response.json()
  } catch {
    return rejectWithValue('Failed to load quiz results')
  }
})

// === SLICE ===
export const textQuizSlice = createSlice({
  name: 'textQuiz',
  initialState,
  reducers: {
    initializeQuiz: (state, action: PayloadAction<QuizData>) => {
      state.quizData = action.payload
      state.answers = []
      state.currentQuestionIndex = 0
      state.isCompleted = false
      state.score = 0
      state.status = 'idle'
    },

    completeQuiz: (state, action: PayloadAction<{
      completedAt?: string
      score?: number
      quizId?: string | number
      title?: string
      answers?: AnswerType[]
      questions?: QuestionType[]
      slug?: string
    }>) => {
      state.isCompleted = true
      state.status = 'succeeded'
      
      // Handle score if provided
      if (action.payload.score !== undefined) {
        state.score = action.payload.score;
      }
      
      // Handle completion timestamp
      if (action.payload.completedAt) {
        state.completedAt = action.payload.completedAt;
      } else {
        state.completedAt = new Date().toISOString();
      }
      
      // Handle answers if they are provided in the payload
      if (action.payload.answers && action.payload.answers.length > 0) {
        state.answers = action.payload.answers;
      }
      
      // Handle quizId if provided
      if (action.payload.quizId) {
        state.quizId = String(action.payload.quizId);
      }
      
      // Handle title if provided
      if (action.payload.title) {
        state.title = action.payload.title;
      }
      
      // Handle slug if provided
      if (action.payload.slug) {
        state.slug = action.payload.slug;
      }
      
      // Store questions in the state for results page
      if (action.payload.questions) {
        state.questions = action.payload.questions;
      } else if (state.quizData?.questions) {
        // Fallback to quizData questions if available
        state.questions = state.quizData.questions;
      }
    },

    submitAnswerLocally: (state, action: PayloadAction<AnswerType>) => {
      const incoming = action.payload
      const index = state.answers.findIndex(
        a => a.index === incoming.index || a.questionId === incoming.questionId
      )
      if (index >= 0) {
        state.answers[index] = incoming
      } else {
        state.answers.push(incoming)
      }
    },

    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestionIndex = action.payload
      if (state.quizData && action.payload >= state.quizData.questions.length) {
        state.isCompleted = true
      }
    },

    saveQuizState: (state) => {
      state.savedState = {
        answers: state.answers,
        currentQuestionIndex: state.currentQuestionIndex,
        isCompleted: state.isCompleted,
        quizData: state.quizData,
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
    },

    resetQuiz: (state) => {
      // Reset the quiz state but keep the quizData
      const quizData = state.quizData;
      return {
        ...initialState,
        quizData
      };
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(submitTextQuizResults.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(submitTextQuizResults.fulfilled, (state) => {
        state.status = 'succeeded'
        state.resultsSaved = true
      })
      .addCase(submitTextQuizResults.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload || 'Submission failed'
      })
      .addCase(fetchQuizResults.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchQuizResults.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.answers = action.payload.answers
        state.score = action.payload.score
        state.isCompleted = true
      })
      .addCase(fetchQuizResults.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload || 'Fetch failed'
      })
  },
})

// === EXPORTS ===
export const {
  initializeQuiz,
  completeQuiz,
  submitAnswerLocally,
  setCurrentQuestion,
  saveQuizState,
  restoreQuizState,
  clearSavedState,
  resetQuiz,
} = textQuizSlice.actions

export const textQuizReducer = textQuizSlice.reducer
export default textQuizReducer
