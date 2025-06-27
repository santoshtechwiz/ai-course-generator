"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuizFooterProps {
  onNext?: () => void
  onPrevious?: () => void
  onSubmit?: () => void
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
  nextLabel?: string
  submitLabel?: string
  className?: string
}

export function QuizFooter({
  onNext,
  onPrevious,
  onSubmit,
  canGoNext = false,
  canGoPrevious = false,
  isLastQuestion = false,
  nextLabel = "Next",
  submitLabel = "Submit",
  className,
}: QuizFooterProps) {
  const showSubmit = isLastQuestion && canGoNext

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-5 border-t border-border bg-muted",
        className
      )}
    >
      {/* Previous */}
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className="flex items-center gap-2 w-full sm:w-auto"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      {/* Submit or Next */}
      {showSubmit ? (
        <Button
          onClick={onSubmit}
          variant="default"
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <CheckCircle className="w-4 h-4" />
          {submitLabel}
        </Button>
      ) : (
        <Button
          onClick={onNext}
          disabled={!canGoNext}
          variant="secondary"
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          {nextLabel}
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}
