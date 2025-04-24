"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
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
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const submissionInProgress = useRef(false)
  const hasSavedRef = useRef(false)
  const storageKey = `quiz_${quizId}_saved`

  // Calculate correct answers when answers change
  useEffect(() => {
    if (answers && answers.length > 0) {
      const count = quizStorageService.countCorrectAnswers(answers, quizType)
      setCorrectAnswers(count)
    }
    setIsLoading(false)

    // Check if already saved
    if (typeof window !== "undefined") {
      const alreadySaved = localStorage.getItem(storageKey) === "true"
      if (alreadySaved) {
        hasSavedRef.current = true
      }
    }
  }, [answers, quizType, storageKey])

  // Save result function
  const saveResult = useCallback(async () => {
    // Skip if already in progress or already saved
    if (submissionInProgress.current || isSaving || hasSavedRef.current) return

    try {
      submissionInProgress.current = true
      setIsSaving(true)
      setError(null)

      // Check if already saved in localStorage
      if (typeof window !== "undefined") {
        const alreadySaved = localStorage.getItem(storageKey) === "true"
        if (alreadySaved) {
          hasSavedRef.current = true
          return
        }
      }

      // Create the result object
      const result = {
        quizId,
        quizType,
        slug,
        score,
        answers,
        totalTime,
        timestamp: Date.now(),
        isCompleted: true,
      }

      // For authenticated users, save to server
      if (status === "authenticated") {
        try {
          const response = await fetch(`/api/quiz/${slug}/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quizId,
              slug,
              answers,
              totalTime,
              score,
              type: quizType,
              totalQuestions,
            }),
          })

          if (!response.ok) {
            throw new Error("Failed to save quiz results to server")
          }

          // Also save to local storage as backup
          quizStorageService.saveQuizResult(result)

          // Mark as saved
          if (typeof window !== "undefined") {
            localStorage.setItem(storageKey, "true")
          }
          hasSavedRef.current = true

          toast({
            title: "Quiz completed!",
            description: "Your results have been saved successfully.",
          })
        } catch (err) {
          console.error("Error saving to server:", err)

          // Save to local storage as fallback
          quizStorageService.saveQuizResult(result)

          setError("Failed to save to server, but results are saved locally.")
        }
      } else {
        // For unauthenticated users, save to local storage
        quizStorageService.saveGuestResult(result)
      }
    } catch (error: any) {
      console.error("Error saving quiz results:", error)
      setError("Failed to save quiz results. Please try again.")
    } finally {
      setIsSaving(false)
      submissionInProgress.current = false
    }
  }, [quizId, slug, answers, totalTime, score, quizType, totalQuestions, status, toast, storageKey])

  // Retry fetching results
  const handleRetryFetch = useCallback(() => {
    setIsLoading(true)
    // Try to load from storage
    const savedResult = quizStorageService.getQuizResult(quizId)
    if (savedResult && savedResult.answers && savedResult.answers.length > 0) {
      const count = quizStorageService.countCorrectAnswers(savedResult.answers, quizType)
      setCorrectAnswers(count)
    }
    setIsLoading(false)
  }, [quizId, quizType])

  return {
    isLoading,
    isSaving,
    error,
    correctAnswers,
    saveResult,
    handleRetryFetch,
  }
}
