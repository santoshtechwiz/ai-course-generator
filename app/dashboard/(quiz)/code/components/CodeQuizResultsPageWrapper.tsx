"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuiz } from "@/hooks/useQuizState"
import CodeQuizResultsPage from "./CodeQuizResultsPage"
import { LoadingDisplay, ErrorDisplay } from "../../components/QuizStateDisplay"
import { useAppSelector } from "@/store"

interface CodeQuizResultsPageWrapperProps {
  slug: string
  userId: string
  quizId: string
}

export default function CodeQuizResultsPageWrapper({ slug, userId, quizId }: CodeQuizResultsPageWrapperProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get results data from the store
  const resultsData = useAppSelector((state) => state.quiz.resultsData)
  const { getResultsData } = useQuiz()

  useEffect(() => {
    // Check if we have results data
    if (!resultsData) {
      setError("No quiz results found. Please complete the quiz first.")
    }

    setIsLoading(false)
  }, [resultsData])

  const handleReturn = () => {
    router.push("/dashboard/quizzes")
  }

  const handleRestart = () => {
    router.push(`/dashboard/code/${slug}?reset=true`)
  }

  if (isLoading) {
    return <LoadingDisplay />
  }

  if (error || !resultsData) {
    return (
      <ErrorDisplay error={error || "No quiz results found. Please complete the quiz first."} onReturn={handleReturn} />
    )
  }

  return <CodeQuizResultsPage result={resultsData} onRestart={handleRestart} onReturn={handleReturn} />
}
