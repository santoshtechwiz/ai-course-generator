"use client"

import React, { useCallback, useState } from "react"
import { OrderingQuiz } from "./OrderingQuiz"

/**
 * OrderingQuizPlay Component
 * Wrapper for OrderingQuiz that integrates with QuizPlayLayout
 * Handles answer submission with proper format for the unified quiz submission endpoint
 */
export interface OrderingQuizPlayProps {
  question: {
    id?: string | number
    title: string
    topic?: string
    description?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    steps: Array<{
      id: number
      description: string
      explanation?: string
    }>
    type: 'ordering'
  }
  questionNumber: number
  totalQuestions: number
  isSubmitting?: boolean
  isLastQuestion?: boolean
  onAnswer: (answer: {
    questionId: string | number
    userAnswer: number[]
    isCorrect: boolean
    timeSpent: number
    type: 'ordering'
  }) => void
  onNext?: () => void
  timeSpent?: number
  className?: string
}

export const OrderingQuizPlay: React.FC<OrderingQuizPlayProps> = ({
  question,
  questionNumber,
  totalQuestions,
  isSubmitting = false,
  isLastQuestion = false,
  onAnswer,
  onNext,
  timeSpent = 0,
  className = "",
}) => {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = useCallback(
    (userOrder: number[], isCorrect: boolean) => {
      // Send answer to QuizPlayLayout handler with unified format
      onAnswer({
        questionId: question.id || '1',
        userAnswer: userOrder,
        isCorrect,
        timeSpent: timeSpent || 0,
        type: 'ordering',
      })
      
      setSubmitted(true)

      // Auto-advance to next question if not the last one
      if (isCorrect && !isLastQuestion && onNext) {
        setTimeout(() => {
          onNext()
        }, 1500)
      }
    },
    [question.id, timeSpent, isLastQuestion, onNext, onAnswer]
  )

  const handleRetry = useCallback(() => {
    setSubmitted(false)
  }, [])

  return (
    <div className={className}>
      <OrderingQuiz
        question={question}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
        showResult={submitted}
        isSubmitting={isSubmitting}
        className="w-full"
      />
    </div>
  )
}

export default OrderingQuizPlay
