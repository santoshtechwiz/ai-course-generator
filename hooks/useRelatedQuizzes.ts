"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export interface RelatedQuizItem {
  id: string
  title: string
  slug: string
  quizType: string
  difficulty: string
  questionCount: number
}

const memoryCache = new Map<string, { at: number; data: RelatedQuizItem[] }>()

function cacheKey(type?: string, difficulty?: string, exclude?: string, limit?: number, tags?: string[]) {
  return `${type || 'all'}:${difficulty || 'any'}:${exclude || 'none'}:${(tags || []).join('|')}:${limit || 6}`
}

export function useRelatedQuizzes(params: { quizType?: string; difficulty?: string; exclude?: string; limit?: number; tags?: string[] }) {
  const { quizType, difficulty, exclude, limit = 6, tags } = params
  const [quizzes, setQuizzes] = useState<RelatedQuizItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchRelated = useCallback(async () => {
    const key = cacheKey(quizType, difficulty, exclude, limit, tags)
    const cached = memoryCache.get(key)
    if (cached && Date.now() - cached.at < 60_000) {
      setQuizzes(cached.data)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    try {
      setLoading(true)
      setError(null)
      const url = new URL("/api/quizzes/related", window.location.origin)
      if (quizType) url.searchParams.set("quizType", quizType)
      if (difficulty) url.searchParams.set("difficulty", difficulty)
      if (exclude) url.searchParams.set("exclude", exclude)
      url.searchParams.set("limit", String(limit))
      if (tags && tags.length > 0) url.searchParams.set("tags", tags.join(","))

      const res = await fetch(url.toString(), { signal: abortRef.current.signal })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const json = await res.json()
      const list: RelatedQuizItem[] = json.quizzes || []
      setQuizzes(list)
      memoryCache.set(key, { at: Date.now(), data: list })
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      setError(e?.message || 'Failed to load related quizzes')
    } finally {
      setLoading(false)
    }
  }, [quizType, difficulty, exclude, limit, tags])

  useEffect(() => {
    fetchRelated()
    return () => abortRef.current?.abort()
  }, [fetchRelated])

  return { quizzes, loading, error, refetch: fetchRelated }
}