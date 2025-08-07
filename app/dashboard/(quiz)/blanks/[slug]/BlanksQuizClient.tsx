"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import BlanksQuizWrapper from "../components/BlanksQuizWrapper"
import QuizPlayLayout from "../../components/layouts/QuizPlayLayout"
import { QuizGlobalLoader } from "../../components/QuizGlobalLoader"
import { useSelector } from "react-redux"

interface BlanksQuizClientProps {
  params: Promise<{ slug: string }>
}

export default function BlanksQuizClient({ params }: BlanksQuizClientProps) {
  // Properly unwrap the params Promise once at the top level
  const { slug } = use(params);
  const router = useRouter();

  // Get quiz state from Redux for layout purposes
  const quizData = useSelector((state: any) => state.quiz);

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

  return (
    <>
      <QuizGlobalLoader quizType="Fill in the Blanks Quiz" />
      <QuizPlayLayout
        quizSlug={slug}
        quizType="blanks"
        quizId={slug}
        isPublic={true}
        isFavorite={false}
        quizData={quizData || null}
      >
        <BlanksQuizWrapper slug={slug} title="Fill in the Blanks Quiz" />
      </QuizPlayLayout>
    </>
  )
}
