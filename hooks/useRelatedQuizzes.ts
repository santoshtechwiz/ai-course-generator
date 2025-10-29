"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export interface RelatedQuizItem {
  id: string
  title: string
  slug: string
  quizType: string
  difficulty: string
  questionCount: number
  isPublic: boolean
}

interface UseRelatedQuizzesOptions {
  quizType?: string
  exclude?: string
  difficulty?: string
  tags?: string[]
  limit?: number
}

interface UseRelatedQuizzesReturn {
  quizzes: RelatedQuizItem[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Module-level cache
const cache = new Map<string, { data: RelatedQuizItem[], timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const useRelatedQuizzes = (options: UseRelatedQuizzesOptions): UseRelatedQuizzesReturn => {
  const { quizType, exclude, difficulty, tags = [], limit = 6 } = options

  const [quizzes, setQuizzes] = useState<RelatedQuizItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  const buildCacheKey = useCallback(() => {
    return `related:${quizType || 'all'}:${difficulty || 'any'}:${exclude || 'none'}:${tags.join('|')}:${limit}`
  }, [quizType, difficulty, exclude, tags, limit])

  const fetchRelatedQuizzes = useCallback(async () => {
    const cacheKey = buildCacheKey()
    const now = Date.now()

    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      setQuizzes(cached.data)
      setLoading(false)
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (quizType) params.set('quizType', quizType)
      if (difficulty) params.set('difficulty', difficulty)
      if (exclude) params.set('exclude', exclude)
      if (tags.length > 0) params.set('tags', tags.join(','))
      params.set('limit', limit.toString())

      const response = await fetch(`/api/quizzes/related?${params}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const fetchedQuizzes = data.quizzes || []

      // Update cache
      cache.set(cacheKey, { data: fetchedQuizzes, timestamp: now })

      setQuizzes(fetchedQuizzes)
    } catch (err) {
      if ((err as any)?.name === 'AbortError') return

      const errorMessage = err instanceof Error ? err.message : "Failed to load related quizzes"
      setError(errorMessage)
      console.error('Fetch related quizzes error:', err)
    } finally {
      setLoading(false)
    }
  }, [buildCacheKey, quizType, difficulty, exclude, tags, limit])

  const refetch = useCallback(async () => {
    // Clear cache for this key
    const cacheKey = buildCacheKey()
    cache.delete(cacheKey)
    await fetchRelatedQuizzes()
  }, [buildCacheKey, fetchRelatedQuizzes])

  useEffect(() => {
    fetchRelatedQuizzes()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchRelatedQuizzes])

  return {
    quizzes,
    loading,
    error,
    refetch
  }
}