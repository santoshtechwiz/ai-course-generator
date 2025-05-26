"use client"

import { CheckCircle2, Loader2, AlertTriangle, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

interface QuizLoadingStepsProps {
  steps: { label: string; status: "pending" | "loading" | "done" | "error"; errorMsg?: string }[]
  className?: string
}

export function QuizLoadingSteps({ steps, className }: QuizLoadingStepsProps) {
  const [currentStep, setCurrentStep] = useState(0)

  // Find the current active step
  useEffect(() => {
    const activeIndex = steps.findIndex((step) => step.status === "loading")
    if (activeIndex !== -1) {
      setCurrentStep(activeIndex)
    }
  }, [steps])

  // Determine overall status for main icon
  const hasError = steps.some((s) => s.status === "error")
  const isLoading = steps.some((s) => s.status === "loading")
  const isDone = steps.every((s) => s.status === "done")

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  }

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
  }

  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[60vh] w-full px-4", className)}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-xl" />

        <div className="relative flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm border border-border/50 shadow-2xl rounded-3xl px-8 py-12 max-w-md w-full">
          {/* Main Status Icon */}
          <motion.div
            className="mb-8 flex flex-col items-center"
            variants={pulseVariants}
            animate={isLoading ? "pulse" : ""}
          >
            <div className="relative">
              {/* Animated ring for loading state */}
              {isLoading && (
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-primary/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
              )}

              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center",
                  hasError
                    ? "bg-red-100 text-red-600"
                    : isDone
                      ? "bg-green-100 text-green-600"
                      : "bg-blue-100 text-blue-600",
                )}
              >
                <AnimatePresence mode="wait">
                  {hasError ? (
                    <motion.div
                      key="error"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <AlertTriangle className="w-8 h-8" />
                    </motion.div>
                  ) : isDone ? (
                    <motion.div
                      key="done"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.5, ease: "backOut" }}
                    >
                      <CheckCircle2 className="w-8 h-8" />
                    </motion.div>
                  ) : (
                    <motion.div key="loading" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-center"
            >
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {hasError ? "Something went wrong" : isDone ? "Quiz Ready!" : "Preparing Quiz..."}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {hasError ? "Please try again" : isDone ? "Let's get started" : "This will just take a moment"}
              </p>
            </motion.div>
          </motion.div>

          {/* Steps List */}
          <motion.div className="w-full space-y-4">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl transition-all duration-300",
                  step.status === "loading"
                    ? "bg-blue-50 border border-blue-200"
                    : step.status === "done"
                      ? "bg-green-50 border border-green-200"
                      : step.status === "error"
                        ? "bg-red-50 border border-red-200"
                        : "bg-gray-50 border border-gray-200",
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <AnimatePresence mode="wait">
                    {step.status === "done" && (
                      <motion.div
                        key="done"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ duration: 0.3, ease: "backOut" }}
                      >
                        <CheckCircle2 className="text-green-600 w-5 h-5" />
                      </motion.div>
                    )}
                    {step.status === "loading" && (
                      <motion.div key="loading" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <div className="relative">
                          <Loader2 className="animate-spin text-blue-600 w-5 h-5" />
                          <motion.div
                            className="absolute inset-0"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          >
                            <Sparkles className="w-5 h-5 text-blue-400 opacity-60" />
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                    {step.status === "pending" && (
                      <motion.div key="pending" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white" />
                      </motion.div>
                    )}
                    {step.status === "error" && (
                      <motion.div
                        key="error"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ duration: 0.3 }}
                      >
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex-1 min-w-0">
                  <motion.div
                    initial={{ opacity: 0.7 }}
                    animate={{
                      opacity: step.status === "loading" ? 1 : step.status === "done" ? 0.9 : 0.7,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <span
                      className={cn(
                        "font-medium text-sm",
                        step.status === "error"
                          ? "text-red-700"
                          : step.status === "done"
                            ? "text-green-700"
                            : step.status === "loading"
                              ? "text-blue-700"
                              : "text-gray-600",
                      )}
                    >
                      {step.label}
                    </span>

                    {step.status === "error" && step.errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3 }}
                        className="text-xs text-red-600 mt-1 font-normal"
                      >
                        {step.errorMsg}
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            className="w-full mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${(steps.filter((s) => s.status === "done").length / steps.length) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Progress</span>
              <span>
                {steps.filter((s) => s.status === "done").length}/{steps.length}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
