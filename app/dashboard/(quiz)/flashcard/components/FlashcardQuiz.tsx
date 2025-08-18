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

  // Adaptive scheduler helpers
  const answerMap = useMemo(() => {
    // Build latest answer per questionId for quick lookups
    const map = new Map<string, { answer: "correct" | "incorrect" | "still_learning" }>()
    const stateAnswers = (useAppSelector as any)?.prototype ? [] : [] // placeholder to prevent linter confusion
    // We already have Redux state via useAppSelector above; reuse it
    // Note: answers are stored in Redux flashcard slice; pull at time of scheduling for freshness
    // We will compute from closure 'useAppSelector((state) => state.flashcard.answers)' by reading directly in scheduler
    return map
  }, [])

  const computeNextIndex = useCallback(() => {
    if (!cards?.length) return currentQuestionIndex

    // Gather status per index from Redux state
    const state = (window as any).__NEXT_REDUX_STORE__?.getState?.()
    const fcAnswers: any[] = state?.flashcard?.answers || []
    const statusById = new Map<string, "correct" | "incorrect" | "still_learning" | "unseen">()
    fcAnswers.forEach((a) => {
      if (a && typeof a.questionId !== 'undefined' && typeof a.answer !== 'undefined') {
        statusById.set(String(a.questionId), a.answer)
      }
    })

    const incorrect: number[] = []
    const stillLearning: number[] = []
    const correct: number[] = []
    const unseen: number[] = []

    cards.forEach((c, idx) => {
      const s = statusById.get(String(c.id)) || "unseen"
      if (s === "incorrect") incorrect.push(idx)
      else if (s === "still_learning") stillLearning.push(idx)
      else if (s === "correct") correct.push(idx)
      else unseen.push(idx)
    })

    // Remove current index to avoid immediate repeats when possible
    const removeCurrent = (arr: number[]) => arr.filter((i) => i !== currentQuestionIndex)
    const poolIncorrect = removeCurrent(incorrect)
    const poolStill = removeCurrent(stillLearning)
    const poolUnseen = removeCurrent(unseen)
    const poolCorrect = removeCurrent(correct)

    // Weights: incorrect 0.6, still_learning 0.3, unseen 0.1 fallback to correct
    const r = Math.random()
    let candidatePool: number[] | null = null
    if (poolIncorrect.length && r < 0.6) candidatePool = poolIncorrect
    else if (poolStill.length && r < 0.9) candidatePool = poolStill
    else if (poolUnseen.length) candidatePool = poolUnseen
    else if (poolCorrect.length) candidatePool = poolCorrect

    if (candidatePool && candidatePool.length) {
      return candidatePool[Math.floor(Math.random() * candidatePool.length)]
    }

    // Fallback: sequential or loop to start
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

        {/* Main Flashcard Container */}
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
          className="flex items-center justify-center gap-3"
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
                  : "text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20",
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
          <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-full text-sm text-muted-foreground">
            <span className="font-medium">{currentQuestionIndex + 1} / {cards.length}</span>
            <span className="text-xs">•</span>
            <AccuracyBadge />
            <span className="text-xs">•</span>
            <span className="text-xs">Space = Flip</span>
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

function AccuracyBadge() {
  // Read from Redux without causing re-renders of parent
  let accuracy = 0
  try {
    const state = (window as any).__NEXT_REDUX_STORE__?.getState?.()
    const answers: any[] = state?.flashcard?.answers || []
    const total = answers.filter((a: any) => 'answer' in a).length
    const correct = answers.filter((a: any) => a.answer === 'correct').length
    accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  } catch {}
  return <span className="text-xs">Accuracy {accuracy}%</span>
}
