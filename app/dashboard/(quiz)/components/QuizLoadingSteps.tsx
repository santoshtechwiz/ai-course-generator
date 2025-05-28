"use client"

import { CheckCircle2, Loader2, AlertTriangle, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

interface QuizLoadingStepsProps {
  steps: { label: string; status: "pending" | "loading" | "completed" | "error"; errorMsg?: string }[]
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

  // Calculate progress
  const completedSteps = steps.filter((s) => s.status === "completed").length
  const progressPercentage = (completedSteps / steps.length) * 100

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
  }

  const stepVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  }

  const lineVariants = {
    hidden: { scaleY: 0 },
    visible: {
      scaleY: 1,
      transition: { duration: 0.8, ease: "easeInOut" },
    },
  }

  return (
    <div className={cn("flex items-center justify-center min-h-[60vh] w-full px-4", className)}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Preparing Your Quiz</h2>
          <p className="text-muted-foreground">Setting up everything for the best experience</p>
        </motion.div>

        {/* Progress Line Container */}
        <div className="relative">
          {/* Background Line */}
          <motion.div
            className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"
            variants={lineVariants}
            style={{ originY: 0 }}
          />

          {/* Progress Line */}
          <motion.div
            className="absolute left-6 top-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"
            initial={{ height: 0 }}
            animate={{ height: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{ originY: 0 }}
          />

          {/* Steps */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div key={index} variants={stepVariants} className="relative flex items-start gap-6">
                {/* Step Icon */}
                <div className="relative z-10 flex-shrink-0">
                  <motion.div
                    className={cn(
                      "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                      step.status === "completed"
                        ? "bg-green-500 border-green-500 text-white"
                        : step.status === "loading"
                          ? "bg-blue-500 border-blue-500 text-white"
                          : step.status === "error"
                            ? "bg-red-500 border-red-500 text-white"
                            : "bg-background border-border text-muted-foreground",
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <AnimatePresence mode="wait">
                      {step.status === "completed" && (
                        <motion.div
                          key="completed"
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 90 }}
                          transition={{ duration: 0.3, ease: "backOut" }}
                        >
                          <CheckCircle2 className="w-6 h-6" />
                        </motion.div>
                      )}
                      {step.status === "loading" && (
                        <motion.div key="loading" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Loader2 className="w-6 h-6 animate-spin" />
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
                          <AlertTriangle className="w-6 h-6" />
                        </motion.div>
                      )}
                      {step.status === "pending" && (
                        <motion.div key="pending" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Circle className="w-6 h-6" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Pulse effect for loading state */}
                  {step.status === "loading" && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-blue-500"
                      animate={{ scale: [1, 1.4], opacity: [0.7, 0] }}
                      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
                    />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0 pt-2">
                  <motion.div
                    initial={{ opacity: 0.7 }}
                    animate={{
                      opacity: step.status === "loading" ? 1 : step.status === "completed" ? 0.9 : 0.7,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3
                      className={cn(
                        "font-semibold text-base leading-tight",
                        step.status === "error"
                          ? "text-red-600"
                          : step.status === "completed"
                            ? "text-green-600"
                            : step.status === "loading"
                              ? "text-blue-600"
                              : "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </h3>

                    {/* Loading dots animation */}
                    {step.status === "loading" && (
                      <motion.div
                        className="flex items-center gap-1 mt-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{
                              duration: 1,
                              repeat: Number.POSITIVE_INFINITY,
                              delay: i * 0.2,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </motion.div>
                    )}

                    {/* Error message */}
                    {step.status === "error" && step.errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3 }}
                        className="text-sm text-red-600 mt-2 font-normal"
                      >
                        {step.errorMsg}
                      </motion.div>
                    )}

                    {/* Success checkmark animation */}
                    {step.status === "completed" && (
                      <motion.div
                        className="text-sm text-green-600 mt-1"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        ✓ Complete
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Progress Summary */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
            <span className="text-sm font-medium text-muted-foreground">
              {completedSteps} of {steps.length} steps completed
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
