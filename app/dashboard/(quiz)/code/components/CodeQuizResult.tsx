"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { QuizSubmissionLoading } from "../../components/QuizSubmissionLoading"
import type { CodeQuizResultData } from "@/app/types/code-quiz-types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, RefreshCw, Home } from "lucide-react"

interface CodeQuizResultProps {
  result: CodeQuizResultData
}

export default function CodeQuizResult({ result }: CodeQuizResultProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (!result) {
    console.error("CodeQuizResult: result is null or undefined")
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 max-w-xl mx-auto mt-10">
        <h2 className="text-lg font-semibold mb-2">Error Loading Results</h2>
        <p>We couldn't load your quiz results. Please try again.</p>
        <button
          onClick={() => router.push("/dashboard/quizzes")}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Return to Quizzes
        </button>
      </div>
    )
  }

  if (isLoading) {
    return <QuizSubmissionLoading quizType="code" />
  }

  const slug = result.slug || ""
  const title = result.title || "Code Quiz" // Add fallback title
  const scorePercentage = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0

  const handleRestart = () => {
    router.push(`/dashboard/code/${slug}`)
  }

  const handleReturn = () => {
    router.push("/dashboard/quizzes")
  }

  return (
    <Card className="max-w-3xl mx-auto p-6 shadow-md border-t-4 border-t-primary">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Quiz Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-muted-foreground">Completed on {new Date(result.completedAt).toLocaleDateString()}</p>
          </div>
          <div className="mt-4 sm:mt-0 text-center">
            <div className={`text-3xl font-bold ${scorePercentage >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
              {result.score} / {result.total}
            </div>
            <div className={`text-sm font-medium ${scorePercentage >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
              {scorePercentage}% Score
            </div>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <h3 className="text-xl font-semibold mb-4">Your Answers</h3>
          {result.questions.map((q, i) => (
            <div key={i} className="mb-4 p-4 border rounded-md bg-background shadow-sm">
              <div className="flex items-start gap-3">
                <div className={`mt-1 p-1 rounded-full ${q.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                  {q.isCorrect ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">Q{i + 1}: {q.question}</p>
                  <div className="text-sm mt-2 space-y-1">
                    <p className="text-muted-foreground">
                      Your answer: <span className={q.isCorrect ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {q.userAnswer}
                      </span>
                    </p>
                    {!q.isCorrect && (
                      <p className="text-green-700 font-medium">
                        Correct answer: {q.correctAnswer}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 mt-6 border-t">
          <Button
            onClick={handleRestart}
            className="flex items-center gap-2 bg-primary"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Quiz</span>
          </Button>
          <Button
            onClick={handleReturn}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
