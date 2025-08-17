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
  onToggleAutoAdvance?: () => void
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
  onToggleAutoAdvance,
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
          {/* Slide-up panel at bottom ~25% height (Enhanced YouTube style) - Only for non-final chapters */}
          {!isFinalChapter && (
            <motion.div
              className="absolute left-0 right-0 bottom-0 z-[65]"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ height: '25%' }}
            >
              {/* Enhanced background with gradient and blur */}
              <div className="h-full bg-gradient-to-t from-black/95 via-black/85 to-black/70 backdrop-blur-xl text-white p-4 sm:p-6 relative overflow-hidden">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
                </div>
                
                <div className="relative z-10 h-full flex flex-col">
                  {/* Header with enhanced styling */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                          {hasNextChapter ? (
                            <span>Moving to next chapter {autoAdvance && !userCancelled && `in ${countdown}s`}</span>
                          ) : (
                            <span>Chapter completed! Great job! 🎉</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-300 mt-1">
                          {chapterTitle}
                        </div>
                      </div>
                    </div>
                    
                    {hasNextChapter && (
                      <div className="flex items-center gap-3">
                        <Button 
                          size="sm" 
                          onClick={onNextChapter} 
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                          aria-label="Continue to next chapter"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Continue
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleStay} 
                          className="border-white/30 text-white hover:bg-white/10"
                          aria-label="Stay on current chapter"
                        >
                          Stay
                        </Button>
                        {onToggleAutoAdvance && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={onToggleAutoAdvance} 
                            className="text-white/70 hover:text-white hover:bg-white/10"
                            aria-label="Toggle auto-advance"
                            title={`Auto-advance is ${autoAdvance ? 'enabled' : 'disabled'}`}
                          >
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${autoAdvance ? 'bg-green-400' : 'bg-red-400'}`} />
                              <span className="text-xs">Auto</span>
                            </div>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Enhanced Progress Bar with Animation */}
                  {hasNextChapter && autoAdvance && !userCancelled && (
                    <div className="w-full bg-white/20 rounded-full h-2 mb-4 overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-2 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${((autoAdvanceDelay - countdown) / autoAdvanceDelay) * 100}%` }}
                        transition={{ duration: 0.1, ease: "linear" }}
                      />
                    </div>
                  )}

                  {/* Related Courses row with enhanced styling */}
                  {Array.isArray(relatedCourses) && relatedCourses.length > 0 && (
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium text-gray-300">Recommended for you</span>
                      </div>
                      <div className="overflow-x-auto scrollbar-hide">
                        <div className="flex gap-3 pb-2 px-1">
                          {relatedCourses.slice(0, 8).map((c, idx) => (
                            <RelatedCourseCard
                              key={c.id ?? idx}
                              course={c}
                              index={idx}
                              onClick={() => {
                                console.log(`Related course clicked: ${c.title}`)
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Full overlay for modal (only for final course completion) */}
          {isFinalChapter && (
            <motion.div
              className="absolute inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
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
                className="relative max-w-xs sm:max-w-sm md:max-w-lg w-full mx-auto p-4 sm:p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close icon */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700/50"
                  aria-label="Close overlay"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Title and enhanced progress recap */}
                <div className="mb-6 text-center">
                  <motion.div
                    className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                  >
                    <Award className="h-8 w-8 text-white" />
                  </motion.div>
                  
                  <motion.h2
                    className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    {isFinalChapter ? "🎉 Course Completed!" : "✅ Chapter Completed"}
                  </motion.h2>
                  
                  {/* Enhanced Progress Stats */}
                  {progressStats && (
                    <motion.div 
                      className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-4 mb-4 border border-blue-700/30"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-300">Course Progress</span>
                        <span className="text-xl font-bold text-green-400">{progressStats.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-3 mb-3">
                        <motion.div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressStats.progressPercentage}%` }}
                          transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      <div className="flex items-center justify-center gap-6 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span>{progressStats.completedCount} completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-400" />
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
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  {isFinalChapter && onCertificateDownload ? (
                    <>
                      <div className="text-center py-4 mb-4 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-xl border border-yellow-700/30">
                        <p className="text-gray-200 mb-4 text-sm sm:text-base">
                          🏆 Congratulations on completing the full course!
                        </p>
                        <Button
                          onClick={onCertificateDownload}
                          size="lg"
                          disabled={certificateState === "downloading" || certificateState === "success"}
                          className={cn(
                            "w-full flex items-center justify-center gap-2 text-sm sm:text-base bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700",
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
                    <div className="text-center py-3 mb-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-700/30">
                      <p className="text-gray-200 text-sm sm:text-base">You've completed this chapter!</p>
                    </div>
                  )}

                  {/* Quiz Suggestions for Key Chapters */}
                  {isKeyChapter && quizSuggestions.length > 0 && (
                    <motion.div
                      className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-4 border border-green-700/30"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.3 }}
                    >
                      <h4 className="font-semibold text-green-300 mb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Test Your Knowledge
                      </h4>
                      <div className="space-y-2">
                        {quizSuggestions.slice(0, 2).map((quiz, idx) => (
                          <motion.a
                            key={quiz.id}
                            href={`/dashboard/quiz/${quiz.id}`}
                            className="block p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors border border-gray-700/30"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + idx * 0.1 }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm text-green-300">{quiz.title}</div>
                                <div className="text-xs text-green-400 flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  {quiz.estimatedTime} min • {quiz.difficulty}
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-green-400" />
                            </div>
                          </motion.a>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Personalized Recommendations */}
                  {isFinalChapter && personalizedRecommendations.length > 0 && (
                    <motion.div
                      className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-700/30"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9, duration: 0.3 }}
                    >
                      <h4 className="font-semibold text-purple-300 mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Recommended for You
                      </h4>
                      <div className="space-y-2">
                        {personalizedRecommendations.slice(0, 3).map((rec, idx) => (
                          <motion.a
                            key={rec.id}
                            href={`/dashboard/course/${rec.slug}`}
                            className="block p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors border border-gray-700/30"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.0 + idx * 0.1 }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-8 bg-purple-600/50 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {rec.image ? (
                                  <img 
                                    src={rec.image} 
                                    alt={rec.title} 
                                    className="w-full h-full object-cover rounded"
                                    onError={(e) => {
                                      // Fallback to icon if image fails to load
                                      const target = e.target as HTMLImageElement
                                      target.style.display = 'none'
                                      target.nextElementSibling?.classList.remove('hidden')
                                    }}
                                  />
                                ) : null}
                                <BookOpen className={`h-4 w-4 text-purple-300 ${rec.image ? 'hidden' : ''}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-purple-300 line-clamp-1">{rec.title}</div>
                                <div className="text-xs text-purple-400 line-clamp-1">{rec.matchReason}</div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-purple-400 flex-shrink-0" />
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
                      className="h-12 inline-flex items-center justify-center rounded-lg text-sm font-medium bg-gray-800/50 text-gray-200 hover:bg-gray-700/50 transition-colors border border-gray-700/30"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.1 }}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Discuss with peers
                    </motion.a>
                    <motion.a 
                      href={`/dashboard/quizzes?course=${encodeURIComponent(courseTitle || '')}`} 
                      className="h-12 inline-flex items-center justify-center rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Practice quiz
                    </motion.a>
                  </div>

                  <div className="flex items-center gap-3 mt-6">
                    <Button
                      onClick={onReplay}
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-2 text-sm border-gray-600 text-gray-300 hover:bg-gray-700/50"
                      aria-label="Replay current chapter"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Replay</span>
                    </Button>
                    <Button
                      onClick={handleClose}
                      className="flex-1 text-sm bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white"
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
