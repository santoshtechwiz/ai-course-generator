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
}

export function QuizLoader({
  full = false,
  message = "Loading...",
  subMessage,
  className,
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
        <div className="text-center px-4">
          <motion.div
            className="mb-8 flex justify-center"
            variants={loaderVariants}
            animate="animate"
          >
            <Loader2 className="h-16 w-16 text-primary" />
          </motion.div>
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
        className="mb-4 flex justify-center"
        variants={loaderVariants}
        animate="animate"
      >
        <Loader2 className="h-10 w-10 text-primary" />
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
    </motion.div>
  )
}
