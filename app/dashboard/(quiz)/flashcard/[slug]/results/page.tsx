"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import FlashcardResultHandler from "../../components/FlashcardResultHandler"
import { QuizResultInterface } from "@/components/dashboard/QuizResultInterface"

interface FlashCardPageProps {
  params: Promise<{ slug?: string }>
}

export default function FlashCardPage({ params }: FlashCardPageProps) {
  const { slug } = use(params)
  const router = useRouter()

  if (!slug) {
    return (
      <QuizResultLayout title="Flashcard Results" quizType="flashcard">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Error</h2>
            <p className="text-muted-foreground mb-6">Quiz slug is missing. Please check the URL.</p>
            <Button onClick={() => router.push("/dashboard/quizzes")}>
              Back to Quizzes
            </Button>
          </CardContent>
        </Card>
      </QuizResultLayout>
    )
  }

  return (
    <QuizResultInterface title="Flashcard Results" quizType="flashcard" slug={slug}>
      <FlashcardResultHandler
        slug={slug}
        title="Flashcard Results"
        onRestart={() => router.push(`/dashboard/flashcard/${slug}?reset=true`)}
        onReview={(cards) => router.push(`/dashboard/flashcard/${slug}?review=true&cards=${cards.join(",")}`)}
        onReviewStillLearning={(cards) => router.push(`/dashboard/flashcard/${slug}?review=true&cards=${cards.join(",")}&type=stillLearning`)}
      />
    </QuizResultInterface>
  )
}
