"use client"

import { use, Suspense, lazy } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageLoader } from "@/components/loaders"
import { LOADER_MESSAGES } from "@/constants/loader-messages"
import { useSelector } from "react-redux"

// ⚡ PERFORMANCE: Lazy load heavy components with framer-motion
const McqQuizWrapper = lazy(() => import("../components/McqQuizWrapper"))
const QuizPlayLayout = lazy(() => import("../../components/layouts/QuizPlayLayout"))

interface McqQuizClientProps {
  params: Promise<{ slug: string }>
}

export default function McqQuizClient({ params }: McqQuizClientProps) {
  // Properly unwrap the params Promise once at the top level
  const { slug } = use(params);
  const router = useRouter();

  // Get quiz state from Redux for layout purposes
  const quizData = useSelector((state: any) => state.quiz);

  // Let the wrapper component handle data fetching to avoid duplicates

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
    <Suspense fallback={<PageLoader message={LOADER_MESSAGES.LOADING_MCQ} />}>
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
    </Suspense>
  )
}
