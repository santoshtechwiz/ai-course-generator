import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { TextQuizState, QuizAnswer } from '@/types/quiz'

export interface OpenEndedQuestion {
  id: string
  question: string
  answer: string
  openEndedQuestion?: {
    hints?: string[] | string
    difficulty?: string
    tags?: string[]
    inputType?: string
  }
}

export interface QuizAnswer {
  questionId: string
  question: string
  answer: string
  timeSpent: number
  hintsUsed: boolean
  index?: number
  correctAnswer?: string
}

export interface TextQuizState {
  quizId: string | null
  title: string | null
  slug: string | null
  currentQuestionIndex: number
  questions: OpenEndedQuestion[]
  answers: QuizAnswer[]
  status: 'idle' | 'active' | 'answering' | 'completed' | 'error' | 'succeeded'
  error: string | null
  startTime: string | null
  completedAt: string | null
  score: number | null
  resultsSaved: boolean
  isCompleted?: boolean // Add this field to match the state pattern
}

export interface QuizResult {
  quizId: string
  slug: string
  answers: QuizAnswer[]
  questions: OpenEndedQuestion[]
  totalQuestions: number
  completedAt: string
}

export interface OpenEndedQuizData {
  id: string
  title: string
  slug: string
  type: string
  questions: OpenEndedQuestion[]
}

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
    initializeQuiz(state, action: PayloadAction<any>) {
      const { quizId, title, slug, questions } = action.payload

      state.quizId = quizId
      state.title = title
      state.slug = slug
      state.questions = questions
      state.currentQuestionIndex = 0
      state.answers = []
      state.status = 'active'
      state.error = null
      state.startTime = new Date().toISOString()
      state.completedAt = null
      state.score = null
      state.resultsSaved = false
    },
    setCurrentQuestion(state, action: PayloadAction<number>) {
      state.currentQuestionIndex = action.payload
      state.status = 'answering'
    },
    submitAnswer(state, action: PayloadAction<QuizAnswer>) {
      const { questionId, answer, correctAnswer, timeSpent, hintsUsed, index } = action.payload

      // Prevent duplicate submissions
      const existingAnswer = state.answers.find((a) => a.questionId === questionId)
      if (existingAnswer) {
        return
      }

      state.answers.push({
        questionId,
        question: state.questions[state.currentQuestionIndex].question,
        answer,
        correctAnswer,
        timeSpent,
        hintsUsed,
        index,
      })

      // Move to next question or complete quiz
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1
        state.status = 'active'
      } else {
        state.status = 'completed'
        state.completedAt = new Date().toISOString()
        // Calculate score
        state.score = Math.round(
          (state.answers.filter((a) => a.answer === a.correctAnswer).length / state.answers.length) * 100,
        )
      }
    },
    completeQuiz(state) {
      state.status = 'completed'
      state.completedAt = new Date().toISOString()
      // Calculate score
      state.score = Math.round(
        (state.answers.filter((a) => a.answer === a.correctAnswer).length / state.answers.length) * 100,
      )
    },
    resetQuiz(state) {
      state.currentQuestionIndex = 0
      state.answers = []
      state.status = 'active'
      state.error = null
      state.startTime = new Date().toISOString()
      state.completedAt = null
      state.score = null
      state.resultsSaved = false
    },
    clearQuiz(state) {
      Object.assign(state, initialState)
    },
  },
})

export const { initializeQuiz, setCurrentQuestion, submitAnswer, completeQuiz, resetQuiz, clearQuiz } = textQuizSlice.actions

export default textQuizSlice.reducer