"use client"

import { Button } from "@/components/ui/GlobalButton"
import { ChevronLeft, ChevronRight, CheckCircle, SkipForward, X, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { LoadingSpinner } from "../loaders/GlobalLoader"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface QuizFooterProps {
  onNext?: () => void | Promise<void>
  onPrevious?: () => void | Promise<void>
  onSubmit?: () => void | Promise<void>
  onRetake?: () => void | Promise<void>
  onSkip?: () => void | Promise<void>
  onExit?: () => void | Promise<void>
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
  nextLabel?: string
  submitLabel?: string
  className?: string
  isSubmitting?: boolean
  showRetake?: boolean
  hasAnswer?: boolean
  submitState?: "idle" | "loading" | "success" | "error"
  nextState?: "idle" | "loading" | "success" | "error"
  allowSkip?: boolean
  skippedQuestions?: number
  unsavedChanges?: boolean
  enableKeyboardShortcuts?: boolean
}

export function QuizFooter({
  onNext,
  onPrevious,
  onSubmit,
  onSkip,
  onExit,
  canGoNext = false,
  canGoPrevious = false,
  isLastQuestion = false,
  nextLabel = "Continue",
  submitLabel = "Submit Quiz",
  className,
  isSubmitting = false,
  submitState = "idle",
  nextState = "idle",
  allowSkip = false,
  skippedQuestions = 0,
  unsavedChanges = false,
  enableKeyboardShortcuts = true,
}: QuizFooterProps) {
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const showSubmit = isLastQuestion

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      // Next question with Space or Enter
      if ((event.key === ' ' || event.key === 'Enter') && canGoNext && onNext) {
        event.preventDefault()
        onNext()
      }

      // Previous question with Backspace (when no input focused)
      if (event.key === 'Backspace' && canGoPrevious && onPrevious) {
        event.preventDefault()
        onPrevious()
      }

      // Skip with 'S' key
      if (event.key.toLowerCase() === 's' && allowSkip && onSkip) {
        event.preventDefault()
        onSkip()
      }

      // Exit with Escape
      if (event.key === 'Escape' && onExit) {
        event.preventDefault()
        if (unsavedChanges) {
          setShowExitConfirm(true)
        } else {
          onExit()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboardShortcuts, canGoNext, canGoPrevious, allowSkip, unsavedChanges, onNext, onPrevious, onSkip, onExit])

  const handleExitConfirm = () => {
    setShowExitConfirm(false)
    onExit?.()
  }

  return (
    <>
      <motion.div
        className={cn(
          "flex flex-col sm:flex-row items-center gap-3 px-4 py-4 border-t bg-card shadow-sm",
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Left side - Previous button and skip info */}
        <div className="flex items-center gap-3 flex-1">
          {canGoPrevious && onPrevious && (
            <Button
              variant="outline"
              onClick={onPrevious}
              className="flex items-center gap-2"
              aria-label="Go to previous question"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
          )}

          {skippedQuestions > 0 && (
            <Badge variant="secondary" className="text-xs">
              {skippedQuestions} skipped
            </Badge>
          )}
        </div>

        {/* Center - Skip button */}
        <div className="flex items-center gap-2">
          {allowSkip && onSkip && !isLastQuestion && (
            <Button
              variant="ghost"
              onClick={onSkip}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              aria-label="Skip this question"
            >
              <SkipForward className="w-4 h-4" />
              <span className="text-xs">Skip</span>
            </Button>
          )}
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          {onExit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (unsavedChanges) {
                  setShowExitConfirm(true)
                } else {
                  onExit()
                }
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-destructive"
              aria-label="Exit quiz"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </Button>
          )}

          {showSubmit ? (
            <Button
              onClick={onSubmit}
              disabled={isSubmitting || submitState === "loading"}
              className={cn(
                "flex items-center gap-2 relative overflow-hidden",
                submitState === "success" && "bg-green-600 hover:bg-green-700",
                submitState === "error" && "bg-red-600 hover:bg-red-700"
              )}
              aria-label={submitLabel}
            >
              {submitState === "loading" || isSubmitting ? (
                <>
                  <LoadingSpinner className="w-4 h-4" />
                  <span>Submitting...</span>
                </>
              ) : submitState === "success" ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Submitted!</span>
                </>
              ) : submitState === "error" ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Try Again</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{submitLabel}</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={!canGoNext || nextState === "loading"}
              className={cn(
                "flex items-center gap-2 relative overflow-hidden",
                !canGoNext && "opacity-50 cursor-not-allowed",
                nextState === "success" && "bg-green-600 hover:bg-green-700"
              )}
              aria-label={nextLabel}
            >
              {nextState === "loading" ? (
                <>
                  <LoadingSpinner className="w-4 h-4" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>{nextLabel}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>

        {/* Keyboard hints */}
        {enableKeyboardShortcuts && (
          <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground absolute right-4 bottom-1">
            <span>
              <kbd className="px-1 py-0.5 bg-muted border rounded text-xs">Space</kbd> Next
            </span>
            {allowSkip && (
              <span>
                <kbd className="px-1 py-0.5 bg-muted border rounded text-xs">S</kbd> Skip
              </span>
            )}
            <span>
              <kbd className="px-1 py-0.5 bg-muted border rounded text-xs">Esc</kbd> Exit
            </span>
          </div>
        )}
      </motion.div>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Exit Quiz?
            </DialogTitle>
            <DialogDescription>
              {unsavedChanges 
                ? "You have unsaved changes. Are you sure you want to exit? Your progress will be lost."
                : "Are you sure you want to exit the quiz? Your current progress will be saved."
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowExitConfirm(false)}
              className="flex-1"
            >
              Continue Quiz
            </Button>
            <Button 
              variant={unsavedChanges ? "destructive" : "default"}
              onClick={handleExitConfirm}
              className="flex-1"
            >
              {unsavedChanges ? "Exit & Lose Progress" : "Exit Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
