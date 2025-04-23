"use client"

import { useState, useRef } from "react"
import { toast } from "./use-toast"
import { useRouter } from "next/navigation"
import type { QuizType } from "@/app/types/quiz-types"

interface UseQuizResultOptions {
  onSuccess?: (result: any) => void
  onError?: (error: Error) => void
  redirectOnSuccess?: boolean
  redirectPath?: string
}

// Implement consistent error handling with user feedback
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
  const saveAttemptCount = useRef(0)
  const lastSaveAttempt = useRef(0)
  const router = useRouter()

  const resetSubmissionState = () => {
    setIsSubmitting(false)
    setIsSuccess(false)
    setIsError(false)
    setErrorMessage(null)
    setResult(null)
    submissionInProgress.current = false
    saveAttemptCount.current = 0
  }

  // Improved submission function with better error handling
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

    // Prevent excessive save attempts
    const now = Date.now()
    if (now - lastSaveAttempt.current < 5000) {
      // Throttle to once every 5 seconds
      console.log("Throttling save attempt, too frequent")
      return null
    }

    // Limit total save attempts to prevent infinite loops
    if (saveAttemptCount.current > 5) {
      console.log("Too many save attempts, stopping to prevent infinite loop")
      return null
    }

    // Check if we've already saved this quiz
    const alreadySaved = localStorage.getItem(`quiz_${quizId}_saved`) === "true"
    if (alreadySaved) {
      console.log("Quiz results already saved, skipping save")
      setIsSuccess(true)
      return { success: true, message: "Already saved" }
    }

    try {
      lastSaveAttempt.current = now
      saveAttemptCount.current += 1
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
        let errorMessage = `Failed to submit quiz results: ${response.status}`

        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (jsonError) {
          // If JSON parsing fails, try to get the text response
          try {
            const errorText = await response.text()
            if (errorText) {
              errorMessage += ` - ${errorText}`
            }
          } catch (textError) {
            // If text extraction fails, just use the status code error
          }
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      setResult(data)
      setIsSuccess(true)

      // Mark this quiz as saved
      localStorage.setItem(`quiz_${quizId}_saved`, "true")

      if (onSuccess) {
        onSuccess(data)
      }

      // Only show toast on first successful save
      if (saveAttemptCount.current <= 2) {
        toast({
          title: "Quiz completed!",
          description: "Your results have been saved successfully.",
        })
      }

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

      // Check if this is a deadlock error and retry after a delay
      const errorMessage = error.message || "Unknown error"
      if (errorMessage.includes("deadlock") || errorMessage.includes("write conflict")) {
        // Only show toast on first few attempts
        if (saveAttemptCount.current <= 2) {
          toast({
            title: "Database busy",
            description: "We'll try again in a moment...",
          })
        }

        // Retry after a short delay
        setTimeout(() => {
          submissionInProgress.current = false
          setIsSubmitting(false)
        }, 5000) // Increased delay to 5 seconds
      } else {
        // Only show toast on first few attempts
        if (saveAttemptCount.current <= 2) {
          toast({
            title: "Error",
            description: error.message || "Failed to save quiz results. Please try again.",
            variant: "destructive",
          })
        }
      }

      return null
    } finally {
      // Add a small delay before allowing new submissions
      setTimeout(() => {
        setIsSubmitting(false)
        submissionInProgress.current = false
      }, 1000)
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
