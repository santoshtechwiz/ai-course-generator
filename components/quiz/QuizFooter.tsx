"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"
import { GlobalLoader } from "@/components/ui/loader"
import { cn } from "@/lib/utils"

interface QuizFooterProps {
  onNext?: () => void
  onPrevious?: () => void
  onSubmit?: () => void
  onRetake?: () => void  // Add onRetake prop
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
  nextLabel?: string
  submitLabel?: string
  className?: string
  isSubmitting?: boolean
  showRetake?: boolean  // Add showRetake prop
  hasAnswer?: boolean   // Add hasAnswer prop
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
}: QuizFooterProps) {
  // ✅ FIX: Always show submit button on last question
  const showSubmit = isLastQuestion

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center gap-3 px-4 py-4 border-t bg-card shadow-sm",
        className
      )}
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
          className="flex items-center gap-2 w-full sm:w-auto min-w-[160px] bg-emerald-600 hover:bg-emerald-700"
        >          {isSubmitting ? (
            <GlobalLoader size="xs" className="w-4 h-4" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          {isSubmitting ? "Submitting..." : submitLabel}
        </Button>
      ) : (
        <Button
          onClick={onNext}
          disabled={!canGoNext || isSubmitting}
          className="flex items-center gap-2 w-full sm:w-auto min-w-[120px]"
        >
          {nextLabel}
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}
