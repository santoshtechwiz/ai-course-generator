"use client"

import { use, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { useSession, signIn } from "next-auth/react"
import type { AppDispatch } from "@/store"
import {
  selectQuizResults,
  selectQuizStatus,
  selectOrGenerateQuizResults,
  selectAnswers,
  setQuizResults,
  saveAuthRedirectState,
  restoreAuthRedirectState,
  clearAuthState,
} from "@/store/slices/quizSlice"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QuizLoadingSteps } from "@/app/dashboard/(quiz)/components/QuizLoadingSteps"
import McqQuizResult from "../../components/McqQuizResult"
import QuizResult from "../../../components/QuizResult"

interface ResultsPageProps {
  params: { slug: string }
}

export default function McqResultsPage({ params }: ResultsPageProps) {
  const resolvedParams = params instanceof Promise ? use(params) : params
  const slug = resolvedParams.slug
  const searchParams = useSearchParams()
  const fromAuth = searchParams.get("fromAuth") === "true"

  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { status: authStatus } = useSession()

  const quizResults = useSelector(selectQuizResults)
  const generatedResults = useSelector(selectOrGenerateQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const answers = useSelector(selectAnswers)

  const [hasRestoredState, setHasRestoredState] = useState(false)

  useEffect(() => {
    if (authStatus === "authenticated" && fromAuth && !hasRestoredState) {
      const restoredState = dispatch(restoreAuthRedirectState())
      if (restoredState?.quizState?.currentState?.results) {
        dispatch(setQuizResults(restoredState.quizState.currentState.results))
      }
      setHasRestoredState(true)
      dispatch(clearAuthState())
    }
  }, [authStatus, fromAuth, hasRestoredState, dispatch])

  useEffect(() => {
    const hasResults = quizResults || generatedResults
    const hasAnswers = Object.keys(answers || {}).length > 0

    if (authStatus !== "loading" && !hasResults && !hasAnswers && !fromAuth) {
      const redirectTimer = setTimeout(() => {
        router.push(`/dashboard/mcq/${slug}`)
      }, 1000)

      return () => clearTimeout(redirectTimer)
    }
  }, [authStatus, quizResults, generatedResults, answers, router, slug, fromAuth])

  const handleRetakeQuiz = () => {
    router.push(`/dashboard/mcq/${slug}?reset=true`)
  }

  const handleSignIn = async () => {
    const resultsToSave = quizResults || generatedResults

    if (resultsToSave) {
      dispatch(
        saveAuthRedirectState(
          {
            returnPath: `/dashboard/mcq/${slug}/results?fromAuth=true`,
            quizState: {
              slug,
              quizData: { title: resultsToSave.title, questions: resultsToSave.questions, type: "mcq" },
              currentState: {
                answers,
                showResults: true,
                results: resultsToSave,
              },
            },
          },
          `/dashboard/mcq/${slug}/results?fromAuth=true`
        ),
      )
    }

    await signIn(undefined, { callbackUrl: `/dashboard/mcq/${slug}/results?fromAuth=true` })
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

  const resultData = quizResults || generatedResults

  if (!resultData && Object.keys(answers || {}).length === 0) {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold mb-2">No Results Available</h2>
            <p className="text-muted-foreground mb-6">You need to complete the quiz to see results.</p>
            <Button onClick={handleRetakeQuiz}>Take Quiz Now</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (authStatus !== "authenticated") {
    if (resultData) {
      return (
        <div className="container max-w-4xl py-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <McqQuizResult result={resultData} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-primary/90 text-white px-6 py-3 rounded-lg shadow-lg">
                  Sign in to view detailed results
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="container max-w-md py-10">
        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold mb-2">Sign In to View Results</h2>
            <p className="text-muted-foreground mb-6">Please sign in to view your detailed quiz results.</p>
            <Button onClick={handleSignIn}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <QuizResult result={resultData} quizType={"mcq"} />
          
        </CardContent>
      </Card>
    </div>
  )
}
