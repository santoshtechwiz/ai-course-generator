"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface FlashCardResultsProps {
  quizId: string
  title: string
  score: number
  totalQuestions: number
  totalTime: number
  correctAnswers: number
  slug: string
  onRestart: () => void
}

export default function FlashCardResults({
  quizId,
  title,
  score,
  totalQuestions,
  totalTime,
  correctAnswers,
  slug,
  onRestart,
}: FlashCardResultsProps) {
  const router = useRouter()

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{title} Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-4xl font-bold mb-2">{Math.round(score)}%</p>
          <Progress value={score} className="w-full h-2" />
          <p className="mt-2 text-sm text-muted-foreground">
            You got {correctAnswers} out of {totalQuestions} cards correct
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Time Spent</p>
              <p className="text-xl font-semibold">
                {Math.floor(totalTime / 60)}m {Math.round(totalTime % 60)}s
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Cards</p>
              <p className="text-xl font-semibold">{totalQuestions}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-4">
          <Button onClick={onRestart}>Restart Quiz</Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/flashcard")}>
            Back to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
