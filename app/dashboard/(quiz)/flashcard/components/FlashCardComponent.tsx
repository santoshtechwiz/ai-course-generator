"use client"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck, Check, ThumbsUp, ThumbsDown, Settings, X } from "lucide-react"
import { motion, AnimatePresence, useAnimation, type PanInfo } from "framer-motion"
import type { FlashCard } from "@/app/types/types"
import { useAnimation as useAnimationContext } from "@/providers/animation-provider"
import { QuizProgress } from "../../components/QuizProgress"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { useRouter, useSearchParams } from "next/navigation"

import {
  initQuiz,
  submitAnswer,
  completeQuiz,
  resetQuiz,
  setRequiresAuth,
  setPendingAuthRequired,
  nextQuestion,
  setCurrentQuestion,
} from "@/store/slices/quizSlice"
import FlashCardResults from "./FlashCardQuizResults"
import { useSession } from "next-auth/react"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAppDispatch, useAppSelector } from "@/store"

interface FlashCardComponentProps {
  cards: FlashCard[]
  quizId: string | number
  slug: string
  title: string
  onSaveCard?: (card: FlashCard) => void
  savedCardIds?: string[]
}

export function FlashCardComponent({
  cards,
  quizId,
  slug,
  title,
  onSaveCard,
  savedCardIds = [],
}: FlashCardComponentProps) {
  // Redux state
  const dispatch = useAppDispatch()
  const {
    currentQuestionIndex,
    isCompleted,
    answers,
    requiresAuth,
    pendingAuthRequired,
    quizId: storeQuizId,
  } = useAppSelector((state) => state.quiz)

  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Local UI state
  const [flipped, setFlipped] = useState(false)
  const [direction, setDirection] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [ratingAnimation, setRatingAnimation] = useState<"correct" | "incorrect" | null>(null)
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewCards, setReviewCards] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [swipeThreshold, setSwipeThreshold] = useState(100)
  const [swipeDisabled, setSwipeDisabled] = useState(false)

  // Add these state variables after the other state declarations
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [cardTimes, setCardTimes] = useState<Record<string, number>>({})

  // Animation controls
  const cardControls = useAnimation()
  const cardRef = useRef<HTMLDivElement>(null)
  const { animationsEnabled } = useAnimationContext()

  // Check for reset parameter
  useEffect(() => {
    const reset = searchParams.get("reset")
    const timestamp = searchParams.get("t")

    if (reset === "true" && timestamp) {
      dispatch(resetQuiz())

      // Remove the reset parameter from the URL
      const url = new URL(window.location.href)
      url.searchParams.delete("reset")
      url.searchParams.delete("t")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams, dispatch])

  // Initialize quiz in Redux
  useEffect(() => {
    if (cards.length > 0 && (!storeQuizId || storeQuizId !== quizId.toString())) {
      dispatch(
        initQuiz({
          id: quizId.toString(),
          slug,
          title,
          quizType: "flashcard",
          questions: cards,
        }),
      )
    }
  }, [cards, quizId, slug, title, dispatch, storeQuizId])

  // Add loading state with timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Get self-ratings from the answers in Redux
  const selfRating = useMemo(() => {
    const ratings: Record<string, "correct" | "incorrect" | null> = {}

    answers.forEach((answer, index) => {
      if (cards[index]?.id && answer) {
        ratings[cards[index].id.toString()] = answer.answer as "correct" | "incorrect"
      }
    })

    return ratings
  }, [answers, cards])

  const calculateScore = useCallback(() => {
    return Object.values(selfRating).filter((rating) => rating === "correct").length
  }, [selfRating])

  // Get indices of cards marked as "incorrect"
  const cardsToReview = useMemo(() => {
    return Object.entries(selfRating)
      .filter(([_, rating]) => rating === "incorrect")
      .map(([cardId, _]) => {
        // Find the index of the card with this ID
        return cards.findIndex((card) => card.id?.toString() === cardId)
      })
      .filter((index) => index !== -1)
  }, [selfRating, cards])

  // Replace the handleEnterReviewMode function
  const handleEnterReviewMode = useCallback(() => {
    if (cardsToReview.length === 0) {
      // No cards to review
      return
    }

    setReviewCards(cardsToReview)
    dispatch(setCurrentQuestion(0)) // Use the action creator
    setFlipped(false)
    setReviewMode(true)
    setStartTime(Date.now()) // Reset start time for the first review card
  }, [cardsToReview, dispatch, setCurrentQuestion])

  // Fix 5: Update the handleExitReviewMode function
  const handleExitReviewMode = useCallback(() => {
    setReviewMode(false)
    dispatch(setCurrentQuestion(0)) // Use the action creator
    setFlipped(false)
    setStartTime(Date.now()) // Reset start time when exiting review mode
  }, [dispatch, setCurrentQuestion])

  // Fix 6: Update the getCurrentCard function to properly handle review mode
  const getCurrentCard = useCallback(() => {
    if (reviewMode && reviewCards.length > 0) {
      // Make sure we don't go out of bounds
      const reviewIndex = Math.min(currentQuestionIndex, reviewCards.length - 1)
      const cardIndex = reviewCards[reviewIndex]
      return cards[cardIndex] || cards[0] // Fallback to first card if index is invalid
    }
    return cards[currentQuestionIndex] || cards[0] // Fallback to first card if index is invalid
  }, [reviewMode, reviewCards, currentQuestionIndex, cards])

  const currentCard = getCurrentCard()

  // Check if current card is saved
  const isSaved = currentCard?.id ? savedCardIds.includes(currentCard.id.toString()) : false

  // Calculate progress
  const progress = useMemo(() => {
    return reviewMode
      ? ((currentQuestionIndex + 1) / reviewCards.length) * 100
      : ((currentQuestionIndex + 1) / cards.length) * 100
  }, [reviewMode, currentQuestionIndex, reviewCards.length, cards.length])

  // Update the toggleFlip function
  const toggleFlip = useCallback(() => {
    // If flipping to the back of the card, reset the start time
    if (!flipped) {
      setStartTime(Date.now())
    }
    setFlipped(!flipped)
  }, [flipped])

  const handleSaveCard = useCallback(() => {
    if (onSaveCard && currentCard) {
      onSaveCard(currentCard)
    }
  }, [onSaveCard, currentCard])

  // Fix 7: Update the moveToNextCard function to handle review mode
  const moveToNextCard = useCallback(() => {
    const maxIndex = reviewMode ? reviewCards.length - 1 : cards.length - 1

    if (currentQuestionIndex < maxIndex) {
      setDirection(1)
      setFlipped(false)

      // Animate card exit to the left
      cardControls
        .start({
          x: -300,
          opacity: 0,
          transition: { duration: 0.3 },
        })
        .then(() => {
          dispatch(nextQuestion())
          // Reset position for next card
          cardControls.set({ x: 0, opacity: 1 })
          // Reset start time for next card
          setStartTime(Date.now())
        })
    } else {
      // Complete the quiz
      const correctCount = calculateScore()
      const totalQuestions = cards.length
      const score = (correctCount / totalQuestions) * 100

      // Calculate total time from all answers with proper time values
      const totalTime = answers.reduce((acc, answer) => acc + (answer?.timeSpent || 0), 0)

      dispatch(
        completeQuiz({
          score,
          answers,
          completedAt: new Date().toISOString(),
        }),
      )
    }
  }, [
    currentQuestionIndex,
    reviewMode,
    reviewCards.length,
    cards.length,
    dispatch,
    calculateScore,
    answers,
    cardControls,
  ])

  // Replace the handleSelfRating function with this updated version
  const handleSelfRating = useCallback(
    (cardId: string, rating: "correct" | "incorrect") => {
      // Calculate time spent on this card
      const endTime = Date.now()
      const timeSpent = Math.floor((endTime - startTime) / 1000) // Convert to seconds

      // Update card times record
      setCardTimes((prev) => ({
        ...prev,
        [cardId]: (prev[cardId] || 0) + timeSpent,
      }))

      // Temporarily disable swipe to prevent conflicts with rating animations
      setSwipeDisabled(true)

      // Submit the answer to Redux with the actual time spent
      dispatch(
        submitAnswer({
          answer: rating,
          userAnswer: rating,
          timeSpent: timeSpent,
          isCorrect: rating === "correct",
          questionId: cardId,
        }),
      )

      setRatingAnimation(rating)

      // Auto-advance after rating if enabled
      if (autoAdvance) {
        const timer = setTimeout(() => {
          setRatingAnimation(null)
          moveToNextCard()
          setSwipeDisabled(false)
          // Reset start time for next card
          setStartTime(Date.now())
        }, 800)
        return () => clearTimeout(timer)
      } else {
        // Just clear the animation after a delay
        const timer = setTimeout(() => {
          setRatingAnimation(null)
          setSwipeDisabled(false)
        }, 800)
        return () => clearTimeout(timer)
      }
    },
    [dispatch, autoAdvance, moveToNextCard, startTime],
  )

  const handleRestartQuiz = useCallback(() => {
    dispatch(resetQuiz())
    setFlipped(false)
    setReviewMode(false)
    setReviewCards([])

    // Add reset parameters to URL to force a fresh load
    const url = new URL(window.location.href)
    url.searchParams.set("reset", "true")
    url.searchParams.set("t", Date.now().toString())
    router.push(url.toString())
  }, [dispatch, router])

  const handleAuthenticationRequired = useCallback(() => {
    dispatch(setRequiresAuth(true))
    dispatch(setPendingAuthRequired(true))

    const redirectUrl = `${window.location.origin}/dashboard/flashcard/${slug}?fromAuth=true&completed=true`

    // Redirect to sign-in page
    router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl)}`)
  }, [dispatch, router, slug])

  // Handle swipe gestures
  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (swipeDisabled) return

      const swipeDirection = info.offset.x > 0 ? "right" : "left"
      const swipeDistance = Math.abs(info.offset.x)

      if (swipeDistance > swipeThreshold) {
        if (swipeDirection === "left") {
          // Swipe left to go to next card
          moveToNextCard()
        } else {
          // Swipe right to flip card
          toggleFlip()
        }
      } else {
        // Reset position if swipe wasn't far enough
        cardControls.start({ x: 0, opacity: 1 })
      }
    },
    [swipeDisabled, swipeThreshold, moveToNextCard, toggleFlip, cardControls],
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
        case " ": // Space bar
          toggleFlip()
          break
        case "1":
        case "y":
          if (currentCard?.id && flipped) {
            handleSelfRating(currentCard.id.toString(), "correct")
          }
          break
        case "2":
        case "n":
          if (currentCard?.id && flipped) {
            handleSelfRating(currentCard.id.toString(), "incorrect")
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isCompleted, moveToNextCard, toggleFlip, currentCard, flipped, handleSelfRating])

  // Confetti animation
  useEffect(() => {
    if (!showConfetti) return

    const createConfetti = () => {
      const confettiCount = 150
      const container = document.createElement("div")
      container.style.position = "fixed"
      container.style.top = "0"
      container.style.left = "0"
      container.style.width = "100%"
      container.style.height = "100%"
      container.style.pointerEvents = "none"
      container.style.zIndex = "9999"
      document.body.appendChild(container)

      for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement("div")
        const size = Math.random() * 10 + 5
        confetti.style.position = "absolute"
        confetti.style.width = `${size}px`
        confetti.style.height = `${size}px`
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`
        confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "0"
        confetti.style.top = "0"
        confetti.style.left = `${Math.random() * 100}%`

        const animation = confetti.animate(
          [
            { transform: "translateY(0) rotate(0)", opacity: 1 },
            {
              transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 720 - 360}deg)`,
              opacity: 0,
            },
          ],
          {
            duration: Math.random() * 3000 + 1500,
            easing: "cubic-bezier(0.1, 0.8, 0.3, 1)",
          },
        )

        container.appendChild(confetti)

        animation.onfinish = () => {
          confetti.remove()
          if (container.childElementCount === 0) {
            container.remove()
          }
        }
      }
    }

    createConfetti()

    // Cleanup function
    return () => {
      const confettiContainers = document.querySelectorAll(
        'div[style*="position: fixed"][style*="pointer-events: none"]',
      )
      confettiContainers.forEach((container) => container.remove())
    }
  }, [showConfetti])

  // Check for authentication return
  useEffect(() => {
    if (typeof window === "undefined") return

    const urlParams = new URLSearchParams(window.location.search)
    const fromAuth = urlParams.get("fromAuth") === "true"
    const completed = urlParams.get("completed") === "true"

    if ((fromAuth || completed) && session?.user) {
      console.log("Detected return from authentication, processing pending data")

      // If we have completed state in Redux, make sure it's properly set
      if (pendingAuthRequired && isCompleted) {
        // Force completion state to be visible
        dispatch({ type: "FORCE_QUIZ_COMPLETED" })
      }

      // Clean up URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete("fromAuth")
      url.searchParams.delete("completed")
      window.history.replaceState({}, "", url.toString())
    }
  }, [session, dispatch, pendingAuthRequired, isCompleted])

  if (isLoading) {
    return <QuizLoader message="Loading flashcards..." subMessage="Preparing your study materials" />
  }

  // Card variants with swipe animation
  const cardVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    animate: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 25 },
        opacity: { duration: 0.4 },
        scale: { type: "spring", stiffness: 300, damping: 25 },
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 25 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.3 },
      },
    }),
    drag: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 25 },
      },
    },
  }

  // Front and back card variants
  const frontCardVariants = {
    initial: { opacity: 0, rotateY: 0 },
    animate: {
      opacity: 1,
      rotateY: 0,
      transition: { duration: 0.4 },
    },
    exit: {
      opacity: 0,
      rotateY: 90,
      transition: { duration: 0.3 },
    },
  }

  const backCardVariants = {
    initial: { opacity: 0, rotateY: -90 },
    animate: {
      opacity: 1,
      rotateY: 0,
      transition: { duration: 0.4 },
    },
    exit: {
      opacity: 0,
      rotateY: -90,
      transition: { duration: 0.3 },
    },
  }

  // Rating feedback animation variants
  const ratingFeedbackVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: [1, 1.2, 1],
      transition: {
        duration: 0.5,
        times: [0, 0.5, 1],
        type: "spring",
      },
    },
    exit: {
      opacity: 0,
      scale: 1.2,
      transition: { duration: 0.3 },
    },
  }

  const renderQuizContent = () => {
    if (isCompleted) {
      const correctCount = calculateScore()
      const totalQuestions = cards.length
      const percentage = (correctCount / totalQuestions) * 100

      // Calculate total time properly from answers
      const totalTime = answers.reduce((acc, answer) => {
        // Make sure we're adding a number
        const time = typeof answer?.timeSpent === "number" ? answer.timeSpent : 0
        return acc + time
      }, 0)

      // Show auth prompt if needed and user is not authenticated
      if (requiresAuth && !session?.user) {
        return (
          <motion.div
            key="auth-prompt"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 }}
          >
            <NonAuthenticatedUserSignInPrompt
              onSignIn={handleAuthenticationRequired}
              redirectUrl={`${window.location.origin}/dashboard/flashcard/${slug}?fromAuth=true&completed=true`}
            />
          </motion.div>
        )
      }

      // Show results
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <FlashCardResults
            quizId={quizId.toString()}
            title={title}
            score={percentage}
            totalQuestions={totalQuestions}
            totalTime={totalTime}
            correctAnswers={correctCount}
            slug={slug}
            onRestart={handleRestartQuiz}
          />

          {cardsToReview.length > 0 && (
            <div className="mt-6 text-center">
              <Button onClick={handleEnterReviewMode} variant="outline" className="mx-auto">
                Review {cardsToReview.length} card{cardsToReview.length !== 1 ? "s" : ""} to improve
              </Button>
            </div>
          )}
        </motion.div>
      )
    }

    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="rounded-lg shadow-md border bg-background">
          {/* Header Section */}
          <div className="px-6 py-4 flex justify-between items-center">
            <QuizProgress
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={reviewMode ? reviewCards.length : cards.length}
              timeSpent={[]}
              title={reviewMode ? `Review Mode: ${title}` : title}
              quizType="Flashcard"
              animate={animationsEnabled}
            />

            <Popover open={showSettings} onOpenChange={setShowSettings}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Flashcard Settings</h4>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Auto-advance</div>
                      <div className="text-xs text-muted-foreground">Automatically move to next card after rating</div>
                    </div>
                    <Switch checked={autoAdvance} onCheckedChange={setAutoAdvance} />
                  </div>

                  {reviewMode && (
                    <Button variant="outline" size="sm" onClick={handleExitReviewMode} className="w-full">
                      Exit Review Mode
                    </Button>
                  )}

                  <div className="pt-2 text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Keyboard shortcuts:</p>
                    <p>Space/Left Arrow: Flip card</p>
                    <p>Right Arrow: Next card</p>
                    <p>1/Y: Mark as known</p>
                    <p>2/N: Mark as still learning</p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Flashcard Content with Swipe Gestures */}
          <div className="p-4 sm:p-6 md:p-8 border-b border-border/50">
            <div className="relative min-h-[250px] sm:min-h-[300px] md:min-h-[350px] w-full perspective-1000">
              <motion.div
                key={reviewMode ? `review-${currentQuestionIndex}` : `card-${currentQuestionIndex}`}
                drag={!swipeDisabled ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                animate={cardControls}
                className="absolute inset-0 w-full h-full"
                ref={cardRef}
              >
                {!flipped ? (
                  // Front of card
                  <motion.div
                    onClick={toggleFlip}
                    className="w-full h-full rounded-xl border border-border/50 shadow-lg cursor-pointer bg-card p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden"
                    variants={frontCardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    {/* Decorative elements */}
                    <motion.div
                      className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-primary/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"
                      animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, 0],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                      }}
                    />
                    <motion.div
                      className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-primary/10 rounded-full -ml-8 sm:-ml-12 -mb-8 sm:-mb-12"
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, -5, 0],
                      }}
                      transition={{
                        duration: 7,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        delay: 1,
                      }}
                    />

                    {/* Question text */}
                    <div className="text-lg sm:text-xl md:text-2xl font-medium text-center text-foreground z-10 max-w-full sm:max-w-md leading-relaxed overflow-auto max-h-[200px] sm:max-h-[250px] md:max-h-[300px] scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-primary/20 scrollbar-track-transparent px-2">
                      {currentCard?.question}
                    </div>

                    {/* Swipe instructions */}
                    <div className="mt-6 flex flex-col items-center">
                      <motion.span
                        className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1"
                        animate={{
                          y: [0, -5, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatType: "reverse",
                        }}
                      >
                        Tap to reveal answer
                      </motion.span>
                      <div className="mt-2 flex items-center gap-8 text-xs text-muted-foreground">
                        <div className="flex flex-col items-center">
                          <motion.div
                            animate={{
                              x: [-5, 0, -5],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Number.POSITIVE_INFINITY,
                              repeatType: "reverse",
                            }}
                          >
                            ← Swipe
                          </motion.div>
                          <span>Flip card</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <motion.div
                            animate={{
                              x: [5, 0, 5],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Number.POSITIVE_INFINITY,
                              repeatType: "reverse",
                            }}
                          >
                            Swipe →
                          </motion.div>
                          <span>Next card</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  // Back of card
                  <motion.div
                    onClick={toggleFlip}
                    className="w-full h-full rounded-xl border border-border/50 shadow-lg cursor-pointer bg-card p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden"
                    variants={backCardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    {/* Decorative elements */}
                    <motion.div
                      className="absolute top-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-secondary/20 rounded-full -ml-12 sm:-ml-16 -mt-12 sm:-mt-16"
                      animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, -5, 0],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                      }}
                    />
                    <motion.div
                      className="absolute bottom-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-secondary/20 rounded-full -mr-8 sm:-mr-12 -mb-8 sm:-mb-12"
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, 0],
                      }}
                      transition={{
                        duration: 7,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        delay: 1,
                      }}
                    />

                    {/* Answer text */}
                    <div className="text-base sm:text-lg md:text-xl text-center text-foreground z-10 max-w-full sm:max-w-md leading-relaxed overflow-auto max-h-[150px] sm:max-h-[180px] md:max-h-[220px] scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-primary/20 scrollbar-track-transparent px-2">
                      {currentCard?.answer}
                    </div>

                    {/* Self-rating buttons */}
                    <div className="mt-6 md:mt-8 flex flex-col gap-2 sm:gap-3 w-full max-w-xs z-10">
                      <p className="text-xs sm:text-sm text-center text-muted-foreground mb-1 sm:mb-2 font-medium">
                        How well did you know this?
                      </p>
                      <div className="flex justify-center gap-4">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant={selfRating[currentCard?.id || ""] === "correct" ? "default" : "outline"}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (currentCard?.id) {
                                handleSelfRating(currentCard.id.toString(), "correct")
                              }
                            }}
                            className="flex items-center gap-2 relative overflow-hidden h-10 px-4"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            <span>Got it</span>
                          </Button>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant={selfRating[currentCard?.id || ""] === "incorrect" ? "destructive" : "outline"}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (currentCard?.id) {
                                handleSelfRating(currentCard.id.toString(), "incorrect")
                              }
                            }}
                            className="flex items-center gap-2 relative overflow-hidden h-10 px-4"
                          >
                            <ThumbsDown className="h-4 w-4" />
                            <span>Still learning</span>
                          </Button>
                        </motion.div>
                      </div>

                      <motion.span
                        className="mt-4 text-xs text-muted-foreground text-center"
                        animate={{
                          opacity: [0.7, 1, 0.7],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatType: "reverse",
                        }}
                      >
                        {autoAdvance ? "Will advance automatically after rating" : "Tap to see question"}
                      </motion.span>
                    </div>

                    {/* Rating feedback animation */}
                    <AnimatePresence>
                      {ratingAnimation && (
                        <motion.div
                          key={`rating-${currentCard?.id}-${ratingAnimation}`}
                          variants={ratingFeedbackVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm z-20 ${
                            ratingAnimation === "correct" ? "bg-primary/10" : "bg-destructive/10"
                          }`}
                        >
                          <div className={ratingAnimation === "correct" ? "text-primary" : "text-destructive"}>
                            {ratingAnimation === "correct" ? (
                              <Check className="h-16 w-16" />
                            ) : (
                              <ThumbsDown className="h-16 w-16" />
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Card actions */}
            <div className="flex justify-between items-center mt-6">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSaveCard()
                  }}
                  className="flex items-center gap-2 h-9 px-3"
                >
                  <motion.span
                    animate={
                      isSaved
                        ? {
                            scale: [1, 1.3, 1],
                            rotate: [0, 10, 0],
                          }
                        : {}
                    }
                    transition={{ duration: 0.5 }}
                  >
                    {isSaved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                  </motion.span>
                  <span>{isSaved ? "Saved" : "Save Card"}</span>
                </Button>
              </motion.div>

              {/* Progress indicator */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {currentQuestionIndex + 1}/{reviewMode ? reviewCards.length : cards.length}
                </span>
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${reviewMode ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${progress}%` }}
                    initial={{
                      width: `${(currentQuestionIndex / (reviewMode ? reviewCards.length : cards.length)) * 100}%`,
                    }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  ></motion.div>
                </div>
              </div>

              {/* Skip button for quick navigation */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={moveToNextCard}
                  disabled={currentQuestionIndex >= cards.length - 1}
                  className="flex items-center gap-1 h-9 px-3"
                >
                  <span>Skip</span>
                  <X className="h-3 w-3" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {renderQuizContent()}

      {/* Add custom scrollbar styles */}
      <style jsx global>{`
       .scrollbar-thin::-webkit-scrollbar {
         width: 4px;
       }
       .scrollbar-thin::-webkit-scrollbar-track {
         background: transparent;
       }
       .scrollbar-thin::-webkit-scrollbar-thumb {
         background-color: rgba(var(--primary), 0.2);
         border-radius: 9999px;
       }
       .scrollbar-thumb-rounded::-webkit-scrollbar-thumb {
         border-radius: 9999px;
       }
       .scrollbar-thumb-primary::-webkit-scrollbar-thumb {
         background-color: rgba(var(--primary), 0.2);
       }
       .scrollbar-track-transparent::-webkit-scrollbar-track {
         background: transparent;
       }
       .perspective-1000 {
         perspective: 1000px;
       }
     `}</style>
    </>
  )

