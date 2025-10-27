"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface RandomQuiz {
  id: string
  title: string
  quizType: string
  difficulty: string
  questionCount: number
  description?: string
  tags?: string[]
  rating?: number
  slug?: string
  estimatedTime?: number
}

interface UseRandomQuizzesReturn {
  quizzes: RandomQuiz[]
  isLoading: boolean
  error: string | null
  refreshQuizzes: () => Promise<void>
  shuffleQuizzes: () => void
  currentIndex: number
  nextQuiz: () => void
  prevQuiz: () => void
  hasNext: boolean
  hasPrev: boolean
  totalQuizzes: number
}

// Module-level cache
const cache = {
  data: null as RandomQuiz[] | null,
  timestamp: null as number | null,
  ttl: 5 * 60 * 1000, // 5 minutes
  fetchPromise: null as Promise<RandomQuiz[]> | null
}

export const useRandomQuizzes = (maxQuizzes = 6): UseRandomQuizzesReturn => {
  const [quizzes, setQuizzes] = useState<RandomQuiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const abortControllerRef = useRef<AbortController | null>(null)

  const shuffleArray = useCallback((array: RandomQuiz[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  const transformQuizData = useCallback((data: any[]): RandomQuiz[] => {
    return data.map(quiz => ({
      id: quiz.id,
      title: quiz.title || "Untitled Quiz",
      quizType: quiz.quizType || "mcq",
      difficulty: quiz.difficulty || "medium",
      questionCount: quiz.questionCount || 0,
      description: quiz.description || "",
      tags: quiz.tags || [],
      rating: quiz.rating,
      slug: quiz.slug || quiz.id,
      estimatedTime: quiz.estimatedTime
    }))
  }, [])

  const fetchRandomQuizzes = useCallback(async () => {
    const now = Date.now()
    
    // Return cached data if valid
    if (cache.data && cache.timestamp && (now - cache.timestamp) < cache.ttl) {
      setQuizzes(cache.data.slice(0, maxQuizzes))
      setIsLoading(false)
      return
    }

    // Wait for ongoing fetch
    if (cache.fetchPromise) {
      try {
        const result = await cache.fetchPromise
        setQuizzes(result.slice(0, maxQuizzes))
        setIsLoading(false)
        return
      } catch {
        // Continue to fetch fresh data
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)
    setError(null)

    try {
      const fetchPromise = fetch("/api/quizzes/common/random", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
      }).then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        const transformed = transformQuizData(data.quizzes || data || [])
        const shuffled = shuffleArray(transformed)
        
        cache.data = shuffled
        cache.timestamp = Date.now()
        
        return shuffled
      })

      cache.fetchPromise = fetchPromise
      const result = await fetchPromise
      
      setQuizzes(result.slice(0, maxQuizzes))
      setCurrentIndex(0)
    } catch (err) {
      if ((err as any)?.name === 'AbortError') return
      
      setError("Failed to load quizzes")
      console.error('Fetch error:', err)
    } finally {
      cache.fetchPromise = null
      setIsLoading(false)
    }
  }, [maxQuizzes, transformQuizData, shuffleArray])

  const refreshQuizzes = useCallback(async () => {
    // Clear cache to force refresh
    cache.data = null
    cache.timestamp = null
    await fetchRandomQuizzes()
  }, [fetchRandomQuizzes])

  const shuffleQuizzes = useCallback(() => {
    setQuizzes(prev => {
      const shuffled = shuffleArray(prev)
      setCurrentIndex(0)
      return shuffled
    })
  }, [shuffleArray])

  const nextQuiz = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % quizzes.length)
  }, [quizzes.length])

  const prevQuiz = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + quizzes.length) % quizzes.length)
  }, [quizzes.length])

  const hasNext = quizzes.length > 1 && currentIndex < quizzes.length - 1
  const hasPrev = quizzes.length > 1 && currentIndex > 0

  useEffect(() => {
    fetchRandomQuizzes()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchRandomQuizzes])

  useEffect(() => {
    if (quizzes.length > 0 && currentIndex >= quizzes.length) {
      setCurrentIndex(0)
    }
  }, [quizzes.length, currentIndex])

  return {
    quizzes,
    isLoading,
    error,
    refreshQuizzes,
    shuffleQuizzes,
    currentIndex,
    nextQuiz,
    prevQuiz,
    hasNext,
    hasPrev,
    totalQuizzes: quizzes.length,
  }
}