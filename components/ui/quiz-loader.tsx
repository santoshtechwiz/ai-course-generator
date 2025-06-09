"use client"

import React from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuizLoaderProps {
  /**
   * Display as full-screen loader (true) or inline loader (false)
   */
  full?: boolean
  /**
   * Primary loading message
   */
  message?: string
  /**
   * Optional secondary message displayed below the main message
   */
  subMessage?: string
  /**
   * Optional class name for additional styling
   */
  className?: string
  /**
   * Size of the loader - can be 'sm', 'md' or 'lg'
   */
  size?: "sm" | "md" | "lg"
  /**
   * Optional timing indicator - renders a small visual cue that shows something is happening
   */
  showTiming?: boolean
  /**
   * Optional steps for loading process - if provided, will render a stepper
   */
  steps?: Array<{
    label: string
    status: "loading" | "completed" | "pending"
  }>
}

export function QuizLoader({
  full = false,
  message = "Loading...",
  subMessage,
  className,
  size = "md",
  showTiming = false,
  steps,
}: QuizLoaderProps) {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  }

  const loaderVariants = {
    animate: {
      rotate: 360,
      transition: { duration: 1, repeat: Infinity, ease: "linear" },
    },
  }

  const contentVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.2 } },
  }

  const secondaryTextVariants = {
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 0.8, y: 0, transition: { delay: 0.3 } },
  }

  const loaderSizes = {
    sm: { loader: "h-8 w-8", container: "mb-3" },
    md: { loader: "h-10 w-10", container: "mb-4" },
    lg: { loader: "h-16 w-16", container: "mb-8" },
  }

  // If steps are provided, use the QuizLoadingSteps component
  if (steps) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md border-0 shadow-lg bg-card p-8 rounded-lg">
          <div className="text-center space-y-6">
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
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-8 h-8 text-white" />
                </motion.div>
              </div>
            </motion.div>

            <motion.h2
              className="text-xl font-semibold text-foreground"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {message}
            </motion.h2>
            
            {subMessage && (
              <motion.p
                className="text-sm text-muted-foreground"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {subMessage}
              </motion.p>
            )}

            <motion.div className="space-y-2 mt-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.label}
                  className="flex items-center gap-3 text-sm"
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
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                      </motion.div>
                    ) : step.status === "loading" ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
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

            {showTiming && (
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
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (full) {
    return (
      <motion.div
        className={cn(
          "fixed inset-0 flex flex-col items-center justify-center bg-background z-50",
          className
        )}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={containerVariants}
      >
        <div className="text-center px-4 max-w-md w-full">
          {showSpinner && (
            <motion.div
              className="mb-8 flex justify-center"
              variants={loaderVariants}
              animate="animate"
            >
              <Loader2 className="h-16 w-16 text-primary" />
            </motion.div>
          )}
          
          <motion.h2
            className="text-2xl font-bold text-foreground mb-2"
            variants={contentVariants}
          >
            {message}
          </motion.h2>
          
          {subMessage && (
            <motion.p
              className="text-muted-foreground"
              variants={secondaryTextVariants}
            >
              {subMessage}
            </motion.p>
          )}

          {/* Display progress bar if progress is provided */}
          {displayProgress !== undefined && (
            <motion.div 
              className="mt-6 space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: `${displayProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{displayProgress}% complete</span>
                {steps && (
                  <span>{steps.filter(s => s.status === "completed").length} of {steps.length}</span>
                )}
              </div>
            </motion.div>
          )}

          {/* Display steps if provided */}
          {steps && steps.length > 0 && (
            <motion.div
              className="mt-8 space-y-3 text-left"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {steps.map((step, index) => (
                <motion.div
                  key={step.label}
                  className="flex items-center gap-3"
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
                        <Check className="w-5 h-5 text-green-500" />
                      </motion.div>
                    ) : step.status === "loading" ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="w-5 h-5 text-primary" />
                      </motion.div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm",
                      step.status === "completed"
                        ? "text-green-600 dark:text-green-400"
                        : step.status === "loading"
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Animated dots for timing indicator */}
          {showTiming && (
            <motion.div
              className="flex justify-center gap-1 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-primary rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    )
  }

  // Inline loader
  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center py-8 px-4",
        className
      )}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={containerVariants}
    >
      <motion.div
        className={cn("flex justify-center", loaderSizes[size].container)}
        variants={loaderVariants}
        animate="animate"
      >
        <Loader2 className={cn("text-primary", loaderSizes[size].loader)} />
      </motion.div>
      <motion.p
        className="text-lg font-medium text-center"
        variants={contentVariants}
      >
        {message}
      </motion.p>
      {subMessage && (
        <motion.p
          className="text-sm text-muted-foreground text-center mt-1"
          variants={secondaryTextVariants}
        >
          {subMessage}
        </motion.p>
      )}
      
      {showTiming && (
        <motion.div 
          className="flex mt-4 space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-primary/40"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
