"use client"

import React, { useState, useEffect } from "react"
import type { QuizType } from "@/app/types/types"

import { QuizLoader } from "@/components/ui/quiz-loader"
import { QuizResultDisplay } from "./QuizResultDisplay"


// Define more specific types for quiz answers
export interface QuizAnswer {
  answer: string | string[]
  isCorrect: boolean
  timeSpent: number
}

// Define quiz result type
export interface QuizResult {
  score: number
  totalTime: number
  answers: QuizAnswer[]
  quizId: string | number
  type: QuizType
}

// Define the props that will be passed to child components
export interface QuizChildProps {
  onSubmitAnswer: (answer: QuizAnswer) => void
  onComplete: () => void
}

interface QuizBaseProps {
  quizId: string | number
  slug: string
  title: string
  type: QuizType
  totalQuestions: number
  children: React.ReactNode
  initialResult?: QuizResult | null
  onQuizComplete?: (result: QuizResult) => void
}

export function QuizBase({
  quizId,
  slug,
  title,
  type,
  totalQuestions,
  children,
  initialResult = null,
  onQuizComplete,
}: QuizBaseProps) {
  // If initialResult is provided, start in completed state
  const [quizState, setQuizState] = useState<"in-progress" | "submitting" | "completed">(
    initialResult ? "completed" : "in-progress",
  )
  const [startTime] = useState<number>(Date.now())
  const [answers, setAnswers] = useState<QuizAnswer[]>(initialResult?.answers || [])
  const [score, setScore] = useState<number>(initialResult?.score || 0)
  const [totalTime, setTotalTime] = useState<number>(initialResult?.totalTime || 0)

  // Update total time while quiz is in progress
  useEffect(() => {
    if (quizState === "in-progress") {
      const timer = setInterval(() => {
        setTotalTime((Date.now() - startTime) / 1000)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [quizState, startTime])

  const submitAnswer = (answer: QuizAnswer) => {
    setAnswers((prev) => [...prev, answer])
    if (answer.isCorrect) {
      setScore((prev) => prev + 1)
    }
  }

  const completeQuiz = () => {
    setQuizState("submitting")
    const finalTotalTime = (Date.now() - startTime) / 1000
    setTotalTime(finalTotalTime)

    const result: QuizResult = {
      quizId,
      answers,
      totalTime: finalTotalTime,
      score,
      type,
    }

    // Simulate saving with a progress bar
    // In a real app, you would call your save function here
    setTimeout(() => {
      setQuizState("completed")

      if (onQuizComplete) {
        onQuizComplete(result)
      }
    }, 2000) // Simulate a 2-second save process
  }

  if (quizState === "submitting") {
    return <QuizLoader message="Saving your quiz results..." />
  }

  if (quizState === "completed") {
    return (
      <QuizResultDisplay
        quizId={String(quizId)}
        title={title}
        score={score}
        totalQuestions={totalQuestions}
        totalTime={totalTime}
        correctAnswers={score}
        type={type}
        slug={slug}
      />
    )
  }

  // Clone children with additional props using proper type assertion
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<QuizChildProps>, {
        onSubmitAnswer: submitAnswer,
        onComplete: completeQuiz,
      })
    }
    return child
  })

  return <>{childrenWithProps}</>
}

