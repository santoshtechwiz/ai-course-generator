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
        staggerChildren: 0.15,
      },
    },
  }

  const stepVariants = {
    hidden: { opacity: 0, x: -50, scale: 0.8 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        type: "spring",
        stiffness: 100,
      },
    },
  }

  const lineVariants = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: { duration: 1, ease: "easeInOut" },
    },
  }

  const progressLineVariants = {
    hidden: { width: 0 },
    visible: {
      width: `${progressPercentage}%`,
      transition: { duration: 1.2, ease: "easeInOut" },
    },
  }

  return (
    <div className={cn("flex items-center justify-center min-h-[60vh] w-full px-4", className)}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-6xl">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10"
              animate={{ scale: [1.1, 1, 1.1] }}
              transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
            />
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">Preparing Your Quiz</h2>
          <p className="text-lg text-muted-foreground">Setting up everything for the best experience</p>
        </motion.div>

        {/* Horizontal Timeline Container */}
        <div className="relative">
          {/* Background Line */}
          <motion.div
            className="absolute top-8 left-8 right-8 h-0.5 bg-border/60"
            variants={lineVariants}
            style={{ originX: 0 }}
          />

          {/* Progress Line */}
          <motion.div
            className="absolute top-8 left-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm"
            variants={progressLineVariants}
            style={{ originX: 0 }}
          />

          {/* Steps Container */}
          <div className="flex justify-between items-start relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={stepVariants}
                className="flex flex-col items-center relative"
                style={{ flex: 1 }}
              >
                {/* Step Icon */}
                <div className="relative z-10 mb-6">
                  <motion.div
                    className={cn(
                      "w-16 h-16 rounded-full border-3 flex items-center justify-center transition-all duration-500 shadow-lg",
                      step.status === "completed"
                        ? "bg-green-500 border-green-500 text-white shadow-green-500/25"
                        : step.status === "loading"
                          ? "bg-blue-500 border-blue-500 text-white shadow-blue-500/25"
                          : step.status === "error"
                            ? "bg-red-500 border-red-500 text-white shadow-red-500/25"
                            : "bg-background border-border text-muted-foreground shadow-gray-200/50",
                    )}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    animate={step.status === "loading" ? { y: [0, -4, 0] } : {}}
                    transition={
                      step.status === "loading"
                        ? {
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          }
                        : {}
                    }
                  >
                    <AnimatePresence mode="wait">
                      {step.status === "completed" && (
                        <motion.div
                          key="completed"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          transition={{ duration: 0.5, ease: "backOut" }}
                        >
                          <CheckCircle2 className="w-8 h-8" />
                        </motion.div>
                      )}
                      {step.status === "loading" && (
                        <motion.div
                          key="loading"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Loader2 className="w-8 h-8 animate-spin" />
                        </motion.div>
                      )}
                      {step.status === "error" && (
                        <motion.div
                          key="error"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          transition={{ duration: 0.4 }}
                        >
                          <AlertTriangle className="w-8 h-8" />
                        </motion.div>
                      )}
                      {step.status === "pending" && (
                        <motion.div key="pending" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Circle className="w-8 h-8" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Pulse effect for loading state */}
                  {step.status === "loading" && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full border-3 border-blue-500/50"
                        animate={{ scale: [1, 1.6], opacity: [0.8, 0] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border-3 border-blue-400/30"
                        animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeOut", delay: 0.3 }}
                      />
                    </>
                  )}

                  {/* Glow effect for completed state */}
                  {step.status === "completed" && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-green-500/20"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                    />
                  )}
                </div>

                {/* Step Content */}
                <div className="text-center max-w-[200px]">
                  <motion.div
                    initial={{ opacity: 0.6 }}
                    animate={{
                      opacity: step.status === "loading" ? 1 : step.status === "completed" ? 0.95 : 0.7,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3
                      className={cn(
                        "font-semibold text-lg leading-tight mb-2",
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
                        className="flex items-center justify-center gap-1.5 mt-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-blue-500 rounded-full"
                            animate={{
                              scale: [1, 1.4, 1],
                              opacity: [0.4, 1, 0.4],
                              y: [0, -4, 0],
                            }}
                            transition={{
                              duration: 1.2,
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
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="text-sm text-red-600 mt-2 font-normal bg-red-50 px-3 py-2 rounded-lg border border-red-200"
                      >
                        {step.errorMsg}
                      </motion.div>
                    )}

                    {/* Success indicator */}
                    {step.status === "completed" && (
                      <motion.div
                        className="text-sm text-green-600 mt-2 font-medium"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                        >
                          ✓
                        </motion.span>{" "}
                        Complete
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
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-muted/50 to-muted/30 rounded-full border border-border/50 shadow-sm"
            whileHover={{ scale: 1.02, y: -1 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <span className="text-base font-medium text-muted-foreground">
              {completedSteps} of {steps.length} steps completed
            </span>
            <motion.div
              className="text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
            >
              {Math.round(progressPercentage)}%
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
