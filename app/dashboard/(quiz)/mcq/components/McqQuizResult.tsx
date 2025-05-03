"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, Award, ArrowRight } from "lucide-react"
import { calculatePerformanceLevel, formatQuizTime } from "@/lib/utils/quiz-performance"

interface McqQuizResultProps {
  result: {
    quizId: string
    slug: string
    score: number
    totalQuestions: number
    correctAnswers: number
    totalTimeSpent: number
    formattedTimeSpent?: string
    completedAt: string
    answers: Array<{
      questionId: string | number
      question: string
      selectedOption: string
      correctOption: string
      isCorrect: boolean
      timeSpent: number
    }>
  }
}

// Helper function to determine difficulty color
const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case "easy":
      return "text-green-500"
    case "medium":
      return "text-yellow-500"
    case "hard":
      return "text-red-500"
    default:
      return "text-gray-500"
  }
}

export default function McqQuizResult({ result }: McqQuizResultProps) {
  const [showAnswers, setShowAnswers] = useState(false)
  const router = useRouter()

  // Validate result data and provide defaults
  const safeResult = {
    quizId: result?.quizId || "",
    slug: result?.slug || "",
    score: result?.score || 0,
    totalQuestions: result?.totalQuestions || 0,
    correctAnswers: result?.correctAnswers || 0,
    totalTimeSpent: result?.totalTimeSpent || 0,
    formattedTimeSpent: result?.formattedTimeSpent || formatQuizTime(result?.totalTimeSpent || 0),
    completedAt: result?.completedAt || new Date().toISOString(),
    answers: result?.answers || [],
  }

  // Get performance level based on score
  const performanceLevel = calculatePerformanceLevel(safeResult.score)

  // Get color for performance level
  const performanceColor = getDifficultyColor(
    safeResult.score >= 90 ? "easy" : safeResult.score >= 60 ? "medium" : "hard",
  )

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Quiz Results</CardTitle>
          <CardDescription>Completed on {new Date(safeResult.completedAt).toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <Award className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Score</p>
              <p className={`text-2xl font-bold ${performanceColor}`}>{safeResult.score}%</p>
              <p className="text-xs text-muted-foreground mt-1">{performanceLevel}</p>
            </div>

            <div className="flex flex-col items-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
              <p className="text-sm text-muted-foreground">Correct Answers</p>
              <p className="text-2xl font-bold">
                {safeResult.correctAnswers}/{safeResult.totalQuestions}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((safeResult.correctAnswers / safeResult.totalQuestions) * 100)}% accuracy
              </p>
            </div>

            <div className="flex flex-col items-center p-4 border rounded-lg">
              <XCircle className="h-8 w-8 text-red-600 mb-2" />
              <p className="text-sm text-muted-foreground">Incorrect Answers</p>
              <p className="text-2xl font-bold">
                {safeResult.totalQuestions - safeResult.correctAnswers}/{safeResult.totalQuestions}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(
                  ((safeResult.totalQuestions - safeResult.correctAnswers) / safeResult.totalQuestions) * 100,
                )}
                % error rate
              </p>
            </div>

            <div className="flex flex-col items-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 text-blue-600 mb-2" />
              <p className="text-sm text-muted-foreground">Time Spent</p>
              <p className="text-2xl font-bold">
                {safeResult.formattedTimeSpent || formatQuizTime(safeResult.totalTimeSpent)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(safeResult.totalTimeSpent / safeResult.totalQuestions)} sec/question
              </p>
            </div>
          </div>

          <Button variant="outline" className="w-full mt-6" onClick={() => setShowAnswers(!showAnswers)}>
            {showAnswers ? "Hide Answers" : "Show Answers"}
          </Button>

          {showAnswers && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium">Question Review</h3>
              {safeResult.answers && safeResult.answers.length > 0 ? (
                safeResult.answers.map((answer, index) => (
                  <Card key={index} className={answer.isCorrect ? "border-green-200" : "border-red-200"}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-2">
                        {answer.isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium">
                            Question {index + 1}: {answer.question}
                          </p>
                          <p className="text-sm mt-1">
                            Your answer:{" "}
                            <span
                              className={answer.isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"}
                            >
                              {answer.selectedOption}
                            </span>
                          </p>
                          {!answer.isCorrect && (
                            <p className="text-sm mt-1">
                              Correct answer: <span className="text-green-600 font-medium">{answer.correctOption}</span>
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Time spent: {formatQuizTime(answer.timeSpent)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground">No answer details available.</p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/dashboard/mcq")}>
            Return to Quizzes
          </Button>
          <Button onClick={() => router.push(`/dashboard/mcq/${safeResult.slug}`)}>
            Try Again <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
