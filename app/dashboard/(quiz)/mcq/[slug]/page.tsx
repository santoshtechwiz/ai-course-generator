"use client"

import { use, useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { InitializingDisplay, ErrorDisplay } from "../../components/QuizStateDisplay"
import McqQuizWrapper from "../components/McqQuizWrapper"

interface QuizData {
  id: string
  title: string
  description?: string
  questions: Array<{
    id: string
    text: string
    type: "mcq"
    options: Array<{ id: string; text: string }>
    correctOptionId: string
  }>
}

export default function McqQuizPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  const { userId, status } = useAuth()
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Extract slug for both test and production environments
  const slug = params instanceof Promise ? use(params).slug : params.slug

  // Load quiz data for initial render (will be passed to Redux)
  useEffect(() => {
    if (!slug) return

    const loadQuizData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/quizzes/mcq/${slug}`)

        if (!response.ok) {
          throw new Error(response.status === 404 ? "Quiz not found" : `Failed to load quiz (${response.status})`)
        }

        const data = await response.json()

        console.log("Fetched quiz data:", data);
        // Transform to match the slice's Question type
        const transformedData: QuizData = {
          id: data.id,
          title: data.title || "MCQ Quiz",
          description: data.description || "",
          questions: data.questions.map((q: any, index: number) => ({
            id: q.id || `q-${index}`,
            text: q.question || q.text || "",
            type: "mcq" as const,
            options: Array.isArray(q.options)
              ? q.options.map((opt: any, optIndex: number) => ({
                  id: opt.id || `opt-${optIndex}`,
                  text: typeof opt === "string" ? opt : opt.text || "",
                }))
              : [],
            correctOptionId: q.correctAnswer || q.answer || q.correctOptionId || "",
          })),
        }

        setQuizData(transformedData)
      } catch (err: any) {
        setError(err.message || "Failed to load quiz")
      } finally {
        setIsLoading(false)
      }
    }

    loadQuizData()
  }, [slug])

  // Show loading while fetching data or auth status
  if (isLoading || status === "loading") {
    return <InitializingDisplay />
  }

  // Show error if quiz failed to load
  if (error) {
    return (
      <ErrorDisplay error={error} onRetry={() => window.location.reload()} onReturn={() => window.history.back()} />
    )
  }

  // Show error if no quiz data
  if (!quizData) {
    return (
      <ErrorDisplay
        error="Quiz not found"
        onRetry={() => window.location.reload()}
        onReturn={() => window.history.back()}
      />
    )
  }

  // Render quiz wrapper with properly formatted data
  return (
    <div className="container max-w-4xl py-6">
      <McqQuizWrapper slug={slug} userId={userId} quizData={quizData} />
    </div>
  )
}
