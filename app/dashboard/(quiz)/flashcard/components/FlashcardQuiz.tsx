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
import { CheckCircle, RefreshCw, ArrowRight, RotateCcw, Zap, Target, BookOpen, Heart, Star } from "lucide-react"
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

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
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
        {/* Enhanced Minimal Header Section - Removed Progress Bar and Buttons */}
        <motion.div
          className="sticky top-0 z-40 bg-gradient-to-r from-background/95 via-background/98 to-background/95 backdrop-blur-xl border-b border-border/30 shadow-lg"
          variants={cardVariants}
        >
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="flex items-center gap-4"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="relative">
                    <motion.div 
                      className="w-14 h-14 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl"
                      variants={pulseVariants}
                      animate="pulse"
                    >
                      <BookOpen className="w-7 h-7 text-white" />
                    </motion.div>
                    <motion.div
                      className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      <Zap className="w-3 h-3 text-white" />
                    </motion.div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                      {title}
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <Badge 
                        variant="secondary" 
                        className="text-xs bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-orange-200"
                      >
                        <Target className="w-3 h-3 mr-1" />
                        Flashcards
                      </Badge>
                      {isReviewMode && (
                        <Badge 
                          variant="outline" 
                          className="text-xs border-amber-300 bg-amber-50 text-amber-700 animate-pulse"
                        >
                          <Star className="w-3 h-3 mr-1" />
                          Review Mode
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="flex items-center gap-4">
                {/* Enhanced Streak Display */}
                {streak > 0 && (
                  <motion.div
                    className="relative"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.div
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 dark:from-green-900/30 dark:via-emerald-900/30 dark:to-teal-900/30 rounded-2xl border-2 border-green-200 dark:border-green-800 shadow-lg"
                      animate={{ 
                        scale: streak > 5 ? [1, 1.05, 1] : 1,
                        boxShadow: streak > 10 ? [
                          "0 4px 20px rgba(34, 197, 94, 0.3)",
                          "0 8px 30px rgba(34, 197, 94, 0.5)",
                          "0 4px 20px rgba(34, 197, 94, 0.3)"
                        ] : "0 4px 20px rgba(34, 197, 94, 0.3)"
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: streak > 5 ? Infinity : 0, 
                        repeatDelay: 1 
                      }}
                    >
                      <motion.span 
                        className="text-2xl"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                      >
                        🔥
                      </motion.span>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-700 dark:text-green-300">
                          {streak}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                          streak
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Streak milestone celebration */}
                    {streak % 5 === 0 && streak > 0 && (
                      <motion.div
                        className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ duration: 0.5 }}
                      >
                        <Star className="w-4 h-4 text-white fill-current" />
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Enhanced Card Counter */}
                <motion.div 
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 shadow-md"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{currentQuestionIndex + 1}</span>
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-blue-700 dark:text-blue-300">
                      of {cards.length}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      cards
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Enhanced Controller Section */}
            <motion.div className="mb-8" variants={cardVariants}>
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

            {/* Enhanced Flashcard Content Area */}
            <motion.div
              className="relative min-h-[450px] sm:min-h-[500px] md:min-h-[550px] w-full perspective-1000 mb-8"
              variants={cardVariants}
            >
              <motion.div
                key={`card-${currentQuestionIndex}`}
                drag={!swipeDisabled && !isCompleted ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd}
                animate={cardControls}
                layoutId={`card-${currentQuestionIndex}`}
                className="absolute inset-0 w-full h-full touch-manipulation cursor-grab active:cursor-grabbing"
                ref={cardRef}
                tabIndex={0}
                aria-label="Flashcard"
                whileHover={{ scale: 1.01, rotateY: flipped ? 0 : 2 }}
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

            {/* Enhanced Navigation Controls */}
            <motion.div className="flex items-center justify-center gap-6 mb-6" variants={cardVariants}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={toggleFlip}
                  disabled={swipeDisabled}
                  className="flex items-center gap-3 bg-gradient-to-r from-background/90 to-muted/50 backdrop-blur-sm hover:from-muted/80 hover:to-background/80 border-2 border-border/50 hover:border-primary/30 shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3"
                >
                  <motion.div
                    animate={{ rotate: flipped ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
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
                    className="flex items-center gap-3 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-3 border-0"
                  >
                    <span className="font-bold">Next Card</span>
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.div>
                  </Button>
                </motion.div>
              )}

              {/* Enhanced Save Button */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSaveCard}
                  disabled={swipeDisabled}
                  className={cn(
                    "flex items-center gap-3 border-2 shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3",
                    isSaved
                      ? "bg-gradient-to-r from-rose-100 to-pink-100 border-rose-300 text-rose-700 hover:from-rose-200 hover:to-pink-200"
                      : "bg-gradient-to-r from-background/90 to-muted/50 border-border/50 hover:border-rose-300"
                  )}
                >
                  <motion.div
                    animate={isSaved ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart className={cn("h-5 w-5", isSaved && "fill-current text-rose-500")} />
                  </motion.div>
                  <span className="font-semibold">
                    {isSaved ? "Saved" : "Save"}
                  </span>
                </Button>
              </motion.div>
            </motion.div>

            {/* Enhanced Mobile Swipe Hint */}
            <motion.div 
              className="block sm:hidden text-center"
              variants={cardVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-muted/80 to-background/80 rounded-full border border-border/50 shadow-md">
                <motion.div
                  animate={{ x: [-2, 2, -2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-sm">👆</span>
                </motion.div>
                <p className="text-xs text-muted-foreground font-medium">
                  Swipe left: Next • Swipe right: Flip • Tap: Flip
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

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
            <motion.div
              className={cn(
                "px-8 sm:px-12 md:px-16 py-6 sm:py-8 md:py-10 rounded-3xl sm:rounded-[2rem] md:rounded-[3rem] text-white font-bold text-2xl sm:text-3xl md:text-4xl shadow-2xl border-4 max-w-[90vw] text-center backdrop-blur-sm",
                ratingAnimation === "correct" && "bg-gradient-to-r from-green-500 to-emerald-500 border-green-300",
                ratingAnimation === "still_learning" && "bg-gradient-to-r from-amber-500 to-orange-500 border-amber-300",
                ratingAnimation === "incorrect" && "bg-gradient-to-r from-red-500 to-rose-500 border-red-300",
              )}
              animate={{
                scale: [0.8, 1.1, 1],
                rotate: [0, 3, -3, 0],
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {ratingAnimation === "correct" && "🎉 I knew it!"}
                {ratingAnimation === "still_learning" && "📚 Still learning"}
                {ratingAnimation === "incorrect" && "🤔 Need to study"}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showConfetti && <Confetti isActive={showConfetti} />}

      {/* Enhanced Completion feedback modal */}
      <AnimatePresence>
        {showCompletionFeedback && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-background via-background to-muted/20 rounded-3xl shadow-2xl p-8 sm:p-10 max-w-md w-full text-center border-2 border-border/50"
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
                    <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-xl">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Great progress!
                  </h2>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    You've improved your knowledge of these cards. Keep up the excellent work!
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
                    <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-xl">
                      <RefreshCw className="h-10 w-10 text-white" />
                    </div>
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Review Complete
                  </h2>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    You've gone through all the review cards. Ready to see your progress?
                  </p>
                </>
              )}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => {
                    setShowCompletionFeedback(false)
                    handleFinishQuiz()
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
                  size="lg"
                >
                  <Star className="w-5 h-5 mr-2" />
                  See Results
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

