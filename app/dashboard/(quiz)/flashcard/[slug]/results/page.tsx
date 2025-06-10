"use client"

import { use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import FlashCardResults from "../components/FlashCardQuizResults"
import { QuizLoader } from "@/components/ui/quiz-loader"
import GenericQuizResultHandler from "../../components/QuizResultHandler"

export default function FlashCardResults({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  const resolvedParams = params instanceof Promise ? use(params) : params
  const slug = resolvedParams.slug
  const { status } = useSession()
  const router = useRouter()

  if (status === "loading") {
    return <QuizLoader message="Loading flashcard results" showTiming />
  }

  if (!slug) {
    return (
      <div className="container max-w-4xl py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Error</h2>
            <p className="text-muted-foreground mb-6">Flashcard slug is missing. Please check the URL.</p>
            <Button onClick={() => router.push("/dashboard/quizzes")}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <GenericQuizResultHandler slug={slug} quizType="flashcard">
      {({ result }) => <FlashCardResults {...result} slug={slug} />}
    </GenericQuizResultHandler>
  )
}
