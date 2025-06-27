"use client"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence, useAnimation, type PanInfo } from "framer-motion"
import { useAnimation as useAnimationContext } from "@/providers/animation-provider"
import { useSession } from "next-auth/react"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { toast } from "sonner"
import { Confetti } from "@/components/ui/confetti"
import { cn } from "@/lib/utils"
import {
  initFlashCardQuiz,
  submitFlashCardAnswer,
  resetFlashCards,
  nextFlashCard,
} from "@/store/slices/flashcard-slice"
import { useAppDispatch, useAppSelector } from "@/store"

// Import modular components
import { FlashcardFront } from "./FlashcardFront"
import { FlashcardBack } from "./FlashcardBack"
import { FlashcardController } from "./FlashcardController"

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
  savedCardIds?: string[]
  isReviewMode?: boolean
  onComplete?: (results: any) => void
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
  const [isLoading, setIsLoading] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [swipeDisabled, setSwipeDisabled] = useState(false)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [cardTimes, setCardTimes] = useState<Record<string, number>>({})
  const [streak, setStreak] = useState(0)
  const [showHint, setShowHint] = useState(false)

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
    }, 500)
    return () => clearTimeout(timer)
  }, [])

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

    let correctCount = 0
    let stillLearningCount = 0
    let incorrectCount = 0

    answers.forEach((answer) => {
      if (answer && typeof answer.answer === "string") {
        switch (answer.answer) {
          case "correct":
            correctCount++
            break
          case "still_learning":
            stillLearningCount++
            break
          case "incorrect":
            incorrectCount++
            break
        }
      }
    })

    return {
      correctCount,
      stillLearningCount,
      incorrectCount,
      totalCount: correctCount + stillLearningCount + incorrectCount,
    }
  }, [answers, cards])

  // Current card
  const currentCard = useMemo(() => {
    if (!cards || !cards.length) return null
    return cards[Math.min(currentQuestionIndex, cards.length - 1)]
  }, [currentQuestionIndex, cards])

  // Card saved status
  const isSaved = useMemo(
    () => (currentCard?.id ? savedCardIds.includes(currentCard.id.toString()) : false),
    [currentCard?.id, savedCardIds],
  )

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

    const maxIndex = cards.length - 1

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
    } else if (onComplete) {
      onComplete(processedResults)
    }
  }, [currentQuestionIndex, cards, dispatch, cardControls, onComplete, processedResults, animationsEnabled])

  // Handle self rating
  const handleSelfRating = useCallback(
    (cardId: string, rating: "correct" | "incorrect" | "still_learning") => {
      if (!cardId) return

      const endTime = Date.now()
      const timeSpent = Math.floor((endTime - startTime) / 1000)

      // Update streak
      if (rating === "correct") {
        setStreak((prev) => prev + 1)
      } else {
        setStreak(0)
      }

      setRatingAnimation(rating)
      setCardTimes((prev) => ({
        ...prev,
        [cardId]: (prev[cardId] || 0) + timeSpent,
      }))
      setSwipeDisabled(true)

      // Submit answer
      const answerData = {
        answer: rating,
        userAnswer: rating,
        timeSpent: timeSpent,
        isCorrect: rating === "correct",
        questionId: cardId,
        streak: rating === "correct" ? streak + 1 : 0,
      }

      dispatch(submitFlashCardAnswer(answerData))

      // Haptic feedback
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(
          rating === "correct" ? [50, 30, 50] : rating === "still_learning" ? [30, 20, 30] : [100],
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
        totalQuestions={cards?.length || 0}
        quizType="Flashcard"
        animationKey={`card-${currentQuestionIndex}`}
      >
        <div className="space-y-4 sm:space-y-6">
          {/* Controller */}
          <FlashcardController
            title={title}
            currentIndex={currentQuestionIndex}
            totalCards={cards?.length || 0}
            streak={streak}
            isReviewMode={false}
            flipped={flipped}
            autoAdvance={autoAdvance}
            showSettings={showSettings}
            onToggleFlip={toggleFlip}
            onNextCard={moveToNextCard}
            onSetAutoAdvance={setAutoAdvance}
            onSetShowSettings={setShowSettings}
            onRestartQuiz={handleRestartQuiz}
          />

          {/* Flashcard Content */}
          <div className="relative min-h-[300px] sm:min-h-[350px] w-full perspective-1000">
            <motion.div
              key={`card-${currentQuestionIndex}`}
              drag={!swipeDisabled && !isCompleted ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={handleDragEnd}
              animate={cardControls}
              layoutId={`card-${currentQuestionIndex}`}
              className="absolute inset-0 w-full h-full touch-manipulation"
              ref={cardRef}
            >
              <AnimatePresence mode="wait">
                {!flipped ? (
                  <FlashcardFront
                    key="front"
                    question={currentCard?.question || ""}
                    keywords={currentCard?.keywords}
                    showHint={showHint}
                    onToggleHint={() => setShowHint(!showHint)}
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
                      if (currentCard?.id) {
                        handleSelfRating(currentCard.id.toString(), rating)
                      }
                    }}
                    onSaveCard={onSaveCard ? handleSaveCard : undefined}
                    isSaved={isSaved}
                    animationsEnabled={animationsEnabled}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </QuizContainer>

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
                "px-6 sm:px-8 py-4 sm:py-6 rounded-2xl sm:rounded-3xl text-white font-bold text-xl sm:text-2xl shadow-2xl border-4",
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

      {showConfetti && <Confetti isActive={true} />}
    </>
  )
}
