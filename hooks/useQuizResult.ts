"use client"

import { useState, useEffect, useCallback } from "react"
import type { QuizResult, QuizType } from "@/app/types/quiz-types"
import { useToast } from "./use-toast"
import { QuizAnswer, quizResultService } from "@/app/dashboard/subscription/services/QuizResultService"

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

interface UseQuizResultReturn {
  isLoading: boolean
  isSaving: boolean
  error: string | null
  result: QuizResult | null
  saveResult: () => Promise<boolean>
  correctAnswers: number
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
}: UseQuizResultProps): UseQuizResultReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<QuizResult | null>(null)
  const { toast } = useToast()

  // Calculate correct answers
  const correctAnswers = quizResultService.calculateCorrectAnswers(answers, quizType)

  // Fetch existing result on mount
  useEffect(() => {
    const fetchResult = async () => {
      if (!quizId) return

      setIsLoading(true)
      setError(null)

      try {
        const fetchedResult = await quizResultService.getQuizResult(quizId,slug)
        if (fetchedResult) {
          setResult(fetchedResult)
        }
      } catch (err) {
        console.error("Error fetching quiz result:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch quiz result")
      } finally {
        setIsLoading(false)
      }
    }

    fetchResult()
  }, [quizId])

  // Save result function
  const saveResult = useCallback(async (): Promise<boolean> => {
    if (!quizId || !slug || !answers || answers.length === 0) {
      setError("Missing required data to save quiz result")
      return false
    }

    setIsSaving(true)
    setError(null)

    try {
      // Calculate total time if not provided
      const calculatedTotalTime = totalTime || (startTime ? (Date.now() - startTime) / 1000 : 300)

      const savedResult = await quizResultService.submitQuizResult({
        quizId,
        slug,
        answers,
        totalTime: calculatedTotalTime,
        score,
        type: quizType,
        totalQuestions,
      })

      if (savedResult) {
        setResult(savedResult)
        toast({
          title: "Results saved",
          description: "Your quiz results have been saved successfully.",
        })
        return true
      }

      return false
    } catch (err) {
      console.error("Error saving quiz result:", err)
      setError(err instanceof Error ? err.message : "Failed to save quiz result")

      toast({
        title: "Error saving results",
        description: err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      })

      return false
    } finally {
      setIsSaving(false)
    }
  }, [quizId, slug, answers, totalTime, score, quizType, totalQuestions, startTime, toast])

  return {
    isLoading,
    isSaving,
    error,
    result,
    saveResult,
    correctAnswers,
  }
}
