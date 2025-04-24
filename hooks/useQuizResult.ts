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
  isAuthenticated: boolean
}

export function useQuizResult({
  quizId,
  slug,
  answers,
  totalTime,
  score,
  quizType,
  totalQuestions,
  isAuthenticated,
}: UseQuizResultProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submissionInProgress = useRef(false)
  const router = useRouter()

  const saveResult = useCallback(() => {
    if (submissionInProgress.current || isSaving) return

    if (!quizType || !slug) {
      setError("Invalid quiz type or slug.")
      return
    }

    try {
      submissionInProgress.current = true
      setIsSaving(true)
      setError(null)

      const result = {
        quizId,
        slug,
        answers,
        totalTime,
        score,
        type: quizType,
        totalQuestions,
        timestamp: Date.now(),
        isCompleted: true,
      }

      if (isAuthenticated) {
        quizStorageService.saveQuizResult(result)
        toast({ title: "Quiz completed!", description: "Your results have been saved successfully." })
      } else {
        quizStorageService.savePendingQuizResult(result)
      }

      // Redirect to the same page to render the result
      router.push(`/dashboard/${quizType}/${slug}`)
    } catch (error: any) {
      console.error("Error saving quiz results:", error)
      setError("Failed to save quiz results. Please try again.")
    } finally {
      setIsSaving(false)
      submissionInProgress.current = false
    }
  }, [quizId, slug, answers, totalTime, score, quizType, totalQuestions, isAuthenticated, router])

  return {
    isSaving,
    error,
    saveResult,
  }
}
