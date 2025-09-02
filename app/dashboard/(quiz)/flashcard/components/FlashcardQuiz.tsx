"use client"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence, useAnimation, type PanInfo } from "framer-motion"
import { useAnimation as useAnimationContext } from "@/providers/animation-provider"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { submitFlashCardAnswer, nextFlashCard, setCurrentFlashCard } from "@/store/slices/flashcard-slice"
import { useAppDispatch, useAppSelector } from "@/store"

// Import modular components
import { FlashcardFront } from "./FlashcardFront"
import { FlashcardBack } from "./FlashcardBack"
import { Button } from "@/components/ui/button"
import { ArrowRight, RotateCcw, Heart, Brain, Target, TrendingUp, Clock, Lightbulb, CheckCircle2 } from "lucide-react"

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
  saved?: boolean
  difficulty?: "easy" | "medium" | "hard"
  category?: string
  tags?: string[]
}

interface FlashCardComponentProps {
  cards: FlashCard[]
  quizId: string | number
  slug: string
  title: string
  onSaveCard?: (card: FlashCard) => void
  onComplete?: (results: any) => void
  isReviewMode?: boolean
}

// Enhanced animation variants with more sophisticated transitions
const containerVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.1
    },
  },
  exit: {
    opacity: 0,
    y: -30,
    scale: 0.95,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const cardVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.8,
    rotateY: direction > 0 ? 15 : -15,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    rotateY: 0,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.8,
    rotateY: direction < 0 ? 15 : -15,
  }),
}

const swipeConfidenceThreshold = 10000
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity
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

  const { currentQuestion: currentQuestionIndex, isCompleted } = useAppSelector((state) => state.flashcard)

  // Simplified state
  const [flipped, setFlipped] = useState(false)
  const [ratingAnimation, setRatingAnimation] = useState<"correct" | "incorrect" | "still_learning" | null>(null)
  const [streak, setStreak] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [savedCardIds, setSavedCardIds] = useState<string[]>([])
  const [isFinishing, setIsFinishing] = useState(false)

  // Animation controls
  const cardControls = useAnimation()
  const cardRef = useRef<HTMLDivElement>(null)
  const { animationsEnabled } = useAnimationContext()

  // Current card
  const currentCard = useMemo(() => {
    if (!cards || !cards.length) return null
    return cards[Math.min(currentQuestionIndex, cards.length - 1)]
  }, [currentQuestionIndex, cards])

  // Card saved status
  const isSaved = useMemo(() => {
    if (!currentCard?.id) return false
    return currentCard.saved || savedCardIds.includes(currentCard.id.toString())
  }, [currentCard?.id, currentCard?.saved, savedCardIds])

  // Toggle card flip
  const toggleFlip = useCallback(() => {
    setFlipped((prev) => !prev)
    setShowHint(false)
  }, [])

  // Save card
  const handleSaveCard = useCallback(() => {
    if (!currentCard) return

    if (onSaveCard) {
      onSaveCard(currentCard)
    }

    setSavedCardIds((prev) => {
      const id = currentCard.id.toString()
      const newIds = prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
      toast.success(prev.includes(id) ? "Removed from saved cards" : "Added to saved cards")
      return newIds
    })
  }, [currentCard, onSaveCard])

  // Enhanced adaptive scheduler with spaced repetition algorithm
  const computeNextIndex = useCallback(() => {
    if (!cards?.length) return currentQuestionIndex

    // Get answers from Redux state
    const state = (window as any).__NEXT_REDUX_STORE__?.getState?.()
    const fcAnswers: any[] = state?.flashcard?.answers || []
    const statusById = new Map<string, "correct" | "incorrect" | "still_learning" | "unseen">()

    // Build answer history map
    fcAnswers.forEach((a: any) => {
      if (a && typeof a.questionId !== 'undefined' && typeof a.answer !== 'undefined') {
        statusById.set(String(a.questionId), a.answer)
      }
    })

    // Categorize cards by difficulty and performance
    const categories = {
      highPriority: [] as number[], // Incorrect answers
      mediumPriority: [] as number[], // Still learning
      lowPriority: [] as number[], // Correct but need review
      newCards: [] as number[] // Unseen cards
    }

    cards.forEach((card, idx) => {
      const status = statusById.get(String(card.id)) || "unseen"
      const difficulty = card.difficulty || "medium"

      if (status === "incorrect") {
        categories.highPriority.push(idx)
      } else if (status === "still_learning") {
        categories.mediumPriority.push(idx)
      } else if (status === "correct") {
        // Review correct cards less frequently based on difficulty
        const reviewProbability = difficulty === "hard" ? 0.3 : difficulty === "medium" ? 0.2 : 0.1
        if (Math.random() < reviewProbability) {
          categories.lowPriority.push(idx)
        }
      } else {
        categories.newCards.push(idx)
      }
    })

    // Remove current index to avoid immediate repeats
    const removeCurrent = (arr: number[]) => arr.filter((i) => i !== currentQuestionIndex)

    const pools = [
      { items: removeCurrent(categories.highPriority), weight: 0.5 },
      { items: removeCurrent(categories.mediumPriority), weight: 0.3 },
      { items: removeCurrent(categories.newCards), weight: 0.15 },
      { items: removeCurrent(categories.lowPriority), weight: 0.05 }
    ]

    // Weighted random selection
    const random = Math.random()
    let cumulativeWeight = 0

    for (const pool of pools) {
      cumulativeWeight += pool.weight
      if (random <= cumulativeWeight && pool.items.length > 0) {
        return pool.items[Math.floor(Math.random() * pool.items.length)]
      }
    }

    // Fallback: sequential progression
    const next = currentQuestionIndex + 1
    return next < cards.length ? next : 0
  }, [cards, currentQuestionIndex])

  // Handle quiz completion with proper feedback
  const handleQuizCompletion = useCallback(() => {
    setIsFinishing(true)

    // Show completion toast
    toast.success("🎉 Quiz completed! Great job!", {
      duration: 3000,
      description: `You've finished all ${cards.length} flashcards!`,
    })

    // Call completion callback after a short delay to show the toast
    setTimeout(() => {
      if (onComplete) {
        onComplete({ totalCount: cards.length })
      }
      setIsFinishing(false)
    }, 1500)
  }, [cards.length, onComplete])
  // Move to next card using adaptive scheduler
  const moveToNextCard = useCallback(() => {
    if (!cards?.length) return
    const nextIndex = computeNextIndex()
    setFlipped(false)
    if (nextIndex === 0 && currentQuestionIndex === cards.length - 1) {
      handleQuizCompletion()
    } else {
      dispatch(setCurrentFlashCard(nextIndex))
    }
  }, [cards, computeNextIndex, dispatch, currentQuestionIndex, handleQuizCompletion])



  // Enhanced self-rating with detailed feedback
  const handleSelfRating = useCallback(
    (cardId: string, rating: "correct" | "incorrect" | "still_learning") => {
      if (!cardId || !currentCard) return

      const newStreak = rating === "correct" ? streak + 1 : 0
      setStreak(newStreak)
      setRatingAnimation(rating)

      // Enhanced feedback based on rating
      const feedback = {
        correct: {
          message: "Excellent! 🎉",
          description: "You got this one right!",
          color: "emerald",
          icon: "🎯"
        },
        still_learning: {
          message: "Keep Going! 📚",
          description: "You're on the right track",
          color: "amber",
          icon: "💡"
        },
        incorrect: {
          message: "No Worries! 💪",
          description: "Practice makes perfect",
          color: "red",
          icon: "🔄"
        }
      }

      const currentFeedback = feedback[rating]

      // Show detailed toast feedback
      toast.success(currentFeedback.message, {
        description: currentFeedback.description,
        duration: 2000,
        icon: currentFeedback.icon
      })

      const answerData = {
        answer: rating,
        userAnswer: rating,
        timeSpent: 5,
        isCorrect: rating === "correct",
        questionId: cardId,
        streak: newStreak,
        priority: rating === "correct" ? 1 : rating === "still_learning" ? 2 : 3,
        difficulty: currentCard.difficulty || "medium",
        timestamp: Date.now()
      }

      dispatch(submitFlashCardAnswer(answerData))

      // Enhanced haptic feedback
      if (window.navigator?.vibrate) {
        const pattern = rating === "correct" ? [50, 30, 50] : rating === "still_learning" ? [100, 50, 100] : [150, 50, 150]
        window.navigator.vibrate(pattern)
      }

      // Auto-advance with enhanced timing
      const delay = rating === "correct" ? 1200 : 1500 // Shorter delay for correct answers
      setTimeout(() => {
        setRatingAnimation(null)
        moveToNextCard()
      }, delay)
    },
    [dispatch, moveToNextCard, streak, currentCard],
  )

  // Handle swipe gestures
  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipeThreshold = 120
      const { offset, velocity } = info

      // Calculate swipe power for more natural feel
      const swipePowerValue = swipePower(offset.x, velocity.x)

      if (Math.abs(swipePowerValue) > swipeConfidenceThreshold) {
        if (window.navigator?.vibrate) window.navigator.vibrate(50)

        if (offset.x < 0) {
          // Swipe left - next card
          cardControls.start({
            x: -300,
            opacity: 0,
            scale: 0.8,
            rotateY: -15,
            transition: { duration: 0.3, ease: "easeOut" }
          }).then(() => moveToNextCard())
        } else {
          // Swipe right - flip card
          toggleFlip()
        }
      } else {
        // Return to center with spring animation
        cardControls.start({
          x: 0,
          opacity: 1,
          scale: 1,
          rotateY: 0,
          transition: {
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 0.8
          },
        })
      }
    },
    [moveToNextCard, toggleFlip, cardControls],
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted || isFinishing) return

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
          if (currentCard?.id && flipped && !ratingAnimation) {
            handleSelfRating(currentCard.id.toString(), "correct")
          }
          break
        case "2":
          if (currentCard?.id && flipped && !ratingAnimation) {
            handleSelfRating(currentCard.id.toString(), "still_learning")
          }
          break
        case "3":
          if (currentCard?.id && flipped && !ratingAnimation) {
            handleSelfRating(currentCard.id.toString(), "incorrect")
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isCompleted, isFinishing, moveToNextCard, toggleFlip, currentCard, flipped, handleSelfRating, ratingAnimation])

  if (!cards || cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-center">
        <div className="space-y-4">
          <div className="text-6xl">📚</div>
          <h3 className="text-xl font-semibold">No flashcards available</h3>
          <p className="text-muted-foreground">Please check back later or create your own flashcards</p>
        </div>
      </div>
    )
  }

  // Show completion loader
  if (isFinishing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-center">
        <div className="space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="text-6xl mx-auto"
          >
            🎯
          </motion.div>
          <h3 className="text-xl font-semibold">Completing Quiz...</h3>
          <p className="text-muted-foreground">Calculating your results</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="w-full h-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <motion.div
          className="text-center space-y-6"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Quiz Type Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-200 dark:border-orange-800 rounded-full">
              <Brain className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Flashcard Quiz</span>
            </div>
          </motion.div>

          {/* Progress indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground"
          >
            Card {currentQuestionIndex + 1} of {cards.length}
          </motion.div>
        </motion.div>

        {/* Streak Display */}
        {streak > 0 && (
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 dark:from-orange-400/20 dark:to-red-400/20 px-6 py-3 rounded-2xl border border-orange-200/50 dark:border-orange-700/50 backdrop-blur-sm">
              <motion.span
                className="text-2xl"
                animate={{
                  rotate: streak > 3 ? [0, 10, -10, 0] : 0,
                  scale: streak > 3 ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
              >
                🔥
              </motion.span>
              <div>
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{streak}</div>
                <div className="text-xs text-orange-500 dark:text-orange-500 font-medium">streak</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Progress Section */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Progress
              </span>
            </div>
            <div className="flex-1 min-w-32">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {currentQuestionIndex + 1} of {cards.length}
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {Math.round(((currentQuestionIndex + 1) / cards.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestionIndex + 1) / cards.length) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Main Flashcard Container */}
        <div className="relative w-full">
          <motion.div
            key={`card-${currentQuestionIndex}`}
            drag="x"
            dragConstraints={{ left: -50, right: 50 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            animate={cardControls}
            className="w-full cursor-grab active:cursor-grabbing"
            ref={cardRef}
            whileHover={{
              y: -8,
              scale: 1.02,
              transition: { type: "spring", stiffness: 400, damping: 25 }
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {/* Card Shadow Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-red-400/20 rounded-3xl blur-xl"
              animate={{
                opacity: flipped ? 0.6 : 0.3,
                scale: flipped ? 1.05 : 1
              }}
              transition={{ duration: 0.3 }}
            />

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
                    if (currentCard?.id && !ratingAnimation) {
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

          {/* Swipe Hint Animation */}
          <AnimatePresence>
            {!flipped && currentQuestionIndex > 0 && (
              <motion.div
                className="absolute top-4 right-4 text-muted-foreground/60"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: 2 }}
              >
                <motion.div
                  animate={{ x: [-5, 5, -5] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
                  className="flex items-center gap-1 text-xs"
                >
                  <ArrowRight className="w-3 h-3" />
                  <span>Swipe</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Enhanced Control Bar */}
        <motion.div
          className="flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Hint Button */}
          {!flipped && currentCard?.keywords && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowHint((v) => !v)}
                className="group h-12 px-4 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200 bg-transparent"
              >
                <Lightbulb className={cn("h-4 w-4 mr-2", showHint && "text-blue-600 dark:text-blue-400")} />
                <span className="text-blue-700 dark:text-blue-300 font-medium">
                  {showHint ? "Hide Hint" : "Show Hint"}
                </span>
              </Button>
            </motion.div>
          )}

          {/* Flip Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="lg"
              onClick={toggleFlip}
              className="group h-12 px-6 border-2 border-orange-200 dark:border-orange-700 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all duration-200 bg-transparent"
            >
              <motion.div
                animate={{ rotate: flipped ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="mr-2"
              >
                <RotateCcw className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </motion.div>
              <span className="text-orange-700 dark:text-orange-300 font-medium">
                {flipped ? "Show Question" : "Show Answer"}
              </span>
            </Button>
          </motion.div>

          {/* Next Button */}
          {currentQuestionIndex < cards.length - 1 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={moveToNextCard}
                size="lg"
                className="h-12 px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <span className="font-medium mr-2">Next Card</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Finish Button for Last Card */}
          {currentQuestionIndex === cards.length - 1 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleQuizCompletion}
                size="lg"
                disabled={isFinishing}
                className="h-12 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <span className="font-medium mr-2">{isFinishing ? "Finishing..." : "Complete Quiz"}</span>
                {isFinishing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          )}

          {/* Save Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="lg"
              onClick={handleSaveCard}
              className={cn(
                "h-12 px-4 transition-all duration-200",
                isSaved
                  ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30"
                  : "text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20",
              )}
            >
              <motion.div
                animate={isSaved ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart className={cn("h-5 w-5", isSaved && "fill-current")} />
              </motion.div>
            </Button>
          </motion.div>
        </motion.div>

        {/* Enhanced Progress Indicator */}
        <motion.div
          className="flex justify-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-6 px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Session Stats
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {currentQuestionIndex + 1}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Current
                </div>
              </div>

              <div className="w-px h-8 bg-slate-300 dark:bg-slate-600" />

              <div className="text-center">
                <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {cards.length}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Total
                </div>
              </div>

              <div className="w-px h-8 bg-slate-300 dark:bg-slate-600" />

              <AccuracyBadge />

              <div className="w-px h-8 bg-slate-300 dark:bg-slate-600" />

              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                <Clock className="w-3 h-3" />
                <span>Space = Flip</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Rating Animation Overlay */}
        <AnimatePresence>
          {ratingAnimation && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Background blur effect */}
              <motion.div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />

              <motion.div
                className={cn(
                  "relative px-8 py-6 rounded-2xl text-white font-bold text-xl shadow-2xl backdrop-blur-sm border-2",
                  ratingAnimation === "correct" && "bg-emerald-500/95 border-emerald-400",
                  ratingAnimation === "still_learning" && "bg-amber-500/95 border-amber-400",
                  ratingAnimation === "incorrect" && "bg-red-500/95 border-red-400",
                )}
                initial={{ scale: 0.5, opacity: 0, y: 20 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  y: 0,
                  rotate: ratingAnimation === "correct" ? [0, -5, 5, 0] : 0
                }}
                exit={{
                  scale: 0.8,
                  opacity: 0,
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  delay: 0.1
                }}
              >
                {/* Animated particles */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={cn(
                        "absolute w-2 h-2 rounded-full",
                        ratingAnimation === "correct" && "bg-emerald-300",
                        ratingAnimation === "still_learning" && "bg-amber-300",
                        ratingAnimation === "incorrect" && "bg-red-300",
                      )}
                      initial={{
                        x: "50%",
                        y: "50%",
                        scale: 0,
                        opacity: 0
                      }}
                      animate={{
                        x: `${50 + (Math.random() - 0.5) * 200}%`,
                        y: `${50 + (Math.random() - 0.5) * 200}%`,
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.1,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </motion.div>

                <div className="flex items-center gap-4 relative z-10">
                  <motion.span
                    className="text-3xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: ratingAnimation === "correct" ? [0, 10, -10, 0] : 0
                    }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {ratingAnimation === "correct" && "🎉"}
                    {ratingAnimation === "still_learning" && "📚"}
                    {ratingAnimation === "incorrect" && "💪"}
                  </motion.span>

                  <div className="text-center">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="font-bold text-lg"
                    >
                      {ratingAnimation === "correct" && "Perfect!"}
                      {ratingAnimation === "still_learning" && "Keep Learning!"}
                      {ratingAnimation === "incorrect" && "Practice Makes Perfect!"}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-sm opacity-90 mt-1"
                    >
                      {ratingAnimation === "correct" && "You're mastering this!"}
                      {ratingAnimation === "still_learning" && "You're on the right track"}
                      {ratingAnimation === "incorrect" && "Don't worry, you'll get it next time"}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function AccuracyBadge() {
  // Read from Redux without causing re-renders of parent
  let accuracy = 0
  let correct = 0
  let total = 0
  let streak = 0

  try {
    const state = (window as any).__NEXT_REDUX_STORE__?.getState?.()
    const answers: any[] = state?.flashcard?.answers || []
    total = answers.filter((a: any) => 'answer' in a).length
    correct = answers.filter((a: any) => a.answer === 'correct').length
    accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

    // Calculate current streak
    if (answers.length > 0) {
      for (let i = answers.length - 1; i >= 0; i--) {
        if (answers[i].answer === 'correct') {
          streak++
        } else {
          break
        }
      }
    }
  } catch {}

  return (
    <div className="text-center">
      <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
        {accuracy}%
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Accuracy
      </div>
      {streak > 0 && (
        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          🔥 {streak} streak
        </div>
      )}
    </div>
  )
}
