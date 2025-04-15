"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

interface QuizSubmissionFeedbackProps {
  isSubmitting: boolean
  isSuccess: boolean
  isError: boolean
  score: number
  totalQuestions: number
  onContinue: (proceed: boolean) => void
  errorMessage?: string
  quizType?: string
}

export function QuizFeedback({
  isSubmitting,
  isSuccess,
  isError,
  score,
  totalQuestions,
  onContinue,
  errorMessage,
  quizType,
}: QuizSubmissionFeedbackProps) {
  const percentage = Math.round((score / totalQuestions) * 100)

  return (
    <Dialog open={true} onOpenChange={() => onContinue(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isSubmitting ? "Submitting Quiz..." : isSuccess ? "Quiz Submitted!" : "Submission Error"}
          </DialogTitle>
          <DialogDescription>
            {isSubmitting
              ? "Please wait while we save your results."
              : isSuccess
                ? `Your score: ${score}/${totalQuestions} (${percentage}%)`
                : "There was an error submitting your quiz."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center py-4">
          {isSubmitting ? (
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          ) : isSuccess ? (
            <CheckCircle className="h-12 w-12 text-green-500" />
          ) : (
            <AlertCircle className="h-12 w-12 text-red-500" />
          )}
        </div>

        {isError && errorMessage && <p className="text-sm text-red-500 text-center">{errorMessage}</p>}

        <DialogFooter className="sm:justify-center">
          {!isSubmitting && (
            <Button onClick={() => onContinue(true)} disabled={isSubmitting}>
              {isSuccess ? "View Results" : "Try Again"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
