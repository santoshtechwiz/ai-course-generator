"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import QuizResultHandler from "../../../components/QuizResultHandler"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import UnifiedQuizResult from "../../../components/UnifiedQuizResult"
import { QuizResultInterface } from "@/components/dashboard/QuizResultInterface"

interface ResultsPageProps {
  params: Promise<{ slug: string }> 
}

export default function OpenEndedResultsPage({ params }: ResultsPageProps) {
  const router = useRouter()
  // Properly unwrap the params Promise once at the top level
  const { slug } = use(params);

  const handleRetakeQuiz = () => {
    // Use replace instead of push to avoid navigation loops
    router.replace(`/dashboard/openended/${slug}`)
  }

  // If slug is missing, show error
  if (!slug) {
    return (
      <QuizResultInterface title="Results" quizType="openended">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Error</h2>
            <p className="text-muted-foreground mb-6">Quiz slug is missing. Please check the URL.</p>
            <Button onClick={() => router.replace("/dashboard/quizzes")}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </QuizResultInterface>
    )
  }

  return (
    <QuizResultInterface title="Results" quizType="openended" slug={slug}>
      <QuizResultHandler slug={slug} quizType="openended">
        {({ result }) => <UnifiedQuizResult result={result} slug={slug} quizType="openended" onRetake={handleRetakeQuiz} />}
      </QuizResultHandler>
    </QuizResultInterface>
  )
}
