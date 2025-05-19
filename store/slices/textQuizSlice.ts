import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { TextQuizState, QuizAnswer, OpenEndedQuizData } from '@/types/quiz'

const initialState: TextQuizState = {
  quizId: null,
  title: null,
  slug: null,
  currentQuestionIndex: 0,
  questions: [],
  answers: [],
  status: 'idle',
  error: null,
  startTime: null,
  completedAt: null,
  score: null,
  resultsSaved: false,
}

const textQuizSlice = createSlice({
  name: 'textQuiz',
  initialState,
  reducers: {
    initializeQuiz: (state, action: PayloadAction<OpenEndedQuizData>) => {
      state.quizId = action.payload.id
      state.title = action.payload.title
      state.slug = action.payload.slug
      state.questions = action.payload.questions
      state.currentQuestionIndex = 0
      state.answers = []
      state.status = 'active'
      state.startTime = new Date().toISOString()
      state.completedAt = null
      state.score = null
      state.resultsSaved = false
      state.error = null
    },

    submitAnswer: (state, action: PayloadAction<QuizAnswer>) => {
      const answerData = action.payload
      
      // Update existing answer if it exists, otherwise add new answer
      const existingAnswerIndex = state.answers.findIndex(a => a.questionId === answerData.questionId)
      
      if (existingAnswerIndex !== -1) {
        state.answers[existingAnswerIndex] = answerData
      } else {
        state.answers.push(answerData)
      }

      state.status = 'answering'
    },

    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      if (action.payload >= 0 && action.payload < state.questions.length) {
        state.currentQuestionIndex = action.payload
      }
    },

    completeQuiz: (state, action: PayloadAction<{ 
      answers?: QuizAnswer[], 
      completedAt: string 
    }>) => {
      // Ensure we're updating with the provided answers if they exist
      if (action.payload.answers && action.payload.answers.length > 0) {
        state.answers = action.payload.answers;
      }
      
      state.completedAt = action.payload.completedAt;
      state.status = 'completed';
      state.isCompleted = true; // Add isCompleted flag
      
      // Calculate score for completing - improved calculation
      if (state.questions.length > 0 && state.answers.length > 0) {
        // Calculate a basic completion score based on number of answers
        const completionScore = Math.round((state.answers.length / state.questions.length) * 100);
        state.score = completionScore;
      }
      
      // Explicitly set resultsSaved to track that we've processed results
      state.resultsSaved = true;
      
      // Log completion for debugging
      console.log('Quiz completed:', {
        answers: state.answers.length,
        questions: state.questions.length,
        score: state.score,
        status: state.status
      });
    },

    saveResults: (state, action: PayloadAction<{ score: number }>) => {
      state.score = action.payload.score
      state.resultsSaved = true
    },

    resetQuiz: (state) => {
      return {
        ...initialState,
        quizId: state.quizId,
        title: state.title,
        slug: state.slug,
        questions: state.questions,
      }
    },

    clearQuiz: () => initialState,

    setError: (state, action: PayloadAction<string>) => {
      state.status = 'error'
      state.error = action.payload
    },
  },
})

export const {
  initializeQuiz,
  submitAnswer,
  setCurrentQuestion,
  completeQuiz,
  saveResults,
  resetQuiz,
  clearQuiz,
  setError,
} = textQuizSlice.actions

export default textQuizSlice.reducer
