"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useAppSelector } from "@/store"
import { useQuiz } from "@/hooks/useQuizState"
import CodeQuizResult from "../../components/CodeQuizResult"
import NonAuthenticatedUserSignInPrompt from "../../../components/NonAuthenticatedUserSignInPrompt"
import { ErrorDisplay, LoadingDisplay } from "../../../components/QuizStateDisplay"
import type { CodeQuizResultData } from "@/app/types/code-quiz-types"

export default function CodeQuizResultsPage() {
  const router = useRouter()
  const { slug } = useParams() as { slug: string }

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resultData, setResultData] = useState<CodeQuizResultData | null>(null)

  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated" && !!session?.user

  const quizState = useAppSelector((state) => state.quiz)
  const { resultsData, isCompleted } = quizState

  const { getResultsData, requireAuthentication } = useQuiz()

  // Handle sign-in redirect
  useEffect(() => {
    if (status === "unauthenticated") {
      requireAuthentication(`/dashboard/code/${slug}/results`)
    }
  }, [status, requireAuthentication, slug])

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }

    try {
      const result = getResultsData()

      if (result) {
        setResultData(result)
        setError(null)
      } else if (isCompleted && resultsData) {
        setResultData(resultsData)
        setError(null)
      } else if (!isCompleted) {
        router.replace(`/dashboard/code/${slug}`)
        return
      } else {
        setError("Could not load quiz results.")
      }
    } catch (err) {
      setError("An unexpected error occurred while loading results.")
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, getResultsData, resultsData, isCompleted, slug, router])

  const handleRetry = () => {
    setError(null)
    setIsLoading(true)
    window.location.reload()
  }

  const handleReturn = () => {
    router.push(`/dashboard/code/${slug}`)
  }

  // === UI STATES ===
  if (status === "loading" || isLoading) {
    return <LoadingDisplay message="Loading your quiz results..." />
  }

  if (!isAuthenticated) {
    return (
      <NonAuthenticatedUserSignInPrompt
        onSignIn={() => requireAuthentication(`/dashboard/code/${slug}/results`)}
        quizType="code quiz results"
        showSaveMessage
        error={error}
      />
    )
  }

  if (error || !resultData) {
    return (
      <ErrorDisplay
        error={error || "Could not load quiz results. Please try again."}
        onRetry={handleRetry}
        onReturn={handleReturn}
      />
    )
  }

  return <CodeQuizResult result={resultData} />
}
