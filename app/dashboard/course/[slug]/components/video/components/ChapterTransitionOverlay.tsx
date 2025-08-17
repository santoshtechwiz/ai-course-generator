"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Play, Clock, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChapterTransitionOverlayProps {
  visible: boolean
  currentChapterTitle?: string
  nextChapterTitle?: string
  timeRemaining: number
  onContinue: () => void
  onCancel: () => void
  autoAdvance: boolean
  countdown: number
}

const ChapterTransitionOverlay: React.FC<ChapterTransitionOverlayProps> = ({
  visible,
  currentChapterTitle = "Current Chapter",
  nextChapterTitle = "Next Chapter",
  timeRemaining,
  onContinue,
  onCancel,
  autoAdvance = true,
  countdown = 5,
}) => {
  const [showOverlay, setShowOverlay] = useState(false)

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      setShowOverlay(true)
    } else {
      setShowOverlay(false)
    }
  }, [visible])

  // Auto-advance when countdown reaches 0
  useEffect(() => {
    if (visible && autoAdvance && countdown <= 0) {
      onContinue()
    }
  }, [visible, autoAdvance, countdown, onContinue])

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <motion.div
            className="relative max-w-md w-full mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Header with CourseAI branding */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white relative overflow-hidden">
              {/* CourseAI Logo */}
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-white"
                  >
                    <path
                      d="M12 2L2 7L12 12L22 7L12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-center mb-2">
                Moving to Next Chapter
              </h2>
              <p className="text-white/90 text-center text-sm">
                {autoAdvance ? `Auto-advancing in ${countdown} seconds` : "Ready to continue"}
              </p>

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-8 w-8 text-white hover:bg-white/20"
                onClick={onCancel}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Animated background elements */}
              <motion.div
                className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full"
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Current chapter info */}
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Just completed
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {currentChapterTitle}
                </h3>
              </div>

              {/* Next chapter info */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Next up
                  </span>
                </div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  {nextChapterTitle}
                </h3>
              </div>

              {/* Progress bar for countdown */}
              {autoAdvance && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Auto-advancing
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {countdown}s
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                      initial={{ width: "100%" }}
                      animate={{ width: `${(countdown / 5) * 100}%` }}
                      transition={{ duration: 0.1, ease: "linear" }}
                    />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={onContinue}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continue Now
                </Button>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>

              {/* CourseAI branding footer */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>Powered by</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    Course<span className="text-purple-600 dark:text-purple-400">AI</span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default React.memo(ChapterTransitionOverlay)