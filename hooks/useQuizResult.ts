"use client"

import { useState, useRef, useCallback } from "react"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { QuizType } from "@/app/types/quiz-types"
import { quizStorageService, type QuizAnswer } from "@/lib/quiz-storage-service"

interface UseQuizResultProps {
  quizId: string
  slug: string
  answers: QuizAnswer[]
  totalTime: number
  score: number
  quizType: QuizType
  totalQuestions: number
  startTime?: number
}

interface UseQuizResultOptions {
  onSuccess?: (result: any) => void
  onError?: (error: Error) => void
  redirectOnSuccess?: boolean
  redirectPath?: string
}

export function useQuizResult({
  quizId,
  slug,
  answers,
  totalTime,
  score,
  quizType,
  totalQuestions,
  startTime,
}: UseQuizResultProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const submissionInProgress = useRef(false)
  const saveAttemptCount = useRef(0)
  const lastSaveAttempt = useRef(0)
  const router = useRouter()

  // Calculate correct answers
  const calculateCorrectAnswers = useCallback(() => {
    return quizStorageService.countCorrectAnswers(answers, quizType)
  }, [answers, quizType])

  // Update correct answers when answers change
  useState(() => {
    setCorrectAnswers(calculateCorrectAnswers())
  })

  // Save result to server
  const saveResult = useCallback(async () => {
    // Prevent duplicate submissions
    if (submissionInProgress.current || isSaving) {
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
      return { success: true, message: "Already saved" }
    }

    try {
      lastSaveAttempt.current = now
      saveAttemptCount.current += 1
      submissionInProgress.current = true
      setIsSaving(true)
      setError(null)

      // Calculate correct answers
      const correctCount = calculateCorrectAnswers()
      setCorrectAnswers(correctCount)

      // Prepare submission data
      const submissionData = {
        quizId,
        slug,
        answers,
        totalTime,
        score,
        type: quizType,
        totalQuestions,
      }

      console.log("Submitting quiz result:", {
        endpoint: `/api/quiz/${quizId}/complete`,
        data: submissionData,
      })

      // Submit to the correct endpoint with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const response = await fetch(`/api/quiz/${quizId}/complete`, {
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

      // Mark this quiz as saved
      localStorage.setItem(`quiz_${quizId}_saved`, "true")

      // Save the result to our storage service
      quizStorageService.saveQuizResult({
        quizId,
        slug,
        quizType,
        score,
        answers,
        totalTime,
        timestamp: Date.now(),
        isCompleted: true,
      })

      // Only show toast on first successful save
      if (saveAttemptCount.current <= 2) {
        toast({
          title: "Quiz completed!",
          description: "Your results have been saved successfully.",
        })
      }

      return data
    } catch (error: any) {
      console.error("Error submitting quiz results:", error)
      setError(error.message || "An error occurred while submitting your quiz results")

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
          setIsSaving(false)
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
        setIsSaving(false)
        submissionInProgress.current = false
      }, 1000)
    }
  }, [quizId, slug, answers, totalTime, score, quizType, totalQuestions, calculateCorrectAnswers])

  // Retry saving
  const handleRetryFetch = useCallback(() => {
    saveResult()
  }, [saveResult])

  return {
    isLoading,
    isSaving,
    error,
    correctAnswers,
    saveResult,
    handleRetryFetch,
  }
}
