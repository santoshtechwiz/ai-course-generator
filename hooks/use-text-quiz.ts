"use client"

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from './use-auth'

export interface TextQuizQuestion {
  id: string
  text: string
  answer: string
  explanation?: string
  userAnswer?: string
  isCorrect?: boolean
}

export interface TextQuizHook {
  questions: TextQuizQuestion[]
  currentQuestion: TextQuizQuestion | null
  currentQuestionIndex: number
  totalQuestions: number
  isLoading: boolean
  error: string | null
  isCompleted: boolean
  score: number | null
  
  // Actions
  startQuiz: (courseId: number, chapterId?: number) => Promise<void>
  submitAnswer: (answer: string) => Promise<void>
  nextQuestion: () => void
  previousQuestion: () => void
  finishQuiz: () => Promise<void>
  resetQuiz: () => void
}

export function useTextQuiz(): TextQuizHook {
  const { isAuthenticated, userId } = useAuth()
  const [questions, setQuestions] = useState<TextQuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  
  const currentQuestion = questions[currentQuestionIndex] || null
  const totalQuestions = questions.length
  
  // Start a new quiz
  const startQuiz = useCallback(async (courseId: number, chapterId?: number) => {
    if (!isAuthenticated || !userId) {
      setError('You must be logged in to take a quiz')
      return
    }
    
    setIsLoading(true)
    setError(null)
    setIsCompleted(false)
    setScore(null)
    
    try {
      // API call to get quiz questions
      const params = new URLSearchParams({
        courseId: courseId.toString(),
        ...(chapterId ? { chapterId: chapterId.toString() } : {}),
      })
      
      const response = await fetch(`/api/text-quiz?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch quiz questions')
      }
      
      const data = await response.json()
      setQuestions(data.questions || [])
      setCurrentQuestionIndex(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error starting quiz')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, userId])
  
  // Submit an answer to the current question
  const submitAnswer = useCallback(async (answer: string) => {
    if (!currentQuestion) return
    
    try {
      // Update local state first
      setQuestions(prev => prev.map((q, i) => 
        i === currentQuestionIndex 
          ? { ...q, userAnswer: answer } 
          : q
      ))
      
      // API call to validate answer
      const response = await fetch(`/api/text-quiz/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          userAnswer: answer,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to validate answer')
      }
      
      const result = await response.json()
      
      // Update with validation result
      setQuestions(prev => prev.map((q, i) => 
        i === currentQuestionIndex 
          ? { 
              ...q, 
              userAnswer: answer,
              isCorrect: result.isCorrect,
              explanation: result.explanation || q.explanation
            } 
          : q
      ))
      
      // Auto advance if there are more questions
      if (currentQuestionIndex < totalQuestions - 1) {
        setTimeout(() => setCurrentQuestionIndex(prev => prev + 1), 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error submitting answer')
    }
  }, [currentQuestion, currentQuestionIndex, totalQuestions])
  
  // Navigate to next question
  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }, [currentQuestionIndex, questions.length])
  
  // Navigate to previous question
  const previousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }, [currentQuestionIndex])
  
  // Finish the quiz and calculate score
  const finishQuiz = useCallback(async () => {
    if (!isAuthenticated || questions.length === 0) return
    
    setIsLoading(true)
    try {
      // Calculate score
      const answeredQuestions = questions.filter(q => q.userAnswer !== undefined)
      const correctAnswers = questions.filter(q => q.isCorrect === true)
      
      const calculatedScore = Math.round(
        (correctAnswers.length / questions.length) * 100
      )
      
      setScore(calculatedScore)
      setIsCompleted(true)
      
      // Save quiz results
      await fetch('/api/text-quiz/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          questions,
          score: calculatedScore,
        }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error finishing quiz')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, questions, userId])
  
  // Reset the quiz state
  const resetQuiz = useCallback(() => {
    setQuestions([])
    setCurrentQuestionIndex(0)
    setIsCompleted(false)
    setScore(null)
    setError(null)
  }, [])
  
  return {
    questions,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    isLoading,
    error,
    isCompleted,
    score,
    startQuiz,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    finishQuiz,
    resetQuiz,
  }
}

export default useTextQuiz
