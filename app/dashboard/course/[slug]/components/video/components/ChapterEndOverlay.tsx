"use client"

import React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { CheckCircle, ChevronRight, RotateCcw, Award, Download, Check, AlertCircle, X, BookOpen, TrendingUp, Users, Clock, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import RelatedCourseCard from "./RelatedCourseCard"

type CertificateState = "idle" | "downloading" | "success" | "error"

interface QuizSuggestion {
  id: string
  title: string
  description: string
  estimatedTime: number
  difficulty: "easy" | "medium" | "hard"
}

interface PersonalizedRecommendation {
  id: string
  title: string
  description: string
  image?: string
  slug: string
  matchReason: string
}

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
  quizSuggestions?: QuizSuggestion[]
  personalizedRecommendations?: PersonalizedRecommendation[]
  isKeyChapter?: boolean
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
  quizSuggestions = [],
  personalizedRecommendations = [],
  isKeyChapter = false,
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
            <span>Downloading...</span>
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
            <div className="h-full bg-black/80 backdrop-blur-md text-white p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm sm:text-base font-medium">
                  {hasNextChapter ? (
                    <span>Moving to next chapter {autoAdvance && !userCancelled && `in ${countdown}s`}</span>
                  ) : (
                    <span>Chapter completed! Great job!</span>
                  )}
                </div>
                {hasNextChapter && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={onNextChapter} aria-label="Continue to next chapter">
                      <Play className="h-3 w-3 mr-1" />
                      Continue
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleStay} aria-label="Stay on current chapter">
                      Stay
                    </Button>
                  </div>
                )}
              </div>

              {/* Enhanced Progress Bar with Animation */}
              {hasNextChapter && autoAdvance && !userCancelled && (
                <div className="w-full bg-white/20 rounded-full h-1 mb-3">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-1 rounded-full"
                    initial={{ width: "100%" }}
                    animate={{ width: `${((autoAdvanceDelay - countdown) / autoAdvanceDelay) * 100}%` }}
                    transition={{ duration: 0.1, ease: "linear" }}
                  />
                </div>
              )}

              {/* Related Courses row (if provided) */}
              {Array.isArray(relatedCourses) && relatedCourses.length > 0 && (
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-2 sm:gap-3 pb-1 px-1">
                    {relatedCourses.slice(0, 10).map((c, idx) => (
                      <RelatedCourseCard
                        key={c.id ?? idx}
                        course={c}
                        index={idx}
                        onClick={() => {
                          // Track interaction for analytics
                          console.log(`Related course clicked: ${c.title}`)
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Full overlay for modal (only for final course completion) */}
          {!hasNextChapter && isFinalChapter && (
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
                className="relative max-w-xs sm:max-w-sm md:max-w-lg w-full mx-auto p-4 sm:p-6 bg-card border border-border/50 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
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

                {/* Title and enhanced progress recap */}
                <div className="mb-4 sm:mb-6 text-center">
                  <motion.h2
                    className="text-lg sm:text-xl md:text-2xl font-bold mb-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    {isFinalChapter ? "🎉 Course Completed!" : "✅ Chapter Completed"}
                  </motion.h2>
                  
                  {/* Enhanced Progress Stats */}
                  {progressStats && (
                    <motion.div 
                      className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-4 mb-4"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Course Progress</span>
                        <span className="text-lg font-bold text-primary">{progressStats.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-white/50 dark:bg-black/20 rounded-full h-2 mb-2">
                        <motion.div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressStats.progressPercentage}%` }}
                          transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{progressStats.completedCount} completed</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-blue-500" />
                          <span>{progressStats.totalChapters - progressStats.completedCount} remaining</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Actions */}
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                >
                  {isFinalChapter && onCertificateDownload ? (
                    <>
                      <div className="text-center py-3 mb-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg border border-yellow-200/50 dark:border-yellow-800/50">
                        <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                          🏆 Congratulations on completing the full course!
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
                      <p className="text-muted-foreground text-sm sm:text-base">You've completed this chapter!</p>
                    </div>
                  )}

                  {/* Quiz Suggestions for Key Chapters */}
                  {isKeyChapter && quizSuggestions.length > 0 && (
                    <motion.div
                      className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-4 border border-green-200/50 dark:border-green-800/50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                    >
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Test Your Knowledge
                      </h4>
                      <div className="space-y-2">
                        {quizSuggestions.slice(0, 2).map((quiz, idx) => (
                          <motion.a
                            key={quiz.id}
                            href={`/dashboard/quiz/${quiz.id}`}
                            className="block p-3 bg-white/60 dark:bg-black/20 rounded-md hover:bg-white/80 dark:hover:bg-black/30 transition-colors"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + idx * 0.1 }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm text-green-800 dark:text-green-200">{quiz.title}</div>
                                <div className="text-xs text-green-600 dark:text-green-300 flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  {quiz.estimatedTime} min • {quiz.difficulty}
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          </motion.a>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Personalized Recommendations */}
                  {isFinalChapter && personalizedRecommendations.length > 0 && (
                    <motion.div
                      className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-4 border border-purple-200/50 dark:border-purple-800/50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.3 }}
                    >
                      <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Recommended for You
                      </h4>
                      <div className="space-y-2">
                        {personalizedRecommendations.slice(0, 3).map((rec, idx) => (
                          <motion.a
                            key={rec.id}
                            href={`/dashboard/course/${rec.slug}`}
                            className="block p-3 bg-white/60 dark:bg-black/20 rounded-md hover:bg-white/80 dark:hover:bg-black/30 transition-colors"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 + idx * 0.1 }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-8 bg-purple-200 dark:bg-purple-800 rounded flex-shrink-0 flex items-center justify-center">
                                {rec.image ? (
                                  <img src={rec.image} alt={rec.title} className="w-full h-full object-cover rounded" />
                                ) : (
                                  <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-purple-800 dark:text-purple-200 line-clamp-1">{rec.title}</div>
                                <div className="text-xs text-purple-600 dark:text-purple-300 line-clamp-1">{rec.matchReason}</div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                            </div>
                          </motion.a>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Standard engagement suggestions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <motion.a 
                      href={`/dashboard/course/${encodeURIComponent(courseTitle || '')}#discussion`} 
                      className="h-10 inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Discuss with peers
                    </motion.a>
                    <motion.a 
                      href={`/dashboard/quizzes?course=${encodeURIComponent(courseTitle || '')}`} 
                      className="h-10 inline-flex items-center justify-center rounded-md text-sm font-medium btn-gradient hover:opacity-90 transition-opacity"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Practice quiz
                    </motion.a>
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
