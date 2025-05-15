"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useQuiz } from "@/hooks/useQuizState"
import type { CodeQuizResultData } from "@/app/types/code-quiz-types"

interface UseCodeQuizResultsProps {
  slug: string
}

interface UseCodeQuizResultsReturn {
  isLoading: boolean
  isLoadingResults: boolean
  error: string | null
  resultData: CodeQuizResultData | null
  isAuthenticated: boolean
  handleSignIn: () => void
  handleRetry: () => void
  handleReturn: () => void
}

/**
 * Custom hook to manage code quiz results state and logic
 */
export function useCodeQuizResults({ slug }: UseCodeQuizResultsProps): UseCodeQuizResultsReturn {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated" && !!session?.user

  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingResults, setIsLoadingResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultData, setResultData] = useState<CodeQuizResultData | null>(null)

  const { getResults, requireAuthentication } = useQuiz()

  // Function to fetch results from API
  const fetchResultsFromApi = useCallback(async () => {
    try {
      setIsLoadingResults(true)
      const data = await getResults(slug)
      if (data) {
        setResultData(data)
        setError(null)
      } else {
        setError("Could not load quiz results.")
      }
    } catch (err) {
      console.error("Error fetching results:", err)
      setError("Failed to load quiz results. Please try again.")
    } finally {
      setIsLoadingResults(false)
    }
  }, [slug, getResults])

  // Load results when authenticated
  const loadResults = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      setIsLoadingResults(true)

      // Try to get results from Redux store first
      const { results, isCompleted } = await import("@/store").then((module) => module.store.getState().quiz)

      if (isCompleted && results) {
        // Use results from Redux store
        setResultData(results)
        setError(null)
      } else {
        // Fallback to API call
        await fetchResultsFromApi()
      }
    } catch (err) {
      console.error("Error loading results:", err)
      setError("An unexpected error occurred while loading results.")
    } finally {
      setIsLoadingResults(false)
      setIsLoading(false)
    }
  }, [isAuthenticated, fetchResultsFromApi])

  // Handle authentication state changes
  useEffect(() => {
    if (status === "loading") return

    if (isAuthenticated) {
      loadResults()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated, status, loadResults])

  // Handle sign-in action
  const handleSignIn = useCallback(() => {
    requireAuthentication(`/dashboard/code/${slug}/results`)
  }, [requireAuthentication, slug])

  const handleRetry = useCallback(() => {
    setError(null)
    setIsLoading(true)
    loadResults()
  }, [loadResults])

  const handleReturn = useCallback(() => {
    router.push(`/dashboard/code/${slug}`)
  }, [router, slug])

  return {
    isLoading,
    isLoadingResults,
    error,
    resultData,
    isAuthenticated,
    handleSignIn,
    handleRetry,
    handleReturn,
  }
}
