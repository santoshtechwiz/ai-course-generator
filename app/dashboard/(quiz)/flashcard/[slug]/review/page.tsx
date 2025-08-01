"use client"

import { use, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GlobalLoader, useLoader } from "@/components/ui/loader"
import QuizPlayLayout from "../../../components/layouts/QuizPlayLayout"

interface FlashCardReviewPageProps {
  params: Promise<{ slug?: string }>
}

export default function FlashCardReviewPage({ params }: FlashCardReviewPageProps) {
  const { slug } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const cardsParam = searchParams?.get("cards")
  const reviewType = searchParams?.get("type")
  const [isRedirecting, setIsRedirecting] = useState(true)

  useEffect(() => {
    // Automatically redirect to the main flashcard page with review parameters
    if (slug && isRedirecting) {
      let url = `/dashboard/flashcard/${slug}?review=true`
      
      // Add selected card IDs if available
      if (cardsParam) {
        url += `&cards=${cardsParam}`
      }
      
      // Add review type if specified (stillLearning or incorrect)
      if (reviewType) {
        url += `&type=${reviewType}`
      }
      
      router.replace(url)
    }
  }, [slug, cardsParam, reviewType, router, isRedirecting])

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

  if (!cardsParam) {
    return (
      <QuizPlayLayout>
        <div className="container max-w-4xl py-6">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold mb-4">No Cards Selected</h2>
              <p className="text-muted-foreground mb-6">
                No cards were selected for review. Please go back to the results page and select cards to review.
              </p>
              <Button onClick={() => router.push(`/dashboard/flashcard/${slug}/results`)}>
                Back to Results
              </Button>
            </CardContent>
          </Card>
        </div>
      </QuizPlayLayout>
    )
  }

  // Show loading state while redirecting
  return (
    <QuizPlayLayout>
      <div className="container max-w-4xl py-6 flex items-center justify-center min-h-[300px]">
        <GlobalLoader size="sm" />
        <span className="ml-2 text-muted-foreground">Loading review...</span>
      </div>
    </QuizPlayLayout>
  )
}
