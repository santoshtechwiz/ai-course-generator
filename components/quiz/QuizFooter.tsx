"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Check, RotateCcw, Loader2, CheckCircle2, Flag } from 'lucide-react'
import { cn } from "@/lib/utils"

interface QuizFooterProps {
  onNext?: () => void | Promise<void>
  onPrevious?: () => void
  onSubmit?: () => void | Promise<void>
  onRetake?: () => void
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
  isSubmitting?: boolean
  showRetake?: boolean
  hasAnswer?: boolean
  nextLabel?: string
  submitLabel?: string
  submitState?: "idle" | "loading" | "success" | "error"
  nextState?: "idle" | "loading" | "success" | "error"
}

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.02, y: -1 },
  tap: { scale: 0.98 },
}

/**
 * Unified Quiz Footer Component
 * 
 * Provides consistent navigation controls across all quiz types with:
 * - Full-width responsive layout
 * - Consistent button sizing and spacing
 * - Loading and success states
 * - Proper accessibility
 */
export function QuizFooter({
  onNext,
  onPrevious,
  onSubmit,
  onRetake,
  canGoNext = false,
  canGoPrevious = false,
  isLastQuestion = false,
  isSubmitting = false,
  showRetake = false,
  hasAnswer = false,
  nextLabel = "Next Question",
  submitLabel = "Submit Quiz",
  submitState = "idle",
  nextState = "idle",
}: QuizFooterProps) {
  const isLoading = isSubmitting || submitState === "loading" || nextState === "loading"
  const isSuccess = submitState === "success" || nextState === "success"

  return (
    <motion.div
      className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-8 border-t border-border/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Previous Button */}
      <motion.div
        variants={buttonVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
        className="order-1 sm:order-1"
      >
        {canGoPrevious && onPrevious ? (
          <Button
            onClick={onPrevious}
            variant="outline"
            size="lg"
            className="min-w-[140px] h-12 transition-all duration-200"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        ) : (
          <div className="w-[140px]" /> // Placeholder for consistent spacing
        )}
      </motion.div>

      {/* Center Status/Info */}
      <div className="order-3 sm:order-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        {hasAnswer && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Answer recorded</span>
          </motion.div>
        )}
      </div>

      {/* Main Action Button */}
      <motion.div
        variants={buttonVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
        className="order-2 sm:order-3"
      >
        {showRetake && onRetake ? (
          <Button
            onClick={onRetake}
            variant="outline"
            size="lg"
            className="min-w-[140px] h-12 transition-all duration-200"
            disabled={isLoading}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Retake
          </Button>
        ) : isLastQuestion ? (
          <Button
            onClick={onSubmit}
            size="lg"
            className={cn(
              "min-w-[140px] h-12 transition-all duration-200",
              isSuccess && "bg-green-600 hover:bg-green-700",
              hasAnswer 
                ? "bg-primary hover:bg-primary/90" 
                : "bg-muted-foreground/50 hover:bg-muted-foreground/60"
            )}
            disabled={!hasAnswer || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : isSuccess ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Submitted!
              </>
            ) : (
              <>
                <Flag className="w-4 h-4 mr-2" />
                {submitLabel}
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            size="lg"
            className={cn(
              "min-w-[140px] h-12 transition-all duration-200",
              isSuccess && "bg-green-600 hover:bg-green-700",
              canGoNext 
                ? "bg-primary hover:bg-primary/90" 
                : "bg-muted-foreground/50 hover:bg-muted-foreground/60"
            )}
            disabled={!canGoNext || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : isSuccess ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Success!
              </>
            ) : (
              <>
                {nextLabel}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </motion.div>
    </motion.div>
  )
}

export default QuizFooter
