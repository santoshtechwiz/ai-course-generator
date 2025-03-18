"use client"


import { QuizPlayer } from "@/components/features/document/QuizPlay"
import { useParams } from "next/navigation"

export default function PlayQuizPage() {
  const params = useParams()
  const quizId = params.quizId as string

  return (
    <div className="container mx-auto py-8">
      <QuizPlayer quizId={quizId} />
    </div>
  )
}

