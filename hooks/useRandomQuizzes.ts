'use client'


import axios from "axios"
import { useState, useEffect } from "react"


export interface Quiz {
  id: number
  topic: string
  quizType: string
  difficulty: string | null
  bestScore: number | null
  slug: string
}

export const useRandomQuizzes = (count = 3) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getQuizzes = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const fetchedQuizzes = await axios.get<Quiz[]>(`/api/quiz/random`)
        .then((response) => response.data);

       console.log(fetchedQuizzes);

        setQuizzes(fetchedQuizzes)
      } catch (err) {
        setError('Failed to fetch quizzes')
        console.error('Error fetching quizzes:', err)
      } finally {
        setIsLoading(false)
      }
    }

    getQuizzes()
  }, [count])

  return { quizzes, isLoading, error }
}
