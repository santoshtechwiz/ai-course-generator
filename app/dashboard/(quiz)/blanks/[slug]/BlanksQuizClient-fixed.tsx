"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import BlanksQuizWrapper from "../components/BlanksQuizWrapper"
import QuizPlayLayout from "../../components/layouts/QuizPlayLayout"
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
      <div className="flex flex-col min-h-screen w-full bg-background px-2 sm:px-4 md:px-8 py-8 items-center justify-center">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Error</h2>
            <p className="text-muted-foreground mb-6">Quiz slug is missing. Please check the URL.</p>
            <Button size="lg" className="w-full sm:w-auto" onClick={() => router.push("/dashboard/quizzes")}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-background px-0 sm:px-2 md:px-4">
      <QuizPlayLayout
        quizSlug={slug}
        quizType="blanks"
        quizId={slug}
        isPublic={true}
        isFavorite={false}
        quizData={quizData || null}
      >
        <div className="w-full max-w-5xl mx-auto flex flex-col flex-1">
          <BlanksQuizWrapper slug={slug} title="Fill in the Blanks Quiz" />
        </div>
      </QuizPlayLayout>
    </div>
  )
}
