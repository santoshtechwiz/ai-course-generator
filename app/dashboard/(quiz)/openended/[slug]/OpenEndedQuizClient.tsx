"use client"

import { use, Suspense, lazy } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSelector } from "react-redux"
import { AppLoader } from "@/components/ui/loader"

// ⚡ PERFORMANCE: Lazy load heavy components with framer-motion
const OpenEndedQuizWrapper = lazy(() => import("../components/OpenEndedQuizWrapper"))
const QuizPlayInterface = lazy(() => import("@/components/dashboard/QuizPlayInterface").then(module => ({ default: module.QuizPlayInterface })))

interface OpenEndedQuizClientProps {
  params: Promise<{ slug: string }>
}

export default function OpenEndedQuizClient({ params }: OpenEndedQuizClientProps) {
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
    <Suspense fallback={<div className="min-h-[200px] flex items-center justify-center"><div className="animate-spin h-6 w-6 border-2 border-primary border-r-transparent rounded-full" /></div>}>
      <QuizPlayInterface
        quizSlug={slug}
        quizType="openended"
        quizData={quizData || null}
        quizId={slug}
        isPublic={true}
        isFavorite={false}
      >
        <OpenEndedQuizWrapper slug={slug} />
      </QuizPlayInterface>
    </Suspense>
  );
}
