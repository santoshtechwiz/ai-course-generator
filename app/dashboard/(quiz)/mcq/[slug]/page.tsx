"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { useAuth } from "@/hooks/useAuth"
import { AppDispatch } from "@/store"
import { InitializingDisplay, ErrorDisplay } from "../../components/QuizStateDisplay"
import McqQuizWrapper from "../components/McqQuizWrapper"

export default function McqQuizPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  const router = useRouter()
  const { userId, status } = useAuth()
  const dispatch = useDispatch<AppDispatch>()
  const [quizData, setQuizData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Extract slug in a way that works in tests and in real usage
  const slug =
    params instanceof Promise
      ? use(params).slug // Real usage with Next.js
      : (params as { slug: string }).slug // Test usage

  // Load quiz data
  useEffect(() => {
    const loadQuizData = async () => {
      try {
        // Fetch quiz data from API
        const response = await fetch(`/api/quizzes/mcq/${slug}`)
        
        if (!response.ok) {
          throw new Error('Quiz not found')
        }
        
        const data = await response.json()
        setQuizData(data)
      } catch (error: any) {
        console.error("Error loading quiz:", error)
        setError(error.message || 'Failed to load quiz')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (slug) {
      loadQuizData()
    }
  }, [slug])

  // If still loading or waiting for auth status, show loading
  if (isLoading || status === "loading") {
    return <InitializingDisplay />
  }

  // Show error if any
  if (error) {
    return (
      <ErrorDisplay 
        error={error}
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard")}
      />
    )
  }

  // No quiz data
  if (!quizData) {
    return (
      <ErrorDisplay 
        error="Quiz not found"
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard")}
      />
    )
  }

  return (
    <div className="container max-w-4xl py-6">
      <McqQuizWrapper
        slug={slug}
        quizId={quizData.id}
        userId={userId}
        quizData={quizData}
      />
    </div>
  )
}
