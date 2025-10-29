// components/quiz/UnsubscribedQuizModal.tsx
"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Zap, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface UnsubscribedQuizModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateQuiz: () => void
  onSubscribe: () => void
  variant?: "block" | "dismiss" // "block" = must subscribe, "dismiss" = can continue but limited
  quizTitle?: string
}

const EMOJIS = ["✨", "🤖", "📚", "🎯", "💡", "⚡"]

export const UnsubscribedQuizModal: React.FC<UnsubscribedQuizModalProps> = ({
  isOpen,
  onClose,
  onCreateQuiz,
  onSubscribe,
  variant = "dismiss",
  quizTitle,
}) => {
  const randomEmojis = React.useMemo(() => {
    return Array.from({ length: 3 }, () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)])
  }, [isOpen])

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={variant === "dismiss" ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className={cn(
                "relative w-full max-w-md pointer-events-auto",
                "bg-white dark:bg-gray-900 border-6 border-black dark:border-white",
                "shadow-[8px_8px_0px_rgba(0,0,0,0.3)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.2)]",
                "p-6 sm:p-8 space-y-6 rounded-none overflow-hidden",
                // Slight tilt for brutalist feel
                "transform"
              )}
              style={{
                transform: "rotate(-1deg) perspective(1200px) rotateY(0deg)",
              }}
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              {/* Close button - only for dismiss variant */}
              {variant === "dismiss" && (
                <motion.button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-black dark:border-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-black dark:text-white" />
                </motion.button>
              )}

              {/* Floating emojis background */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {randomEmojis.map((emoji, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-4xl opacity-10"
                    initial={{ y: -100, opacity: 0 }}
                    animate={{
                      y: [0, 20, 0],
                      opacity: [0, 0.1, 0],
                      x: Math.sin(i) * 30,
                    }}
                    transition={{
                      duration: 4 + i,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      left: `${20 + i * 30}%`,
                      top: `${10 + i * 20}%`,
                    }}
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>

              {/* Content */}
              <div className="relative z-10 space-y-4 sm:space-y-6">
                {/* Header with icon */}
                <motion.div
                  className="flex items-center gap-3 sm:gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="p-3 sm:p-4 bg-yellow-300 dark:bg-yellow-400 border-4 border-black dark:border-white shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-black" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-black dark:text-white leading-tight">
                    Did you know?
                  </h2>
                </motion.div>

                {/* Main message */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 font-bold leading-relaxed">
                    This quiz is created by <span className="font-black text-black dark:text-white">CourseAI</span>!
                  </p>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 font-bold leading-relaxed">
                    Why not create your own quizzes? It's <span className="font-black text-black dark:text-white">free and fun</span> — engage your audience today.
                  </p>
                  {quizTitle && (
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 border-3 border-black dark:border-white">
                      <p className="text-xs sm:text-sm font-mono font-black text-gray-700 dark:text-gray-300 truncate">
                        Quiz: {quizTitle}
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* Feature highlights */}
                <motion.div
                  className="space-y-2 py-4 border-t-4 border-b-4 border-black dark:border-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {[
                    { icon: BookOpen, text: "Create unlimited quizzes" },
                    { icon: Zap, text: "Engage your audience instantly" },
                    { icon: Sparkles, text: "Track detailed analytics" },
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base font-bold text-gray-700 dark:text-gray-200"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.05 }}
                    >
                      <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-black dark:text-white flex-shrink-0" />
                      <span>{feature.text}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                  className="space-y-3 pt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {/* Primary CTA - Always show Create Quiz */}
                  <motion.button
                    onClick={onCreateQuiz}
                    className={cn(
                      "w-full px-4 sm:px-6 py-3 sm:py-4 font-black text-sm sm:text-base",
                      "bg-black dark:bg-white text-white dark:text-black",
                      "border-4 border-black dark:border-white",
                      "shadow-[4px_4px_0px_rgba(0,0,0,0.2)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.2)]",
                      "transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
                      "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,0.3)]",
                      "uppercase tracking-wide rounded-none",
                      "relative overflow-hidden group"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                      Create Quiz Now
                    </span>
                  </motion.button>

                  {/* Secondary CTA - Subscribe (always visible) */}
                  <motion.button
                    onClick={onSubscribe}
                    className={cn(
                      "w-full px-4 sm:px-6 py-3 sm:py-4 font-black text-sm sm:text-base",
                      "bg-cyan-500 dark:bg-cyan-600 text-black dark:text-white",
                      "border-4 border-black dark:border-white",
                      "shadow-[4px_4px_0px_rgba(0,0,0,0.2)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.2)]",
                      "transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
                      "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,0.3)]",
                      "uppercase tracking-wide rounded-none",
                      "relative overflow-hidden group"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                      Explore Premium
                    </span>
                  </motion.button>

                  {/* Dismiss button - only for dismiss variant */}
                  {variant === "dismiss" && (
                    <motion.button
                      onClick={onClose}
                      className={cn(
                        "w-full px-4 sm:px-6 py-2 sm:py-3 font-bold text-sm sm:text-base",
                        "bg-white dark:bg-gray-800 text-black dark:text-white",
                        "border-3 border-black dark:border-white",
                        "shadow-[2px_2px_0px_rgba(0,0,0,0.1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,0.1)]",
                        "transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700",
                        "rounded-none"
                      )}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      Continue with Limited Access
                    </motion.button>
                  )}
                </motion.div>

                {/* Footer text */}
                <motion.p
                  className="text-xs sm:text-sm text-center text-gray-600 dark:text-gray-400 font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {variant === "block"
                    ? "Subscribe to access all premium quizzes"
                    : "You can continue with basic features or upgrade for full access"}
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default UnsubscribedQuizModal