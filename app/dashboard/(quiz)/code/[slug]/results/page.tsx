"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { useSession } from "next-auth/react"
import type { AppDispatch } from "@/store"
import {
  selectQuizResults,
  selectQuizStatus,
  selectOrGenerateQuizResults,
  selectQuizTitle,
  selectAnswers,
  selectQuestions,
  resetQuiz,
} from "@/store/slices/quizSlice"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QuizLoadingSteps } from "../../../components/QuizLoadingSteps"
import QuizResult from "../../../components/QuizResult"

interface ResultsPageProps {
  params: { slug: string }
}

export default function CodeResultsPage({ params }: ResultsPageProps) {
  const slug = params.slug
  const searchParams = useSearchParams()
  const fromAuth = searchParams.get("fromAuth") === "true"

  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { status: authStatus } = useSession()

  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const generatedResults = useSelector(selectOrGenerateQuizResults)
  const quizTitle = useSelector(selectQuizTitle)
  const answers = useSelector(selectAnswers)
  const questions = useSelector(selectQuestions)

  const resultData = quizResults || generatedResults

  useEffect(() => {
    if (authStatus === "authenticated" && fromAuth) {
      dispatch(resetQuiz())
    }
  }, [authStatus, fromAuth, dispatch])

  useEffect(() => {
    if (authStatus !== "loading" && quizStatus !== "loading") {
      const hasResults = resultData !== null
      const hasAnswers = Object.keys(answers || {}).length > 0

      if (!hasResults && !hasAnswers) {
        router.push(`/dashboard/code/${slug}`)
      }
    }
  }, [authStatus, quizStatus, resultData, router, slug, answers])

  const handleRetake = () => {
    dispatch(resetQuiz())
    router.push(`/dashboard/code/${slug}?reset=true`)
  }

  if (authStatus === "loading" || quizStatus === "loading") {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Checking authentication", status: authStatus === "loading" ? "loading" : "completed" },
          { label: "Loading quiz results", status: quizStatus === "loading" ? "loading" : "completed" },
        ]}
      />
    )
  }

  if (!resultData) {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold mb-2">No Results Available</h2>
            <p className="text-muted-foreground mb-6">Taking you to the quiz page...</p>
            <Button onClick={() => router.push(`/dashboard/code/${slug}`)}>Take Quiz Now</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <QuizResult result={resultData} quizType={"code"} />
          <Button onClick={handleRetake} className="mt-4">
            Retake Quiz
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
