"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface LoadingStep {
  label: string
  status: "loading" | "completed" | "pending"
}

interface QuizLoadingStepsProps {
  steps: LoadingStep[]
  title?: string
  subtitle?: string
}

export function QuizLoadingSteps({
  steps,
  title = "Loading Quiz",
  subtitle = "Please wait while we prepare everything",
}: QuizLoadingStepsProps) {
  const [progress, setProgress] = useState(0)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Calculate progress based on completed steps
  useEffect(() => {
    const completedSteps = steps.filter((step) => step.status === "completed").length
    const newProgress = (completedSteps / steps.length) * 100
    setProgress(newProgress)

    // Find current loading step
    const loadingStepIndex = steps.findIndex((step) => step.status === "loading")
    if (loadingStepIndex !== -1) {
      setCurrentStepIndex(loadingStepIndex)
    }
  }, [steps])

  const currentStep = steps[currentStepIndex]

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Animated Logo/Icon */}
            <motion.div
              className="relative mx-auto w-16 h-16"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Loader2 className="w-8 h-8 text-white" />
                </motion.div>
              </div>
            </motion.div>

            {/* Title and Subtitle */}
            <div className="space-y-2">
              <motion.h2
                className="text-xl font-semibold text-foreground"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {title}
              </motion.h2>
              <motion.p
                className="text-sm text-muted-foreground"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {subtitle}
              </motion.p>
            </div>

            {/* Progress Bar */}
            <motion.div
              className="space-y-3"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(progress)}% complete</span>
                <span>
                  {steps.filter((s) => s.status === "completed").length} of {steps.length}
                </span>
              </div>
            </motion.div>

            {/* Current Step */}
            <AnimatePresence mode="wait">
              {currentStep && (
                <motion.div
                  key={currentStep.label}
                  className="flex items-center justify-center gap-3 py-3"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative">
                    {currentStep.status === "loading" ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      >
                        <Loader2 className="w-4 h-4 text-blue-500" />
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Check className="w-4 h-4 text-green-500" />
                      </motion.div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground">{currentStep.label}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Steps List (Compact) */}
            {steps.length > 1 && (
              <motion.div
                className="space-y-2"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {steps.map((step, index) => (
                  <motion.div
                    key={step.label}
                    className="flex items-center gap-3 text-xs"
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <div className="relative">
                      {step.status === "completed" ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Check className="w-3 h-3 text-green-500" />
                        </motion.div>
                      ) : step.status === "loading" ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        >
                          <Loader2 className="w-3 h-3 text-blue-500" />
                        </motion.div>
                      ) : (
                        <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </div>
                    <span
                      className={`${
                        step.status === "completed"
                          ? "text-green-600 dark:text-green-400"
                          : step.status === "loading"
                            ? "text-blue-600 dark:text-blue-400 font-medium"
                            : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Animated Dots */}
            <motion.div
              className="flex justify-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
