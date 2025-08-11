"use client"

import { useState, useEffect, useCallback } from "react"

export interface RandomQuiz {
  id: string
  title: string
  quizType: string
  difficulty: string
  questionCount: number
  description?: string
  tags?: string[]
  rating?: number
  attempts?: number
  createdAt?: string
  slug?: string
}

interface UseRandomQuizzesReturn {
  quizzes: RandomQuiz[]
  isLoading: boolean
  error: string | null
  refreshQuizzes: () => Promise<void>
  shuffleQuizzes: () => void
}

export const useRandomQuizzes = (maxQuizzes = 6): UseRandomQuizzesReturn => {
  const [quizzes, setQuizzes] = useState<RandomQuiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const shuffleArray = useCallback((array: RandomQuiz[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  const fetchRandomQuizzes = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Primary endpoint for random quizzes
      let response = await fetch("/api/quizzes/common/random", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      // Fallback to general quizzes endpoint if primary fails
      if (!response.ok) {
        response = await fetch(`/api/quizzes?limit=${maxQuizzes}&random=true`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch quizzes: ${response.status}`)
      }

      const data = await response.json()

      // Transform API data to match component interface
      const transformedQuizzes: RandomQuiz[] = (data.quizzes || data || []).slice(0, maxQuizzes).map((quiz: any) => ({
        id: quiz.id,
        title: quiz.title || "Untitled Quiz",
        quizType: quiz.quizType || quiz.type || "mcq",
        difficulty: quiz.difficulty || "medium",
        questionCount: quiz.questionCount || quiz._count?.questions || quiz.questions?.length || 0,
        description: quiz.description || "",
        tags: Array.isArray(quiz.tags) ? quiz.tags : [],
        rating: typeof quiz.rating === "number" ? quiz.rating : undefined,
        attempts: typeof quiz.attempts === "number" ? quiz.attempts : undefined,
        createdAt: quiz.createdAt || new Date().toISOString(),
        slug: quiz.slug || quiz.id,
      }))

      // Shuffle the quizzes for variety
      const shuffledQuizzes = shuffleArray(transformedQuizzes)
      setQuizzes(shuffledQuizzes)
    } catch (err) {
      console.error("Error fetching random quizzes:", err)
      setError(err instanceof Error ? err.message : "Failed to load quizzes")

      // Set empty array on error to prevent UI issues
      setQuizzes([])
    } finally {
      setIsLoading(false)
    }
  }, [maxQuizzes, shuffleArray])

  const refreshQuizzes = useCallback(async () => {
    await fetchRandomQuizzes()
  }, [fetchRandomQuizzes])

  const shuffleQuizzes = useCallback(() => {
    setQuizzes((prev) => shuffleArray(prev))
  }, [shuffleArray])

  // Initial fetch
  useEffect(() => {
    fetchRandomQuizzes()
  }, [fetchRandomQuizzes])

  return {
    quizzes,
    isLoading,
    error,
    refreshQuizzes,
    shuffleQuizzes,
  }
}
