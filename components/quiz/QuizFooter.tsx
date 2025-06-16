"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Send, RotateCcw } from "lucide-react"
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
}: QuizFooterProps) {
  return (
    <motion.div
      className={cn(
        "bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 border-2 border-primary/20 border-t-0 rounded-b-3xl p-6 shadow-lg",
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.3,
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Previous Button */}
        <motion.div whileHover={{ scale: canGoPrevious ? 1.05 : 1 }} whileTap={{ scale: canGoPrevious ? 0.95 : 1 }}>
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className={cn(
              "gap-2 px-6 py-3 rounded-xl border-2 font-semibold transition-all duration-300",
              canGoPrevious
                ? "hover:bg-muted/50 hover:border-primary/40 hover:text-primary hover:shadow-lg"
                : "opacity-50 cursor-not-allowed",
            )}
          >
            <motion.div
              animate={canGoPrevious ? { x: [-2, 0, -2] } : {}}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.div>
            Previous
          </Button>
        </motion.div>

        {/* Center Content */}
        <div className="flex-1 flex justify-center">
          {showRetake && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <Button
                variant="secondary"
                onClick={onRetake}
                className="gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/80 hover:to-secondary shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <RotateCcw className="w-4 h-4" />
                </motion.div>
                Retake Quiz
              </Button>
            </motion.div>
          )}
        </div>

        {/* Next/Submit Button */}
        <motion.div
          whileHover={{ scale: canGoNext || isLastQuestion ? 1.05 : 1 }}
          whileTap={{ scale: canGoNext || isLastQuestion ? 0.95 : 1 }}
        >
          {isLastQuestion ? (
            <Button
              onClick={onSubmit}
              disabled={!canGoNext || isSubmitting}
              className={cn(
                "gap-2 px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-all duration-300",
                canGoNext && !isSubmitting
                  ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 hover:shadow-xl ring-2 ring-primary/20 hover:ring-primary/40"
                  : "opacity-50 cursor-not-allowed",
              )}
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                />
              ) : (
                <motion.div
                  animate={canGoNext ? { x: [0, 2, 0] } : {}}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  <Send className="w-5 h-5" />
                </motion.div>
              )}
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={!canGoNext}
              className={cn(
                "gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300",
                canGoNext
                  ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 hover:shadow-xl ring-2 ring-primary/20 hover:ring-primary/40"
                  : "opacity-50 cursor-not-allowed",
              )}
            >
              Next
              <motion.div
                animate={canGoNext ? { x: [0, 2, 0] } : {}}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </Button>
          )}
        </motion.div>
      </div>

      {/* Enhanced Help Text */}
      {!canGoNext && !showRetake && (
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <motion.p
            className="text-muted-foreground text-sm bg-muted/30 px-4 py-2 rounded-xl border border-muted/40 inline-block"
            animate={{
              opacity: [0.7, 1, 0.7],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            ✨ Select an answer to continue
          </motion.p>
        </motion.div>
      )}
    </motion.div>
  )
}
