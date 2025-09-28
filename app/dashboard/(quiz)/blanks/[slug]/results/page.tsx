"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import QuizResultHandler from "../../../components/QuizResultHandler"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import UnifiedQuizResult from "../../../components/UnifiedQuizResult"

interface ResultsPageProps {
  params: Promise<{ slug: string }> | { slug: string }
}

export default function BlanksResultsPage({ params }: ResultsPageProps) {
  const router = useRouter()
  const slug = params instanceof Promise ? use(params).slug : params.slug

  const handleRetakeQuiz = () => {
    // Use replace instead of push to avoid navigation loops
    router.replace(`/dashboard/blanks/${slug}`)
  }

  // If slug is missing, show error
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
    <div className="container max-w-4xl py-10">
      <QuizResultHandler slug={slug} quizType="blanks">
        {({ result }) => <UnifiedQuizResult result={result} slug={slug} quizType="blanks" onRetake={handleRetakeQuiz} />}
      </QuizResultHandler>
    </div>
  )
}
