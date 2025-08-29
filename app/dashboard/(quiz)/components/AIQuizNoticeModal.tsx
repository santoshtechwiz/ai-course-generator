"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Brain, Zap, Check } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Simple checkbox component if not available
const Checkbox = ({ 
  id, 
  checked, 
  onCheckedChange, 
  className 
}: { 
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}) => (
  <button
    id={id}
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      "w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center transition-colors",
      checked && "bg-blue-500 border-blue-500",
      className
    )}
  >
    {checked && <Check className="w-3 h-3 text-white" />}
  </button>
)

interface AIQuizNoticeModalProps {
  isOpen: boolean
  onClose: () => void
  onStartQuiz: () => void
  onCreateQuiz: () => void
  quizType?: string
  onDismissWithPreference?: (preference: 'never' | 'less' | 'normal') => void
}

const AIQuizNoticeModal = ({
  isOpen,
  onClose,
  onStartQuiz,
  onCreateQuiz,
  quizType = "quiz",
  onDismissWithPreference
}: AIQuizNoticeModalProps) => {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const handleClose = () => {
    if (dontShowAgain) {
      // Use new preference system if available
      if (onDismissWithPreference) {
        onDismissWithPreference('never')
      } else {
        localStorage.setItem("ai-quiz-notice-dismissed", "true")
      }
    }
    onClose()
  }

  const handleCloseWithPreference = (preference: 'never' | 'less' | 'normal') => {
    if (onDismissWithPreference) {
      onDismissWithPreference(preference)
    } else {
      // Fallback to old system
      if (preference === 'never') {
        localStorage.setItem("ai-quiz-notice-dismissed", "true")
      }
    }
    onClose()
  }

  const handleStartQuiz = () => {
    if (dontShowAgain) {
      localStorage.setItem("ai-quiz-notice-dismissed", "true")
    }
    onStartQuiz()
  }

  const handleCreateQuiz = () => {
    if (dontShowAgain) {
      localStorage.setItem("ai-quiz-notice-dismissed", "true")
    }
    onCreateQuiz()
  }

  // Backdrop variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  }

  // Modal variants
  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      y: 50,
      rotateX: -15
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.4
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: 50,
      rotateX: 15,
      transition: {
        duration: 0.2
      }
    }
  }

  // AI icon animation variants
  const aiIconVariants = {
    initial: { scale: 1, rotate: 0 },
    animate: {
      scale: [1, 1.1, 1],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  // Sparkle animation variants
  const sparkleVariants = {
    initial: { opacity: 0, scale: 0 },
    animate: {
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        delay: Math.random() * 2
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className={cn(
              "relative w-full max-w-md mx-auto",
              "bg-gradient-to-br from-white via-white to-blue-50/30",
              "dark:from-gray-900 dark:via-gray-900 dark:to-blue-950/30",
              "rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50",
              "overflow-hidden"
            )}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
          >
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
            
            {/* Floating sparkles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-blue-400 rounded-full"
                  style={{
                    left: `${20 + (i * 15)}%`,
                    top: `${15 + (i * 10)}%`,
                  }}
                  variants={sparkleVariants}
                  initial="initial"
                  animate="animate"
                />
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className={cn(
                "absolute top-4 right-4 z-10",
                "w-8 h-8 rounded-full",
                "bg-gray-100 dark:bg-gray-800",
                "hover:bg-gray-200 dark:hover:bg-gray-700",
                "flex items-center justify-center",
                "transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              )}
              aria-label="Close modal"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Content */}
            <div className="relative p-8 text-center">
              {/* AI Icon with animation */}
              <motion.div
                className="mx-auto mb-6 relative"
                variants={aiIconVariants}
                initial="initial"
                animate="animate"
              >
                <div className={cn(
                  "w-16 h-16 mx-auto",
                  "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500",
                  "rounded-2xl shadow-lg",
                  "flex items-center justify-center",
                  "relative overflow-hidden"
                )}>
                  <Brain className="w-8 h-8 text-white relative z-10" />
                  
                  {/* Animated background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </div>

                {/* Floating sparkles around icon */}
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3"
                  animate={{
                    scale: [0, 1, 0],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0.5
                  }}
                >
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.h2
                id="modal-title"
                className="text-2xl font-bold text-gray-900 dark:text-white mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                AI-Generated Quiz
              </motion.h2>

              {/* Description */}
              <motion.p
                id="modal-description"
                className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                This quiz was generated by AI to match your learning style. 
                Want to create your own quiz using AI?
              </motion.p>

              {/* Action buttons */}
              <motion.div
                className="space-y-3 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {/* Start Quiz Button */}
                <Button
                  onClick={handleStartQuiz}
                  className={cn(
                    "w-full h-12",
                    "bg-gradient-to-r from-green-500 to-emerald-500",
                    "hover:from-green-600 hover:to-emerald-600",
                    "text-white font-semibold",
                    "shadow-lg hover:shadow-xl",
                    "transition-all duration-200",
                    "focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  )}
                >
                  <motion.div
                    className="flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    ✅ Start Quiz
                  </motion.div>
                </Button>

                {/* Create Quiz Button */}
                <Button
                  onClick={handleCreateQuiz}
                  variant="outline"
                  className={cn(
                    "w-full h-12",
                    "border-2 border-blue-200 dark:border-blue-800",
                    "hover:bg-blue-50 dark:hover:bg-blue-950/30",
                    "hover:border-blue-300 dark:hover:border-blue-700",
                    "font-semibold",
                    "transition-all duration-200",
                    "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  )}
                >
                  <motion.div
                    className="flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Zap className="w-4 h-4" />
                    Create My Own Quiz
                  </motion.div>
                </Button>
              </motion.div>

              {/* Don't show again preference buttons */}
              <motion.div
                className="flex flex-col gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
                  How often would you like to see this?
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => handleCloseWithPreference('never')}
                    variant="ghost"
                    size="sm"
                    className="text-xs px-3 py-1 h-auto"
                  >
                    Never
                  </Button>
                  <Button
                    onClick={() => handleCloseWithPreference('less')}
                    variant="ghost"
                    size="sm"
                    className="text-xs px-3 py-1 h-auto"
                  >
                    Less often
                  </Button>
                  <Button
                    onClick={() => handleCloseWithPreference('normal')}
                    variant="ghost"
                    size="sm"
                    className="text-xs px-3 py-1 h-auto"
                  >
                    Keep showing
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AIQuizNoticeModal