"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Check, RotateCcw, Loader2, CheckCircle2, Flag, SkipForward } from 'lucide-react'
import { cn, getColorClasses } from "@/lib/utils"

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
  disabled?: boolean
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
  disabled = false,
}: QuizFooterProps) {
  const isLoading = isSubmitting || submitState === "loading" || nextState === "loading"
  const isSuccess = submitState === "success" || nextState === "success"
  
  // Get Neobrutalism utilities
  const { buttonPrimary, buttonSecondary } = getColorClasses()

  return (
    <motion.div
      className={cn(
        "w-full flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 mt-10 border-t-3 border-border",
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
            className={cn(
              buttonSecondary,
              "min-w-[160px] h-12 px-6 text-base transition-all duration-100"
            )}
            disabled={isLoading || disabled}
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
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-none",
              "bg-success/10 dark:bg-success/5",
              "border-2 border-success/20",
              "shadow-[2px_2px_0px_0px_hsl(var(--success)/0.2)]"
            )}
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="w-5 h-5 text-success" aria-hidden="true" />
            <span className="font-bold text-success">Answer recorded</span>
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
              className={cn(
                "text-muted-foreground hover:text-primary font-bold",
                "border-2 border-transparent hover:border-border",
                "hover:shadow-[2px_2px_0px_0px_hsl(var(--border))]"
              )}
              disabled={isLoading || disabled}
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
            className={cn(
              buttonSecondary,
              "min-w-[160px] h-12 px-6 text-base transition-all duration-100"
            )}
            disabled={isLoading || disabled}
            aria-label="Retake the quiz"
          >
            <RotateCcw className="w-5 h-5 mr-2" aria-hidden="true" />
            Retake Quiz
          </Button>
        ) : isLastQuestion ? (
          <Button
            onClick={onSubmit}
            className={cn(
              buttonPrimary,
              "min-w-[160px] h-12 px-6 text-base"
            )}
            disabled={!hasAnswer || isLoading || disabled}
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
            className={cn(
              buttonPrimary,
              "min-w-[160px] h-12 px-6 text-base"
            )}
            disabled={!canGoNext || isLoading || disabled}
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


