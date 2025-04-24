"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

interface QuizResultDisplayProps {
  quizId: string
  title: string
  score: number
  totalQuestions: number
  totalTime: number
  correctAnswers: number
  type: string
  slug: string
  answers: any[]
}

export function QuizResultDisplay({
  quizId,
  title,
  score,
  totalQuestions,
  totalTime,
  correctAnswers,
  type,
  slug,
  answers,
}: QuizResultDisplayProps) {
  const { data: session } = useSession()

  if (!session) {
    return (
      <div>
        <p>Please sign in to view your results.</p>
        <Button onClick={() => signIn("credentials", { callbackUrl: `/dashboard/${type}/${slug}/result` })}>
          Sign In
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h1>{title}</h1>
      <p>Score: {score}%</p>
      <p>Correct Answers: {correctAnswers} / {totalQuestions}</p>
      <p>Total Time: {totalTime} seconds</p>
      {/* Render answers or other details */}
    </div>
  )
}
