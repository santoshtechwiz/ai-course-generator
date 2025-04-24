"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { quizStorageService } from "@/lib/quiz-storage-service"
import { QuizResultDisplay } from "../../components/QuizResultDisplay"

interface McqQuizResultProps {
  quizId: string
  slug: string
  title: string
  totalQuestions: number
  startTime: number
}

export default function McqQuizResult({
  quizId,
  slug,
  title,
  totalQuestions,
  startTime,
}: McqQuizResultProps) {
  const { data: session, status } = useSession()
  const [quizResult, setQuizResult] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchResult() {
      if (status === "authenticated") {
        // Fetch result from server
        const response = await fetch(`/api/quiz/${slug}`)
        if (response.ok) {
          const result = await response.json()
          setQuizResult(result)
        }
      } else if (status === "unauthenticated") {
        // Retrieve result from localStorage
        const pendingResult = quizStorageService.getPendingQuizResult()
        if (pendingResult?.quizId === quizId) {
          setQuizResult(pendingResult)
        }
      }
      setIsLoading(false)
    }

    fetchResult()
  }, [status, slug, quizId])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!quizResult) {
    return <div>Error loading quiz results.</div>
  }

  return (
    <QuizResultDisplay
      quizId={quizId}
      title={title}
      score={quizResult.score}
      totalQuestions={totalQuestions}
      totalTime={quizResult.totalTime}
      correctAnswers={quizResult.correctAnswers}
      type="mcq"
      slug={slug}
      answers={quizResult.answers}
    />
  )
}
