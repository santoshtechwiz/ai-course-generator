"use client"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence, useAnimation, type PanInfo } from "framer-motion"
import { useAnimation as useAnimationContext } from "@/providers/animation-provider"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Confetti } from "@/components/ui/confetti"
import { GlobalLoader } from "@/components/ui/loader"
import { cn } from "@/lib/utils"
import {
  initFlashCardQuiz,
  submitFlashCardAnswer,
  resetFlashCards,
  nextFlashCard,
  type AnswerEntry,
  type RatingAnswer,
  ANSWER_TYPES,
} from "@/store/slices/flashcard-slice"
import { useAppDispatch, useAppSelector } from "@/store"

// Import modular components
import { FlashcardFront } from "./FlashcardFront"
import { FlashcardBack } from "./FlashcardBack"
import { Button } from "@/components/ui/button"
import { CheckCircle, RefreshCw, ArrowRight, RotateCcw, Heart, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface FlashCard {
  id: string
  question: string
  answer: string
  options?: string[]
  keywords?: string[]
  imageUrl?: string
  audioUrl?: string
  codeSnippet?: string
  language?: string
  type?: "mcq" | "code" | "text"
}

interface FlashCardComponentProps {
  cards: FlashCard[]
  quizId: string | number
  slug: string
  title: string
  onSaveCard?: (card: FlashCard) => void
  isReviewMode?: boolean
  onComplete?: (results: any) => void
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.6,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
      duration: 0.4,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -20,
    transition: { duration: 0.2 },
  },
}

const ratingFeedbackVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
}

export default function FlashCardQuiz({
  cards,
  quizId,
  slug,
  title,
  onSaveCard,
  isReviewMode = false,
  onComplete,
}: FlashCardComponentProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    currentQuestion: currentQuestionIndex,
    isCompleted,
    answers,
    quizId: storeQuizId,
  } = useAppSelector((state) => state.flashcard)

  const { data: session } = useSession()

  // State management
  const [flipped, setFlipped] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [ratingAnimation, setRatingAnimation] = useState<"correct" | "incorrect" | "still_learning" | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [swipeDisabled, setSwipeDisabled] = useState(false)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [cardTimes, setCardTimes] = useState<Record<string, number>>({})
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState<number>(0)
  const [showHint, setShowHint] = useState(false)
  const [savedCardIds, setSavedCardIds] = useState<string[]>([])
  const [showCompletionFeedback, setShowCompletionFeedback] = useState(false)
  const [completionFeedbackType, setCompletionFeedbackType] = useState<"success" | "info">("success")
  const [initialized, setInitialized] = useState(false)

  // Animation controls
  const cardControls = useAnimation()
  const cardRef = useRef<HTMLDivElement>(null)
  const { animationsEnabled } = useAnimationContext()

  // Mount tracking
  const isMountedRef = useRef(true)

  // Initialize localStorage values safely
  useEffect(() => {
    if (typeof window !== "undefined") {
      setBestStreak(Number(localStorage.getItem("flashcard_best_streak") || 0))
      try {
        setSavedCardIds(JSON.parse(localStorage.getItem("flashcard_saved_cards") || "[]"))
      } catch {
        setSavedCardIds([])
      }
    }
  }, [])

  // Initialize quiz only once when component mounts
  useEffect(() => {
    if (!initialized && cards?.length > 0) {
      const shouldReset = !searchParams.get("from") && storeQuizId === quizId.toString()

      if (shouldReset) {
        dispatch(resetFlashCards())
      }

      dispatch(
        initFlashCardQuiz({
          id: quizId.toString(),
          slug,
          title,
          questions: cards,
          userId: session?.user?.id || "",
        }),
      )
      setInitialized(true)
      setIsLoading(false)
    }
  }, [cards, quizId, slug, title, dispatch, initialized, searchParams, session, storeQuizId])

  // Process results
  const processedResults = useMemo(() => {
    if (!answers || !Array.isArray(answers) || !cards || !cards.length) {
      return {
        correctCount: 0,
        stillLearningCount: 0,
        incorrectCount: 0,
        totalCount: 0,
      }
    }

    const result = {
      correctCount: 0,
      stillLearningCount: 0,
      incorrectCount: 0,
      totalCount: 0,
    }

    answers.forEach((answer: AnswerEntry) => {
      if (answer && "answer" in answer && typeof answer.answer === "string") {
        switch (answer.answer) {
          case "correct":
            result.correctCount++
            break
          case "still_learning":
            result.stillLearningCount++
            break
          case "incorrect":
            result.incorrectCount++
            break
        }
      }
    })

    result.totalCount = result.correctCount + result.stillLearningCount + result.incorrectCount
    return result
  }, [answers, cards])

  // Current card memoized
  const currentCard = useMemo(() => {
    if (!cards || !cards.length) return null
    return cards[Math.min(currentQuestionIndex, cards.length - 1)]
  }, [currentQuestionIndex, cards])

  // Card saved status
  const isSaved = useMemo(
    () => (currentCard?.id ? savedCardIds.includes(currentCard.id.toString()) : false),
    [currentCard?.id, savedCardIds],
  )

  // Progress calculation
  const progress = useMemo(() => {
    if (!cards?.length) return 0
    return Math.round(((currentQuestionIndex + 1) / cards.length) * 100)
  }, [currentQuestionIndex, cards?.length])

  // Update best streak in localStorage
  useEffect(() => {
    if (streak > bestStreak) {
      setBestStreak(streak)
      if (typeof window !== "undefined") {
        localStorage.setItem("flashcard_best_streak", String(streak))
      }
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [streak, bestStreak])

  // Persist saved cards to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("flashcard_saved_cards", JSON.stringify(savedCardIds))
    }
  }, [savedCardIds])

  // Toggle card flip
  const toggleFlip = useCallback(() => {
    if (swipeDisabled) return
    if (!flipped) {
      setStartTime(Date.now())
    }
    setFlipped((prev) => !prev)
    setShowHint(false)
  }, [flipped, swipeDisabled])

  // Save card
  const handleSaveCard = useCallback(() => {
    if (!currentCard) return
    setSavedCardIds((prev) => {
      const id = currentCard.id.toString()
      const newIds = prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]

      toast.success(prev.includes(id) ? "Removed from saved cards" : "Added to saved cards")
      return newIds
    })
  }, [currentCard])

  // Move to next card
  const moveToNextCard = useCallback(() => {
    if (!cards?.length || swipeDisabled) return
    const maxIndex = cards.length - 1

    if (currentQuestionIndex < maxIndex) {
      setFlipped(false)
      setSwipeDisabled(true)

      const animationPromise = animationsEnabled
        ? cardControls
            .start({
              x: -300,
              opacity: 0,
              transition: { duration: 0.3 },
            })
            .then(() => {
              if (isMountedRef.current) {
                dispatch(nextFlashCard())
                cardControls.set({ x: 0, opacity: 1 })
              }
            })
        : Promise.resolve().then(() => dispatch(nextFlashCard()))

      animationPromise.then(() => {
        if (isMountedRef.current) {
          setStartTime(Date.now())
          setSwipeDisabled(false)
        }
      })
    } else if (onComplete) {
      onComplete(processedResults)
    }
  }, [
    currentQuestionIndex,
    cards,
    dispatch,
    cardControls,
    onComplete,
    processedResults,
    animationsEnabled,
    swipeDisabled,
  ])

  // Handle self rating
  const handleSelfRating = useCallback(
    (cardId: string, rating: "correct" | "incorrect" | "still_learning") => {
      if (!cardId || swipeDisabled) return

      setSwipeDisabled(true)
      const endTime = Date.now()
      const timeSpent = Math.floor((endTime - startTime) / 1000)

      // Check if this is a change from previous rating
      const previousAnswer = answers.find((a): a is RatingAnswer => "answer" in a && a.questionId === cardId)
      const isStatusChange = previousAnswer && previousAnswer.answer !== rating

      // Update streak
      const newStreak = rating === "correct" ? streak + 1 : 0
      setStreak(newStreak)

      setRatingAnimation(rating)
      setCardTimes((prev) => ({
        ...prev,
        [cardId]: (prev[cardId] || 0) + timeSpent,
      }))

      // Submit answer with adaptive learning priority
      const priority = rating === "correct" ? 1 : rating === "still_learning" ? 2 : 3
      const answerData = {
        answer: rating,
        userAnswer: rating,
        timeSpent: timeSpent,
        isCorrect: rating === "correct",
        questionId: cardId,
        streak: newStreak,
        priority: priority,
      }
      dispatch(submitFlashCardAnswer(answerData))

      // Show appropriate toast for status changes in review mode
      if (isReviewMode && isStatusChange) {
        if (previousAnswer?.answer === "incorrect" && rating === "correct") {
          toast.success("Great job! You've learned this card!", {
            duration: 2000,
            icon: "🎉",
          })
        } else if (previousAnswer?.answer === "still_learning" && rating === "correct") {
          toast.success("You've mastered this card!", {
            duration: 2000,
            icon: "⭐",
          })
        } else if (previousAnswer?.answer === "correct" && rating !== "correct") {
          toast.info("We'll help you review this card more.", {
            duration: 2000,
          })
        }
      }

      // Haptic feedback
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(
          rating === "correct" ? [50, 30, 50] : rating === "still_learning" ? [30, 20, 30] : [100],
        )
      }

      // Confetti for milestones
      if (rating === "correct" && newStreak % 5 === 0 && newStreak > 0) {
        setShowConfetti(true)
        const timer = setTimeout(() => setShowConfetti(false), 2500)
        return () => clearTimeout(timer)
      }

      // Check if this was the last card in review mode
      const isLastCard = currentQuestionIndex === cards.length - 1

      // Show completion feedback for review mode
      if (isReviewMode && isLastCard) {
        const correctAnswersCount = answers.filter(
          (a): a is RatingAnswer => "answer" in a && a.answer === ANSWER_TYPES.CORRECT,
        ).length

        const feedbackType = correctAnswersCount >= Math.floor(cards.length * 0.7) ? "success" : "info"

        const timer = setTimeout(() => {
          if (isMountedRef.current) {
            setCompletionFeedbackType(feedbackType)
            setShowCompletionFeedback(true)
          }
        }, 1200)

        return () => clearTimeout(timer)
      }

      // Auto-advance or reset animation
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setRatingAnimation(null)
          if (autoAdvance && !isLastCard) {
            moveToNextCard()
          }
          setSwipeDisabled(false)
        }
      }, 1000)

      return () => clearTimeout(timer)
    },
    [
      dispatch,
      autoAdvance,
      moveToNextCard,
      startTime,
      streak,
      swipeDisabled,
      answers,
      isReviewMode,
      currentQuestionIndex,
      cards.length,
    ],
  )

  // Restart quiz
  const handleRestartQuiz = useCallback(() => {
    dispatch(resetFlashCards())
    setFlipped(false)
    setShowConfetti(false)
    setStreak(0)
    toast("Quiz has been reset")
  }, [dispatch])

  // Finish quiz early
  const handleFinishQuiz = useCallback(() => {
    const completedCardCount = Object.keys(cardTimes).length
    const progressPercent = (completedCardCount / cards.length) * 100

    if (completedCardCount === 0) {
      toast.warning("Please rate at least one card before finishing")
      return
    }

    if (progressPercent < 50 && !isReviewMode) {
      const confirmFinish = window.confirm(
        `You've only completed ${Math.round(progressPercent)}% of the cards. Are you sure you want to finish?`,
      )
      if (!confirmFinish) return
    }

    if (onComplete) {
      toast.success("Quiz completed!")
      onComplete(processedResults)
    }
  }, [cardTimes, cards.length, isReviewMode, onComplete, processedResults])

  // Handle swipe gestures
  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (swipeDisabled) return
      const swipeThreshold = 100
      const swipeDirection = info.offset.x > 0 ? "right" : "left"
      const isEffectiveSwipe = Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > 500

      if (isEffectiveSwipe) {
        if (window.navigator?.vibrate) window.navigator.vibrate(50)
        if (swipeDirection === "left") {
          moveToNextCard()
        } else {
          toggleFlip()
        }
      } else {
        cardControls.start({
          x: 0,
          opacity: 1,
          transition: { type: "spring", stiffness: 500, damping: 30 },
        })
      }
    },
    [swipeDisabled, moveToNextCard, toggleFlip, cardControls],
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading || isCompleted || swipeDisabled) return
      if (e.repeat) return

      switch (e.key) {
        case "ArrowRight":
          moveToNextCard()
          break
        case "ArrowLeft":
        case " ":
          e.preventDefault()
          toggleFlip()
          break
        case "1":
        case "y":
          if (currentCard?.id && flipped && !ratingAnimation) {
            handleSelfRating(currentCard.id.toString(), "correct")
          }
          break
        case "2":
        case "s":
          if (currentCard?.id && flipped && !ratingAnimation) {
            handleSelfRating(currentCard.id.toString(), "still_learning")
          }
          break
        case "3":
        case "n":
          if (currentCard?.id && flipped && !ratingAnimation) {
            handleSelfRating(currentCard.id.toString(), "incorrect")
          }
          break
        case "h":
          setShowHint((v) => !v)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    isLoading,
    isCompleted,
    moveToNextCard,
    toggleFlip,
    currentCard,
    flipped,
    handleSelfRating,
    showHint,
    ratingAnimation,
    swipeDisabled,
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  if (isLoading) {
    return <GlobalLoader />
  }

  if (!cards || cards.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[60vh]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold">No flashcards available</h3>
            <p className="text-muted-foreground">Please check back later or create your own flashcards</p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950/10 dark:to-indigo-950/20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Main Content Area */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Progress and Streak Header */}
          <motion.div
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Progress */}
            <div className="flex items-center gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-lg border border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  {currentQuestionIndex + 1} of {cards.length}
                </span>
              </div>
              <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Streak Display */}
            {streak > 0 && (
              <motion.div
                className="flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-950/30 dark:to-red-950/30 px-4 py-2 rounded-full border border-orange-200 dark:border-orange-800 shadow-lg"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.span
                  className="text-2xl"
                  animate={{
                    rotate: streak > 5 ? [0, 10, -10, 0] : 0,
                    scale: streak > 5 ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    duration: 1,
                    repeat: streak > 5 ? Number.POSITIVE_INFINITY : 0,
                    repeatDelay: 2,
                  }}
                >
                  🔥
                </motion.span>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-700 dark:text-orange-300">{streak}</div>
                  <div className="text-xs text-orange-600 dark:text-orange-400">streak</div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Flashcard Container */}
          <motion.div className="relative min-h-[500px] w-full mb-8" variants={cardVariants}>
            <motion.div
              key={`card-${currentQuestionIndex}`}
              drag={!swipeDisabled && !isCompleted ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
              animate={cardControls}
              className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
              ref={cardRef}
              tabIndex={0}
              aria-label="Flashcard"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <AnimatePresence mode="wait">
                {!flipped ? (
                  <FlashcardFront
                    key="front"
                    question={currentCard?.question || ""}
                    keywords={currentCard?.keywords}
                    showHint={showHint}
                    onToggleHint={() => setShowHint((v) => !v)}
                    onFlip={toggleFlip}
                    animationsEnabled={animationsEnabled}
                    codeSnippet={currentCard?.codeSnippet}
                    language={currentCard?.language}
                    type={currentCard?.type}
                  />
                ) : (
                  <FlashcardBack
                    key="back"
                    answer={currentCard?.answer || ""}
                    onFlip={toggleFlip}
                    onSelfRating={(rating) => {
                      if (currentCard?.id && !ratingAnimation && !swipeDisabled) {
                        handleSelfRating(currentCard.id.toString(), rating)
                      }
                    }}
                    onSaveCard={handleSaveCard}
                    isSaved={isSaved}
                    animationsEnabled={animationsEnabled}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Navigation Controls */}
          <motion.div
            className="flex items-center justify-center gap-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="lg"
                onClick={toggleFlip}
                disabled={swipeDisabled}
                className="flex items-center gap-3 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700"
              >
                <motion.div animate={{ rotate: flipped ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <RotateCcw className="h-5 w-5" />
                </motion.div>
                <span className="font-semibold">Flip Card</span>
              </Button>
            </motion.div>

            {currentQuestionIndex < cards.length - 1 && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={moveToNextCard}
                  disabled={swipeDisabled}
                  size="lg"
                  className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 rounded-2xl border-0"
                >
                  <span className="font-semibold">Next Card</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            className="flex items-center justify-center gap-3 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveCard}
                disabled={swipeDisabled}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300",
                  isSaved
                    ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800",
                )}
              >
                <motion.div animate={isSaved ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.3 }}>
                  <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
                </motion.div>
                <span className="text-sm font-medium">{isSaved ? "Saved" : "Save"}</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestartQuiz}
                className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm font-medium">Restart</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFinishQuiz}
                className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Finish</span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Interaction Hints */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="hidden sm:inline">💡</span>
                <span>Space: Flip</span>
              </div>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="hidden sm:inline">👆</span>
                <span>Swipe: Navigate</span>
              </div>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="hidden sm:inline">⌨️</span>
                <span>1-3: Rate</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Rating feedback overlay */}
      <AnimatePresence>
        {ratingAnimation && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            variants={ratingFeedbackVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className={cn(
                "px-8 py-6 rounded-3xl text-white font-bold text-2xl shadow-2xl border-2 max-w-[90vw] text-center backdrop-blur-sm",
                ratingAnimation === "correct" &&
                  "bg-gradient-to-r from-emerald-500/90 to-green-500/90 border-emerald-300",
                ratingAnimation === "still_learning" &&
                  "bg-gradient-to-r from-amber-500/90 to-orange-500/90 border-amber-300",
                ratingAnimation === "incorrect" && "bg-gradient-to-r from-red-500/90 to-rose-500/90 border-red-300",
              )}
              animate={{
                scale: [0.8, 1.1, 1],
                rotate: [0, 3, -3, 0],
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="flex items-center justify-center gap-3">
                {ratingAnimation === "correct" && (
                  <>
                    <span className="text-3xl">🎉</span>
                    <span>I knew it!</span>
                  </>
                )}
                {ratingAnimation === "still_learning" && (
                  <>
                    <span className="text-3xl">📚</span>
                    <span>Still learning</span>
                  </>
                )}
                {ratingAnimation === "incorrect" && (
                  <>
                    <span className="text-3xl">🤔</span>
                    <span>Need to study</span>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion feedback modal */}
      <AnimatePresence>
        {showCompletionFeedback && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-200 dark:border-gray-700"
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              {completionFeedbackType === "success" ? (
                <>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", damping: 10 }}
                    className="mb-6"
                  >
                    <div className="w-20 h-20 mx-auto bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-4 text-emerald-600 dark:text-emerald-400">
                    Excellent Progress!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
                    You've mastered these concepts. Keep up the amazing work!
                  </p>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", damping: 10 }}
                    className="mb-6"
                  >
                    <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <RefreshCw className="h-10 w-10 text-white" />
                    </div>
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-4 text-blue-600 dark:text-blue-400">Review Complete!</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
                    Great job reviewing! Ready to see your progress?
                  </p>
                </>
              )}
              <Button
                onClick={() => {
                  setShowCompletionFeedback(false)
                  handleFinishQuiz()
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <Star className="w-6 h-6 mr-3" />
                View Results
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showConfetti && <Confetti isActive={showConfetti} />}
    </>
  )
}
