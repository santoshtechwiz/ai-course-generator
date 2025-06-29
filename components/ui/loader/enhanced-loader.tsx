"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { LoaderCircle, Brain, Zap, Target, BookOpen, FileQuestion, CheckCircle2, Clock, Sparkles } from "lucide-react"

export interface EnhancedLoaderProps {
  isLoading: boolean
  message?: string
  subMessage?: string
  fullscreen?: boolean
  variant?: "shimmer" | "pulse" | "progress" | "dots" | "glow"
  showProgress?: boolean
  progress?: number
  speed?: "slow" | "normal" | "fast"
  theme?: "light" | "dark" | "system"
  className?: string
  showLogo?: boolean
  children?: React.ReactNode
  context?: "quiz" | "result" | "loading" | "submitting" | "processing"
}

export function EnhancedLoader({
  isLoading = false,
  message = "Loading...",
  subMessage,
  fullscreen = false,
  variant = "shimmer",
  showProgress = false,
  progress: externalProgress,
  speed = "normal",
  className,
  showLogo = false,
  children,
  context = "loading",
}: EnhancedLoaderProps) {
  const [progress, setProgress] = useState(externalProgress ?? 0)
  const [mounted, setMounted] = useState(false)
  const [currentIcon, setCurrentIcon] = useState(0)

  // Context-aware icons and messages
  const contextConfig = {
    quiz: {
      icons: [Brain, FileQuestion, Target, BookOpen],
      defaultMessage: "Loading quiz...",
      defaultSubMessage: "Preparing your questions",
    },
    result: {
      icons: [CheckCircle2, Target, Sparkles, Brain],
      defaultMessage: "Processing results...",
      defaultSubMessage: "Calculating your score",
    },
    loading: {
      icons: [LoaderCircle, Zap, Brain, Target],
      defaultMessage: "Loading...",
      defaultSubMessage: "Please wait",
    },
    submitting: {
      icons: [Clock, CheckCircle2, Zap, Target],
      defaultMessage: "Submitting answers...",
      defaultSubMessage: "Processing your responses",
    },
    processing: {
      icons: [Brain, Sparkles, Target, CheckCircle2],
      defaultMessage: "Processing...",
      defaultSubMessage: "Analyzing your performance",
    },
  }

  const config = contextConfig[context] || contextConfig.loading
  const icons = config.icons
  const contextMessage = message === "Loading..." ? config.defaultMessage : message
  const contextSubMessage = subMessage || config.defaultSubMessage

  useEffect(() => {
    setMounted(true)

    if (isLoading && showProgress && externalProgress === undefined) {
      const interval = setInterval(
        () => {
          setProgress((prev) => {
            const remaining = 100 - prev
            const increment = Math.max(0.4, remaining * 0.05)
            const newProgress = prev + increment
            return newProgress >= 98 ? 98 : newProgress
          })
        },
        speed === "fast" ? 60 : speed === "slow" ? 200 : 120,
      )

      return () => clearInterval(interval)
    } else if (externalProgress !== undefined) {
      setProgress(externalProgress)
    }

    return () => {}
  }, [isLoading, showProgress, externalProgress, speed])

  useEffect(() => {
    if (externalProgress !== undefined) {
      setProgress(externalProgress)
    }
  }, [externalProgress])

  useEffect(() => {
    if (!isLoading) {
      const timeout = setTimeout(() => {
        setProgress(0)
      }, 200)
      return () => clearTimeout(timeout)
    }
  }, [isLoading])

  // Context-aware icon rotation
  useEffect(() => {
    if (isLoading) {
      const iconInterval = setInterval(
        () => {
          setCurrentIcon((prev) => (prev + 1) % icons.length)
        },
        context === "result" ? 800 : 1200,
      )
      return () => clearInterval(iconInterval)
    }
  }, [isLoading, icons.length, context])

  if (!mounted) return null

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.25,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      transition: {
        duration: 0.15,
        ease: "easeIn",
      },
    },
  }

  const contentVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: 0.05,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -4,
      transition: { duration: 0.1 },
    },
  }

  const renderVariant = () => {
    switch (variant) {
      case "shimmer":
        return (
          <div className="relative overflow-hidden rounded-xl bg-primary/6 w-40 h-2.5 my-6">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 1.2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
          </div>
        )

      case "pulse":
        return (
          <div className="flex gap-2.5 my-6">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-3.5 h-3.5 rounded-full bg-primary"
                animate={{
                  scale: [0.7, 1.3, 0.7],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )

      case "progress":
        return (
          <div className="w-64 space-y-3 my-6">
            <div className="h-2.5 bg-primary/12 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              />
            </div>
            {showProgress && (
              <motion.p
                className="text-xs text-center text-muted-foreground tabular-nums font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {Math.round(progress)}%
              </motion.p>
            )}
          </div>
        )

      case "dots":
        return (
          <div className="flex space-x-2.5 my-6">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-primary rounded-full"
                animate={{
                  y: [0, -12, 0],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.1,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )

      case "glow":
        return (
          <motion.div
            className="relative w-18 h-18 rounded-2xl bg-primary/8 flex items-center justify-center my-6"
            animate={{
              boxShadow: ["0 0 0 0 rgba(var(--primary), 0.08)", "0 0 0 25px rgba(var(--primary), 0)"],
            }}
            transition={{
              duration: 1.2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            >
              <LoaderCircle className="w-9 h-9 text-primary" />
            </motion.div>
          </motion.div>
        )

      default:
        return (
          <div className="w-40 h-2.5 bg-primary/12 rounded-full overflow-hidden my-6">
            <motion.div
              className="h-full w-1/3 bg-primary rounded-full"
              animate={{ x: ["-100%", "250%"] }}
              transition={{
                duration: 1.2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          </div>
        )
    }
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "flex items-center justify-center",
            fullscreen ? "fixed inset-0 z-50 bg-background/96 backdrop-blur-md" : "w-full py-16",
            className,
          )}
        >
          <motion.div
            variants={contentVariants}
            className={cn(
              "flex flex-col items-center justify-center p-8 rounded-2xl max-w-sm mx-auto",
              fullscreen ? "bg-card/90 shadow-2xl backdrop-blur-sm border border-border/40" : "",
            )}
          >
            {showLogo && (
              <motion.div
                className="mb-6"
                key={currentIcon}
                initial={{ scale: 0.7, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.7, opacity: 0, rotate: 20 }}
                transition={{ duration: 0.25, type: "spring", stiffness: 300, damping: 25 }}
              >
                {React.createElement(icons[currentIcon], {
                  className: "w-14 h-14 text-primary",
                })}
              </motion.div>
            )}

            {renderVariant()}

            {contextMessage && (
              <motion.h3
                className="text-lg font-semibold text-foreground text-center mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {contextMessage}
              </motion.h3>
            )}

            {contextSubMessage && (
              <motion.p
                className="text-sm text-muted-foreground text-center max-w-xs leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                {contextSubMessage}
              </motion.p>
            )}

            {children && (
              <motion.div
                className="mt-6 w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                {children}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
