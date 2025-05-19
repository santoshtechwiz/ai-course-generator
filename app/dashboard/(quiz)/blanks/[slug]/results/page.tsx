"use client"

import { use } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/store"
import BlankQuizResults from "../../components/BlankQuizResults"

export default function BlanksResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { slug } = resolvedParams
  
  const quizState = useAppSelector((state) => state.textQuiz)

  // If no quiz state or not completed, redirect back to quiz
  useEffect(() => {
    if (!quizState.quizData || !quizState.isCompleted) {
      router.replace(`/dashboard/blanks/${slug}`)
    }
  }, [quizState, router, slug])

  // Show loading while checking state
  if (!quizState.quizData || !quizState.isCompleted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <div className="h-8 w-8 mb-4 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    )
  }

  // Format result data for the results component
  const result = {
    quizId: quizState.quizData.id,
    slug: slug,
    score: quizState.score,
    totalQuestions: quizState.quizData.questions.length,
    correctAnswers: quizState.answers.filter(a => a.isCorrect).length,
    totalTimeSpent: quizState.answers.reduce((total, a) => total + (a.timeSpent || 0), 0),
    completedAt: new Date().toISOString(),
    answers: quizState.answers
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <BlankQuizResults result={result} />
    </div>
  )
}
