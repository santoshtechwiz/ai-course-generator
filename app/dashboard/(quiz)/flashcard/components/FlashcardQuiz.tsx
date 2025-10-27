"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence, useAnimation, type PanInfo } from "framer-motion"
import { useAnimation as useAnimationContext } from "@/providers/animation-provider"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { submitFlashCardAnswer, setCurrentFlashCard } from "@/store/slices/flashcard-slice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

// Import the simplified components
import { FlashcardFront } from "./FlashcardFront"
import { FlashcardBack } from "./FlashcardBack"
import { FlashcardController } from "./FlashcardController"

import { Button } from "@/components/ui/button"
import { RotateCcw, Heart, Brain } from "lucide-react"
import { AppLoader } from "@/components/ui/loader"
import { LOADER_MESSAGES } from "@/constants/loader-messages"

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
  isFocusMode?: boolean
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
  isFocusMode = false,
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
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

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
    setFlipped(prev => !prev)
    setShowHint(false)
  }, [])

  // Save card
  const handleSaveCard = useCallback(() => {
    if (!currentCard) return

    if (onSaveCard) {
      onSaveCard(currentCard)
    }

    setSavedCardIds(prev => {
      const id = currentCard.id.toString()
      const newIds = prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
      toast.success(prev.includes(id) ? "Removed from saved" : "Added to saved")
      return newIds
    })
  }, [currentCard, onSaveCard])

  // Simplified next card logic
  const moveToNextCard = useCallback(() => {
    if (!cards?.length) return
    
    const nextIndex = currentQuestionIndex + 1
    setFlipped(false)
    
    if (nextIndex >= cards.length) {
      handleQuizCompletion()
    } else {
      dispatch(setCurrentFlashCard(nextIndex))
    }
  }, [cards, currentQuestionIndex, dispatch])

  // Handle quiz completion
  const handleQuizCompletion = useCallback(() => {
    setIsFinishing(true)
    toast.success("🎉 Quiz completed!")
    
    setTimeout(() => {
      if (onComplete) {
        onComplete({ totalCount: cards.length })
      }
      setIsFinishing(false)
    }, 1500)
  }, [cards.length, onComplete])

  // Handle self-rating with simplified feedback
  const handleSelfRating = useCallback(
    async (cardId: string, rating: "correct" | "incorrect" | "still_learning") => {
      if (!cardId || !currentCard) return

      const newStreak = rating === "correct" ? streak + 1 : 0
      setStreak(newStreak)
      setRatingAnimation(rating)

      // Simple feedback
      const feedback = {
        correct: { message: "Perfect! 🎉", icon: "🎯" },
        still_learning: { message: "Keep going! 📚", icon: "💡" },
        incorrect: { message: "No worries! 💪", icon: "🔄" }
      }

      toast.success(feedback[rating].message)

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

      // Save review to database with spaced repetition scheduling
      try {
        const response = await fetch('/api/flashcards/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardId: parseInt(cardId),
            rating,
            timeSpent: answerData.timeSpent
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('[Flashcard] Review scheduled:', data.schedule)
        }
      } catch (error) {
        console.error('[Flashcard] Failed to save review:', error)
      }

      // Auto-advance or manual control
      const delay = autoAdvance ? 1200 : 0
      setTimeout(() => {
        setRatingAnimation(null)
        if (autoAdvance) {
          moveToNextCard()
        }
      }, delay)
    },
    [dispatch, moveToNextCard, streak, currentCard, autoAdvance]
  )

  // Handle swipe gestures (simplified)
  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info
      const swipePowerValue = swipePower(offset.x, velocity.x)

      if (Math.abs(swipePowerValue) > swipeConfidenceThreshold) {
        if (offset.x < 0) {
          // Swipe left - next card
          moveToNextCard()
        } else {
          // Swipe right - flip card
          toggleFlip()
        }
      } else {
        // Return to center
        cardControls.start({
          x: 0,
          opacity: 1,
          scale: 1,
          transition: { type: "spring", stiffness: 400, damping: 30 }
        })
      }
    },
    [moveToNextCard, toggleFlip, cardControls]
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
      <div className="flex items-center justify-center min-h-[60vh] text-center p-4">
        <div className="space-y-4 p-6 sm:p-8 bg-card border-4 border-border shadow-neo rounded-none max-w-md mx-auto">
          <div className="text-5xl sm:text-6xl">📚</div>
          <h3 className="text-lg sm:text-xl font-black text-foreground">No flashcards available</h3>
          <p className="text-sm sm:text-base text-muted-foreground">Please check back later or create your own flashcards</p>
        </div>
      </div>
    )
  }

  // Show completion loader
  if (isFinishing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <AppLoader
          size="large"
          message={LOADER_MESSAGES.CALCULATING_RESULTS}
          className="p-8"
        />
      </div>
    )
  }

  return (
    <div className={cn(
      "w-full space-y-4 sm:space-y-6",
      isFocusMode
        ? "min-h-screen flex flex-col justify-center px-0"
        : "w-full px-3 sm:px-4 lg:px-6"
    )}>
        <div className="text-center hidden">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--color-accent)] text-[var(--color-bg)] border-3 sm:border-4 border-border shadow-neo mb-3 sm:mb-4 font-black text-xs sm:text-sm rounded-none">
              <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Flashcard Quiz</span>
            </div>
          </div>

      {/* Controller - Hidden in focus mode */}
      {!isFocusMode && (
        <FlashcardController
        title={title}
        currentIndex={currentQuestionIndex}
        totalCards={cards.length}
        streak={streak}
        isReviewMode={isReviewMode}
        flipped={flipped}
        autoAdvance={autoAdvance}
        showSettings={showSettings}
        onToggleFlip={toggleFlip}
        onSetAutoAdvance={setAutoAdvance}
        onSetShowSettings={setShowSettings}
      />
      )}

      {/* Main Card */}
      <div className="relative px-2 sm:px-0">
        <motion.div
          key={`card-${currentQuestionIndex}`}
          drag="x"
          dragConstraints={{ left: -50, right: 50 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          animate={cardControls}
          className="w-full cursor-grab active:cursor-grabbing"
          ref={cardRef}
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              style={{ perspective: 1000 }}
              className="w-full h-full"
            >
              {!flipped ? (
              <FlashcardFront
                key="front"
                question={currentCard?.question || ""}
                keywords={currentCard?.keywords}
                showHint={showHint}
                onToggleHint={() => setShowHint(v => !v)}
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
                explanation={(currentCard as any)?.explanation}
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
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Simple Action Bar - Flip and Save only (navigation moved to controller) */}
      <div className={cn(
        "flex flex-col sm:flex-row justify-center gap-2 sm:gap-2 px-2 sm:px-0",
        isFocusMode && "mt-4 sm:mt-6"
      )}>
        <Button 
          variant="neutral" 
          onClick={toggleFlip}
          size="lg"
          className={cn(
            "px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-black bg-[var(--color-accent)] text-[var(--color-bg)] border-2 sm:border-3 border-border shadow-neo hover:-translate-x-1 hover:-translate-y-1 hover:shadow-none w-full sm:w-auto",
            isFocusMode && "sm:min-w-[160px]"
          )}
        >
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          {flipped ? "Show Question" : "Show Answer"}
        </Button>
        
        <Button 
          variant="noShadow" 
          onClick={handleSaveCard}
          size="lg"
          className={cn(
            "px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-black bg-card text-foreground border-2 sm:border-3 border-border shadow-neo hover:-translate-x-1 hover:-translate-y-1 hover:shadow-none w-full sm:w-auto",
            isFocusMode && "sm:min-w-[160px]"
          )}
        >
          <Heart className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 ${isSaved ? "fill-current text-danger" : "text-foreground"}`} />
          {isSaved ? "Saved" : "Save"}
        </Button>
      </div>

      {/* Rating Animation Overlay */}
      <AnimatePresence>
        {ratingAnimation && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
                className={cn(
                  "px-6 sm:px-8 py-4 sm:py-6 rounded-none font-black text-lg sm:text-xl shadow-neo border-4 border-border max-w-sm w-full",
                  ratingAnimation === "correct" && "bg-[var(--color-success)] text-[var(--color-bg)]",
                  ratingAnimation === "still_learning" && "bg-[var(--color-accent)] text-[var(--color-bg)]",
                  ratingAnimation === "incorrect" && "bg-[var(--color-error)] text-[var(--color-bg)]"
                )}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl sm:text-2xl">
                  {ratingAnimation === "correct" && "🎉"}
                  {ratingAnimation === "still_learning" && "📚"}
                  {ratingAnimation === "incorrect" && "💪"}
                </span>
                <div>
                  <div className="font-bold text-base sm:text-lg">
                    {ratingAnimation === "correct" && "Perfect!"}
                    {ratingAnimation === "still_learning" && "Keep Learning!"}
                    {ratingAnimation === "incorrect" && "Practice Makes Perfect!"}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}