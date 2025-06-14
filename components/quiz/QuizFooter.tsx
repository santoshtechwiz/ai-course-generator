"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Flag, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface QuizFooterProps {
  onPrevious?: () => void
  onNext?: () => void
  onSubmit?: () => void
  onRetake?: () => void
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
  isSubmitting?: boolean
  showRetake?: boolean
  className?: string
  children?: ReactNode
}

export function QuizFooter({
  onPrevious,
  onNext,
  onSubmit,
  onRetake,
  canGoNext = false,
  canGoPrevious = false,
  isLastQuestion = false,
  isSubmitting = false,
  showRetake = false,
  className,
  children,
}: QuizFooterProps) {
  if (children) {
    return (
      <div className={cn("p-6 border-t border-border/40 flex justify-between", className)}>
        {children}
      </div>
    )
  }

  return (
    <div className={cn("p-6 border-t border-border/40 flex justify-between", className)}>
      <div className="flex gap-3">
        {canGoPrevious && onPrevious && (
          <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              onClick={onPrevious}
              className="flex items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors"
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>
          </motion.div>
        )}
        
        {showRetake && onRetake && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              variant="outline" 
              onClick={onRetake}
              className="flex items-center gap-2"
              disabled={isSubmitting}
            >
              <RefreshCw className="w-4 h-4" />
              Retake Quiz
            </Button>
          </motion.div>
        )}
      </div>
      <div className="flex gap-3">
        {!isLastQuestion && onNext ? (
          <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onNext}
              disabled={!canGoNext || isSubmitting}
              className={cn(
                "flex items-center gap-2 min-w-[120px] transition-all duration-300",
                canGoNext
                  ? "bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg hover:shadow-primary/20"
                  : "opacity-70"
              )}
              size="lg"
            >
              {isSubmitting ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              ) : null}
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        ) : onSubmit ? (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onSubmit}
              disabled={(!canGoNext && !isLastQuestion) || isSubmitting}
              className={cn(
                "flex items-center gap-2 min-w-[140px] transition-all duration-300",
                canGoNext || isLastQuestion
                  ? "bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg hover:shadow-primary/20"
                  : "opacity-70"
              )}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4" />
                  Submit Quiz
                </>
              )}
            </Button>
          </motion.div>
        ) : null}
      </div>
    </div>
  )
}
