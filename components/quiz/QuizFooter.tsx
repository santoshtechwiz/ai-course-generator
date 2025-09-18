"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Check, RotateCcw, Loader2, CheckCircle2, Flag, SkipForward } from 'lucide-react'
import { cn } from "@/lib/utils"

interface QuizFooterProps {
  onNext?: () => void | Promise<void>
  onPrevious?: () => void
  onSubmit?: () => void | Promise<void>
  onRetake?: () => void
  onSkip?: () => void
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
  isSubmitting?: boolean
  showRetake?: boolean
  showSkip?: boolean
  hasAnswer?: boolean
  nextLabel?: string
  submitLabel?: string
  submitState?: "idle" | "loading" | "success" | "error"
  nextState?: "idle" | "loading" | "success" | "error"
  className?: string
}

const buttonVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      mass: 0.8
    }
  },
  hover: {
    scale: 1.02,
    y: -1,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  },
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

/**
 * Enhanced Quiz Footer Component
 *
 * Provides consistent navigation controls across all quiz types with:
 * - Full-width responsive layout with enhanced animations
 * - Consistent button sizing and spacing
 * - Loading and success states with smooth transitions
 * - Improved accessibility with ARIA labels
 * - Skip functionality for optional questions
 */
export function QuizFooter({
  onNext,
  onPrevious,
  onSubmit,
  onRetake,
  onSkip,
  canGoNext = false,
  canGoPrevious = false,
  isLastQuestion = false,
  isSubmitting = false,
  showRetake = false,
  showSkip = false,
  hasAnswer = false,
  nextLabel = "Next Question",
  submitLabel = "Submit Quiz",
  submitState = "idle",
  nextState = "idle",
  className,
}: QuizFooterProps) {
  const isLoading = isSubmitting || submitState === "loading" || nextState === "loading"
  const isSuccess = submitState === "success" || nextState === "success"

  return (
    <motion.div
      className={cn(
        "w-full flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 mt-10 border-t border-border/30",
        className
      )}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      id="quiz-navigation"
      role="navigation"
      aria-label="Quiz navigation"
    >
      {/* Enhanced Previous Button */}
      <motion.div
        variants={buttonVariants}
        className="order-1 sm:order-1"
      >
        {canGoPrevious && onPrevious ? (
          <Button
            onClick={onPrevious}
            variant="outline"
            size="lg"
            className="min-w-[160px] h-14 px-6 text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 hover:border-primary/50"
            disabled={isLoading}
            aria-label="Go to previous question"
          >
            <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
            Previous
          </Button>
        ) : (
          <div className="w-[160px]" aria-hidden="true" /> // Placeholder for consistent spacing
        )}
      </motion.div>

      {/* Enhanced Center Status/Info */}
      <div className="order-3 sm:order-2 flex items-center justify-center gap-3 text-sm text-muted-foreground">
        {hasAnswer && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span className="font-medium text-emerald-700 dark:text-emerald-300">Answer recorded</span>
          </motion.div>
        )}

        {showSkip && onSkip && (
          <motion.div
            variants={buttonVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={onSkip}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary"
              disabled={isLoading}
              aria-label="Skip this question"
            >
              <SkipForward className="w-4 h-4 mr-1" aria-hidden="true" />
              Skip
            </Button>
          </motion.div>
        )}
      </div>

      {/* Enhanced Main Action Button */}
      <motion.div
        variants={buttonVariants}
        className="order-2 sm:order-3"
      >
        {showRetake && onRetake ? (
          <Button
            onClick={onRetake}
            variant="outline"
            size="lg"
            className="min-w-[160px] h-14 px-6 text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 hover:border-primary/50"
            disabled={isLoading}
            aria-label="Retake the quiz"
          >
            <RotateCcw className="w-5 h-5 mr-2" aria-hidden="true" />
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
            aria-label={submitLabel}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                Submitting...
              </>
            ) : isSuccess ? (
              <>
                <Check className="w-5 h-5 mr-2" aria-hidden="true" />
                Submitted!
              </>
            ) : (
              <>
                <Flag className="w-5 h-5 mr-2" aria-hidden="true" />
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
            aria-label={nextLabel}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                Loading...
              </>
            ) : isSuccess ? (
              <>
                <Check className="w-5 h-5 mr-2" aria-hidden="true" />
                Success!
              </>
            ) : (
              <>
                {nextLabel}
                <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
              </>
            )}
          </Button>
        )}
      </motion.div>
    </motion.div>
  )
}

export default QuizFooter
