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
      className="w-full flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 mt-10 border-t border-border/30"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Enhanced Previous Button */}
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
            className="min-w-[160px] h-14 px-6 text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 hover:border-primary/50"
            disabled={isLoading}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Previous
          </Button>
        ) : (
          <div className="w-[160px]" /> // Placeholder for consistent spacing
        )}
      </motion.div>

      {/* Enhanced Center Status/Info */}
      <div className="order-3 sm:order-2 flex items-center justify-center gap-3 text-sm text-muted-foreground">
        {hasAnswer && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium text-emerald-700 dark:text-emerald-300">Answer recorded</span>
          </motion.div>
        )}
      </div>

      {/* Enhanced Main Action Button */}
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
            className="min-w-[160px] h-14 px-6 text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 hover:border-primary/50"
            disabled={isLoading}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Retake Quiz
          </Button>
        ) : isLastQuestion ? (
          <Button
            onClick={onSubmit}
            size="lg"
            className={cn(
              "min-w-[160px] h-14 px-6 text-base font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg",
              "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground border-0"
            )}
            disabled={!hasAnswer || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : isSuccess ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Submitted!
              </>
            ) : (
              <>
                <Flag className="w-5 h-5 mr-2" />
                {submitLabel}
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            size="lg"
            className={cn(
              "min-w-[160px] h-14 px-6 text-base font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg",
              "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground border-0"
            )}
            disabled={!canGoNext || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading...
              </>
            ) : isSuccess ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Success!
              </>
            ) : (
              <>
                {nextLabel}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        )}
      </motion.div>
    </motion.div>
  )
}

export default QuizFooter
