"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Clock, Award, RotateCcw, Home } from "lucide-react"
import { formatQuizTime } from "@/lib/utils/quiz-index"

interface McqQuizResultProps {
  result: {
    quizId: string
    slug: string
    score: number
    totalQuestions: number
    correctAnswers: number
    answers?: any[]
    totalTimeSpent?: number
    formattedTimeSpent?: string
    completedAt?: string
    elapsedTime?: number
  }
  onTryAgain: () => void
  onBackToQuizzes: () => void
}

export default function McqQuizResult({ result, onTryAgain, onBackToQuizzes }: McqQuizResultProps) {
  // Calculate total time if not provided
  const totalTime =
    result.totalTimeSpent || (result.answers ? result.answers.reduce((sum, a) => sum + (a?.timeSpent || 0), 0) : 0)

  // Format time if not provided
  const displayTime = result.formattedTimeSpent || formatQuizTime(totalTime)

  return (
    <div className="space-y-6" data-testid="quiz-results">
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center gap-4">
          <Award className="h-12 w-12 text-primary" />
          <h2 className="text-2xl font-bold">Quiz Results</h2>
          <div className="w-full max-w-md">
            <Progress value={result.score} className="h-3" />
          </div>
          <p className="text-3xl font-bold" data-testid="quiz-score">
            {result.score}%
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span data-testid="quiz-correct-answers">
              {result.correctAnswers} correct out of{" "}
              <span data-testid="quiz-total-questions">{result.totalQuestions}</span> questions
            </span>
          </div>
          {displayTime && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Completed in {displayTime}</span>
            </div>
          )}
        </div>
      </Card>

      {result.answers && result.answers.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Question Summary</h3>
          <div className="space-y-4">
            {result.answers.map(
              (answer, index) =>
                answer && (
                  <div key={index} className="border rounded-md p-4" data-testid={`answer-${index}`}>
                    <div className="flex items-start gap-2">
                      {answer.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium">{answer.question || `Question ${index + 1}`}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your answer:{" "}
                          <span className={answer.isCorrect ? "text-green-600" : "text-red-600"}>
                            {answer.selectedOption || answer.userAnswer || answer.answer}
                          </span>
                        </p>
                        {!answer.isCorrect && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Correct answer: <span className="text-green-600">{answer.correctOption}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ),
            )}
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center" data-testid="quiz-try-again">
        <Button variant="outline" onClick={onTryAgain} data-testid="try-again-button">
          <RotateCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Button onClick={onBackToQuizzes} data-testid="back-to-quizzes-button">
          <Home className="h-4 w-4 mr-2" />
          Back to Quizzes
        </Button>
      </div>
    </div>
  )
}
