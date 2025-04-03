"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { CheckCircle, Clock, Award, BarChart2, ArrowRight } from "lucide-react"
import type { QuizType } from "@/app/types/types"

interface QuizResultDisplayProps {
  quizId: string | number
  title: string
  score: number
  totalQuestions: number
  totalTime: number
  correctAnswers: number
  type: QuizType
  slug: string
  isLoading?: boolean
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
  isLoading = false,
}: QuizResultDisplayProps) {
  const router = useRouter()
  const [formattedTime, setFormattedTime] = useState("")

  useEffect(() => {
    // Format time from seconds to minutes and seconds
    const minutes = Math.floor(totalTime / 60)
    const seconds = Math.floor(totalTime % 60)
    setFormattedTime(`${minutes}m ${seconds}s`)
  }, [totalTime])

  if (isLoading) {
    return <QuizLoader message="Processing your results..." />
  }

  const percentageScore = type === "mcq" ? (score / totalQuestions) * 100 : score
  const scoreColor =
    percentageScore >= 70 ? "text-green-600" : percentageScore >= 50 ? "text-amber-600" : "text-red-600"

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{title} - Results</CardTitle>
        <CardDescription>Here's how you performed on this quiz</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center space-y-2">
          <span className={`text-4xl font-bold ${scoreColor}`}>{Math.round(percentageScore)}%</span>
          <Progress value={percentageScore} className="w-full h-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Correct Answers</p>
              <p className="text-lg font-bold">
                {correctAnswers} / {totalQuestions}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
            <Clock className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Time Taken</p>
              <p className="text-lg font-bold">{formattedTime}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
            <Award className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium">Performance</p>
              <p className="text-lg font-bold">
                {percentageScore >= 80
                  ? "Excellent"
                  : percentageScore >= 60
                    ? "Good"
                    : percentageScore >= 40
                      ? "Average"
                      : "Needs Improvement"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
            <BarChart2 className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium">Quiz Type</p>
              <p className="text-lg font-bold capitalize">{type}</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.push(`/dashboard/${type}/${slug}`)}>
          Retry Quiz
        </Button>
        <Button onClick={() => router.push("/dashboard/quizzes")} className="gap-2">
          More Quizzes <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

