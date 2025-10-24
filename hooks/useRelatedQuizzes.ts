"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface RelatedQuizItem {
  id: string
  title: string
  slug: string
  quizType: string
  difficulty: string
  questionCount: number
}

// Enhanced client-side cache with longer TTL
const memoryCache = new Map<string, { at: number; data: RelatedQuizItem[]; etag?: string }>()
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes (increased from 1 minute)

function cacheKey(type?: string, difficulty?: string, exclude?: string, limit?: number, tags?: string[]) {
  return `related:${type || 'all'}:${difficulty || 'any'}:${exclude || 'none'}:${(tags || []).join('|')}:${limit || 6}`
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
    
    // Use longer cache TTL
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setQuizzes(cached.data)
      setLoading(false)
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

      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Cache-Control': 'public, max-age=600'
      }

      // Add ETag for conditional requests
      if (cached?.etag) {
        headers['If-None-Match'] = cached.etag
      }

      const res = await fetch(url.toString(), { 
        signal: abortRef.current.signal,
        headers
      })
      
      // Handle 304 Not Modified
      if (res.status === 304 && cached) {
        setQuizzes(cached.data)
        // Extend cache time
        memoryCache.set(key, { ...cached, at: Date.now() })
        return
      }
      
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      
      const json = await res.json()
      const list: RelatedQuizItem[] = json.quizzes || []
      const etag = res.headers.get('etag')
      
      setQuizzes(list)
      memoryCache.set(key, { at: Date.now(), data: list, etag: etag || undefined })
      
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      console.error('Related quizzes fetch error:', e)
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