"use client"

import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import type { QuizType } from "@/app/types/types"

interface UseQuizResultOptions {
  onSuccess?: (result: any) => void
  onError?: (error: Error) => void
}

export function useQuizResult(options?: UseQuizResultOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [result, setResult] = useState<any>(null)

  /**
   * Submit quiz results to the server
   */
  const submitQuizResult = async (quizId: string, answers: any[], totalTime: number, score: number, type: QuizType) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setIsSuccess(false)
    setIsError(false)
    setErrorMessage("")

    try {
      const response = await fetch(`/api/quiz/${quizId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId,
          answers,
          totalTime,
          score,
          type,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to submit quiz results: ${response.status}`)
      }

      const data = await response.json()
      setResult(data.result || data)

      // Show success state
      setIsSuccess(true)

      // Show success message
      toast({
        title: "Quiz completed!",
        description: `Your score: ${Math.round(data.result?.percentageScore || data.percentageScore || 0)}%`,
      })

      // Call the success callback if provided
      if (options?.onSuccess) {
        options.onSuccess(data.result || data)
      }

      return data.result || data
    } catch (error) {
      console.error("Error submitting quiz results:", error)

      // Show error state
      setIsError(true)
      setErrorMessage(error instanceof Error ? error.message : "Failed to submit quiz results")

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit quiz results",
        variant: "destructive",
      })

      // Call the error callback if provided
      if (options?.onError) {
        options.onError(error instanceof Error ? error : new Error("Unknown error"))
      }

      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetSubmissionState = () => {
    setIsSubmitting(false)
    setIsSuccess(false)
    setIsError(false)
    setErrorMessage("")
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

