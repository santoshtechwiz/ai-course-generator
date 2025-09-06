"use client"

import { useState, useEffect, useCallback, useRef } from "react"

// Module-level cache to prevent multiple components from repeatedly
// fetching the same random quizzes endpoint. This reduces network churn
// when multiple consumers mount at the same time.
let __cachedRandomQuizzes: RandomQuiz[] | null = null
let __cachedRandomQuizzesAt: number | null = null
let __fetchInProgress: Promise<RandomQuiz[] | null> | null = null
const CACHE_TTL_MS = 60 * 1000 // 60 seconds

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
  isPublic?: boolean
  isFavorite?: boolean
  estimatedTime?: number
  timeStarted?: Date
}

interface UseRandomQuizzesReturn {
  quizzes: RandomQuiz[]
  isLoading: boolean
  error: string | null
  refreshQuizzes: () => Promise<void>
  shuffleQuizzes: () => void
  currentIndex: number
  setCurrentIndex: (index: number) => void
  nextQuiz: () => void
  prevQuiz: () => void
  hasNext: boolean
  hasPrev: boolean
  totalQuizzes: number
  retryCount: number
  lastFetchTime: Date | null
}

export const useRandomQuizzes = (maxQuizzes = 6): UseRandomQuizzesReturn => {
  const [quizzes, setQuizzes] = useState<RandomQuiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const maxRetries = 3
  const retryDelay = 1000

  const shuffleArray = useCallback((array: RandomQuiz[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  const generateFallbackQuizzes = useCallback((): RandomQuiz[] => {
    const fallbackQuizzes: RandomQuiz[] = [
      {
        id: "fallback-1",
        title: "JavaScript Fundamentals",
        quizType: "mcq",
        difficulty: "easy",
        questionCount: 10,
        description: "Test your knowledge of JavaScript basics",
        tags: ["javascript", "programming", "web"],
        rating: 4.2,
        slug: "javascript-fundamentals",
        isPublic: true,
        estimatedTime: 15,
      },
      {
        id: "fallback-2",
        title: "React Components",
        quizType: "code",
        difficulty: "medium",
        questionCount: 8,
        description: "Practice React component development",
        tags: ["react", "components", "frontend"],
        rating: 4.5,
        slug: "react-components",
        isPublic: true,
        estimatedTime: 20,
      },
      {
        id: "fallback-3",
        title: "CSS Flexbox",
        quizType: "blanks",
        difficulty: "easy",
        questionCount: 12,
        description: "Master CSS Flexbox layout",
        tags: ["css", "layout", "flexbox"],
        rating: 4.0,
        slug: "css-flexbox",
        isPublic: true,
        estimatedTime: 18,
      },
      {
        id: "fallback-4",
        title: "Algorithm Thinking",
        quizType: "openended",
        difficulty: "hard",
        questionCount: 5,
        description: "Explore algorithmic problem solving",
        tags: ["algorithms", "problem-solving", "computer-science"],
        rating: 4.7,
        slug: "algorithm-thinking",
        isPublic: true,
        estimatedTime: 30,
      },
      {
        id: "fallback-5",
        title: "Web Security Basics",
        quizType: "flashcard",
        difficulty: "medium",
        questionCount: 15,
        description: "Learn essential web security concepts",
        tags: ["security", "web", "cybersecurity"],
        rating: 4.3,
        slug: "web-security-basics",
        isPublic: true,
        estimatedTime: 25,
      },
    ]
    
    return shuffleArray(fallbackQuizzes).slice(0, maxQuizzes)
  }, [maxQuizzes, shuffleArray])

  const fetchRandomQuizzes = useCallback(async (isRetry = false) => {
    // If we have cached data that's fresh, reuse it and avoid a network call.
    const now = Date.now()
    if (!isRetry && __cachedRandomQuizzes && __cachedRandomQuizzesAt && now - __cachedRandomQuizzesAt < CACHE_TTL_MS) {
      setQuizzes(__cachedRandomQuizzes.slice(0, maxQuizzes))
      setError(null)
      setRetryCount(0)
      setLastFetchTime(new Date(__cachedRandomQuizzesAt))
      setIsLoading(false)
      setCurrentIndex(0)
      return
    }

    // If a fetch is already in progress, wait for it instead of firing a parallel one
    if (!isRetry && __fetchInProgress) {
      try {
        const result = await __fetchInProgress
        if (result) {
          setQuizzes(result.slice(0, maxQuizzes))
          setLastFetchTime(new Date(__cachedRandomQuizzesAt || Date.now()))
        }
      } catch (e) {
        // swallow; downstream logic will handle showing fallback
      }
      setIsLoading(false)
      return
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort()
      } catch (e) {
        // ignore
      }
      // If we abort an in-flight request, clear the shared fetch marker so callers
      // don't await a permanently-rejected promise.
      __fetchInProgress = null
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    if (!isRetry) {
      setIsLoading(true)
      setError(null)
      setRetryCount(0)
    }

    try {
      // Primary endpoint for random quizzes
      const fetchPromise = (async () => {
        let response = await fetch("/api/quizzes/common/random", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: abortControllerRef.current!.signal,
        })

      // Fallback to general quizzes endpoint if primary fails
        if (!response.ok) {
          response = await fetch(`/api/quizzes?limit=${maxQuizzes}&random=true`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            signal: abortControllerRef.current!.signal,
          })
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch quizzes: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        // Transform API data to match component interface
        const transformedQuizzes: RandomQuiz[] = (data.quizzes || data || []).slice(0, maxQuizzes).map((quiz: any) => ({
        id: quiz.id,
        title: quiz.title || "Untitled Quiz",
        quizType: quiz.quizType || quiz.type || "mcq",
        difficulty: quiz.difficulty || "medium",
        questionCount: quiz._count?.questions || quiz.questionCount || quiz.questions?.length || 0,
        description: quiz.description || "",
        tags: Array.isArray(quiz.tags) ? quiz.tags : [],
        rating: typeof quiz.rating === "number" ? quiz.rating : Math.random() * 2 + 3,
        attempts: typeof quiz.attempts === "number" ? quiz.attempts : undefined,
        createdAt: quiz.createdAt || new Date().toISOString(),
        slug: quiz.slug || quiz.id,
        isPublic: quiz.isPublic ?? true,
        isFavorite: quiz.isFavorite || false,
        estimatedTime: quiz.estimatedTime || Math.ceil((quiz._count?.questions || quiz.questionCount || 10) * 1.5),
        timeStarted: quiz.timeStarted ? new Date(quiz.timeStarted) : undefined,
      }))
        if (transformedQuizzes.length === 0) {
          // Use fallback quizzes if no data received
          const fallbackQuizzes = generateFallbackQuizzes()
          __cachedRandomQuizzes = fallbackQuizzes
          __cachedRandomQuizzesAt = Date.now()
          return fallbackQuizzes
        }

        // Shuffle the quizzes for variety
        const shuffledQuizzes = shuffleArray(transformedQuizzes)
        // Populate module-level cache
        __cachedRandomQuizzes = shuffledQuizzes
        __cachedRandomQuizzesAt = Date.now()
        return shuffledQuizzes
      })()

      // Mark fetch in progress so other callers can wait
      __fetchInProgress = fetchPromise

      let result: RandomQuiz[] | null = null
      try {
        result = await fetchPromise
      } finally {
        // Always clear the shared in-progress marker regardless of success/failure
        __fetchInProgress = null
      }

      if (result && result.length > 0) {
        setQuizzes(result)
        setError(null)
        setRetryCount(0)
        setLastFetchTime(new Date())
        setCurrentIndex(0) // Reset to first quiz on successful fetch
      } else if (result && result.length === 0) {
        const fallbackQuizzes = generateFallbackQuizzes()
        setQuizzes(fallbackQuizzes)
      }
    } catch (err) {
      // Some environments throw DOMException (name === 'AbortError') which may not
      // pass `instanceof Error` in all runtimes, so check name too.
      if ((err as any)?.name === 'AbortError') {
        // Request was aborted, don't update state or report an error.
        // Ensure the shared in-progress marker is cleared so other callers don't
        // wait on a rejected promise.
        __fetchInProgress = null
        return
      }

      const errorMessage = (err && (err as any).message) ? (err as any).message : String(err || "Failed to load quizzes")

      // Log object trace when available for debugging, but make the console
      // message helpful if the error had no message.
      console.error('useRandomQuizzes error:', err)

      if (retryCount < maxRetries) {
        // Retry with exponential backoff
        const delay = retryDelay * Math.pow(2, retryCount)
        setRetryCount(prev => prev + 1)

        setTimeout(() => {
          fetchRandomQuizzes(true)
        }, delay)

        setError(`Retrying... (${retryCount + 1}/${maxRetries})`)
      } else {
        // Max retries reached, use fallback quizzes
        setError(errorMessage)
        const fallbackQuizzes = generateFallbackQuizzes()
        __cachedRandomQuizzes = fallbackQuizzes
        __cachedRandomQuizzesAt = Date.now()
        setQuizzes(fallbackQuizzes)
        setCurrentIndex(0)
      }
    } finally {
      if (!isRetry) {
        setIsLoading(false)
      }
    }
  }, [maxQuizzes, shuffleArray, retryCount, generateFallbackQuizzes])

  const refreshQuizzes = useCallback(async () => {
    setRetryCount(0)
    await fetchRandomQuizzes()
  }, [fetchRandomQuizzes])

  const shuffleQuizzes = useCallback(() => {
    setQuizzes((prev) => {
      const shuffled = shuffleArray(prev)
      setCurrentIndex(0) // Reset to first after shuffle
      return shuffled
    })
  }, [shuffleArray])

  const nextQuiz = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % quizzes.length)
  }, [quizzes.length])

  const prevQuiz = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + quizzes.length) % quizzes.length)
  }, [quizzes.length])

  const hasNext = quizzes.length > 1 && currentIndex < quizzes.length - 1
  const hasPrev = quizzes.length > 1 && currentIndex > 0

  // Initial fetch
  useEffect(() => {
    fetchRandomQuizzes()
    
    // Cleanup function to abort any pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchRandomQuizzes])

  // Reset current index when quizzes change
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
    setCurrentIndex,
    nextQuiz,
    prevQuiz,
    hasNext,
    hasPrev,
    totalQuizzes: quizzes.length,
    retryCount,
    lastFetchTime,
  }
}

