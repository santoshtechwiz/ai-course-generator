"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "./use-toast"
import { QuizType } from "@/app/types/types"


interface QuizAnswer {
  answer: string | string[]
  isCorrect: boolean
  timeSpent: number
}

interface SaveQuizResultParams {
  s
  quizId: string | number
  answers: QuizAnswer[]
  totalTime: number
  score: number
  type: QuizType,
  slug: string
}

export function useSaveQuizResult() {
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const saveQuizResult = async ({ quizId, answers, totalTime, score, type, slug }: SaveQuizResultParams) => {
    setIsSaving(true)

    try {
      const response = await fetch(`/api/quiz/${slug}/complete`, {
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

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save quiz results")
      }

      toast({
        title: "Quiz completed!",
        description: `Your score: ${Math.round(data.result.percentageScore || data.result.score)}%`,
      })

      // Refresh the page to show updated results
      router.refresh()

      return data
    } catch (error) {
      console.error("Error saving quiz results:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save quiz results",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  return { saveQuizResult, isSaving }
}

