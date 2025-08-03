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

  const getButtonContent = (type: "next" | "submit") => {
    const state = type === "next" ? nextState : submitState
    const defaultLabel = type === "next" ? nextLabel : submitLabel

    switch (state) {
      case "loading":
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: type === "next" ? "Loading..." : "Submitting...",
        }
      case "success":
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          text: type === "next" ? "Success!" : "Submitted!",
        }
      case "error":
        return {
          icon: <RotateCcw className="h-4 w-4" />,
          text: "Try Again",
        }
      default:
        return {
          icon: type === "next" ? <ArrowRight className="h-4 w-4" /> : <Flag className="h-4 w-4" />,
          text: defaultLabel,
        }
    }
  }

  const nextContent = getButtonContent("next")
  const submitContent = getButtonContent("submit")

  return (
    <motion.div
      className="mt-6 bg-background/95 backdrop-blur-sm border-t border-border/20 p-4 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Previous Button */}
          <motion.div
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            transition={{ delay: 0.1 }}
          >
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={!canGoPrevious || isLoading}
              className={cn(
                "gap-1.5 min-w-[100px] h-9 bg-background/80 backdrop-blur-sm border-border/50 hover:border-primary/50",
                !canGoPrevious && "opacity-0 pointer-events-none"
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
          </motion.div>

          {/* Center Status */}
          <motion.div
            className="flex items-center gap-2 text-sm text-muted-foreground"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {!hasAnswer && !isLastQuestion && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium">Please select an answer</span>
              </div>
            )}
            
            {hasAnswer && !isLastQuestion && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-300 rounded-full border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-xs font-medium">Ready to continue</span>
              </div>
            )}

            {isLastQuestion && hasAnswer && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                <Flag className="w-3 h-3" />
                <span className="text-xs font-medium">Ready to finish</span>
              </div>
            )}

          
          </motion.div>

          {/* Next/Submit Button */}
          <div className="flex items-center gap-2">
            {showRetake && onRetake && (
              <motion.div
                variants={buttonVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
                transition={{ delay: 0.2 }}
              >
                <Button variant="outline" onClick={onRetake} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Retake
                </Button>
              </motion.div>
            )}

            <motion.div
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
              transition={{ delay: 0.3 }}
            >
              {isLastQuestion ? (
                <Button
                  onClick={onSubmit}
                  disabled={!hasAnswer || isLoading}
                  className={cn(
                    "gap-1.5 min-w-[120px] h-9 relative overflow-hidden",
                    "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700",
                    "shadow-lg hover:shadow-xl transition-all duration-200",
                    isSuccess && "from-emerald-500 to-green-500",
                    !hasAnswer && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {submitContent.icon}
                  {submitContent.text}
                  
                  {/* Success shimmer effect */}
                  {isSuccess && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 1,
                        ease: "linear",
                      }}
                    />
                  )}
                </Button>
              ) : (
                <Button
                  onClick={onNext}
                  disabled={!canGoNext || isLoading}
                  className={cn(
                    "gap-1.5 min-w-[120px] h-9 relative overflow-hidden",
                    "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
                    "shadow-lg hover:shadow-xl transition-all duration-200",
                    isSuccess && "from-blue-500 to-primary",
                    !canGoNext && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {nextContent.icon}
                  {nextContent.text}
                  
                  {/* Success shimmer effect */}
                  {isSuccess && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 1,
                        ease: "linear",
                      }}
                    />
                  )}
                </Button>
              )}
            </motion.div>
          </div>
        </div>

      
      </div>
    </motion.div>
  )
}