"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import FlashcardResultHandler from "../../components/FlashcardResultHandler"
import FlashCardResults from "../../components/FlashCardQuizResults"

export default function FlashCardResultsPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  const resolvedParams = params instanceof Promise ? use(params) : params
  const slug = resolvedParams.slug
  const router = useRouter()

  if (!slug) {
    return (
      <div className="container max-w-4xl py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Error</h2>
            <p className="text-muted-foreground mb-6">
              Flashcard slug is missing. Please check the URL.
            </p>
            <Button onClick={() => router.push("/dashboard/quizzes")}>
              Back to Quizzes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10">
      <FlashcardResultHandler slug={slug}>
        {({ result }) => (
          <FlashCardResults
            slug={slug}
            title={result?.title}
            score={result?.percentage ?? result?.score ?? 0}
            totalQuestions={result?.totalQuestions ?? 0}
            correctAnswers={result?.correctAnswers ?? 0}
            totalTime={result?.totalTime ?? 0}
            onReview={result?.reviewCards ? () => 
              router.push(`/dashboard/flashcard/${slug}`) : undefined}
          />
        )}
      </FlashcardResultHandler>
    </div>
  )
}

