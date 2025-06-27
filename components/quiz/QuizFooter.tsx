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
  return (
    <div className={cn("flex items-center justify-between pt-6 border-t border-border", className)}>
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className="flex items-center gap-2 bg-transparent"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      {isLastQuestion ? (
        <Button onClick={onSubmit} disabled={!canGoNext} className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {submitLabel}
        </Button>
      ) : (
        <Button onClick={onNext} disabled={!canGoNext} className="flex items-center gap-2">
          {nextLabel}
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}
