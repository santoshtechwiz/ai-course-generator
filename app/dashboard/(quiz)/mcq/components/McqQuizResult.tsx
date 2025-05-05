"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Award, Clock, ArrowRight } from "lucide-react"
import { formatTime } from "@/lib/utils"


interface McqQuizResultProps {
  result: {
    quizId: string | null
    slug: string | null
    score: number
    answers: any[]
    totalQuestions: number
    correctAnswers: number
    completedAt: string
  }
  onTryAgain: () => void
  onBackToQuizzes: () => void
}

export default function McqQuizResult({ result, onTryAgain, onBackToQuizzes }: McqQuizResultProps) {
  const [showDebug, setShowDebug] = useState(true)

  // Calculate percentage
  const percentage = result.totalQuestions > 0 ? Math.round((result.correctAnswers / result.totalQuestions) * 100) : 0

  // Count valid answers
  const validAnswers = result.answers?.filter((a) => a !== null)?.length || 0

  // Count correct answers
  const correctAnswersCount = result.answers?.filter((a) => a && a.isCorrect)?.length || 0

  return (
    <div className="space-y-6">
      {showDebug && (
        <Card className="bg-slate-50 border-slate-200">
          <div className="p-3">
            <h3 className="text-sm text-slate-700">Result Debug</h3>
            <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-60 mt-2">
              {JSON.stringify({ result, percentage, validAnswers, correctAnswersCount }, null, 2)}
            </pre>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Award className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-primary">{percentage}%</div>
            <p className="mt-2 text-muted-foreground">
              {correctAnswersCount} correct out of {result.totalQuestions} questions
            </p>
          </div>

          <div className="flex justify-center items-center gap-4">
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Completed in {formatTime(0)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Question Summary</h3>
            <div className="space-y-2">
              {result.answers.map((answer, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center">
                    {answer && answer.isCorrect ? (
                      <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="mr-2 h-5 w-5 text-red-500" />
                    )}
                    <span>Question {index + 1}</span>
                  </div>
                  {answer && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span className="mr-2">{answer.selectedOption || answer.userAnswer || "No answer"}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="ml-2 font-medium">{answer.correctOption || "Unknown"}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onBackToQuizzes}>
            Back to Quizzes
          </Button>
          <Button onClick={onTryAgain}>Try Again</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
