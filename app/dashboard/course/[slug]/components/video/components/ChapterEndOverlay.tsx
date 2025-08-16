"use client"

import React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { CheckCircle, ChevronRight, RotateCcw, Award, Download, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type CertificateState = "idle" | "downloading" | "success" | "error"

interface ChapterEndOverlayProps {
  visible: boolean
  chapterTitle?: string
  nextChapterTitle?: string
  hasNextChapter: boolean
  onNextChapter: () => void
  onReplay: () => void
  onClose?: () => void
  autoAdvanceDelay?: number
  autoAdvance?: boolean
  onCertificateDownload?: () => void
  certificateState?: CertificateState
  isFinalChapter?: boolean
  courseTitle?: string
}

const ChapterEndOverlay: React.FC<ChapterEndOverlayProps> = ({
  visible,
  chapterTitle = "Current Chapter",
  nextChapterTitle,
  hasNextChapter,
  onNextChapter,
  onReplay,
  onClose,
  autoAdvanceDelay = 5,
  autoAdvance = true,
  onCertificateDownload,
  certificateState = "idle",
  isFinalChapter = false,
  courseTitle,
}) => {
  const [countdown, setCountdown] = useState(autoAdvanceDelay)
  const [showOverlay, setShowOverlay] = useState(false)

  // Handle countdown for auto-advance
  useEffect(() => {
    if (!visible || !autoAdvance || !hasNextChapter) {
      setCountdown(autoAdvanceDelay)
      return
    }

    setShowOverlay(true)

    if (countdown <= 0) {
      onNextChapter()
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [visible, countdown, autoAdvance, hasNextChapter, autoAdvanceDelay, onNextChapter])

  // Show/hide the overlay based on visibility prop
  useEffect(() => {
    if (visible) {
      setShowOverlay(true)
    } else {
      setShowOverlay(false)
      setCountdown(autoAdvanceDelay)
    }
  }, [visible, autoAdvanceDelay])

  // Handle closing the overlay
  const handleClose = () => {
    setShowOverlay(false)
    onClose?.()
  }

  // Certificate button content based on state
  const getCertificateButtonContent = () => {
    switch (certificateState) {
      case "downloading":
        return (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Download className="h-4 w-4" />
            </motion.div>
      
          </>
        )
      case "success":
        return (
          <>
            <Check className="h-4 w-4 text-green-500" />
            <span>Downloaded!</span>
          </>
        )
      case "error":
        return (
          <>
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span>Try Again</span>
          </>
        )
      default:
        return (
          <>
            <Award className="h-4 w-4" />
            <span>Get Your Certificate</span>
          </>
        )
    }
  }

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          role="dialog"
          aria-label="Chapter completion"
          aria-live="polite"
        >
          <motion.div
            className="max-w-xs sm:max-w-sm md:max-w-md w-full mx-auto p-4 sm:p-6 bg-card rounded-lg shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="mb-4 sm:mb-6 text-center">
              <motion.div
                className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4",
                  isFinalChapter ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600",
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
              >
                {isFinalChapter ? (
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                ) : (
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                )}
              </motion.div>

              <motion.h2
                className="text-lg sm:text-xl md:text-2xl font-bold mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {isFinalChapter ? "Course Completed!" : "Chapter Completed"}
              </motion.h2>

              <motion.p
                className="text-muted-foreground text-sm sm:text-base"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                {chapterTitle}
              </motion.p>

              {isFinalChapter && courseTitle && (
                <motion.div
                  className="mt-2 py-2 px-3 bg-muted/50 rounded-md inline-block"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <span className="text-xs sm:text-sm font-medium">{courseTitle}</span>
                </motion.div>
              )}
            </div>

            <motion.div
              className="space-y-3 sm:space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              {hasNextChapter ? (
                <>
                  <Button
                    onClick={onNextChapter}
                    className="w-full flex items-center justify-between text-sm sm:text-base touch-manipulation hover:scale-[1.02] transition-transform"
                    size="lg"
                    aria-label={`Continue to next chapter${nextChapterTitle ? `: ${nextChapterTitle}` : ""}`}
                  >
                    <span>Continue to Next Chapter</span>
                    <div className="flex items-center">
                      {autoAdvance && (
                        <span className="text-xs bg-primary-foreground/20 px-2 py-1 rounded-full mr-2">
                          {countdown}s
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </Button>
                  {nextChapterTitle && (
                    <p className="text-xs sm:text-sm text-center text-muted-foreground">Next: {nextChapterTitle}</p>
                  )}
                </>
              ) : isFinalChapter && onCertificateDownload ? (
                <>
                  <div className="text-center py-2 mb-2">
                    <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                      Congratulations on completing the full course!
                    </p>
                    <Button
                      onClick={onCertificateDownload}
                      size="lg"
                      disabled={certificateState === "downloading" || certificateState === "success"}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation hover:scale-[1.02] transition-transform",
                        certificateState === "success" && "bg-green-600 hover:bg-green-700",
                        certificateState === "error" && "bg-red-600 hover:bg-red-700",
                      )}
                      aria-label="Download course completion certificate"
                    >
                      {getCertificateButtonContent()}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-2 mb-2">
                  <p className="text-muted-foreground text-sm sm:text-base">You've completed the final chapter!</p>
                </div>
              )}

              {/* Create Quiz CTA always visible at end-of-chapter */}
              <div className="mt-3">
                <a
                  href="/dashboard/mcq"
                  className="w-full inline-flex items-center justify-center rounded-md h-10 text-sm font-medium btn-gradient hover:opacity-90 transition-transform hover:scale-[1.01]"
                  aria-label="Create a quiz from your learnings"
                >
                  Create a quiz from this lesson
                </a>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 mt-4">
                <Button
                  onClick={onReplay}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2 text-xs sm:text-sm touch-manipulation hover:scale-[1.02] transition-transform"
                  aria-label="Replay current chapter"
                >
                  <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Replay Chapter</span>
                </Button>

                {!hasNextChapter && (
                  <Button
                    onClick={handleClose}
                    className="flex-1 text-xs sm:text-sm touch-manipulation hover:scale-[1.02] transition-transform"
                    aria-label="Close overlay"
                  >
                    Close
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default React.memo(ChapterEndOverlay)
