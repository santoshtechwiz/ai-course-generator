"use client"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence, useAnimation, type PanInfo } from "framer-motion"
import { useAnimation as useAnimationContext } from "@/providers/animation-provider"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { submitFlashCardAnswer, nextFlashCard } from "@/store/slices/flashcard-slice"
import { useAppDispatch, useAppSelector } from "@/store"

// Import modular components
import { FlashcardFront } from "./FlashcardFront"
import { FlashcardBack } from "./FlashcardBack"
import { Button } from "@/components/ui/button"
import { ArrowRight, RotateCcw, Heart, Brain } from "lucide-react"

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

// Standardized animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3, ease: "easeIn" },
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

  // Move to next card
  const moveToNextCard = useCallback(() => {
    if (!cards?.length) return
    const maxIndex = cards.length - 1

    if (currentQuestionIndex < maxIndex) {
      setFlipped(false)
      dispatch(nextFlashCard())
    } else {
      // Quiz completed - show completion feedback
      handleQuizCompletion()
    }
  }, [currentQuestionIndex, cards, dispatch])

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

  // Handle self rating
  const handleSelfRating = useCallback(
    (cardId: string, rating: "correct" | "incorrect" | "still_learning") => {
      if (!cardId) return

      const newStreak = rating === "correct" ? streak + 1 : 0
      setStreak(newStreak)
      setRatingAnimation(rating)

      const answerData = {
        answer: rating,
        userAnswer: rating,
        timeSpent: 5,
        isCorrect: rating === "correct",
        questionId: cardId,
        streak: newStreak,
        priority: rating === "correct" ? 1 : rating === "still_learning" ? 2 : 3,
      }

      dispatch(submitFlashCardAnswer(answerData))

      // Haptic feedback
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(rating === "correct" ? [50, 30, 50] : [100])
      }

      // Auto-advance after rating
      setTimeout(() => {
        setRatingAnimation(null)
        moveToNextCard()
      }, 1000)
    },
    [dispatch, moveToNextCard, streak],
  )

  // Handle swipe gestures
  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipeThreshold = 100
      const isEffectiveSwipe = Math.abs(info.offset.x) > swipeThreshold

      if (isEffectiveSwipe) {
        if (window.navigator?.vibrate) window.navigator.vibrate(50)
        if (info.offset.x < 0) {
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
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="space-y-8">
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Flashcard Quiz</span>
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
            <div className="flex items-center gap-3 bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20 backdrop-blur-sm">
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
                <div className="text-lg font-bold text-primary">{streak}</div>
                <div className="text-xs text-muted-foreground font-medium">streak</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Flashcard Container */}
        <div className="relative w-full max-w-4xl mx-auto">
          <motion.div
            key={`card-${currentQuestionIndex}`}
            drag="x"
            dragConstraints={{ left: -50, right: 50 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            animate={cardControls}
            className="w-full cursor-grab active:cursor-grabbing"
            ref={cardRef}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
        </div>

        {/* Control Bar */}
        <motion.div
          className="flex items-center justify-center gap-3 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Flip Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="lg"
              onClick={toggleFlip}
              className="group h-12 px-6 border-2 border-primary/20 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 bg-transparent"
            >
              <motion.div
                animate={{ rotate: flipped ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="mr-2"
              >
                <RotateCcw className="h-4 w-4 text-primary" />
              </motion.div>
              <span className="text-primary font-medium">{flipped ? "Show Question" : "Show Answer"}</span>
            </Button>
          </motion.div>

          {/* Next Button */}
          {currentQuestionIndex < cards.length - 1 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={moveToNextCard}
                size="lg"
                className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
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
                className="h-12 px-6 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <span className="font-medium mr-2">{isFinishing ? "Finishing..." : "Complete Quiz"}</span>
                {isFinishing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <ArrowRight className="h-4 w-4" />
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
                  : "text-muted-foreground hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20",
              )}
            >
              <motion.div animate={isSaved ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
                <Heart className={cn("h-5 w-5", isSaved && "fill-current")} />
              </motion.div>
            </Button>
          </motion.div>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          className="flex justify-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full text-sm text-muted-foreground">
            <span className="font-medium">
              {currentQuestionIndex + 1} of {cards.length}
            </span>
            <span className="text-xs">•</span>
            <span className="text-xs">Press Space to flip</span>
          </div>
        </motion.div>

        {/* Rating Animation Overlay */}
        <AnimatePresence>
          {ratingAnimation && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className={cn(
                  "px-8 py-6 rounded-2xl text-white font-bold text-xl shadow-2xl backdrop-blur-sm",
                  ratingAnimation === "correct" && "bg-emerald-500/90",
                  ratingAnimation === "still_learning" && "bg-amber-500/90",
                  ratingAnimation === "incorrect" && "bg-red-500/90",
                )}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="flex items-center gap-3">
                  {ratingAnimation === "correct" && (
                    <>
                      <span className="text-2xl">🎉</span>
                      <span>Perfect!</span>
                    </>
                  )}
                  {ratingAnimation === "still_learning" && (
                    <>
                      <span className="text-2xl">📚</span>
                      <span>Keep Learning</span>
                    </>
                  )}
                  {ratingAnimation === "incorrect" && (
                    <>
                      <span className="text-2xl">💪</span>
                      <span>Practice More</span>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
