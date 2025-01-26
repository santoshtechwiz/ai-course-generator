"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useLoaderContext } from "../providers/LoadingContext"

const loaderVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

const circleVariants = {
  hidden: { pathLength: 0 },
  visible: {
    pathLength: 1,
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Number.POSITIVE_INFINITY,
    },
  },
}

const pulseVariants = {
  hidden: { scale: 0.8, opacity: 0.5 },
  visible: {
    scale: 1.2,
    opacity: 1,
    transition: {
      duration: 1,
      yoyo: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
}

export const AnimatedLoader = () => {
  const { isLoading } = useLoaderContext()

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={loaderVariants}
          aria-live="polite"
          aria-busy={isLoading}
        >
          <div className="relative w-40 h-40" role="status">
            <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* Outer circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                fill="none"
                variants={circleVariants}
              />

              {/* Inner pulsing circle */}
              <motion.circle cx="50" cy="50" r="20" fill="hsl(var(--primary))" variants={pulseVariants} />

              {/* AI "circuits" */}
              <motion.path
                d="M30 50 L70 50 M50 30 L50 70 M35 35 L65 65 M35 65 L65 35"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="text-2xl font-bold text-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                AI
              </motion.div>
            </div>
            <span className="sr-only">AI processing your request...</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

