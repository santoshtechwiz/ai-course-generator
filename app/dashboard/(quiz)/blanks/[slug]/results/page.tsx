"use client"

import { use, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import {
  fetchQuizResults,
  fetchQuiz,
  setQuizResults,
  setQuizType,
  selectQuizResults,
  selectQuestions,
  selectAnswers,
  selectQuizTitle,
} from "@/store/slices/quizSlice"
import { useSession } from "next-auth/react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/hooks/spinner"
import { NonAuthenticatedUserSignInPrompt } from "../../../components/NonAuthenticatedUserSignInPrompt"
import { ReduxStateDebug } from "../../../components/ReduxStateDebug"
import { BlankQuizResults } from "../../components/BlankQuizResults"

interface ResultsPageProps {
  params: Promise<{ slug: string }> | { slug: string }
}

export default function BlanksResultsPage({ params }: ResultsPageProps) {
  const slug = params instanceof Promise ? use(params).slug : params.slug
  const router = useRouter()
  const dispatch = useDispatch()

  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"

  // Redux selectors
  const results = useSelector(selectQuizResults)
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const title = useSelector(selectQuizTitle)
  const quizType = useSelector((state: any) => state.quiz.quizType)

  const [isFetching, setIsFetching] = useState(false)

  useEffect(() => {
    if (isAuthenticated && !quizType && slug) {
      dispatch(setQuizType("blanks"))
      dispatch(fetchQuiz({ id: slug, type: "blanks" }))
    }
  }, [isAuthenticated, quizType, slug, dispatch])

  useEffect(() => {
    if (isAuthenticated && slug && !results && quizType) {
      setIsFetching(true)
      dispatch(fetchQuizResults(slug))
        .then((res) => {
          if ((res as any)?.payload) {
            dispatch(setQuizResults((res as any).payload))
          }
        })
        .finally(() => setIsFetching(false))
    }
  }, [isAuthenticated, slug, results, quizType, dispatch])

  const handleSignIn = () => {
    router.push(`/api/auth/signin?callbackUrl=/dashboard/blanks/${slug}/results`)
  }

  const handleRetake = () => {
    //clear previous results
    dispatch(setQuizResults(null));
    router.push(`/dashboard/blanks/${slug}?reset=true`)
  }

  const quizResult = useMemo(() => {
    if (!results || !questions.length) return null

    return {
      quizId: slug,
      slug,
      title: title || "Fill in the Blanks Quiz",
      score: results?.score ?? 0,
      maxScore: questions.length,
      totalQuestions: questions.length,
      correctAnswers: results?.score ?? 0,
      percentage: results?.percentage ?? 0,
      completedAt: results?.submittedAt
        ? new Date(results.submittedAt).toISOString()
        : new Date().toISOString(),
      questionResults: results?.questionResults ?? answers,
    }
  }, [results, questions, title, slug, answers])

  // Auth loading
  if (status === "loading") {
    return (
      <PageLoader message="Checking authentication status..." />
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container max-w-md py-10">
        <NonAuthenticatedUserSignInPrompt
          onSignIn={handleSignIn}
          title="Sign In to View Results"
          message="Please sign in to view your quiz results and track your progress."
        />
      </div>
    )
  }

  // Results loading
  if (isFetching || !results) {
    return <PageLoader message="Loading your results..." />
  }

  // No results available
  if (!quizResult) {
    return (
      <div className="container max-w-2xl py-12 text-center">
        <h1 className="text-3xl font-bold mb-3">No Results Found</h1>
        <p className="text-muted-foreground mb-6">
          We couldn’t find your results for this quiz.
        </p>
        <Button onClick={handleRetake}>Take the Quiz</Button>
      </div>
    )
  }

  return (
    <>
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <BlankQuizResults result={quizResult} onRetake={handleRetake} />
          </CardContent>
        </Card>
      </div>
      <ReduxStateDebug />
    </>
  )
}

function PageLoader({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  )
}
