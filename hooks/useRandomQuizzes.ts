"use client"

import axios from "axios"
import { useState, useEffect } from "react"
import type { QuizType, QuizDifficulty } from "@/app/types/quiz-types"

export interface Quiz {
  id: number;
  title: string;
  quizType: QuizType;
  difficulty: QuizDifficulty | null;
  bestScore: number | null;
  slug: string;
  duration: number; // in minutes
  completionRate?: number; // percentage, optional
}

export const useRandomQuizzes = (count = 3) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const getQuizzes = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await axios.get<Quiz[]>(`/api/quiz/random?count=${count}`)
        setQuizzes(response.data)
      } catch (err) {
        setError("Failed to fetch quizzes")
        console.error("Error fetching quizzes:", err)
      } finally {
        setIsLoading(false)
      }
    }

    getQuizzes()
  }, [count, refreshKey])

  const refresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return { quizzes, isLoading, error, refresh }
}
