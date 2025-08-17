"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Play, X, Clock, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface NextChapterNotificationProps {
  visible: boolean
  nextChapterTitle?: string
  countdown: number
  onContinue: () => void
  onCancel: () => void
  autoAdvance: boolean
}

const NextChapterNotification: React.FC<NextChapterNotificationProps> = ({
  visible,
  nextChapterTitle = "Next Chapter",
  countdown,
  onContinue,
  onCancel,
  autoAdvance = true,
}) => {
  const [showNotification, setShowNotification] = useState(false)

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      setShowNotification(true)
    } else {
      setShowNotification(false)
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
      {showNotification && (
        <motion.div
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  <span className="font-semibold text-sm">Next Chapter</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-white/20"
                  onClick={onCancel}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="mb-3">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1">
                  {nextChapterTitle}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Auto-playing in {countdown} seconds
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mb-4">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-1 rounded-full"
                  initial={{ width: "100%" }}
                  animate={{ width: `${(countdown / 5) * 100}%` }}
                  transition={{ duration: 0.1, ease: "linear" }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={onContinue}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Continue Now
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default React.memo(NextChapterNotification)