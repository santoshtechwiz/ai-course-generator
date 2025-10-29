"use client"

import React, { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Bot, BookOpen, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuizCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubscribe?: () => void
  onCreateQuiz: () => void
  mode?: "block" | "dismiss" // block = must interact, dismiss = can continue limited
  isAuthenticated?: boolean
}

export function QuizCreationModal({
  isOpen,
  onClose,
  onSubscribe,
  onCreateQuiz,
  mode = "block",
  isAuthenticated = true
}: QuizCreationModalProps) {
  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleBackdropClick = (event: React.MouseEvent) => {
    // Only close on backdrop click if in dismiss mode
    if (mode === "dismiss" && event.target === event.currentTarget) {
      onClose()
    }
  }

  const handleCreateQuiz = () => {
    onCreateQuiz()
    if (mode === "dismiss") {
      onClose()
    }
  }

  const handleSubscribe = () => {
    if (onSubscribe) {
      onSubscribe()
    }
    if (mode === "dismiss") {
      onClose()
    }
  }

  const handleContinueLimited = () => {
    if (mode === "dismiss") {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
          />

          {/* Modal */}
          <motion.div
            className={cn(
              "relative max-w-md w-full mx-auto bg-card border-6 border-border shadow-[8px_8px_0px_0px_var(--color-border)] z-50",
              "transform rotate-1 hover:rotate-0 transition-transform duration-300"
            )}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.3
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
          >
            {/* Close button - only show in dismiss mode */}
            {mode === "dismiss" && (
              <button
                onClick={onClose}
                className="absolute -top-3 -right-3 w-10 h-10 bg-destructive border-4 border-border shadow-[4px_4px_0px_0px_var(--color-border)] hover:shadow-[6px_6px_0px_0px_var(--color-border)] transition-all duration-200 z-10 flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-destructive-foreground font-black" />
              </button>
            )}

            {/* Header with playful elements */}
            <div className="p-6 pb-4 border-b-4 border-border bg-gradient-to-r from-accent/10 to-accent/5">
              <div className="flex items-center justify-center gap-2 mb-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                >
                  <Sparkles className="w-6 h-6 text-accent" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                >
                  <Bot className="w-8 h-8 text-accent" />
                </motion.div>
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse" }}
                >
                  <BookOpen className="w-6 h-6 text-accent" />
                </motion.div>
              </div>

              <h2
                id="modal-title"
                className="text-2xl font-black text-center text-foreground mb-2 tracking-tight"
              >
                DID YOU KNOW?
              </h2>
            </div>

            {/* Content */}
            <div className="p-6">
              <p
                id="modal-description"
                className="text-base font-bold text-center text-foreground leading-relaxed mb-6"
              >
                {isAuthenticated ? (
                  <>
                    This quiz is created by <span className="text-accent font-black">CourseAI</span>!
                    <br />
                    <span className="text-lg">Why not create your own quizzes?</span>
                    <br />
                    <span className="text-muted-foreground font-normal">It's free and fun — engage your audience today.</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg font-black">Join CourseAI</span> to create amazing quizzes!
                    <br />
                    <span className="text-accent font-black">Sign up for free</span> and start building interactive quizzes that engage your audience.
                    <br />
                    <span className="text-muted-foreground font-normal">No credit card required — get started instantly!</span>
                  </>
                )}
              </p>

              {/* CTA Buttons */}
              <div className="space-y-3">
                {/* Primary CTA - Create Quiz */}
                <motion.button
                  onClick={handleCreateQuiz}
                  className={cn(
                    "w-full py-4 px-6 bg-accent border-4 border-border shadow-[4px_4px_0px_0px_var(--color-border)]",
                    "hover:shadow-[6px_6px_0px_0px_var(--color-border)] hover:-translate-y-1",
                    "transition-all duration-200 font-black text-lg text-accent-foreground",
                    "flex items-center justify-center gap-3",
                    "focus:outline-none focus:ring-4 focus:ring-accent/50"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  aria-label={isAuthenticated ? "Create your own quiz" : "Sign up for free"}
                >
                  <Zap className="w-6 h-6" />
                  {isAuthenticated ? "CREATE YOUR OWN QUIZ" : "SIGN UP FREE"}
                  <Zap className="w-6 h-6" />
                </motion.button>

                {/* Secondary CTA - Subscribe (only for authenticated users) */}
                {isAuthenticated && onSubscribe && (
                  <motion.button
                    onClick={handleSubscribe}
                    className={cn(
                      "w-full py-3 px-6 bg-card border-4 border-border shadow-[4px_4px_0px_0px_var(--color-border)]",
                      "hover:shadow-[6px_6px_0px_0px_var(--color-border)] hover:-translate-y-1 hover:bg-muted",
                      "transition-all duration-200 font-black text-base text-foreground",
                      "flex items-center justify-center gap-2",
                      "focus:outline-none focus:ring-4 focus:ring-border/50"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Subscribe to unlock premium features"
                  >
                    <Sparkles className="w-5 h-5" />
                    UPGRADE TO PREMIUM
                  </motion.button>
                )}

                {/* Continue Limited Mode (dismiss mode only) */}
                {mode === "dismiss" && (
                  <motion.button
                    onClick={handleContinueLimited}
                    className={cn(
                      "w-full py-2 px-4 bg-muted border-2 border-border shadow-[2px_2px_0px_0px_var(--color-border)]",
                      "hover:shadow-[4px_4px_0px_0px_var(--color-border)] hover:-translate-y-0.5 hover:bg-muted/80",
                      "transition-all duration-200 font-bold text-sm text-muted-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-border/50"
                    )}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    aria-label="Continue with limited quiz access"
                  >
                    Continue Limited Mode →
                  </motion.button>
                )}
              </div>

              {/* Footer note */}
              <p className="text-xs text-center text-muted-foreground mt-4 font-medium">
                ✨ No credit card required • Start creating instantly ✨
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}