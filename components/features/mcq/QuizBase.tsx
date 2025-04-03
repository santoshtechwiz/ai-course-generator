"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { saveQuizResult } from "@/lib/quiz-result-service"
import { QuizLoader } from "@/components/ui/quiz-loader"
import type { QuizType } from "@/app/types/types"
import { toast } from "@/hooks/use-toast"
import { QuizResultDisplay } from "./QuizResultDisplay"

interface QuizAnswer {
  answer: string | string[]
  isCorrect: boolean
  timeSpent: number
}

// Define the props that will be passed to child components
interface QuizChildProps {
  onSubmitAnswer?: (answer: QuizAnswer) => void
  onComplete?: () => void
}

interface QuizBaseProps {
  quizId: string | number
  slug: string
  title: string
  type: QuizType
  totalQuestions: number
  children: React.ReactNode
  onQuizComplete?: (result: any) => void
}

export function QuizBase({ quizId, slug, title, type, totalQuestions, children, onQuizComplete }: QuizBaseProps) {
  const router = useRouter()
  const [quizState, setQuizState] = useState<"in-progress" | "submitting" | "completed">("in-progress")
  const [startTime] = useState<number>(Date.now())
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [score, setScore] = useState<number>(0)
  const [totalTime, setTotalTime] = useState<number>(0)
  const [result, setResult] = useState<any>(null)

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

  const submitQuiz = async () => {
    setQuizState("submitting")
    const finalTotalTime = (Date.now() - startTime) / 1000

    try {
      const result = await saveQuizResult({
        quizId,
        answers,
        totalTime: finalTotalTime,
        score,
        type,
      })

      if (result.success) {
        setResult(result.result)
        setQuizState("completed")
        if (onQuizComplete) {
          onQuizComplete(result.result)
        }
      } else {
        toast({
          title: "Error saving quiz results",
          description: result.error || "Please try again",
          variant: "destructive",
        })
        setQuizState("in-progress")
      }
    } catch (error) {
      console.error("Error submitting quiz:", error)
      toast({
        title: "Error saving quiz results",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      setQuizState("in-progress")
    }
  }

  if (quizState === "submitting") {
    return <QuizLoader message="Saving your quiz results..." />
  }

  if (quizState === "completed") {
    return (
      <QuizResultDisplay
        quizId={quizId}
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
      // Use type assertion to tell TypeScript that the child can accept these props
      return React.cloneElement(child as React.ReactElement<QuizChildProps>, {
        onSubmitAnswer: submitAnswer,
        onComplete: submitQuiz,
      })
    }
    return child
  })

  return <>{childrenWithProps}</>
}

