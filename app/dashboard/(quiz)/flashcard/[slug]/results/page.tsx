"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import QuizPlayLayout from "../../../components/layouts/QuizPlayLayout"
import FlashcardResultHandler from "../../components/FlashcardResultHandler"

interface FlashCardPageProps {
  params: Promise<{ slug?: string }>
}

export default function FlashCardPage({ params }: FlashCardPageProps) {
  const { slug } = use(params)
  const router = useRouter()

  if (!slug) {
    return (
      <QuizPlayLayout>
        <div className="container max-w-4xl py-6">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold mb-4">Error</h2>
              <p className="text-muted-foreground mb-6">Quiz slug is missing. Please check the URL.</p>
              <Button onClick={() => router.push("/dashboard/quizzes")}>Back to Quizzes</Button>
            </CardContent>
          </Card>
        </div>
      </QuizPlayLayout>
    )
  }
  return (
    <QuizPlayLayout>
      <div className="container max-w-4xl py-6">        
        <FlashcardResultHandler
        slug={slug}
        title="Flashcard Results"
        onRestart={() => router.push(`/dashboard/flashcard/${slug}?reset=true&t=${Date.now()}`)}
        onReview={(cards) => router.push(`/dashboard/flashcard/${slug}?review=true&cards=${cards.join(",")}`)}
        onReviewStillLearning={(cards) => router.push(`/dashboard/flashcard/${slug}?review=true&cards=${cards.join(",")}&type=stillLearning`)}
      />
      </div>
    </QuizPlayLayout>
  )
}
