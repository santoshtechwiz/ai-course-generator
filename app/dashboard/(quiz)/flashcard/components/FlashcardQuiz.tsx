"use client"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck, ThumbsUp, ThumbsDown, Settings, BookOpen } from "lucide-react"
import { motion, AnimatePresence, useAnimation, type PanInfo } from "framer-motion"

import { useAnimation as useAnimationContext } from "@/providers/animation-provider"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { QuizContainer } from "@/components/quiz/QuizContainer"

// Import the flashcard slice actions
import {
  initFlashCardQuiz,
  submitFlashCardAnswer,
  completeFlashCardQuiz,
  resetFlashCards,
  setCurrentFlashCard,
  nextFlashCard,
} from "@/store/slices/flashcard-slice"
import { useAppDispatch, useAppSelector } from "@/store"
import { Confetti } from "@/components/ui/confetti"

interface FlashCard {
  id: string
  question: string
  answer: string
  options?: string[]
  keywords?: string[]
  imageUrl?: string
  audioUrl?: string
}

interface FlashCardComponentProps {
  cards: FlashCard[]
  quizId: string | number
  slug: string
  title: string
  onSaveCard?: (card: FlashCard) => void
  savedCardIds?: string[]
  isReviewMode?: boolean
}

function FlashCardQuiz({
  cards,
  quizId,
  slug,
  title,
  onSaveCard,
  savedCardIds = [],
  isReviewMode = false,
}: FlashCardComponentProps) {
  // Get state from flashcard slice only
  const dispatch = useAppDispatch()
  const {
    currentQuestion: currentQuestionIndex,
    isCompleted,
    answers,
    requiresAuth,
    pendingAuthRequired,
    quizId: storeQuizId,
  } = useAppSelector((state) => state.flashcard)

  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Local UI state
  const [flipped, setFlipped] = useState(false)
  const [direction, setDirection] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [ratingAnimation, setRatingAnimation] = useState<"correct" | "incorrect" | "still_learning" | null>(null)
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewCards, setReviewCards] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [swipeThreshold, setSwipeThreshold] = useState(100)
  const [swipeDisabled, setSwipeDisabled] = useState(false)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [cardTimes, setCardTimes] = useState<Record<string, number>>({})

  // Animation controls
  const cardControls = useAnimation()
  const cardRef = useRef<HTMLDivElement>(null)
  const { animationsEnabled } = useAnimationContext()

  // Add isMounted ref to prevent animations after unmount
  const isMountedRef = useRef(true)

  // Set up mount tracking
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Initialize quiz in Redux using the flashcard slice
  useEffect(() => {
    if (cards && cards.length > 0 && (!storeQuizId || storeQuizId !== quizId.toString())) {
      dispatch(
        initFlashCardQuiz({
          id: quizId.toString(),
          slug,
          title,
          questions: cards,
        }),
      )
    }
  }, [cards, quizId, slug, title, dispatch, storeQuizId])

  // Add loading state with timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Get self-ratings from the answers in Redux with proper null checks
  const selfRating = useMemo(() => {
    const ratings: Record<string, "correct" | "incorrect" | "still_learning" | null> = {}

    if (answers && Array.isArray(answers) && cards) {
      answers.forEach((answer) => {
        if (answer && answer.questionId) {
          ratings[answer.questionId] = answer.answer as "correct" | "incorrect" | "still_learning"
        }
      })
    }

    return ratings
  }, [answers, cards])

  // Calculate score based on "correct" self-ratings
  const calculateScore = useCallback(() => {
    return Object.values(selfRating).filter((rating) => rating === "correct").length
  }, [selfRating])

  // Process answers to get detailed counts including still_learning - FIXED CARD MAPPING
  const processedResults = useMemo(() => {
    if (!answers || !Array.isArray(answers) || !cards || !cards.length) {
      return {
        correctCount: 0,
        stillLearningCount: 0,
        incorrectCount: 0,
        totalCount: 0,
        reviewCards: [],
        stillLearningCards: [],
      }
    }

    let correctCount = 0
    let stillLearningCount = 0
    let incorrectCount = 0
    const reviewCards: number[] = []
    const stillLearningCards: number[] = []

    answers.forEach((answer) => {
      if (answer && typeof answer.answer === "string" && answer.questionId) {
        // Find the card index by matching the question ID
        const cardIndex = cards.findIndex((card) => card.id?.toString() === answer.questionId.toString())

        if (cardIndex !== -1) {
          switch (answer.answer) {
            case "correct":
              correctCount++
              break
            case "still_learning":
              stillLearningCount++
              stillLearningCards.push(cardIndex)
              break
            case "incorrect":
              incorrectCount++
              reviewCards.push(cardIndex)
              break
          }
        }
      }
    })

    return {
      correctCount,
      stillLearningCount,
      incorrectCount,
      totalCount: correctCount + stillLearningCount + incorrectCount,
      reviewCards,
      stillLearningCards,
    }
  }, [answers, cards])

  // Get cards that need review by category - IMPROVED MAPPING
  const reviewCardsByCategory = useMemo(() => {
    if (!cards || !cards.length) return { incorrect: [], stillLearning: [] }

    const incorrect: number[] = []
    const stillLearning: number[] = []

    Object.entries(selfRating).forEach(([cardId, rating]) => {
      const index = cards.findIndex((card) => card.id?.toString() === cardId)
      if (index !== -1) {
        if (rating === "incorrect") {
          incorrect.push(index)
        } else if (rating === "still_learning") {
          stillLearning.push(index)
        }
      }
    })

    return { incorrect, stillLearning }
  }, [selfRating, cards])

  // Fixed enter review mode function with better error handling
  const handleEnterReviewMode = useCallback(
    (reviewType: "incorrect" | "still_learning" = "incorrect") => {
      const cardsToReview =
        reviewType === "incorrect" ? reviewCardsByCategory.incorrect : reviewCardsByCategory.stillLearning

      if (!cardsToReview.length) {
        console.log(`No ${reviewType} cards to review`)
        return
      }

      console.log(`Entering ${reviewType} review mode with cards:`, cardsToReview)

      // Set review cards and reset UI state
      setReviewCards(cardsToReview)
      setReviewMode(true)
      setFlipped(false)

      // Reset to first review card via Redux
      dispatch(setCurrentFlashCard(0))

      // Don't reset completed state - we want to maintain the results
      setStartTime(Date.now())
    },
    [reviewCardsByCategory, dispatch],
  )

  // Handle exiting review mode
  const handleExitReviewMode = useCallback(() => {
    setReviewMode(false)
    dispatch(setCurrentFlashCard(0))
    setFlipped(false)
    setStartTime(Date.now())
  }, [dispatch])

  // Memoize getCurrentCard function to prevent recreating on every render
  const getCurrentCard = useCallback(() => {
    if (!cards || !cards.length) return null

    if (reviewMode && reviewCards && reviewCards.length > 0) {
      // Get the current review index, bounded by array length
      const reviewIndex = Math.min(currentQuestionIndex, reviewCards.length - 1)

      // Get the actual card index from our array of review indices
      const cardIndex = reviewCards[reviewIndex]

      if (cardIndex !== undefined && cardIndex >= 0 && cardIndex < cards.length) {
        return cards[cardIndex]
      }
    }

    // In normal mode or if review index was invalid
    return cards[Math.min(currentQuestionIndex, cards.length - 1)]
  }, [reviewMode, reviewCards, currentQuestionIndex, cards])

  // Memoize current card to prevent unnecessary re-renders
  const currentCard = useMemo(() => getCurrentCard(), [getCurrentCard])

  // Check if current card is saved - memoized to prevent recalculation
  const isSaved = useMemo(
    () => (currentCard?.id ? savedCardIds.includes(currentCard.id.toString()) : false),
    [currentCard?.id, savedCardIds],
  )

  // Calculate progress percentage - memoized for performance
  const progress = useMemo(() => {
    if (reviewMode) {
      return reviewCards.length ? ((currentQuestionIndex + 1) / reviewCards.length) * 100 : 0
    }
    return cards?.length ? ((currentQuestionIndex + 1) / cards.length) * 100 : 0
  }, [reviewMode, currentQuestionIndex, reviewCards.length, cards?.length])

  // Handle card flip
  const toggleFlip = useCallback(() => {
    if (!flipped) {
      setStartTime(Date.now())
    }
    setFlipped(!flipped)
  }, [flipped])

  // Handle saving/bookmarking cards
  const handleSaveCard = useCallback(() => {
    if (onSaveCard && currentCard) {
      onSaveCard(currentCard)
    }
  }, [onSaveCard, currentCard])

  // Handle moving to the next flashcard - FIXED REVIEW MODE NAVIGATION
  const moveToNextCard = useCallback(() => {
    if (!cards?.length) return

    const maxIndex = reviewMode ? reviewCards.length - 1 : cards.length - 1

    if (currentQuestionIndex < maxIndex) {
      setDirection(1)
      setFlipped(false)

      // Only animate if component is still mounted
      if (isMountedRef.current) {
        cardControls
          .start({
            x: -300,
            opacity: 0,
            transition: { duration: 0.3 },
          })
          .then(() => {
            // Additional check before updating state after animation
            if (isMountedRef.current) {
              dispatch(nextFlashCard())
              cardControls.set({ x: 0, opacity: 1 })
              setStartTime(Date.now())
            }
          })
      } else {
        // If not mounted, just update state without animation
        dispatch(nextFlashCard())
      }
    } else {
      // If we're in review mode and finished reviewing, go back to normal mode
      if (reviewMode) {
        setReviewMode(false)
        setReviewCards([])
        dispatch(setCurrentFlashCard(0))
        setFlipped(false)
        return
      }

      // Otherwise, complete the quiz
      const correctCount = calculateScore()
      const totalQuestions = cards.length
      const score = totalQuestions ? (correctCount / totalQuestions) * 100 : 0

      // Calculate total time from answers
      const totalTime = Array.isArray(answers) ? answers.reduce((acc, answer) => acc + (answer?.timeSpent || 0), 0) : 0

      // Complete the quiz with proper result data
      const quizResults = {
        score,
        answers: answers || [],
        completedAt: new Date().toISOString(),
        percentage: score,
        correctAnswers: correctCount,
        stillLearningAnswers: processedResults.stillLearningCount,
        incorrectAnswers: processedResults.incorrectCount,
        totalQuestions: totalQuestions,
        totalTime: totalTime,
        reviewCards: processedResults.reviewCards,
        stillLearningCards: processedResults.stillLearningCards,
      }

      dispatch(completeFlashCardQuiz(quizResults))

      // Show confetti for completion
      setShowConfetti(true)
    }
  }, [
    currentQuestionIndex,
    reviewMode,
    reviewCards.length,
    cards,
    dispatch,
    calculateScore,
    answers,
    cardControls,
    processedResults,
  ])

  // Rating feedback optimization with smoother spring physics
  const ratingFeedbackVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      willChange: "transform, opacity",
    },
    visible: {
      opacity: 1,
      scale: [0.9, 1.05, 1],
      willChange: "transform, opacity",
      transition: {
        duration: 0.4,
        times: [0, 0.6, 1],
        type: "spring",
        stiffness: 300,
        damping: 15,
      },
    },
    exit: {
      opacity: 0,
      scale: 1.1,
      willChange: "transform, opacity",
      transition: {
        duration: 0.25,
        ease: "easeOut",
      },
    },
  }

  // Handle self-rating functionality with improved animation coordination - now supports three states
  const handleSelfRating = useCallback(
    (cardId: string, rating: "correct" | "incorrect" | "still_learning") => {
      if (!cardId) return

      // Calculate time spent
      const endTime = Date.now()
      const timeSpent = Math.floor((endTime - startTime) / 1000)

      // Update card times
      setCardTimes((prev) => ({
        ...prev,
        [cardId]: (prev[cardId] || 0) + timeSpent,
      }))

      // Disable swipe during animation
      setSwipeDisabled(true)

      // Submit answer - still_learning is neither correct nor incorrect
      const answerData = {
        answer: rating,
        userAnswer: rating,
        timeSpent: timeSpent,
        isCorrect: rating === "correct",
        questionId: cardId,
      }

      dispatch(submitFlashCardAnswer(answerData))

      // Show rating animation with coordinated timing
      setRatingAnimation(rating)

      // Add haptic feedback for mobile if available
      if (window.navigator && window.navigator.vibrate) {
        if (rating === "correct") {
          window.navigator.vibrate([50])
        } else if (rating === "still_learning") {
          window.navigator.vibrate([30, 20, 30])
        } else {
          window.navigator.vibrate([20, 30, 40])
        }
      }

      let timerRef: NodeJS.Timeout | null = null

      // Handle auto-advance with coordinated timing
      if (autoAdvance) {
        // Use a slight delay to show feedback before advancing
        timerRef = setTimeout(() => {
          if (isMountedRef.current) {
            setRatingAnimation(null)
            // Short delay before advancing to next card for better UX
            const advanceTimer = setTimeout(() => {
              if (isMountedRef.current) {
                moveToNextCard()
                setSwipeDisabled(false)
                setStartTime(Date.now())
              }
            }, 50)

            return () => clearTimeout(advanceTimer)
          }
        }, 700)
      } else {
        timerRef = setTimeout(() => {
          if (isMountedRef.current) {
            setRatingAnimation(null)
            setSwipeDisabled(false)
          }
        }, 700)
      }

      return () => {
        if (timerRef) clearTimeout(timerRef)
      }
    },
    [dispatch, autoAdvance, moveToNextCard, startTime],
  )

  // Handle restart quiz
  const handleRestartQuiz = useCallback(() => {
    dispatch(resetFlashCards())

    setFlipped(false)
    setReviewMode(false)
    setReviewCards([])
    setShowConfetti(false)

    // Add reset parameters to URL
    const url = new URL(window.location.href)
    url.searchParams.set("reset", "true")
    url.searchParams.set("t", Date.now().toString())
    router.push(url.toString())
  }, [dispatch, router])

  // Handle swipe gestures
  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (swipeDisabled) return

      const swipeDirection = info.offset.x > 0 ? "right" : "left"
      const swipeDistance = Math.abs(info.offset.x)
      const swipeVelocity = Math.abs(info.velocity.x)

      // Consider both distance and velocity for more natural swipe detection
      const isEffectiveSwipe = swipeDistance > swipeThreshold || swipeVelocity > 0.5

      if (isEffectiveSwipe) {
        // Add haptic feedback for mobile if available
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50)
        }

        if (swipeDirection === "left") {
          moveToNextCard()
        } else {
          toggleFlip()
        }
      } else {
        // Animate back to original position with spring physics
        cardControls.start({
          x: 0,
          opacity: 1,
          transition: {
            type: "spring",
            stiffness: 500,
            damping: 30,
          },
        })
      }
    },
    [swipeDisabled, swipeThreshold, moveToNextCard, toggleFlip, cardControls],
  )

  // Keyboard navigation - updated to support three rating options
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted) return

      switch (e.key) {
        case "ArrowRight":
          moveToNextCard()
          break
        case "ArrowLeft":
        case " ": // Space bar
          toggleFlip()
          break
        case "1":
        case "y":
          if (currentCard?.id && flipped) {
            handleSelfRating(currentCard.id.toString(), "correct")
          }
          break
        case "2":
        case "s":
          if (currentCard?.id && flipped) {
            handleSelfRating(currentCard.id.toString(), "still_learning")
          }
          break
        case "3":
        case "n":
          if (currentCard?.id && flipped) {
            handleSelfRating(currentCard.id.toString(), "incorrect")
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isCompleted, moveToNextCard, toggleFlip, currentCard, flipped, handleSelfRating])

  if (isLoading) {
    return <QuizLoader message="Loading flashcards..." subMessage="Preparing your study materials" />
  }

  // Enhanced animation variants with 3D transforms and hardware acceleration
  const frontCardVariants = {
    initial: { opacity: 0, rotateY: 0 },
    animate: {
      opacity: 1,
      rotateY: 0,
      transition: {
        duration: animationsEnabled ? 0.4 : 0.1,
        ease: [0.23, 1, 0.32, 1],
      },
    },
    exit: {
      opacity: 0,
      rotateY: 90,
      transition: {
        duration: animationsEnabled ? 0.3 : 0.1,
        ease: [0.23, 1, 0.32, 1],
      },
    },
  }

  const backCardVariants = {
    initial: { opacity: 0, rotateY: -90 },
    animate: {
      opacity: 1,
      rotateY: 0,
      transition: {
        duration: animationsEnabled ? 0.4 : 0.1,
        ease: [0.23, 1, 0.32, 1],
      },
    },
    exit: {
      opacity: 0,
      rotateY: -90,
      transition: {
        duration: animationsEnabled ? 0.3 : 0.1,
        ease: [0.23, 1, 0.32, 1],
      },
    },
  }

  // Render different content based on quiz state
  const renderQuizContent = () => {
    // Only show flashcard UI if not completed or in review mode
    if (isCompleted && !reviewMode) {
      // Don't render results directly - QuizResultHandler will handle this
      return null
    }

    // Not completed or in review mode - show flashcard UI
    return (
      <QuizContainer
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={reviewMode ? reviewCards.length : cards?.length || 0}
        quizType="Flashcard"
        animationKey={reviewMode ? `review-${currentQuestionIndex}` : `card-${currentQuestionIndex}`}
      >
        <div className="space-y-6">
          {/* Settings Header */}
          <div className="flex justify-between items-center">
            <motion.h3
              className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              {reviewMode ? `Review Mode: ${title}` : title}
            </motion.h3>

            {/* Enhanced Settings popover */}
            <Popover open={showSettings} onOpenChange={setShowSettings}>
              <PopoverTrigger asChild>
                <motion.div whileHover={{ scale: 1.05, rotate: 90 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl border-2 border-muted hover:border-primary/40 hover:bg-primary/5"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </motion.div>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-2xl border-2 border-muted/30 shadow-2xl">
                <div className="space-y-4">
                  <h4 className="font-bold text-lg bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    Flashcard Settings
                  </h4>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-muted/30">
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold">Auto-advance</div>
                      <div className="text-xs text-muted-foreground">Automatically move to next card after rating</div>
                    </div>
                    <Switch checked={autoAdvance} onCheckedChange={setAutoAdvance} />
                  </div>

                  <div className="space-y-2">
                    {reviewMode && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEnterReviewMode()}
                          className="w-full rounded-xl border-2 hover:border-destructive/40 hover:bg-destructive/5"
                        >
                          Review Incorrect
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEnterReviewMode("still_learning")}
                          className="w-full rounded-xl border-2 hover:border-amber-500/40 hover:bg-amber-500/5"
                        >
                          Review Still Learning
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExitReviewMode}
                          className="w-full rounded-xl border-2 hover:border-primary/40 hover:bg-primary/5"
                        >
                          Exit Review Mode
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="pt-2 text-xs text-muted-foreground bg-muted/10 p-3 rounded-xl">
                    <p className="font-semibold mb-2">Keyboard shortcuts:</p>
                    <div className="space-y-1">
                      <p>Space/Left Arrow: Flip card</p>
                      <p>Right Arrow: Next card</p>
                      <p>1/Y: Mark as known</p>
                      <p>2/S: Still learning</p>
                      <p>3/N: Mark as incorrect</p>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Enhanced Flashcard Content with Swipe Gestures */}
          <div className="relative min-h-[350px] w-full perspective-1000">
            <motion.div
              key={reviewMode ? `review-${currentQuestionIndex}` : `card-${currentQuestionIndex}`}
              drag={!swipeDisabled && !isCompleted ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={handleDragEnd}
              animate={cardControls}
              layoutId={`card-${currentQuestionIndex}`}
              className="absolute inset-0 w-full h-full touch-manipulation"
              ref={cardRef}
            >
              {!flipped ? (
                // Enhanced Front of card
                <motion.div
                  onClick={toggleFlip}
                  className="w-full h-full rounded-3xl border-2 border-primary/20 shadow-2xl cursor-pointer bg-gradient-to-br from-background via-background to-muted/10 p-8 flex flex-col items-center justify-center relative overflow-hidden group"
                  variants={frontCardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  role="button"
                  aria-label="Flip card to see answer"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      toggleFlip()
                    }
                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 25px 50px -12px rgba(var(--primary), 0.25)",
                    borderColor: "rgba(var(--primary), 0.4)",
                  }}
                  style={{
                    willChange: "transform, opacity",
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                  }}
                >
                  {/* Enhanced decorative elements */}
                  <motion.div
                    className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full -mr-16 -mt-16"
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 10, 0],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    }}
                  />
                  <motion.div
                    className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-accent/20 to-accent/5 rounded-full -ml-12 -mb-12"
                    animate={{
                      scale: [1, 1.15, 1],
                      rotate: [0, -10, 0],
                    }}
                    transition={{
                      duration: 7,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                      delay: 1,
                    }}
                  />

                  {/* Enhanced Question text */}
                  <div className="text-2xl font-bold text-center text-foreground z-10 max-w-md leading-relaxed overflow-auto max-h-[250px] scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-primary/20 scrollbar-track-transparent px-4">
                    {currentCard?.question || "No question available"}
                  </div>

                  {/* Enhanced Swipe instructions */}
                  <div className="mt-8 flex flex-col items-center z-10">
                    <motion.span
                      className="text-sm text-muted-foreground flex items-center gap-2 bg-muted/20 px-4 py-2 rounded-full border border-muted/30"
                      animate={{
                        y: [0, -3, 0],
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                      }}
                    >
                      ✨ Tap to reveal answer
                    </motion.span>
                    <div className="mt-4 flex items-center gap-8 text-xs text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <motion.div
                          className="bg-muted/20 px-2 py-1 rounded-lg border border-muted/30"
                          animate={{
                            x: [-3, 0, -3],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: "reverse",
                          }}
                        >
                          ← Swipe
                        </motion.div>
                        <span className="mt-1 font-medium">Flip card</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <motion.div
                          className="bg-muted/20 px-2 py-1 rounded-lg border border-muted/30"
                          animate={{
                            x: [3, 0, 3],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: "reverse",
                          }}
                        >
                          Swipe →
                        </motion.div>
                        <span className="mt-1 font-medium">Next card</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                // Enhanced Back of card
                <motion.div
                  onClick={toggleFlip}
                  className="w-full h-full rounded-3xl border-2 border-primary/20 shadow-2xl cursor-pointer bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8 flex flex-col relative overflow-hidden group"
                  variants={backCardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  role="button"
                  aria-label="Flip card to see question"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      toggleFlip()
                    }
                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 25px 50px -12px rgba(var(--primary), 0.25)",
                    borderColor: "rgba(var(--primary), 0.4)",
                  }}
                  style={{
                    willChange: "transform, opacity",
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                  }}
                >
                  {/* Enhanced decorative elements for back */}
                  <motion.div
                    className="absolute top-0 left-0 w-28 h-28 bg-gradient-to-br from-accent/20 to-accent/5 rounded-full -ml-14 -mt-14"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, -15, 0],
                    }}
                    transition={{
                      duration: 9,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    }}
                  />

                  {/* Enhanced Answer text */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-xl font-semibold text-center text-foreground max-w-md leading-relaxed overflow-auto max-h-[200px] scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-primary/20 scrollbar-track-transparent px-4">
                      {currentCard?.answer || "No answer available"}
                    </div>
                  </div>

                  {/* Enhanced Rating buttons with three options */}
                  <div className="mt-6 space-y-4">
                    <div className="text-center">
                      <span className="text-sm font-semibold text-muted-foreground bg-muted/20 px-3 py-1 rounded-full border border-muted/30">
                        How well did you know this?
                      </span>
                    </div>

                    <div className="flex gap-3 justify-center">
                      {/* Correct/Known button */}
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (currentCard?.id) {
                              handleSelfRating(currentCard.id.toString(), "correct")
                            }
                          }}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-green-400/30 hover:border-green-400/50"
                          size="lg"
                        >
                          <ThumbsUp className="w-5 h-5 mr-2" />I knew it!
                        </Button>
                      </motion.div>

                      {/* Still Learning button */}
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (currentCard?.id) {
                              handleSelfRating(currentCard.id.toString(), "still_learning")
                            }
                          }}
                          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-amber-400/30 hover:border-amber-400/50"
                          size="lg"
                        >
                          <BookOpen className="w-5 h-5 mr-2" />
                          Still learning
                        </Button>
                      </motion.div>

                      {/* Incorrect/Don't know button */}
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (currentCard?.id) {
                              handleSelfRating(currentCard.id.toString(), "incorrect")
                            }
                          }}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-red-400/30 hover:border-red-400/50"
                          size="lg"
                        >
                          <ThumbsDown className="w-5 h-5 mr-2" />
                          Need to study
                        </Button>
                      </motion.div>
                    </div>

                    {/* Enhanced keyboard shortcuts */}
                    <div className="text-center text-xs text-muted-foreground mt-4">
                      <div className="flex justify-center gap-6 bg-muted/10 px-4 py-2 rounded-xl border border-muted/20">
                        <span className="flex items-center gap-1">
                          <kbd className="px-2 py-1 bg-muted/30 rounded text-xs font-mono">1</kbd> Known
                        </span>
                        <span className="flex items-center gap-1">
                          <kbd className="px-2 py-1 bg-muted/30 rounded text-xs font-mono">2</kbd> Learning
                        </span>
                        <span className="flex items-center gap-1">
                          <kbd className="px-2 py-1 bg-muted/30 rounded text-xs font-mono">3</kbd> Study
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Save button */}
                  {onSaveCard && (
                    <motion.div
                      className="absolute top-4 right-4"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSaveCard()
                        }}
                        className={cn(
                          "h-12 w-12 rounded-xl border-2 transition-all duration-300",
                          isSaved
                            ? "bg-primary/10 border-primary/40 text-primary hover:bg-primary/20"
                            : "border-muted/40 hover:border-primary/40 hover:bg-primary/5",
                        )}
                      >
                        {isSaved ? <BookmarkCheck className="h-6 w-6" /> : <Bookmark className="h-6 w-6" />}
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Enhanced Rating feedback overlay */}
          <AnimatePresence>
            {ratingAnimation && (
              <motion.div
                className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                variants={ratingFeedbackVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div
                  className={cn(
                    "px-8 py-6 rounded-3xl text-white font-bold text-2xl shadow-2xl border-4",
                    ratingAnimation === "correct" && "bg-gradient-to-r from-green-500 to-green-600 border-green-400",
                    ratingAnimation === "still_learning" &&
                      "bg-gradient-to-r from-amber-500 to-amber-600 border-amber-400",
                    ratingAnimation === "incorrect" && "bg-gradient-to-r from-red-500 to-red-600 border-red-400",
                  )}
                >
                  {ratingAnimation === "correct" && "✅ I knew it!"}
                  {ratingAnimation === "still_learning" && "📚 Still learning"}
                  {ratingAnimation === "incorrect" && "❌ Need to study"}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Navigation buttons */}
          <div className="flex justify-between items-center pt-6">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={toggleFlip}
                className="px-6 py-3 rounded-xl border-2 font-semibold hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              >
                {flipped ? "Show Question" : "Show Answer"}
              </Button>
            </motion.div>

            <div className="text-center">
              <div className="text-sm text-muted-foreground font-medium">
                {reviewMode ? "Review Progress" : "Study Progress"}
              </div>
              <div className="text-2xl font-bold text-primary">
                {currentQuestionIndex + 1} / {reviewMode ? reviewCards.length : cards?.length || 0}
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={moveToNextCard}
                className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {currentQuestionIndex >= (reviewMode ? reviewCards.length - 1 : (cards?.length || 0) - 1)
                  ? reviewMode
                    ? "Finish Review"
                    : "Complete"
                  : "Next Card"}
              </Button>
            </motion.div>
          </div>
        </div>
      </QuizContainer>
    )
  }

  return (
    <>
      {renderQuizContent()}
      {showConfetti && <Confetti isActive={false} />}
    </>
  )
}

export default FlashCardQuiz
