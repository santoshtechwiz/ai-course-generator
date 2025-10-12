/**
 * Adaptive Feedback Wrapper for Quiz Components
 * 
 * Wraps quiz components to provide:
 * - Attempt tracking
 * - Graduated hint system
 * - Answer reveals for authenticated users
 * - Resource suggestions
 */

"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Lightbulb, BookOpen, Lock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { getAdaptiveFeedback, AttemptTracker, type FeedbackResponse } from '@/lib/utils/adaptive-feedback'
import { cn } from '@/lib/utils'

interface AdaptiveFeedbackWrapperProps {
  /** Quiz slug for tracking */
  quizSlug: string
  /** Question ID */
  questionId: string | number
  /** User's current answer */
  userAnswer: string
  /** Correct answer */
  correctAnswer: string
  /** Is user authenticated? */
  isAuthenticated: boolean
  /** Available hints */
  hints?: string[]
  /** Related topic/course slug for resource suggestions */
  relatedTopicSlug?: string
  /** Question difficulty (1-5) */
  difficulty?: number
  /** Callback when feedback should be displayed */
  onFeedback?: (feedback: FeedbackResponse) => void
  /** Should show feedback now? */
  shouldShowFeedback: boolean
  /** Reset callback */
  onReset?: () => void
}

export function AdaptiveFeedbackWrapper({
  quizSlug,
  questionId,
  userAnswer,
  correctAnswer,
  isAuthenticated,
  hints = [],
  relatedTopicSlug,
  difficulty,
  onFeedback,
  shouldShowFeedback,
  onReset
}: AdaptiveFeedbackWrapperProps) {
  const router = useRouter()
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackResponse | null>(null)
  const [showFeedbackCard, setShowFeedbackCard] = useState(false)
  const [showFullAnswer, setShowFullAnswer] = useState(false)

  // Get attempt count from tracker
  const attemptCount = AttemptTracker.getAttemptCount(questionId, quizSlug)

  // Generate feedback when answer changes
  useEffect(() => {
    if (shouldShowFeedback && userAnswer.trim()) {
      // Read attempt count snapshot here to avoid creating a dependency that
      // changes when we increment attempts inside this effect (which would
      // cause a re-run and potential infinite loop).
      const currentAttemptCount = AttemptTracker.getAttemptCount(questionId, quizSlug)

      const feedback = getAdaptiveFeedback({
        isAuthenticated,
        attemptCount: currentAttemptCount,
        difficulty,
        userAnswer,
        correctAnswer,
        hints,
        relatedTopicSlug
      })

      setCurrentFeedback(feedback)
      setShowFeedbackCard(true)

      if (onFeedback) {
        onFeedback(feedback)
      }

      // Increment attempt count if not acceptable. Use the tracker directly
      // rather than relying on a prop-derived attemptCount value so we don't
      // trigger this effect again via dependency changes.
      if (!feedback.isAcceptable) {
        AttemptTracker.incrementAttempt(questionId, quizSlug)
      }
    } else {
      setShowFeedbackCard(false)
    }
  // Note: attempt count is intentionally not included in deps to avoid
  // re-running when we increment attempts inside this effect.
  }, [
    shouldShowFeedback,
    userAnswer,
    correctAnswer,
    isAuthenticated,
    difficulty,
    hints,
    relatedTopicSlug,
    questionId,
    quizSlug,
    onFeedback
  ])

  // Reset tracker when component unmounts or question changes
  useEffect(() => {
    return () => {
      if (onReset) {
        onReset()
      }
    }
  }, [questionId, onReset])

  if (!showFeedbackCard || !currentFeedback) {
    return null
  }

  const isSuccess = currentFeedback.isAcceptable
  const showSignInPrompt = !isAuthenticated && attemptCount >= 3

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`feedback-${questionId}`}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mt-4"
      >
        <Card className={cn(
          "p-4 border-2",
          isSuccess 
            ? "bg-green-50 dark:bg-green-950/20 border-green-500/50" 
            : "bg-amber-50 dark:bg-amber-950/20 border-amber-500/50"
        )}>
          {/* Feedback Message */}
          <div className="flex items-start gap-3 mb-3">
            <div className={cn(
              "p-2 rounded-full",
              isSuccess
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            )}>
              {isSuccess ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  ✓
                </motion.div>
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium",
                isSuccess ? "text-green-900 dark:text-green-100" : "text-amber-900 dark:text-amber-100"
              )}>
                {currentFeedback.message}
              </p>

              {/* Similarity Badge */}
              {!isSuccess && currentFeedback.similarity > 0 && (
                <Badge 
                  variant="outline" 
                  className="mt-2 text-xs"
                >
                  {Math.round(currentFeedback.similarity * 100)}% similar
                </Badge>
              )}
            </div>
          </div>

          {/* Hint Display */}
          {!isSuccess && currentFeedback.hint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-3"
            >
              <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-sm text-blue-900 dark:text-blue-100 ml-2">
                  <strong>Hint:</strong> {currentFeedback.hint}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Answer Reveal (for authenticated users after multiple attempts) */}
          {currentFeedback.allowFullReveal && isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mb-3"
            >
              {!showFullAnswer ? (
                <Alert className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                  <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <AlertDescription className="text-sm text-purple-900 dark:text-purple-100 ml-2">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <strong>Need the answer?</strong> You can reveal the correct answer, but this may affect your progress.
                      </div>
                      <div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Simple confirm flow to avoid adding a modal dependency here.
                            // If user confirms, reveal the answer and record a penalty attempt.
                            if (window.confirm('Reveal the correct answer? This may count as an additional attempt.')) {
                              AttemptTracker.incrementAttempt(questionId, quizSlug)
                              setShowFullAnswer(true)
                            }
                          }}
                        >
                          Reveal Answer
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                  <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <AlertDescription className="text-sm text-purple-900 dark:text-purple-100 ml-2">
                    <strong>Correct Answer:</strong> {correctAnswer}
                  </AlertDescription>
                </Alert>
              )}
            </motion.div>
          )}

          {/* Sign-in Prompt for Guests */}
          {showSignInPrompt && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mb-3"
            >
              <Alert className="bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800">
                <Lock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <AlertDescription className="text-sm text-indigo-900 dark:text-indigo-100 ml-2">
                  <div className="flex items-center justify-between gap-4">
                    <p>
                      <strong>Want more help?</strong> Sign in to unlock detailed hints, answer reveals, and personalized learning resources!
                    </p>
                    <Button
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={() => {
                        const callbackUrl = encodeURIComponent(window.location.pathname)
                        router.push(`/api/auth/signin?callbackUrl=${callbackUrl}`)
                      }}
                    >
                      Sign In
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Resource Suggestions */}
          {currentFeedback.suggestedResources && currentFeedback.suggestedResources.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="space-y-2"
            >
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Recommended Resources
              </p>
              <div className="grid gap-2">
                {currentFeedback.suggestedResources.map((resource, index) => (
                  <Link
                    key={index}
                    href={resource.url}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border border-border/50",
                      "hover:bg-accent hover:border-accent-foreground/20 transition-colors",
                      "text-sm text-foreground"
                    )}
                  >
                    <Badge variant="outline" className="text-xs">
                      {resource.type}
                    </Badge>
                    <span className="flex-1 truncate">{resource.title}</span>
                    <span className="text-xs text-muted-foreground">→</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Attempt Counter (for debugging - remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Attempt #{attemptCount} | Encouragement Level: {currentFeedback.encouragementLevel}
              </p>
            </div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Hook to use adaptive feedback in quiz components
 */
export function useAdaptiveFeedback(
  quizSlug: string,
  questionId: string | number,
  isAuthenticated: boolean
) {
  const [shouldShowFeedback, setShouldShowFeedback] = useState(false)
  const [lastFeedback, setLastFeedback] = useState<FeedbackResponse | null>(null)

  const showFeedback = useCallback(() => {
    setShouldShowFeedback(true)
  }, [])

  const hideFeedback = useCallback(() => {
    setShouldShowFeedback(false)
  }, [])

  const resetFeedback = useCallback(() => {
    setShouldShowFeedback(false)
    setLastFeedback(null)
    AttemptTracker.clearAttempt(questionId, quizSlug)
  }, [questionId, quizSlug])

  const handleFeedback = useCallback((feedback: FeedbackResponse) => {
    setLastFeedback(feedback)
  }, [])

  const attemptCount = AttemptTracker.getAttemptCount(questionId, quizSlug)

  return {
    shouldShowFeedback,
    lastFeedback,
    attemptCount,
    showFeedback,
    hideFeedback,
    resetFeedback,
    handleFeedback
  }
}
