"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import QuizResult from "../../../components/QuizResult"
import QuizResultHandler from "../../../components/QuizResultHandler"
import { McqQuizResult } from "../../components/McqQuizResult"
import { use } from "react"

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
      <div className="container max-w-4xl py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Error</h2>
            <p className="text-muted-foreground mb-6">Quiz slug is missing. Please check the URL.</p>
            <Button onClick={() => router.replace("/dashboard/quizzes")}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10">      <QuizResultHandler 
        slug={slug} 
        quizType="mcq"
      >
        {({ result }) => (
          result ? (
            // Render the McqQuizResult directly instead of going through QuizResult
            // to avoid potential duplicate rendering
            <McqQuizResult 
              result={result} 
              onRetake={handleRetakeQuiz}
            />
          ) : null
        )}
      </QuizResultHandler>
    </div>
  )
}
