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
import { FlashcardController } from "./FlashcardController"
import { Button } from "@/components/ui/button"
import { CheckCircle, RefreshCw, ArrowRight, RotateCcw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

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
    return <GlobalLoader text="Loading flashcards..." subText="Preparing your study materials" theme="primary" />
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
        className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Simplified Header Section */}
        <motion.div
          className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm"
          variants={cardVariants}
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">📚</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">{title}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        Flashcards
                      </Badge>
                      {isReviewMode && (
                        <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                          Review Mode
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {streak > 0 && (
                  <motion.div
                    className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full border border-green-200 dark:border-green-800"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.5, repeat: streak > 5 ? Number.POSITIVE_INFINITY : 0, repeatDelay: 2 }}
                  >
                    <span className="text-lg">🔥</span>
                    <span className="text-sm font-bold text-green-700 dark:text-green-300">{streak} streak</span>
                  </motion.div>
                )}

                <div className="text-sm font-medium text-muted-foreground">
                  {currentQuestionIndex + 1} / {cards.length}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <motion.div className="mt-4" variants={cardVariants}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Progress</span>
                <span className="text-xs font-bold text-primary">{progress}%</span>
              </div>
              <div className="relative">
                <Progress value={progress} className="h-2" />
                <motion.div
                  className="absolute top-0 left-0 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Controller Section */}
            <motion.div className="mb-6" variants={cardVariants}>
              <FlashcardController
                title={title}
                currentIndex={currentQuestionIndex}
                totalCards={cards?.length || 0}
                streak={streak}
                bestStreak={bestStreak}
                isReviewMode={isReviewMode}
                flipped={flipped}
                autoAdvance={autoAdvance}
                showSettings={showSettings}
                onToggleFlip={toggleFlip}
                onNextCard={moveToNextCard}
                onSetAutoAdvance={setAutoAdvance}
                onSetShowSettings={setShowSettings}
                onRestartQuiz={handleRestartQuiz}
                onFinishQuiz={handleFinishQuiz}
              />
            </motion.div>

            {/* Flashcard Content Area */}
            <motion.div
              className="relative min-h-[400px] sm:min-h-[450px] md:min-h-[500px] w-full perspective-1000"
              variants={cardVariants}
            >
              <motion.div
                key={`card-${currentQuestionIndex}`}
                drag={!swipeDisabled && !isCompleted ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragEnd={handleDragEnd}
                animate={cardControls}
                layoutId={`card-${currentQuestionIndex}`}
                className="absolute inset-0 w-full h-full touch-manipulation cursor-grab active:cursor-grabbing"
                ref={cardRef}
                tabIndex={0}
                aria-label="Flashcard"
                whileHover={{ scale: 1.01 }}
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
            <motion.div className="flex items-center justify-center gap-4 mt-6" variants={cardVariants}>
              <Button
                variant="outline"
                size="lg"
                onClick={toggleFlip}
                disabled={swipeDisabled}
                className="flex items-center gap-2 bg-background/80 backdrop-blur-sm hover:bg-muted/80 transition-all duration-200"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Flip Card</span>
              </Button>

              {currentQuestionIndex < cards.length - 1 && (
                <Button
                  onClick={moveToNextCard}
                  disabled={swipeDisabled}
                  size="lg"
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <span>Next Card</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}

              {currentQuestionIndex === cards.length - 1 && (
                <Button
                  onClick={handleFinishQuiz}
                  disabled={swipeDisabled}
                  size="lg"
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Finish Quiz</span>
                </Button>
              )}
            </motion.div>

            {/* Mobile Swipe Hint */}
            <motion.div className="block sm:hidden text-center mt-4" variants={cardVariants}>
              <p className="text-xs text-muted-foreground">Swipe left: Next • Swipe right: Flip • Tap: Flip</p>
            </motion.div>
          </div>
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
                "px-6 sm:px-8 md:px-12 py-4 sm:py-6 md:py-8 rounded-2xl sm:rounded-3xl md:rounded-[2rem] text-white font-bold text-xl sm:text-2xl md:text-3xl shadow-2xl border-4 max-w-[90vw] text-center",
                ratingAnimation === "correct" && "bg-green-500 border-green-400",
                ratingAnimation === "still_learning" && "bg-amber-500 border-amber-400",
                ratingAnimation === "incorrect" && "bg-red-500 border-red-400",
              )}
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 2, -2, 0],
              }}
              transition={{ duration: 0.5 }}
            >
              {ratingAnimation === "correct" && "✅ I knew it!"}
              {ratingAnimation === "still_learning" && "📚 Still learning"}
              {ratingAnimation === "incorrect" && "❌ Need to study"}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showConfetti && <Confetti isActive={showConfetti} />}

      {/* Completion feedback modal */}
      <AnimatePresence>
        {showCompletionFeedback && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-background rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center border border-border/50"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ type: "spring", damping: 15 }}
            >
              {completionFeedbackType === "success" ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", damping: 10 }}
                  >
                    <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2">Great progress!</h2>
                  <p className="text-muted-foreground mb-6">
                    You've improved your knowledge of these cards. Keep up the good work!
                  </p>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", damping: 10 }}
                  >
                    <RefreshCw className="h-16 w-16 mx-auto text-blue-500 mb-4" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2">Review Complete</h2>
                  <p className="text-muted-foreground mb-6">
                    You've gone through all the review cards. Want to see your progress?
                  </p>
                </>
              )}
              <Button
                onClick={() => {
                  setShowCompletionFeedback(false)
                  handleFinishQuiz()
                }}
                className="w-full"
                size="lg"
              >
                See Results
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
