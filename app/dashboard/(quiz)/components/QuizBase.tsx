"use client"

import React, { useState, useEffect, useRef } from "react"


import { QuizLoader } from "@/components/ui/quiz-loader"
import { QuizResultDisplay } from "./QuizResultDisplay"
import { QuizFeedback } from "./QuizFeedback"
import { useSession } from "next-auth/react"
import { saveQuizState } from "@/hooks/quiz-session-storage"
import { submitQuizResult } from "@/lib/quiz-result-service"

// Define more specific types for quiz answers
export interface QuizAnswer {
  answer: string | string[]
  isCorrect: boolean
  timeSpent: number
  similarity?: number
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
  const [quizState, setQuizState] = useState<"in-progress" | "submitting" | "completed" | "feedback">(
    initialResult ? "completed" : "in-progress",
  )
  const [startTime] = useState<number>(Date.now())
  const [answers, setAnswers] = useState<QuizAnswer[]>(initialResult?.answers || [])
  const [score, setScore] = useState<number>(initialResult?.score || 0)
  const [totalTime, setTotalTime] = useState<number>(initialResult?.totalTime || 0)
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false)
  const [isSubmitError, setIsSubmitError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { data: session, status } = useSession()
  const isLoggedIn = status === "authenticated"

  // Store the final calculated score to ensure consistency
  const finalScoreRef = useRef<number | null>(null)

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

  // Optimize the completeQuiz function to prevent duplicate API calls
  const completeQuiz = async () => {
    // Prevent multiple submissions
    if (quizState !== "in-progress") {
      console.log("Quiz already completed or submitting, ignoring duplicate completion request")
      return
    }

    setQuizState("submitting")
    const finalTotalTime = (Date.now() - startTime) / 1000
    setTotalTime(finalTotalTime)

    // Calculate the final score and store it for consistency
    const calculatedScore = calculateFinalScore()
    finalScoreRef.current = calculatedScore

    const result: QuizResult = {
      quizId,
      answers,
      totalTime: finalTotalTime,
      score: calculatedScore,
      type,
    }

    // For unauthenticated users, save the quiz state to session storage
    if (!isLoggedIn) {
      saveQuizState({
        quizId: String(quizId),
        slug,
        type,
        answers,
        score: calculatedScore,
        totalTime: finalTotalTime,
        redirectPath: `/dashboard/${type}/${slug}`,
      })

      // Show feedback dialog without database save
      setIsSubmitSuccess(true)
      setIsSaving(false)
      setQuizState("feedback")

      // If onQuizComplete callback is provided, call it
      if (onQuizComplete) {
        onQuizComplete(result)
      }

      return
    }

    // For authenticated users, save to database
    setIsSaving(true)

    try {
      console.log("Submitting quiz result to API:", {
        quizId: String(quizId),
        slug,
        answersCount: answers.length,
        totalTime: finalTotalTime,
        score: calculatedScore,
        type,
        totalQuestions,
      })

      await submitQuizResult({
        quizId: String(quizId),
        slug,
        answers,
        totalTime: finalTotalTime,
        score: calculatedScore,
        type,
        totalQuestions,
      })

      setIsSubmitSuccess(true)
      setIsSubmitError(false)
      setErrorMessage("")
    } catch (error) {
      console.error("Error submitting quiz:", error)
      setIsSubmitSuccess(false)
      setIsSubmitError(true)
      setErrorMessage(error instanceof Error ? error.message : "Failed to save quiz results")
    } finally {
      setIsSaving(false)
      setQuizState("feedback")

      // If onQuizComplete callback is provided, call it
      if (onQuizComplete) {
        onQuizComplete(result)
      }
    }
  }

  // Improve the calculateFinalScore function for more consistent scoring
  const calculateFinalScore = () => {
    console.log("Calculating final score:", {
      type,
      score,
      totalQuestions,
      answersLength: answers.length,
    })

    if (type === "mcq" || type === "code") {
      // For MCQ and code quizzes, calculate percentage
      return Math.round((score / Math.max(1, totalQuestions)) * 100)
    } else if (type === "fill-blanks") {
      // For fill-in-the-blanks, calculate from answer similarities
      const totalSimilarity = answers.reduce((acc, answer) => {
        return acc + ((answer as any).similarity || 0)
      }, 0)

      return Math.round(totalSimilarity / Math.max(1, answers.length))
    } else if (type === "openended") {
      // For open-ended, use the score directly (should be a percentage)
      return Math.round(score)
    }

    // Default fallback
    return Math.round((score / Math.max(1, totalQuestions)) * 100)
  }

  const handleFeedbackContinue = (proceed: boolean) => {
    if (proceed) {
      setQuizState("completed")
    } else {
      // User canceled, go back to in-progress
      setQuizState("in-progress")
    }
  }

  const handleRestart = () => {
    // Reset all state
    setAnswers([])
    setScore(0)
    setTotalTime(0)
    setIsSubmitSuccess(false)
    setIsSubmitError(false)
    setErrorMessage("")
    finalScoreRef.current = null
    setQuizState("in-progress")
  }

  if (quizState === "submitting") {
    return <QuizLoader message="Saving your quiz results..." />
  }

  if (quizState === "feedback") {
    // Use the stored final score for consistency
    const displayScore =
      finalScoreRef.current !== null
        ? finalScoreRef.current
        : type === "mcq" || type === "code"
          ? Math.round((score / totalQuestions) * 100)
          : score

    return (
      <QuizFeedback
        isSubmitting={isSaving}
        isSuccess={isSubmitSuccess}
        isError={isSubmitError}
        score={displayScore}
        totalQuestions={100} // Use 100 for percentage display
        onContinue={handleFeedbackContinue}
        errorMessage={errorMessage}
        quizType={type}
        waitForSave={true} // Wait for save in the feedback dialog
        autoClose={false} // Don't auto-close the dialog
      />
    )
  }

  // Update the completed state rendering to prevent duplicate API calls
  if (quizState === "completed") {
    // Use the stored final score for consistency
    const displayScore =
      finalScoreRef.current !== null
        ? finalScoreRef.current
        : type === "mcq" || type === "code"
          ? Math.round((score / totalQuestions) * 100)
          : score

    return (
      <QuizResultDisplay
        quizId={String(quizId)}
        title={title}
        score={displayScore}
        totalQuestions={totalQuestions}
        totalTime={totalTime}
        correctAnswers={type === "mcq" || type === "code" ? score : Math.round((displayScore / 100) * totalQuestions)}
        type={type}
        slug={slug}
        answers={answers} // Pass answers to prevent needing to refetch
        preventAutoSave={true} // Prevent auto-save in the result display
        onRestart={handleRestart}
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
