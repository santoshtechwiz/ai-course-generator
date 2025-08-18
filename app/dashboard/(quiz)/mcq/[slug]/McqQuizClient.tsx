"use client"

import { use } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import McqQuizWrapper from "../components/McqQuizWrapper"

import { useSelector } from "react-redux"
import QuizPlayLayout from "../../components/layouts/QuizPlayLayout"
import { NoResults } from "@/components/ui/no-results"
import { RelatedQuizSuggestions } from "../../components/RelatedQuizSuggestions"


interface McqQuizClientProps {
  params: Promise<{ slug: string }>
}

export default function McqQuizClient({ params }: McqQuizClientProps) {
  // Properly unwrap the params Promise once at the top level
  const { slug } = use(params);
  const router = useRouter();

  // Get quiz state from Redux for layout purposes
  const quizData = useSelector((state: any) => state.quiz);
  const status = useSelector((state: any) => state.quiz.status)
  const error = useSelector((state: any) => state.quiz.error)
  const hasQuestions = useSelector((state: any) => (state.quiz?.questions || []).length > 0)

  // Let the wrapper component handle data fetching to avoid duplicates

  if (!slug) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-background">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-3">Error</h2>
            <p className="text-muted-foreground mb-4">Quiz slug is missing. Please check the URL.</p>
            <Button size="lg" onClick={() => router.push("/dashboard/quizzes")}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Friendly not-found/private handling
  if (status === 'not-found' && !hasQuestions) {
    const isPrivate = error && /private|visibility|unauthorized/i.test(error)
    return (
      <div className="mx-auto w-full max-w-screen-md px-4 py-10">
        <NoResults
          variant="error"
          title={isPrivate ? "This quiz is private" : "Quiz not found"}
          description={isPrivate
            ? "The quiz exists but is not publicly accessible. Ask the owner to share it or explore public quizzes."
            : "We couldn’t find this quiz. It may have been removed or the link is incorrect. Explore other quizzes below."}
          action={{
            label: "Explore Quizzes",
            onClick: () => router.push("/dashboard/quizzes"),
            variant: "default"
          }}
          secondaryAction={{
            label: "Go Home",
            onClick: () => router.push("/dashboard"),
            variant: "outline"
          }}
          illustrationPlacement="left"
        />
        <RelatedQuizSuggestions quizType="mcq" excludeSlug={slug} difficulty={quizData?.difficulty} tags={quizData?.tags} />
      </div>
    )
  }

  return (
    <QuizPlayLayout
      quizSlug={slug}
      quizType="mcq"
      quizId={slug}
      isPublic={true}
      isFavorite={false}
      quizData={quizData || null}
    >
      <McqQuizWrapper slug={slug} />
    </QuizPlayLayout>
  )
}
