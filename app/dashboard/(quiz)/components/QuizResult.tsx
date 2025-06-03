"use client"

import { useMemo, useCallback } from "react"
import { useSelector } from "react-redux"
import { useSessionService } from "@/hooks/useSessionService"
import {
  selectQuizResults,
  selectQuizStatus,
  selectQuizError,
  selectQuizId,
} from "@/store/slices/quizSlice"
import { selectIsAuthenticated } from "@/store/slices/authSlice"
import { QuizLoadingSteps } from "./QuizLoadingSteps"
import QuizAuthGuard from "@/components/QuizAuthGuard"
import McqQuizResult from "../mcq/components/McqQuizResult"
import CodeQuizResult from "../code/components/CodeQuizResult"
import BlanksQuizResult from "../blanks/components/BlankQuizResults"
import OpenEndedQuizResult from "../openended/components/QuizResultsOpenEnded"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy } from "lucide-react"

interface QuizResultProps {
  result?: any
  quizType?: "mcq" | "code" | "blanks" | "openended"
  slug?: string
  onRetake?: () => void
  hideAuthGuard?: boolean
}

export default function QuizResult({
  result: propResult,
  quizType: propQuizType,
  slug: propSlug,
  onRetake,
  hideAuthGuard = false,
}: QuizResultProps) {
  const { getStoredResults } = useSessionService()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const quizError = useSelector(selectQuizError)
  const quizId = propSlug || useSelector(selectQuizId)

  const result = useMemo(
    () => propResult || quizResults || (quizId ? getStoredResults(quizId) : null),
    [propResult, quizResults, getStoredResults, quizId]
  )

  const quizType = useMemo(
    () =>
      propQuizType ||
      result?.quizType ||
      quizResults?.quizType ||
      (result?.questions && result?.questions[0]?.type) ||
      "mcq",
    [propQuizType, result, quizResults]
  )

  if (quizStatus === "loading") {
    return <QuizLoadingSteps steps={[{ label: "Loading results", status: "loading" }]} />
  }

  if (quizStatus === "failed" || quizError) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Unable to Load Results</h3>
            <p className="text-muted-foreground">{quizError || "An error occurred loading your quiz results."}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!result) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">No Results Available</h3>
            <p className="text-muted-foreground">We couldn't find any quiz results. Try taking a quiz first!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const content = useCallback(() => {
    switch (quizType) {
      case "mcq":
        return <McqQuizResult result={result} onRetake={onRetake} />
      case "code":
        return <CodeQuizResult result={result} onRetake={onRetake} />
      case "blanks":
        return <BlanksQuizResult result={result} onRetake={onRetake} />
      case "openended":
        return <OpenEndedQuizResult result={result} onRetake={onRetake} isAuthenticated={!!isAuthenticated} slug={quizId} />
      default:
        return (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Unsupported Quiz Type</h3>
                <p className="text-muted-foreground">
                  This quiz type is not supported. Please contact support.
                </p>
              </div>
            </CardContent>
          </Card>
        )
    }
  }, [quizType, result, onRetake, isAuthenticated, quizId])

  if (hideAuthGuard) {
    return content()
  }

  return (
    <QuizAuthGuard quizId={quizId}>
      {content()}
    </QuizAuthGuard>
  )
}
