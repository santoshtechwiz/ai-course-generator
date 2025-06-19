"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Send, RotateCcw, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuizFooterProps {
  onNext?: () => void
  onPrevious?: () => void
  onSubmit?: () => void
  onRetake?: () => void
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
  isSubmitting?: boolean
  showRetake?: boolean
  className?: string
  hasAnswer?: boolean
}

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
  className,
  hasAnswer = false,
}: QuizFooterProps) {  const buttonVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
  }
  
  // Debug log for troubleshooting
  // console.log('QuizFooter props:', { canGoNext, hasAnswer, isLastQuestion })

  return (
    <motion.div
      className={cn("flex items-center justify-between gap-4 pt-8 mt-8 border-t border-border/30", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      {/* Previous Button */}
      <AnimatePresence>
        {canGoPrevious && onPrevious ? (
          <motion.div
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              variant="outline"
              onClick={onPrevious}
              className="group bg-background/50 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:bg-primary/5 rounded-2xl px-6 py-3 transition-all duration-300"
            >
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform duration-200" />
              Previous
            </Button>
          </motion.div>
        ) : (
          <div className="w-24" /> // Spacer for alignment
        )}
      </AnimatePresence>

      {/* Center Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Retake Button */}
        <AnimatePresence>
          {showRetake && onRetake && (
            <motion.div
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                variant="outline"
                onClick={onRetake}
                className="group bg-background/50 backdrop-blur-sm border-amber-200 hover:border-amber-300 hover:bg-amber-50 text-amber-700 rounded-2xl px-4 py-3 transition-all duration-300"
              >
                <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                Retry
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <AnimatePresence>
          {isLastQuestion && onSubmit && (
            <motion.div
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              whileHover={!isSubmitting ? "hover" : {}}
              whileTap={!isSubmitting ? "tap" : {}}
            >
              <Button
                onClick={onSubmit}
                disabled={isSubmitting || !hasAnswer}
                className={cn(
                  "group relative bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 rounded-2xl px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300",
                  isSubmitting && "opacity-80 cursor-not-allowed",
                )}
              >
                <AnimatePresence mode="wait">
                  {isSubmitting ? (
                    <motion.div
                      key="submitting"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Submitting...
                    </motion.div>
                  ) : (
                    <motion.div
                      key="submit"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center"
                    >
                      <Send className="w-4 h-4 mr-2 group-hover:translate-x-0.5 transition-transform duration-200" />
                      Submit Quiz
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Next Button */}
      <AnimatePresence>
        {!isLastQuestion && onNext ? (          <motion.div
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            whileHover={canGoNext ? "hover" : {}}
            whileTap={canGoNext ? "tap" : {}}
          >
            <Button
              onClick={onNext}
              disabled={!canGoNext}
              className={cn(
                "group bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white border-0 rounded-2xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300",
                !canGoNext && "opacity-50 cursor-not-allowed hover:shadow-lg",
              )}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform duration-200" />
            </Button>
          </motion.div>
        ) : (
          <div className="w-24" /> // Spacer for alignment
        )}
      </AnimatePresence>

      {/* Answer Status Indicator */}
      <AnimatePresence>
        {hasAnswer && !isLastQuestion && (
          <motion.div
            className="absolute -top-4 right-0 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium shadow-sm"
            initial={{ opacity: 0, scale: 0, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <CheckCircle className="w-3 h-3 mr-1 inline" />
            Answered
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
