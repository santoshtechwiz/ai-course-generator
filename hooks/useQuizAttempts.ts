import { useState, useEffect } from 'react'
import useSWR from 'swr'

interface QuizAttempt {
  id: number
  score: number
  accuracy: number
  timeSpent: number
  createdAt: string
  totalQuestions: number
  correctAnswers: number
  userQuiz: {
    id: number
    title: string
    slug: string
    quizType: string
  }
  attemptQuestions: Array<{
    id: number
    userAnswer: string
    isCorrect: boolean
    timeSpent: number
    question: {
      id: number
      question: string
      answer: string
      options: any
      questionType: string
    }
  }>
}

interface QuizAttemptsResponse {
  attempts: QuizAttempt[]
  total: number
}

const fetcher = async (url: string): Promise<QuizAttemptsResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch quiz attempts')
  }
  return response.json()
}

export function useQuizAttempts(limit = 10, offset = 0) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/user/quiz-attempts?limit=${limit}&offset=${offset}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds
    }
  )

  const resetAttempts = async () => {
    try {
      const response = await fetch('/api/user/quiz-attempts', {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to reset quiz attempts')
      }
      
      // Revalidate the data after reset
      await mutate()
      return true
    } catch (error) {
      console.error('Error resetting quiz attempts:', error)
      return false
    }
  }

  return {
    attempts: data?.attempts || [],
    total: data?.total || 0,
    isLoading,
    error,
    mutate,
    resetAttempts,
  }
}
