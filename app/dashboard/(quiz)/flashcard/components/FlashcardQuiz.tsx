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
      className="w-full max-w-4xl mx-auto space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header - Simplified */}
      <motion.div className="text-center space-y-4">
        {/* Quiz Type Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Flashcard Quiz</span>
          </div>
        </div>

        {/* Progress */}
        <div className="text-sm text-muted-foreground">
          Card {currentQuestionIndex + 1} of {cards.length}
        </div>
      </motion.div>

      {/* Streak Display - Simplified */}
      {streak > 0 && (
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
            <span className="text-lg">🔥</span>
            <div className="text-sm">
              <span className="font-bold text-primary">{streak}</span>
              <span className="text-muted-foreground ml-1">streak</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Flashcard Container - Cleaner */}
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
          whileHover={{ y: -2 }}
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

      {/* Control Bar - Simplified */}
      <motion.div
        className="flex items-center justify-center gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Flip Button */}
        <Button
          variant="outline"
          size="lg"
          onClick={toggleFlip}
          disabled={isFinishing || ratingAnimation !== null}
          className="min-w-[120px] h-12"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          {flipped ? "Show Question" : "Show Answer"}
        </Button>

        {/* Save Button */}
        <Button
          variant={isSaved ? "default" : "outline"}
          size="lg"
          onClick={handleSaveCard}
          disabled={isFinishing}
          className="min-w-[100px] h-12"
        >
          <Heart className={cn("w-4 h-4 mr-2", isSaved && "fill-current")} />
          {isSaved ? "Saved" : "Save"}
        </Button>

        {/* Next Button */}
        <Button
          variant="default"
          size="lg"
          onClick={moveToNextCard}
          disabled={isFinishing || ratingAnimation !== null}
          className="min-w-[100px] h-12"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Next
        </Button>
      </motion.div>

      {/* Instructions - Simplified */}
      <motion.div
        className="text-center text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="space-y-1">
          <p>Click or swipe to flip • Arrow keys to navigate • Numbers 1-3 to rate</p>
          {flipped && !ratingAnimation && (
            <p className="text-xs">Rate yourself: 1 = Correct, 2 = Still Learning, 3 = Incorrect</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
