"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { QuizType } from "@/app/types/quiz-types"

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
  const { data: session, status } = useSession()
  const router = useRouter()

  const [open, setOpen] = useState(true)
  const [showIcon, setShowIcon] = useState(false)
  const [buttonEnabled, setButtonEnabled] = useState(!waitForSave)
  const autoCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const minDisplayTimeRef = useRef<NodeJS.Timeout | null>(null)
  const hasShownMinTime = useRef<boolean>(false)

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
      open,
    })
  }, [isSubmitting, isSuccess, isError, score, totalQuestions, quizType, waitForSave, autoClose, open])

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

    // Ensure the modal is shown for at least 2 seconds
    if (!hasShownMinTime.current) {
      minDisplayTimeRef.current = setTimeout(() => {
        hasShownMinTime.current = true
        // Enable the button after minimum display time
        setButtonEnabled(true)
      }, 2000)
    }

    // Auto-close the dialog after 5 seconds if autoClose is true and there's no error
    if (autoClose && !isSubmitting && !isError && hasShownMinTime.current) {
      autoCloseTimeoutRef.current = setTimeout(() => {
        setOpen(false)
        onContinue(true)
      }, 5000) // Increased from 3s to 5s to give users more time
    }

    return () => {
      clearTimeout(iconTimer)
      if (minDisplayTimeRef.current) clearTimeout(minDisplayTimeRef.current)
      if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current)
    }
  }, [isSubmitting, isError, autoClose, onContinue])

  // Reset the auto-close timer when submission state changes
  useEffect(() => {
    // Clear any existing auto-close timer
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current)
      autoCloseTimeoutRef.current = null
    }

    // If we're no longer submitting and auto-close is enabled, start a new timer
    if (!isSubmitting && autoClose && !isError && hasShownMinTime.current) {
      autoCloseTimeoutRef.current = setTimeout(() => {
        setOpen(false)
        onContinue(true)
      }, 5000)
    }

    // Enable the button when submission completes
    if (!isSubmitting && hasShownMinTime.current) {
      setButtonEnabled(true)
    }

    return () => {
      if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current)
    }
  }, [isSubmitting, autoClose, isError, onContinue])

  const handleSignIn = () => {
    router.push("/auth/signin")
  }

  // Handle dialog close
  const handleClose = (proceed: boolean) => {
    if (status !== "authenticated") {
      handleSignIn()
    } else {
      setOpen(false)
      onContinue(proceed)
    }
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
      <DialogContent className="sm:max-w-md rounded-xl overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold">Quiz Submitted!</DialogTitle>
          {/* Fix: Remove DialogDescription wrapper to avoid p > div nesting */}
          {isError ? (
            <span className="text-red-500 flex items-center pt-2">
              <AlertCircle className="h-4 w-4 mr-2" />
              {errorMessage || "There was an error submitting your quiz. Please try again."}
            </span>
          ) : (
            <div className="pt-2">
              <div className="flex items-center">
                <span className="font-medium">Your score: </span>
                <span
                  className={`ml-2 text-lg font-bold ${score >= 70 ? "text-green-500" : score >= 50 ? "text-amber-500" : "text-red-500"}`}
                >
                  {scoreDisplay()}
                </span>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="flex justify-center py-8">
          {isSubmitting || !showIcon ? (
            <div className="flex flex-col items-center">
              <div className="relative">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse"></div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">Saving your results...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <p className="mt-4 text-sm text-red-500">Error submitting quiz</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <p className="mt-4 text-sm text-green-500">Quiz submitted successfully!</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-2 pt-2 border-t">
          {isError && (
            <Button variant="outline" onClick={() => handleClose(false)} className={cn("w-full sm:w-auto")}>
              Try Again
            </Button>
          )}
          <Button
            onClick={() => handleClose(true)}
            className={cn("w-full sm:w-auto", !isError && "bg-primary hover:bg-primary/90")}
            disabled={isSubmitting || !buttonEnabled}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Results...
              </div>
            ) : (
              <>
                View Results
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
