"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import FlashcardResultHandler from "../../components/FlashcardResultHandler"
import FlashCardResults from "../../components/FlashCardQuizResults"
import { BookOpen } from "lucide-react"

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
      <FlashcardResultHandler 
        slug={slug} 
        onRestart={() => {
          // Use window.location for more reliable hard reset
          window.location.href = `/dashboard/flashcard/${slug}?reset=true&t=${Date.now()}`;
        }}
      />
    </div>
  )
}

