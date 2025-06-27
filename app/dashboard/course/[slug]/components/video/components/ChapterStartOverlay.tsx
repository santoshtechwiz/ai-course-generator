"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import AnimatedCourseAILogo from "./AnimatedCourseAILogo"

interface ChapterStartOverlayProps {
  visible: boolean
  chapterTitle?: string
  courseTitle?: string
  onComplete?: () => void
  duration?: number
  videoId?: string
}

const ChapterStartOverlay: React.FC<ChapterStartOverlayProps> = ({
  visible,
  chapterTitle = "Chapter",
  courseTitle,
  onComplete,
  duration = 10000,
  videoId,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [currentTitle, setCurrentTitle] = useState(chapterTitle)

  // Cleanup function
  const clearTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  // Reset state when video/chapter changes
  useEffect(() => {
    if (videoId) {
      clearTimers()
      setIsVisible(false)
      setCurrentTitle(chapterTitle)
    }
  }, [videoId, chapterTitle])

  useEffect(() => {
    clearTimers()

    if (visible) {
      setCurrentTitle(chapterTitle)
      setIsVisible(true)

      timerRef.current = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, duration)
    } else {
      setIsVisible(false)
    }

    return clearTimers
  }, [visible, duration, onComplete, chapterTitle])

  // Force cleanup on unmount
  useEffect(() => {
    return clearTimers
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          key={`overlay-${videoId}-${currentTitle}`}
          role="dialog"
          aria-label="Chapter introduction"
          aria-live="polite"
        >
          <div className="text-center px-4 max-w-xs sm:max-w-sm md:max-w-md mx-auto">
            <motion.div
              className="mx-auto mb-4 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            >
              <AnimatedCourseAILogo animated />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
              className="space-y-2"
            >
              {courseTitle && (
                <h3 className="text-gray-300 text-xs sm:text-sm md:text-base font-medium leading-tight">
                  {courseTitle}
                </h3>
              )}

              <h2 className="text-white text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold leading-tight">
                {currentTitle}
              </h2>
            </motion.div>

            {/* Progress indicator */}
            <motion.div
              className="mt-6 w-16 sm:w-20 h-1 bg-white/20 rounded-full mx-auto overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: duration / 1000, ease: "linear" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default React.memo(ChapterStartOverlay)
