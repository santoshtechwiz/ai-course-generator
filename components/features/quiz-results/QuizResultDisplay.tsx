"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import type { QuizType } from "@/app/types/types"
import { formatTime } from "@/lib/utils"

interface QuizResultDisplayProps {
  quizId: string | number
  title: string
  score: number
  totalQuestions: number
  totalTime: number
  correctAnswers: number
  type: QuizType
  slug: string
}
const buildQuizUrl=(quizId: string | number, type: QuizType) => {
  switch (type) {
    case "mcq":
      return `/dashboard/mcq/${quizId}`
    case "fill-blanks":
      return `/dashboard/blanks/${quizId}`
    case "openended":
      return `/dashboard/open-ended/${quizId}`
    case "code":
      return `/dashboard/code/${quizId}`
    case "flashcard":
      return `/dashboard/flashcard/${quizId}`
    default:
      return `/dashboard/quiz/${quizId}`
  }
}

export function QuizResultDisplay({
  quizId,
  title,
  score,
  totalQuestions,
  totalTime,
  correctAnswers,
  type,
  slug,
}: QuizResultDisplayProps) {
  const router = useRouter()
  const percentage = Math.round((score / totalQuestions) * 100)

  const getResultMessage = () => {
    if (percentage >= 90) return "Excellent! You've mastered this topic!"
    if (percentage >= 70) return "Great job! You have a solid understanding."
    if (percentage >= 50) return "Good effort! Keep practicing to improve."
    return "Keep learning! Review the material and try again."
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{title} Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-5xl font-bold mb-2">{percentage}%</div>
          <p className="text-muted-foreground">{getResultMessage()}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Score</span>
            <span className="font-medium">
              {correctAnswers} / {totalQuestions} correct
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="bg-muted rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{totalQuestions}</div>
            <div className="text-xs text-muted-foreground">Questions</div>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{formatTime(totalTime)}</div>
            <div className="text-xs text-muted-foreground">Time Taken</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 justify-center">
        <Button onClick={() => router.push(`${buildQuizUrl(slug,type)}`)}>Try Again</Button>
        <Button variant="outline" onClick={() => router.push("/dashboard/quizzes")}>
          Back to Quizzes
        </Button>
      </CardFooter>
    </Card>
  )
}

