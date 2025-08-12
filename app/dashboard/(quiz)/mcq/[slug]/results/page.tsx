"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import QuizResultHandler from "../../../components/QuizResultHandler"

import { use } from "react"
import { McqQuizResult } from "../../components/McqQuizResult"
import QuizResultLayout from "../../../components/layouts/QuizResultLayout"

interface ResultsPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function McqResultsPage({ params }: ResultsPageProps) {
  const router = useRouter()
  const { slug } = use(params)

  const handleRetakeQuiz = () => {
    if (slug) {
      router.push(`/dashboard/mcq/${slug}`)
    }
  }

  if (!slug) {
    return (
      <QuizResultLayout title="Results" quizType="mcq">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Error</h2>
            <p className="text-muted-foreground mb-6">Quiz slug is missing. Please check the URL.</p>
            <Button onClick={() => router.replace("/dashboard/quizzes")}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </QuizResultLayout>
    )
  }

  return (
    <QuizResultLayout title="Results" quizType="mcq" slug={slug}>
      <QuizResultHandler
        slug={slug}
        quizType="mcq"
      >
        {({ result }) => (
          result ? (
            <McqQuizResult
              result={result}
              onRetake={handleRetakeQuiz}
            />
          ) : null
        )}
      </QuizResultHandler>
    </QuizResultLayout>
  )
}
