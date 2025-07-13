"use client"

import { Button } from "@/components/ui/GlobalButton"
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { LoadingSpinner } from "../loaders/GlobalLoader"

interface QuizFooterProps {
  onNext?: () => void | Promise<void>
  onPrevious?: () => void | Promise<void>
  onSubmit?: () => void | Promise<void>
  onRetake?: () => void | Promise<void>
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
}

export function QuizFooter({
  onNext,
  onPrevious,
  onSubmit,
  canGoNext = false,
  canGoPrevious = false,
  isLastQuestion = false,
  nextLabel = "Continue",
  submitLabel = "Submit Quiz",
  className,
  isSubmitting = false,
  submitState = "idle",
  nextState = "idle",
}: QuizFooterProps) {
  // ✅ FIX: Always show submit button on last question
  const showSubmit = isLastQuestion

  return (
    <motion.div
      className={cn(
        "flex flex-col sm:flex-row items-center gap-3 px-4 py-4 border-t bg-card shadow-sm",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Previous Button */}
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={!canGoPrevious || isSubmitting}
        className="flex items-center gap-2 w-full sm:w-auto min-w-[120px]"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      <div className="flex-1" />

      {/* Action Button */}
      {showSubmit ? (
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          state={submitState || (isSubmitting ? "loading" : "idle")}
          loadingText="Submitting..."
          successText="Submitted!"
          errorText="Try Again"
          className="flex items-center gap-2 w-full sm:w-auto min-w-[160px] bg-emerald-600 hover:bg-emerald-700"
        >
          {isSubmitting || submitState === "loading" ? (
            <LoadingSpinner  />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          {submitLabel}
        </Button>
      ) : (
        <Button
          onClick={onNext}
          disabled={!canGoNext || isSubmitting}
          state={nextState || "idle"}
          loadingText=""
          className="flex items-center gap-2 w-full sm:w-auto min-w-[120px]"
        >
          {nextLabel}
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  )
}
