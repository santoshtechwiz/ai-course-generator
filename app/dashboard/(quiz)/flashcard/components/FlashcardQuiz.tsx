"use client"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck, ThumbsUp, ThumbsDown, Settings, BookOpen, RotateCw } from "lucide-react"
import { motion, AnimatePresence, useAnimation, type PanInfo } from "framer-motion"
import { useAnimation as useAnimationContext } from "@/providers/animation-provider"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { toast } from "sonner"
import {
  initFlashCardQuiz,
  submitFlashCardAnswer,
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
  onComplete?: (results: any) => void
}

const ratingFeedbackVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 }
}

export default function FlashCardQuiz({
  cards,
  quizId,
  slug,
  title,
  onSaveCard,
  savedCardIds = [],
  isReviewMode = false,
  onComplete,
}: FlashCardComponentProps) {
  const dispatch = useAppDispatch()
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
  const [reviewMode, setReviewMode] = useState(isReviewMode)
  const [reviewCards, setReviewCards] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [swipeDisabled, setSwipeDisabled] = useState(false)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [cardTimes, setCardTimes] = useState<Record<string, number>>({})
  const [streak, setStreak] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [lastRating, setLastRating] = useState<"correct" | "incorrect" | "still_learning" | null>(null)
  const [firstVisit, setFirstVisit] = useState(true)

  // Animation controls
  const cardControls = useAnimation()
  const cardRef = useRef<HTMLDivElement>(null)
  const { animationsEnabled } = useAnimationContext()

  // Mount tracking
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Initialize quiz
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

  // Loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      setFirstVisit(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Self ratings from answers
  const selfRating = useMemo(() => {
    const ratings: Record<string, "correct" | "incorrect" | "still_learning" | null> = {}
    
    if (answers && Array.isArray(answers)) {
      answers.forEach((answer) => {
        if (answer && answer.questionId) {
          ratings[answer.questionId] = answer.answer as "correct" | "incorrect" | "still_learning"
        }
      })
    }
    return ratings
  }, [answers])

  // Process results
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

  // Review cards by category
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

  // Current card
  const currentCard = useMemo(() => {
    if (!cards || !cards.length) return null

    if (reviewMode && reviewCards.length > 0) {
      const reviewIndex = Math.min(currentQuestionIndex, reviewCards.length - 1)
      const cardIndex = reviewCards[reviewIndex]
      return cards[cardIndex] || null
    }

    return cards[Math.min(currentQuestionIndex, cards.length - 1)]
  }, [reviewMode, reviewCards, currentQuestionIndex, cards])

  // Card saved status
  const isSaved = useMemo(
    () => (currentCard?.id ? savedCardIds.includes(currentCard.id.toString()) : false),
    [currentCard?.id, savedCardIds],
  )

  // Progress calculation
  const progress = useMemo(() => {
    if (reviewMode) {
      return reviewCards.length ? ((currentQuestionIndex + 1) / reviewCards.length) * 100 : 0
    }
    return cards?.length ? ((currentQuestionIndex + 1) / cards.length) * 100 : 0
  }, [reviewMode, currentQuestionIndex, reviewCards.length, cards?.length])

  // Enter review mode
  const handleEnterReviewMode = useCallback(
    (reviewType: "incorrect" | "still_learning" = "incorrect") => {
      const cardsToReview = reviewType === "incorrect" 
        ? reviewCardsByCategory.incorrect 
        : reviewCardsByCategory.stillLearning

      if (!cardsToReview.length) {
        toast.info(`No cards to review in this category`)
        return
      }

      setReviewCards(cardsToReview)
      setReviewMode(true)
      setFlipped(false)
      dispatch(setCurrentFlashCard(0))
      setStartTime(Date.now())
      toast.success(`Entered review mode with ${cardsToReview.length} cards`)
    },
    [reviewCardsByCategory, dispatch],
  )

  // Exit review mode
  const handleExitReviewMode = useCallback(() => {
    setReviewMode(false)
    dispatch(setCurrentFlashCard(0))
    setFlipped(false)
    setStartTime(Date.now())
    toast("Exited review mode")
  }, [dispatch])

  // Toggle card flip
  const toggleFlip = useCallback(() => {
    if (!flipped) {
      setStartTime(Date.now())
    }
    setFlipped(!flipped)
    setShowHint(false)
  }, [flipped])

  // Save card
  const handleSaveCard = useCallback(() => {
    if (onSaveCard && currentCard) {
      onSaveCard(currentCard)
      toast.success(isSaved ? "Removed from saved cards" : "Added to saved cards")
    }
  }, [onSaveCard, currentCard, isSaved])

  // Move to next card
  const moveToNextCard = useCallback(() => {
    if (!cards?.length) return

    const maxIndex = reviewMode ? reviewCards.length - 1 : cards.length - 1

    if (currentQuestionIndex < maxIndex) {
      setFlipped(false)
      setSwipeDisabled(true)

      if (animationsEnabled) {
        cardControls
          .start({
            x: -300,
            opacity: 0,
            transition: { duration: 0.3 },
          })
          .then(() => {
            if (isMountedRef.current) {
              dispatch(nextFlashCard())
              cardControls.set({ x: 0, opacity: 1 })
              setStartTime(Date.now())
              setSwipeDisabled(false)
            }
          })
      } else {
        dispatch(nextFlashCard())
        setStartTime(Date.now())
        setSwipeDisabled(false)
      }
    } else {
      if (reviewMode) {
        handleExitReviewMode()
      } else if (onComplete) {
        onComplete(processedResults)
      }
    }
  }, [
    currentQuestionIndex,
    reviewMode,
    reviewCards.length,
    cards,
    dispatch,
    cardControls,
    onComplete,
    processedResults,
    animationsEnabled,
    handleExitReviewMode
  ])

  // Handle self rating
  const handleSelfRating = useCallback(
    (cardId: string, rating: "correct" | "incorrect" | "still_learning") => {
      if (!cardId) return

      const endTime = Date.now()
      const timeSpent = Math.floor((endTime - startTime) / 1000)

      // Update streak
      if (rating === "correct") {
        setStreak(prev => prev + 1)
      } else {
        setStreak(0)
      }

      setLastRating(rating)
      setRatingAnimation(rating)
      setCardTimes(prev => ({
        ...prev,
        [cardId]: (prev[cardId] || 0) + timeSpent
      }))
      setSwipeDisabled(true)

      // Submit answer
      const answerData = {
        answer: rating,
        userAnswer: rating,
        timeSpent: timeSpent,
        isCorrect: rating === "correct",
        questionId: cardId,
        streak: rating === "correct" ? streak + 1 : 0
      }

      dispatch(submitFlashCardAnswer(answerData))

      // Haptic feedback
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(
          rating === "correct" ? [50, 30, 50] :
          rating === "still_learning" ? [30, 20, 30] : [100]
        )
      }

      // Confetti for milestones
      if (rating === "correct" && (streak + 1) % 5 === 0) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 2500)
      }

      // Auto-advance or reset animation
      setTimeout(() => {
        if (isMountedRef.current) {
          setRatingAnimation(null)
          if (autoAdvance) {
            moveToNextCard()
          }
          setSwipeDisabled(false)
        }
      }, 1000)
    },
    [dispatch, autoAdvance, moveToNextCard, startTime, streak],
  )

  // Restart quiz
  const handleRestartQuiz = useCallback(() => {
    dispatch(resetFlashCards())
    setFlipped(false)
    setReviewMode(false)
    setReviewCards([])
    setShowConfetti(false)
    setStreak(0)
    toast("Quiz has been reset")
  }, [dispatch])

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
      if (isCompleted) return

      switch (e.key) {
        case "ArrowRight":
          moveToNextCard()
          break
        case "ArrowLeft":
        case " ":
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
        case "h":
          setShowHint(!showHint)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isCompleted, moveToNextCard, toggleFlip, currentCard, flipped, handleSelfRating, showHint])

  // Animation variants
  const frontCardVariants = {
    initial: { opacity: 0, rotateY: 0 },
    animate: {
      opacity: 1,
      rotateY: 0,
      transition: { duration: animationsEnabled ? 0.4 : 0.1, ease: [0.23, 1, 0.32, 1] },
    },
    exit: {
      opacity: 0,
      rotateY: 90,
      transition: { duration: animationsEnabled ? 0.3 : 0.1, ease: [0.23, 1, 0.32, 1] },
    },
  }

  const backCardVariants = {
    initial: { opacity: 0, rotateY: -90 },
    animate: {
      opacity: 1,
      rotateY: 0,
      transition: { duration: animationsEnabled ? 0.4 : 0.1, ease: [0.23, 1, 0.32, 1] },
    },
    exit: {
      opacity: 0,
      rotateY: -90,
      transition: { duration: animationsEnabled ? 0.3 : 0.1, ease: [0.23, 1, 0.32, 1] },
    },
  }

  if (isLoading) {
    return <QuizLoader message="Loading flashcards..." subMessage="Preparing your study materials" />
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="text-xl font-medium">No flashcards available</div>
          <p className="text-muted-foreground">Please check back later or create your own flashcards</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <QuizContainer
        quizTitle="Flashcard Quiz"
        quizSubtitle="Test your knowledge with interactive flashcards"
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={reviewMode ? reviewCards.length : cards?.length || 0}
        quizType="Flashcard"
        animationKey={reviewMode ? `review-${currentQuestionIndex}` : `card-${currentQuestionIndex}`}
      >
        <div className="space-y-6">
          {/* Header with progress and settings */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <motion.h3
                className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                {reviewMode ? `Review Mode: ${title}` : title}
                {streak > 0 && (
                  <span className="ml-2 text-sm bg-green-500/10 text-green-600 px-2 py-1 rounded-full">
                    Streak: {streak} 🔥
                  </span>
                )}
              </motion.h3>

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
                        <div className="text-xs text-muted-foreground">Move to next card after rating</div>
                      </div>
                      <Switch checked={autoAdvance} onCheckedChange={setAutoAdvance} />
                    </div>

                    <div className="space-y-2">
                      {!reviewMode && (
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
                        </>
                      )}
                      {reviewMode && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExitReviewMode}
                          className="w-full rounded-xl border-2 hover:border-primary/40 hover:bg-primary/5"
                        >
                          Exit Review Mode
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRestartQuiz}
                        className="w-full rounded-xl border-2 hover:border-primary/40 hover:bg-primary/5"
                      >
                        <RotateCw className="w-4 h-4 mr-2" />
                        Restart Quiz
                      </Button>
                    </div>

                    <div className="pt-2 text-xs text-muted-foreground bg-muted/10 p-3 rounded-xl">
                      <p className="font-semibold mb-2">Keyboard shortcuts:</p>
                      <div className="space-y-1">
                        <p>Space/Left Arrow: Flip card</p>
                        <p>Right Arrow: Next card</p>
                        <p>1/Y: Mark as known</p>
                        <p>2/S: Still learning</p>
                        <p>3/N: Mark as incorrect</p>
                        <p>H: Toggle hint</p>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Progress value={progress} className="h-2" />
          </div>

          {/* Flashcard Content */}
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
                  {/* Decorative elements */}
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

                  {/* Question text */}
                  <div className="text-2xl font-bold text-center text-foreground z-10 max-w-md leading-relaxed overflow-auto max-h-[250px] scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-primary/20 scrollbar-track-transparent px-4">
                    {currentCard?.question || "No question available"}
                  </div>

                  {/* Hint (if available) */}
                  {showHint && currentCard?.keywords && (
                    <motion.div
                      className="mt-4 text-sm text-muted-foreground bg-muted/20 px-3 py-2 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p className="font-medium">Keywords:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {currentCard.keywords.map((keyword, i) => (
                          <span key={i} className="bg-background px-2 py-1 rounded text-xs">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Instructions */}
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
                    {currentCard?.keywords && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowHint(!showHint)
                        }}
                      >
                        {showHint ? "Hide hint" : "Show hint (H)"}
                      </Button>
                    )}
                  </div>
                </motion.div>
              ) : (
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
                  {/* Decorative elements for back */}
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

                  {/* Answer text */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-xl font-semibold text-center text-foreground max-w-md leading-relaxed overflow-auto max-h-[200px] scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-primary/20 scrollbar-track-transparent px-4">
                      {currentCard?.answer || "No answer available"}
                    </div>
                  </div>

                  {/* Rating buttons */}
                  <div className="mt-6 space-y-4">
                    <div className="text-center">
                      <span className="text-sm font-semibold text-muted-foreground bg-muted/20 px-3 py-1 rounded-full border border-muted/30">
                        How well did you know this?
                      </span>
                    </div>

                    <div className="flex gap-3 justify-center flex-wrap">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (currentCard?.id) {
                              handleSelfRating(currentCard.id.toString(), "correct")
                            }
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-green-400/30 hover:border-green-400/50"
                          size="lg"
                        >
                          <ThumbsUp className="w-5 h-5 mr-2" />I knew it!
                        </Button>
                      </motion.div>

                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (currentCard?.id) {
                              handleSelfRating(currentCard.id.toString(), "still_learning")
                            }
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-amber-400/30 hover:border-amber-400/50"
                          size="lg"
                        >
                          <BookOpen className="w-5 h-5 mr-2" />
                          Still learning
                        </Button>
                      </motion.div>

                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (currentCard?.id) {
                              handleSelfRating(currentCard.id.toString(), "incorrect")
                            }
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-red-400/30 hover:border-red-400/50"
                          size="lg"
                        >
                          <ThumbsDown className="w-5 h-5 mr-2" />
                          Need to study
                        </Button>
                      </motion.div>
                    </div>

                    {/* Keyboard shortcuts */}
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

                  {/* Save button */}
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
                <div
                  className={cn(
                    "px-8 py-6 rounded-3xl text-white font-bold text-2xl shadow-2xl border-4",
                    ratingAnimation === "correct" && "bg-green-500 border-green-400",
                    ratingAnimation === "still_learning" && "bg-amber-500 border-amber-400",
                    ratingAnimation === "incorrect" && "bg-red-500 border-red-400",
                  )}
                >
                  {ratingAnimation === "correct" && "✅ I knew it!"}
                  {ratingAnimation === "still_learning" && "📚 Still learning"}
                  {ratingAnimation === "incorrect" && "❌ Need to study"}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
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
                onClick={() => {
                  if (
                    currentQuestionIndex >=
                    (reviewMode ? reviewCards.length - 1 : (cards?.length || 0) - 1)
                  ) {
                    if (reviewMode) {
                      handleExitReviewMode()
                    } else if (onComplete) {
                      onComplete(processedResults)
                    }
                  } else {
                    moveToNextCard()
                  }
                }}
                className="px-6 py-3 rounded-xl font-semibold bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
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

      {showConfetti && <Confetti isActive={true} />}
    </>
  )
}