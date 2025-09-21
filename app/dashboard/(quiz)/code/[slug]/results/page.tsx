"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ImprovedQuizResult from "../../../components/ImprovedQuizResult"
import GenericQuizResultHandler from "../../../components/QuizResultHandler"
import QuizResultLayout from "../../../components/layouts/QuizResultLayout"

interface ResultsPageProps {
  params: Promise<{ slug: string }>
}

export default function CodeResultsPage({ params }: ResultsPageProps) {
  const router = useRouter()
  
  // Properly unwrap the params Promise once at the top level
  const { slug: slugString } = use(params);

  // Handle retake quiz
  const handleRetakeQuiz = () => {
    router.replace(`/dashboard/code/${slugString}`)
  }

  // If slug is missing, show error
  if (!slugString) {
    return (
      <QuizResultLayout title="Results" quizType="code">
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
    <QuizResultLayout title="Results" quizType="code" slug={slugString}>
      <GenericQuizResultHandler
        slug={slugString}
        quizType="code"
      >
        {({ result }) => (
          <ImprovedQuizResult
            result={result}
            slug={slugString}
            quizType="code"
            onRetake={handleRetakeQuiz}
          />
        )}
      </GenericQuizResultHandler>
    </QuizResultLayout>
  )
}

