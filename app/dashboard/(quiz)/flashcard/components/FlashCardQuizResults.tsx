"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, RefreshCw } from "lucide-react"

import { resetQuiz } from "@/store/slices/quizSlice"
import { useAppDispatch } from "@/store"

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
  const dispatch = useAppDispatch()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRestarting, setIsRestarting] = useState(false)

  // Format time to show minutes and seconds
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0s"

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes === 0) {
      return `${remainingSeconds}s`
    }

    return `${minutes}m ${remainingSeconds}s`
  }

  const handleRetry = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Submit results using Redux action if needed
      // This would be implemented if we need to retry submission
      setError(null)
    } catch (err) {
      console.error("Error retrying submission:", err)
      setError("Failed to save results. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTryAgain = () => {
    setIsRestarting(true)

    // Reset the quiz state in Redux
    dispatch(resetQuiz())

    // Add reset parameters to URL to force a fresh load
    const url = new URL(window.location.href)
    url.searchParams.set("reset", "true")
    url.searchParams.set("t", Date.now().toString())

    // Navigate to the same page with reset parameters
    router.push(url.toString())

    // Call the onRestart callback
    onRestart()
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
              <div className="text-sm text-muted-foreground">Total time: {formatTime(totalTime)}</div>
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
          <Button onClick={handleTryAgain} disabled={isRestarting}>
            {isRestarting ? "Restarting..." : "Try Again"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/flashcard")}>
            Back to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
