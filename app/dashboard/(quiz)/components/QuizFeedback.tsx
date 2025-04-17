"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { QuizType } from "@/app/types/types"

interface QuizFeedbackProps {
  isSubmitting: boolean
  isSuccess: boolean
  isError: boolean
  score: number
  totalQuestions: number
  onContinue: (proceed: boolean) => void
  errorMessage?: string
  quizType: QuizType
  waitForSave?: boolean
  autoClose?: boolean
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
  waitForSave = true,
  autoClose = false,
}: QuizFeedbackProps) {
  const [open, setOpen] = useState(true)
  const [showIcon, setShowIcon] = useState(false)
  const [buttonEnabled, setButtonEnabled] = useState(!waitForSave)

  // Debug logging
  useEffect(() => {
    console.log("QuizFeedback rendered with:", {
      isSubmitting,
      isSuccess,
      isError,
      score,
      totalQuestions,
      quizType,
      waitForSave,
      autoClose,
    })
  }, [isSubmitting, isSuccess, isError, score, totalQuestions, quizType, waitForSave, autoClose])

  // Format the score display based on quiz type
  const scoreDisplay = () => {
    // Always display as a percentage for consistency with results page
    return `${score}%`
  }

  useEffect(() => {
    // Show the loading state for at least 1.5 seconds
    const iconTimer = setTimeout(() => {
      setShowIcon(true)
    }, 1500)

    // Enable the button after loading is complete
    const buttonTimer = setTimeout(
      () => {
        setButtonEnabled(true)
      },
      waitForSave ? 2000 : 0,
    )

    // Auto-close the dialog after 3 seconds if autoClose is true and there's no error
    let closeTimer: NodeJS.Timeout | null = null
    if (autoClose && !isSubmitting && !isError) {
      closeTimer = setTimeout(() => {
        setOpen(false)
        onContinue(true)
      }, 3000)
    }

    return () => {
      clearTimeout(iconTimer)
      clearTimeout(buttonTimer)
      if (closeTimer) clearTimeout(closeTimer)
    }
  }, [isSubmitting, isError, waitForSave, autoClose, onContinue])

  // Handle dialog close
  const handleClose = (proceed: boolean) => {
    console.log("Dialog close triggered, proceed:", proceed)
    setOpen(false)
    onContinue(proceed)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        console.log("Dialog open change:", isOpen)
        // Only allow closing via the buttons, not by clicking outside
        if (!isOpen) {
          handleClose(false)
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Quiz Submitted!</DialogTitle>
          <DialogDescription className="text-base pt-2">
            {isError ? (
              <span className="text-red-500">
                {errorMessage || "There was an error submitting your quiz. Please try again."}
              </span>
            ) : (
              <span>Your score: {scoreDisplay()}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-6">
          {isSubmitting || !showIcon ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p className="mt-4 text-sm text-muted-foreground">Saving your results...</p>
            </div>
          ) : isError ? (
            <AlertCircle className="h-16 w-16 text-red-500" />
          ) : (
            <CheckCircle className="h-16 w-16 text-green-500" />
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-2">
          {isError && (
            <Button variant="outline" onClick={() => handleClose(false)} className={cn("w-full sm:w-auto")}>
              Try Again
            </Button>
          )}
          <Button
            onClick={() => handleClose(true)}
            className={cn("w-full sm:w-auto")}
            disabled={isSubmitting || !buttonEnabled}
          >
            View Results
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
