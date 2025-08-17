"use client"

import React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { CheckCircle, ChevronRight, RotateCcw, Award, Download, Check, AlertCircle, X } from "lucide-react"
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
  relatedCourses?: Array<{ id?: string | number; slug?: string; title?: string; description?: string; image?: string }>
  progressStats?: { completedCount: number; totalChapters: number; progressPercentage: number }
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
  relatedCourses = [],
  progressStats,
}) => {
  const [countdown, setCountdown] = useState(autoAdvanceDelay)
  const [showOverlay, setShowOverlay] = useState(false)
  const [userCancelled, setUserCancelled] = useState(false)

  // Handle countdown for auto-advance
  useEffect(() => {
    if (!visible || !autoAdvance || !hasNextChapter || userCancelled) {
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
  }, [visible, countdown, autoAdvance, hasNextChapter, autoAdvanceDelay, onNextChapter, userCancelled])

  // Show/hide the overlay based on visibility prop
  useEffect(() => {
    if (visible) {
      setShowOverlay(true)
      setUserCancelled(false)
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

  const handleStay = () => {
    setUserCancelled(true)
    handleClose()
  }

  // ESC to close for better UX
  useEffect(() => {
    if (!showOverlay) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        handleClose()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [showOverlay])

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
        <>
          {/* Slide-up panel at bottom ~20% height (YouTube style Up Next) */}
          <motion.div
            className="absolute left-0 right-0 bottom-0 z-[65]"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{ height: '20%' }}
          >
            <div className="h-full bg-black/70 backdrop-blur-md text-white p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm sm:text-base font-medium">
                  {hasNextChapter ? (
                    <span>Next chapter ready — Would you like to continue? {autoAdvance && !userCancelled && `(${countdown}s)`}</span>
                  ) : (
                    <span>Great job! You’ve completed this chapter.</span>
                  )}
                </div>
                {hasNextChapter && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={onNextChapter} aria-label="Continue to next chapter">
                      Continue
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleStay} aria-label="Stay on current chapter">
                      Stay
                    </Button>
                  </div>
                )}
              </div>
              {/* Related Courses row (if provided) */}
              {Array.isArray(relatedCourses) && relatedCourses.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <div className="flex gap-3">
                    {relatedCourses.slice(0, 10).map((c, idx) => (
                      <a
                        key={c.id ?? idx}
                        href={c.slug ? `/dashboard/course/${c.slug}` : '#'}
                        className="min-w-[180px] max-w-[220px] bg-white/10 rounded-lg p-2 hover:bg-white/15 transition-colors"
                      >
                        <div className="w-full h-20 bg-white/10 rounded mb-2 overflow-hidden" />
                        <div className="text-xs font-semibold line-clamp-2">{c.title || 'Course'}</div>
                        <div className="text-[11px] text-white/70 line-clamp-2">{c.description || ''}</div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Full overlay for modal (final chapter / no next) */}
          {!hasNextChapter && (
            <motion.div
              className="absolute inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              role="dialog"
              aria-label="Chapter completion"
              aria-live="polite"
              aria-modal="true"
            >
              <motion.div
                className="relative max-w-xs sm:max-w-sm md:max-w-md w-full mx-auto p-4 sm:p-6 bg-card border border-border/50 rounded-xl shadow-2xl"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close icon (always visible) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  aria-label="Close overlay"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Title and recap */}
                <div className="mb-4 sm:mb-6 text-center">
                  <motion.h2
                    className="text-lg sm:text-xl md:text-2xl font-bold mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    {isFinalChapter ? "Course Completed!" : "Chapter Completed"}
                  </motion.h2>
                  {progressStats && (
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Progress: {progressStats.progressPercentage}% • {progressStats.completedCount}/{progressStats.totalChapters} completed
                    </div>
                  )}
                </div>

                {/* Actions */}
                <motion.div
                  className="space-y-3 sm:space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                >
                  {isFinalChapter && onCertificateDownload ? (
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
                            "w-full flex items-center justify-center gap-2 text-sm sm:text-base",
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

                  {/* Engagement suggestions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a href={`/dashboard/course/${encodeURIComponent(courseTitle || '')}#recommendations`} className="h-10 inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      Personalized recommendations
                    </a>
                    <a href={`/dashboard/quizzes?course=${encodeURIComponent(courseTitle || '')}`} className="h-10 inline-flex items-center justify-center rounded-md text-sm font-medium btn-gradient hover:opacity-90">
                      Try a quick quiz
                    </a>
                    <a href={`/dashboard/course/${encodeURIComponent(courseTitle || '')}#discussion`} className="h-10 inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      Discuss with peers
                    </a>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 mt-4">
                    <Button
                      onClick={onReplay}
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-2 text-xs sm:text-sm"
                      aria-label="Replay current chapter"
                    >
                      <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Replay</span>
                    </Button>
                    <Button
                      onClick={handleClose}
                      className="flex-1 text-xs sm:text-sm"
                      aria-label="Close overlay"
                    >
                      Close
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}

export default React.memo(ChapterEndOverlay)
