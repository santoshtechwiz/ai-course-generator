"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import QuizPlayLayout from "../../components/layouts/QuizPlayLayout"
import FlashCardsPageClient from "../components/FlashCardsPageClient"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { getQuizSlug } from "../../components/utils"

export default function FlashCardPage({
  params,
}: {
  params: Promise<{ slug: string }> 
}) {
  const slug = getQuizSlug(params);
  const router = useRouter()



  if (!slug) {
    return (
      <div className="container max-w-4xl py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Error</h2>
            <p className="text-muted-foreground mb-6">Quiz slug is missing. Please check the URL.</p>
            <Button onClick={() => router.push("/dashboard/quizzes")}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <QuizPlayLayout>
      <FlashCardsPageClient slug={slug} userId={""} />
    </QuizPlayLayout>
  )
}
