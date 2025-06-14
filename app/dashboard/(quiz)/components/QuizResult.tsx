"use client"

import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { clearQuizState } from "@/store/slices/quiz-slice"
import { AppDispatch } from "@/store"
import BlankQuizResults from "../blanks/components/BlankQuizResults"
import McqQuizResult from "../mcq/components/McqQuizResult"
import OpenEndedQuizResults from "../openended/components/QuizResultsOpenEnded"
import { NoResults } from "@/components/ui/no-results"
import FlashCardResults from "../flashcard/components/FlashCardQuizResults"
import CodeQuizResult from "../code/components/CodeQuizResult"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { QuizType } from "@/types/quiz"

interface QuizResultProps {
  result: any
  slug: string
  quizType: QuizType
  onRetake?: () => void
}

export default function QuizResult({
  result,
  slug,
  quizType = "mcq",
  onRetake,
}: QuizResultProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()

  const handleRetake = () => {
    dispatch(clearQuizState())
    router.push(`/dashboard/${quizType}/${slug}`)
  }

  if (!result) {
    return (
      <NoResults
        variant="quiz"
        title="Results Not Found"
        description="We couldn't load your quiz results. The quiz may not have been completed."
        action={{
          label: "Retake Quiz",
          onClick: handleRetake,
        }}
      />
    )
  }

  const isValidResult =
    result &&
    (result.percentage !== undefined ||
      result.score !== undefined ||
      (result.questionResults && result.questionResults.length) ||
      (result.questions && result.questions.length))

  if (!isValidResult) {
    return (
      <NoResults
        variant="quiz"
        title="Invalid Quiz Results"
        description="Your quiz results appear to be incomplete or invalid. It's recommended to retake the quiz."
        action={{
          label: "Retake Quiz",
          onClick: handleRetake,
        }}
      />
    )
  }

  const quizContent = renderQuizResultComponent(quizType, result, slug, handleRetake)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
      <Card className="shadow-xl border-muted rounded-2xl">
        <CardHeader className="bg-muted/50 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">
            Quiz Results
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-6 space-y-6">{quizContent}</CardContent>
        <CardFooter className="flex justify-center items-center py-6">
          <button
            onClick={handleRetake}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition"
          >
            Retake Quiz
          </button>
        </CardFooter>
      </Card>
    </div>
  )
}

function renderQuizResultComponent(
  quizType: QuizType,
  result: any,
  slug: string,
  onRetake: () => void
) {
  switch (quizType) {
    case "mcq":
      return <McqQuizResult result={result} />
    case "blanks":
      return (
        <BlankQuizResults
          result={result}
          isAuthenticated={true}
          slug={slug}
          onRetake={onRetake}
        />
      )
    case "openended":
      return (
        <OpenEndedQuizResults
          result={result}
          isAuthenticated={true}
          slug={slug}
          onRetake={onRetake}
        />
      )
    case "code":
      return <CodeQuizResult result={result}  onRetake={onRetake} />
    case "flashcard":
      return <FlashCardResults result={result} slug={slug} onRetake={onRetake} />
    default:
      return <McqQuizResult result={result} />
  }
}
