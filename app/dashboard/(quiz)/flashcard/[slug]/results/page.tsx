"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import QuizPlayLayout from "../../../components/layouts/QuizPlayLayout"
import { getQuizSlug } from "../../../components/utils"
import FlashcardResultHandler from "../../components/FlashcardResultHandler"

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
      <FlashcardResultHandler slug={slug} />
    </QuizPlayLayout>
  )
}

