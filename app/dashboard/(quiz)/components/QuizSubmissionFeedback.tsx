"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface QuizSubmissionFeedbackProps {
  score: number
  totalQuestions: number
  isSubmitting: boolean
  isSuccess: boolean
  isError: boolean
  errorMessage?: string | null
  onContinue: () => void
  quizType: string
  autoCloseDelay?: number
}

export function QuizSubmissionFeedback({
  score,
  totalQuestions,
  isSubmitting,
  isSuccess,
  isError,
  errorMessage,
  onContinue,
  quizType,
  autoCloseDelay = 2000,
}: QuizSubmissionFeedbackProps) {
  // Auto-close on success after delay
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        onContinue()
      }, autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, onContinue, autoCloseDelay])

  // Calculate percentage score
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0

  return (
    <AnimatePresence>
      {(isSubmitting || isSuccess || isError) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
        >
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isSubmitting && (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    Saving your results
                  </>
                )}
                {isSuccess && (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Results saved successfully
                  </>
                )}
                {isError && (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Error saving results
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSubmitting && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Please wait while we save your quiz results...</p>
                  <Progress value={100} className="animate-pulse" />
                </div>
              )}

              {isSuccess && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Your {quizType} quiz results have been saved successfully.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Score:</span>
                    <span className="text-sm font-bold">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )}

              {isError && (
                <div className="space-y-2">
                  <p className="text-sm text-red-500">
                    {errorMessage || "There was an error saving your quiz results. Please try again."}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={onContinue}
                className="w-full"
                variant={isError ? "destructive" : "default"}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Please wait..." : isSuccess ? "View Results" : "Try Again"}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
