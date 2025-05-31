"use client"

import { use, useCallback, useEffect, useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { signIn, useSession } from "next-auth/react"
import type { AppDispatch } from "@/store"
import { Card, CardContent } from "@/components/ui/card"

import {
  selectQuizResults,
  selectQuizStatus,
  selectQuizError,
  selectQuestions,
  selectAnswers,
  selectQuizTitle,
  selectOrGenerateQuizResults,
  resetQuiz,
  setQuizResults
} from "@/store/slices/quizSlice"
import { selectIsAuthenticated } from "@/store/slices/authSlice"
import { QuizLoadingSteps } from "../../../components/QuizLoadingSteps"
import { useSessionService } from "@/hooks/useSessionService"
import QuizResultsOpenEnded from "../../components/QuizResultsOpenEnded"

interface ResultsPageProps {
  params: Promise<{ slug: string }> | { slug: string }
}

export default function OpenEndedResultsPage({ params }: ResultsPageProps) {
  const slug = params instanceof Promise ? use(params).slug : params.slug
  const searchParams = useSearchParams()
  const fromAuth = searchParams.get("fromAuth") === 'true'
  const [redirectAttempted, setRedirectAttempted] = useState(false)
  const [fetchAttempted, setFetchAttempted] = useState(false)
  
  // Important: Use a ref to track initialization state to prevent infinite loops
  const [isInitialized, setIsInitialized] = useState(false)
  const [localResults, setLocalResults] = useState<any>(null)

  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { restoreAuthRedirectState, clearQuizResults } = useSessionService()
  const { status: authStatus } = useSession()

  // Redux selectors - memoize these to prevent unnecessary re-renders
  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const title = useSelector(selectQuizTitle)
  const generatedResults = useSelector(selectOrGenerateQuizResults)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  // Store results in local state when available - but only do this once
  useEffect(() => {
    // Prevent infinite updates by checking initialization state
    if (isInitialized) return;
    
    if (!localResults) {
      if (quizResults) {
        console.log("Setting local results from quiz results:", quizResults);
        setLocalResults(quizResults);
      } else if (generatedResults) {
        console.log("Setting local results from generated results:", generatedResults);
        setLocalResults(generatedResults);
      }
    }
    
    // Mark as initialized to prevent further updates
    setIsInitialized(true);
  }, [quizResults, generatedResults, localResults, isInitialized]);

  // Memoize whether we have valid results to avoid recalculation
  const hasResults = useMemo(() => {
    return !!localResults || !!quizResults || !!generatedResults || Object.keys(answers).length > 0
  }, [localResults, quizResults, generatedResults, answers])

  // Check for auth return after sign-in - include all dependencies
  useEffect(() => {
    // Only run this logic once
    if (authStatus === "authenticated" && fromAuth && !fetchAttempted) {
      setFetchAttempted(true)
      
      // Restore any saved quiz state from auth redirect
      const state = restoreAuthRedirectState()
      console.log("Restored state after auth:", state)
      
      // If we have results in the restored state, use them
      if (state?.quizState?.currentState?.results) {
        const restoredResults = state.quizState.currentState.results
        setLocalResults(restoredResults)
        dispatch(setQuizResults(restoredResults))
      }
      
      // Mark as restored to prevent redirect
      sessionStorage.setItem('quizResultsRestored', 'true')
    }
  }, [authStatus, restoreAuthRedirectState, fromAuth, dispatch, fetchAttempted])

  // Data check and redirect logic - use ref to prevent multiple executions
  useEffect(() => {
    // Skip redirect if we've already attempted or if we have results
    if (redirectAttempted || sessionStorage.getItem('quizResultsRestored') === 'true' || hasResults) {
      sessionStorage.removeItem('quizResultsRestored')
      return
    }
    
    const redirectTimeout = setTimeout(() => {
      if (!hasResults && quizStatus !== "loading") {
        setRedirectAttempted(true)
        console.log("No results found, redirecting to quiz page")
        router.push(`/dashboard/openended/${slug}`)
      }
    }, 1500)
    
    return () => clearTimeout(redirectTimeout)
  }, [hasResults, router, slug, quizStatus, redirectAttempted])

  // Clean up function to reset quiz state when navigating away
  useEffect(() => {
    return () => {
      // Only clear results if explicitly requested
      if (searchParams.get("clear") === 'true') {
        clearQuizResults()
      }
    }
  }, [clearQuizResults, searchParams])

  // Loading states
  if (authStatus === "loading" || quizStatus === "loading") {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Checking authentication", status: authStatus === "loading" ? "loading" : "completed" },
          { label: "Loading quiz data", status: quizStatus === "loading" ? "loading" : "completed" },
        ]}
      />
    )
  }

  // Pass our local results and hasResults flag to the QuizResultsOpenEnded component
  return (
    <div className="container max-w-4xl py-6">
      <QuizResultsOpenEnded 
        slug={slug} 
        initialResults={localResults}
        hasResults={hasResults}
      />
    </div>
  )
}

