"use client"

import { nanoid } from 'nanoid'

export interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

export interface Quiz {
  id: string
  title: string
  questions: Question[]
  createdAt: number
}

export interface QuizAttempt {
  quizId: string
  answers: number[]
  score: number
  completed: boolean
  startedAt: number
  completedAt?: number
}

// In-memory database using localStorage
class QuizStore {
  private readonly QUIZZES_KEY = 'quizzes'
  private readonly ATTEMPTS_KEY = 'quiz-attempts'

  constructor() {
    // Initialize storage if needed
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem(this.QUIZZES_KEY)) {
        localStorage.setItem(this.QUIZZES_KEY, JSON.stringify({}))
      }
      if (!localStorage.getItem(this.ATTEMPTS_KEY)) {
        localStorage.setItem(this.ATTEMPTS_KEY, JSON.stringify({}))
      }
    }
  }

  private getQuizzes(): Record<string, Quiz> {
    if (typeof window === 'undefined') return {}
    const data = localStorage.getItem(this.QUIZZES_KEY)
    return data ? JSON.parse(data) : {}
  }

  private getAttempts(): Record<string, QuizAttempt> {
    if (typeof window === 'undefined') return {}
    const data = localStorage.getItem(this.ATTEMPTS_KEY)
    return data ? JSON.parse(data) : {}
  }

  private saveQuizzes(quizzes: Record<string, Quiz>): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.QUIZZES_KEY, JSON.stringify(quizzes))
  }

  private saveAttempts(attempts: Record<string, QuizAttempt>): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.ATTEMPTS_KEY, JSON.stringify(attempts))
  }

  getAllQuizzes(): Quiz[] {
    const quizzes = this.getQuizzes()
    return Object.values(quizzes).sort((a, b) => b.createdAt - a.createdAt)
  }

  getQuiz(id: string): Quiz | null {
    const quizzes = this.getQuizzes()
    return quizzes[id] || null
  }

  saveQuiz(title: string, questions: Question[]): Quiz {
    const quizzes = this.getQuizzes()
    const id = nanoid(10)
    const newQuiz: Quiz = {
      id,
      title,
      questions,
      createdAt: Date.now()
    }
    
    quizzes[id] = newQuiz
    this.saveQuizzes(quizzes)
    return newQuiz
  }

  updateQuiz(id: string, updates: Partial<Quiz>): Quiz | null {
    const quizzes = this.getQuizzes()
    if (!quizzes[id]) return null
    
    quizzes[id] = {
      ...quizzes[id],
      ...updates
    }
    
    this.saveQuizzes(quizzes)
    return quizzes[id]
  }

  deleteQuiz(id: string): boolean {
    const quizzes = this.getQuizzes()
    if (!quizzes[id]) return false
    
    delete quizzes[id]
    this.saveQuizzes(quizzes)
    return true
  }

  // Quiz attempt methods
  startQuizAttempt(quizId: string): string {
    const attempts = this.getAttempts()
    const attemptId = nanoid(10)
    
    attempts[attemptId] = {
      quizId,
      answers: [],
      score: 0,
      completed: false,
      startedAt: Date.now()
    }
    
    this.saveAttempts(attempts)
    return attemptId
  }

  getQuizAttempt(attemptId: string): QuizAttempt | null {
    const attempts = this.getAttempts()
    return attempts[attemptId] || null
  }

  saveQuizAnswer(attemptId: string, questionIndex: number, answerIndex: number): QuizAttempt | null {
    const attempts = this.getAttempts()
    if (!attempts[attemptId]) return null
    
    const attempt = attempts[attemptId]
    const answers = [...attempt.answers]
    answers[questionIndex] = answerIndex
    
    attempts[attemptId] = {
      ...attempt,
      answers
    }
    
    this.saveAttempts(attempts)
    return attempts[attemptId]
  }

  completeQuizAttempt(attemptId: string): QuizAttempt | null {
    const attempts = this.getAttempts()
    if (!attempts[attemptId]) return null
    
    const attempt = attempts[attemptId]
    const quiz = this.getQuiz(attempt.quizId)
    if (!quiz) return null
    
    // Calculate score
    let score = 0
    attempt.answers.forEach((answer, index) => {
      if (index < quiz.questions.length && answer === quiz.questions[index].correctAnswer) {
        score++
      }
    })
    
    attempts[attemptId] = {
      ...attempt,
      score,
      completed: true,
      completedAt: Date.now()
    }
    
    this.saveAttempts(attempts)
    return attempts[attemptId]
  }
}

// Singleton instance
export const quizStore = new QuizStore()
