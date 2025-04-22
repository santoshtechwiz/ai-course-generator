"use client"

import { useState, useRef } from "react"
import { toast } from "./use-toast"
import { useRouter } from "next/navigation"
import { QuizType } from "@/app/types/quiz-types"


interface UseQuizResultOptions {
  onSuccess?: (result: any) => void
  onError?: (error: Error) => void
  redirectOnSuccess?: boolean
  redirectPath?: string
}

export function useQuizResult({
  onSuccess,
  onError,
  redirectOnSuccess = false,
  redirectPath = "/dashboard",
}: UseQuizResultOptions = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [result, setResult] = useState<any | null>(null)
  const submissionInProgress = useRef(false)
  const router = useRouter()

  const resetSubmissionState = () => {
    setIsSubmitting(false)
    setIsSuccess(false)
    setIsError(false)
    setErrorMessage(null)
    setResult(null)
    submissionInProgress.current = false
  }

  // Improved submission function with better error handling and duplicate submission prevention
  const submitQuizResult = async (
    quizId: string | number,
    answers: any[],
    totalTime: number,
    score: number,
    type: QuizType,
    slug: string,
  ) => {
    // Prevent duplicate submissions
    if (submissionInProgress.current || isSubmitting) {
      console.log("Preventing duplicate submission")
      return null
    }

    try {
      submissionInProgress.current = true
      setIsSubmitting(true)
      setIsSuccess(false)
      setIsError(false)
      setErrorMessage(null)

      // Ensure quizId is a string
      const quizIdString = String(quizId)

      // Format answers based on quiz type
      const formattedAnswers = formatAnswers(answers, type)

      // Prepare submission data
      const submissionData = {
        quizId: quizIdString,
        answers: formattedAnswers,
        totalTime,
        score,
        type,
      }

      console.log("Submitting quiz result:", {
        endpoint: `/api/quiz/${quizIdString}/complete`,
        data: submissionData,
      })

      // Submit to the correct endpoint with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const response = await fetch(`/api/quiz/${quizIdString}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `Failed to submit quiz results: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
      setIsSuccess(true)

      if (onSuccess) {
        onSuccess(data)
      }

      toast({
        title: "Quiz completed!",
        description: "Your results have been saved successfully.",
      })

      if (redirectOnSuccess && redirectPath) {
        router.push(redirectPath)
      }

      return data
    } catch (error: any) {
      console.error("Error submitting quiz results:", error)
      setIsError(true)
      setErrorMessage(error.message || "An error occurred while submitting your quiz results")

      if (onError) {
        onError(error)
      }

      toast({
        title: "Error",
        description: error.message || "Failed to save quiz results. Please try again.",
        variant: "destructive",
      })

      return null
    } finally {
      setIsSubmitting(false)
      submissionInProgress.current = false
    }
  }

  // Helper function to format answers based on quiz type
  function formatAnswers(answers: any[], type: QuizType) {
    if (!Array.isArray(answers)) {
      console.warn("Answers is not an array:", answers)
      return []
    }

    return answers.map((answer) => {
      // Handle different answer formats based on quiz type
      if (type === "mcq") {
        return {
          answer: typeof answer === "string" ? answer : answer.answer || "",
          userAnswer: typeof answer === "string" ? answer : answer.userAnswer || answer.answer || "",
          isCorrect: typeof answer === "object" ? answer.isCorrect || false : false,
          timeSpent: typeof answer === "object" ? answer.timeSpent || 0 : 0,
        }
      } else if (type === "blanks") {
        return {
          userAnswer: typeof answer === "string" ? answer : answer.answer || answer.userAnswer || "",
          timeSpent: typeof answer === "object" ? answer.timeSpent || 0 : 0,
          hintsUsed: typeof answer === "object" ? answer.hintsUsed || false : false,
        }
      } else if (type === "openended") {
        return {
          answer: typeof answer === "string" ? answer : answer.answer || "",
          timeSpent: typeof answer === "object" ? answer.timeSpent || 0 : 0,
          hintsUsed: typeof answer === "object" ? answer.hintsUsed || false : false,
        }
      } else if (type === "code") {
        return {
          answer: typeof answer === "string" ? answer : answer.answer || "",
          userAnswer: typeof answer === "string" ? answer : answer.userAnswer || "",
          isCorrect: typeof answer === "object" ? answer.isCorrect || false : false,
          timeSpent: typeof answer === "object" ? answer.timeSpent || 0 : 0,
        }
      }
      return answer
    })
  }

  return {
    submitQuizResult,
    isSubmitting,
    isSuccess,
    isError,
    errorMessage,
    result,
    resetSubmissionState,
  }
}
