"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { quizService } from "@/lib/utils/quiz-service"
import { AlertCircle, RefreshCw } from "lucide-react"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Attempt to save results if they haven't been saved yet
  useEffect(() => {
    const checkAndSaveResults = async () => {
      try {
        // Check if results are already saved
        const isSaved = localStorage.getItem(`quiz_${quizId}_saved`) === "true"

        if (!isSaved && quizService.isAuthenticated()) {
          setIsSubmitting(true)
          setError(null)

          // Get cached result
          const result = quizService.getQuizResult(quizId)

          if (result) {
            // Ensure type is set
            const submission = {
              ...result,
              type: "flashcard", // Always set the type explicitly
              quizId,
              slug,
              score,
              totalQuestions,
              totalTime,
            }

            await quizService.submitQuizResult(submission)
            localStorage.setItem(`quiz_${quizId}_saved`, "true")
            console.log("Results saved successfully")
          }
        }
      } catch (err) {
        console.error("Error saving results:", err)
        setError("Failed to save results. You can try again.")
      } finally {
        setIsSubmitting(false)
      }
    }

    checkAndSaveResults()
  }, [quizId, slug, score, totalQuestions, totalTime])

  const handleRetry = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = quizService.getQuizResult(quizId)

      if (result) {
        // Ensure type is set
        const submission = {
          ...result,
          type: "flashcard", // Always set the type explicitly
          quizId,
          slug,
          score,
          totalQuestions,
          totalTime,
        }

        await quizService.submitQuizResult(submission)
        localStorage.setItem(`quiz_${quizId}_saved`, "true")
        setError(null)
      } else {
        setError("No result data found to submit")
      }
    } catch (err) {
      console.error("Error retrying submission:", err)
      setError("Failed to save results. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

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

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRetry} disabled={isSubmitting} className="ml-auto">
              {isSubmitting ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Retry
            </Button>
          </div>
        )}

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
