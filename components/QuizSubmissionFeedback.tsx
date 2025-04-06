"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface QuizSubmissionFeedbackProps {
  isSubmitting: boolean
  isSuccess: boolean
  isError: boolean
  score?: number
  totalQuestions?: number
  onContinue?: (proceed: boolean) => void
  errorMessage?: string
  quizType?: string
}

export function QuizSubmissionFeedback({
  isSubmitting,
  isSuccess,
  isError,
  score = 0,
  totalQuestions = 0,
  onContinue,
  errorMessage = "Something went wrong. Please try again.",
  quizType = "quiz",
}: QuizSubmissionFeedbackProps) {
  const [progress, setProgress] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)

  // Show the feedback component when submission starts
  useEffect(() => {
    if (isSubmitting || isSuccess || isError) {
      setShowFeedback(true)
    }
  }, [isSubmitting, isSuccess, isError])

  // Animate progress bar during submission
  useEffect(() => {
    if (isSubmitting) {
      setProgress(0)
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(timer)
            return 90
          }
          return prev + 10
        })
      }, 300)

      return () => clearInterval(timer)
    } else if (isSuccess) {
      setProgress(100)
    }
  }, [isSubmitting, isSuccess])

  // Handle continue button click
  const handleContinue = (proceed: boolean) => {
    setShowFeedback(false) // Close the modal
    if (onContinue) {
      onContinue(proceed)
    }
  }

  // Calculate percentage score
  const percentageScore = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0

  // Format quiz type for display
  const formattedQuizType = quizType.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())

  return (
    <AnimatePresence>
      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
        >
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-md">
            <Card className="p-6 shadow-lg">
              {isSubmitting && (
                <div className="space-y-6 text-center">
                  <h3 className="text-xl font-semibold">Saving Your Results</h3>
                  <div className="flex justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                      <Loader2 className="h-12 w-12 text-primary" />
                    </motion.div>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-muted-foreground">Please wait while we save your {formattedQuizType} results...</p>
                </div>
              )}

              {isSuccess && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  </motion.div>

                  <h3 className="text-xl font-semibold">Results Saved Successfully!</h3>

                  {totalQuestions > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Your Score</span>
                        <span className="font-medium">
                          {score} / {totalQuestions}
                        </span>
                      </div>
                      <Progress
                        value={percentageScore}
                        className="h-2"
                        indicatorClassName={
                          percentageScore >= 70
                            ? "bg-green-500"
                            : percentageScore >= 40
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }
                      />
                      <p className="font-medium text-lg">{percentageScore}%</p>
                    </div>
                  )}

                  <Button onClick={() => handleContinue(true)} className="w-full">
                    Continue
                  </Button>
                </motion.div>
              )}

              {isError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                  </motion.div>

                  <h3 className="text-xl font-semibold">Something Went Wrong</h3>

                  <p className="text-muted-foreground">{errorMessage}</p>

                  <Button onClick={() => handleContinue(false)} variant="outline" className="w-full">
                    Try Again
                  </Button>
                </motion.div>
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

