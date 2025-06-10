"use client"

import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/lib/api-client"

export interface RandomQuiz {
  id: string;
  slug: string;
  title: string;
  quizType: string;
  difficulty: string;
  duration?: number;
  bestScore?: number;
  completionRate?: number;
  description?: string;
  popularity?: string;
  createdAt?: string;
}

export function useRandomQuizzes(count: number = 5) {
  const [quizzes, setQuizzes] = useState<RandomQuiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch quizzes function
  const fetchQuizzes = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Use the API client to fetch quizzes
      const response = await apiClient.get("/api/quizzes/common/random", {
        params: { count }
      })

      // Process the quizzes with default values if needed
      const processedQuizzes = response.quizzes?.map((quiz: any) => ({
        ...quiz,
        // Add default values for missing fields
        difficulty: quiz.difficulty || "Medium",
        duration: quiz.duration || Math.floor(Math.random() * 5) + 3,
      })) || []

      setQuizzes(processedQuizzes)
    } catch (err) {
      console.error("Failed to fetch random quizzes", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch quizzes"))
      
      // Use fallback data in case of error
      const fallbackQuizzes = generateFallbackQuizzes(count)
      setQuizzes(fallbackQuizzes)
    } finally {
      setIsLoading(false)
    }
  }, [count])

  // Fetch quizzes on mount
  useEffect(() => {
    fetchQuizzes()
  }, [fetchQuizzes])

  // Generate fallback quizzes for testing or when API fails
  const generateFallbackQuizzes = (count: number): RandomQuiz[] => {
    const types = ["mcq", "fill-blanks", "code", "flashcard", "openended"]
    const difficulties = ["Easy", "Medium", "Hard"]
    const topics = ["JavaScript Basics", "React Hooks", "CSS Grid Layout", "Python Functions", "TypeScript Interfaces"]
    
    return Array.from({ length: count }).map((_, index) => {
      const type = types[Math.floor(Math.random() * types.length)]
      const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)]
      const topic = topics[Math.floor(Math.random() * topics.length)]
      const id = `fallback-${type}-${index}`
      
      return {
        id,
        slug: id,
        title: `${topic} Quiz`,
        quizType: type,
        difficulty,
        duration: Math.floor(Math.random() * 5) + 5,
        bestScore: Math.floor(Math.random() * 40) + 60,
        completionRate: Math.floor(Math.random() * 100),
        description: `Test your knowledge on ${topic} with this interactive ${type} quiz.`,
      }
    })
  }

  return {
    quizzes,
    isLoading,
    error,
    refresh: fetchQuizzes
  }
}
