"use client"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck, Check, ThumbsUp, ThumbsDown, Settings, X, BookOpen } from "lucide-react"
import { motion, AnimatePresence, useAnimation, type PanInfo } from "framer-motion"

import { useAnimation as useAnimationContext } from "@/providers/animation-provider"
import { QuizProgress } from "../../components/QuizProgress"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { QuizLoader } from "@/components/ui/quiz-loader"

// Import the flashcard slice actions
import {
  initFlashCardQuiz,
  submitFlashCardAnswer,
  completeFlashCardQuiz,
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
  isReviewMode?: boolean // Add this missing prop
}

function FlashCardQuiz({
  cards,
  quizId,
  slug,
  title,
  onSaveCard,
  savedCardIds = [],
  isReviewMode = false,
}: FlashCardComponentProps) {
  // Get state from flashcard slice only
  const dispatch = useAppDispatch()
  const {
    currentQuestion: currentQuestionIndex,
    isCompleted,
    answers,
    requiresAuth,
    pendingAuthRequired,
    quizId: storeQuizId,
  } = useAppSelector((state) => state.flashcard)

  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Local UI state
  const [flipped, setFlipped] = useState(false)
  const [direction, setDirection] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [ratingAnimation, setRatingAnimation] = useState<"correct" | "incorrect" | "still_learning" | null>(null)
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewCards, setReviewCards] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [swipeThreshold, setSwipeThreshold] = useState(100)
  const [swipeDisabled, setSwipeDisabled] = useState(false)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [cardTimes, setCardTimes] = useState<Record<string, number>>({})

  // Animation controls
  const cardControls = useAnimation()
  const cardRef = useRef<HTMLDivElement>(null)
  const { animationsEnabled } = useAnimationContext()

  // Add isMounted ref to prevent animations after unmount
  const isMountedRef = useRef(true)

  // Set up mount tracking
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Initialize quiz in Redux using the flashcard slice
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

  // Add loading state with timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Get self-ratings from the answers in Redux with proper null checks
  const selfRating = useMemo(() => {
    const ratings: Record<string, "correct" | "incorrect" | "still_learning" | null> = {}

    if (answers && Array.isArray(answers) && cards) {
      answers.forEach((answer) => {
        if (answer && answer.questionId) {
          ratings[answer.questionId] = answer.answer as "correct" | "incorrect" | "still_learning"
        }
      })
    }

    return ratings
  }, [answers, cards])

  // Calculate score based on "correct" self-ratings
  const calculateScore = useCallback(() => {
    return Object.values(selfRating).filter((rating) => rating === "correct").length
  }, [selfRating])

  // Process answers to get detailed counts including still_learning - FIXED CARD MAPPING
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
        // Find the card index by matching the question ID
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

    console.log("Processed results:", {
      correctCount,
      stillLearningCount,
      incorrectCount,
      reviewCards,
      stillLearningCards,
      totalAnswers: answers.length,
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

  // Get cards that need review by category - IMPROVED MAPPING
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

  // Fixed enter review mode function with better error handling
  const handleEnterReviewMode = useCallback(
    (reviewType: "incorrect" | "still_learning" = "incorrect") => {
      const cardsToReview =
        reviewType === "incorrect" ? reviewCardsByCategory.incorrect : reviewCardsByCategory.stillLearning

      if (!cardsToReview.length) {
        console.log(`No ${reviewType} cards to review`)
        return
      }

      console.log(`Entering ${reviewType} review mode with cards:`, cardsToReview)

      // Set review cards and reset UI state
      setReviewCards(cardsToReview)
      setReviewMode(true)
      setFlipped(false)

      // Reset to first review card via Redux
      dispatch(setCurrentFlashCard(0))

      // Don't reset completed state - we want to maintain the results
      setStartTime(Date.now())
    },
    [reviewCardsByCategory, dispatch],
  )

  // Handle exiting review mode
  const handleExitReviewMode = useCallback(() => {
    setReviewMode(false)
    dispatch(setCurrentFlashCard(0))
    setFlipped(false)
    setStartTime(Date.now())
  }, [dispatch])

  // Memoize getCurrentCard function to prevent recreating on every render
  const getCurrentCard = useCallback(() => {
    if (!cards || !cards.length) return null

    if (reviewMode && reviewCards && reviewCards.length > 0) {
      // Get the current review index, bounded by array length
      const reviewIndex = Math.min(currentQuestionIndex, reviewCards.length - 1)

      // Get the actual card index from our array of review indices
      const cardIndex = reviewCards[reviewIndex]

      // Add debug logging
      console.log("Review mode active:", { reviewIndex, cardIndex, currentIndex: currentQuestionIndex, reviewCards })

      if (cardIndex !== undefined && cardIndex >= 0 && cardIndex < cards.length) {
        return cards[cardIndex]
      }
    }

    // In normal mode or if review index was invalid
    return cards[Math.min(currentQuestionIndex, cards.length - 1)]
  }, [reviewMode, reviewCards, currentQuestionIndex, cards])

  // Memoize current card to prevent unnecessary re-renders
  const currentCard = useMemo(() => getCurrentCard(), [getCurrentCard])

  // Check if current card is saved - memoized to prevent recalculation
  const isSaved = useMemo(
    () => (currentCard?.id ? savedCardIds.includes(currentCard.id.toString()) : false),
    [currentCard?.id, savedCardIds],
  )

  // Calculate progress percentage - memoized for performance
  const progress = useMemo(() => {
    if (reviewMode) {
      return reviewCards.length ? ((currentQuestionIndex + 1) / reviewCards.length) * 100 : 0
    }
    return cards?.length ? ((currentQuestionIndex + 1) / cards.length) * 100 : 0
  }, [reviewMode, currentQuestionIndex, reviewCards.length, cards?.length])

  // Handle card flip
  const toggleFlip = useCallback(() => {
    if (!flipped) {
      setStartTime(Date.now())
    }
    setFlipped(!flipped)
  }, [flipped])

  // Handle saving/bookmarking cards
  const handleSaveCard = useCallback(() => {
    if (onSaveCard && currentCard) {
      onSaveCard(currentCard)
    }
  }, [onSaveCard, currentCard])

  // Handle moving to the next flashcard - FIXED REVIEW MODE NAVIGATION
  const moveToNextCard = useCallback(() => {
    if (!cards?.length) return

    const maxIndex = reviewMode ? reviewCards.length - 1 : cards.length - 1

    if (currentQuestionIndex < maxIndex) {
      setDirection(1)
      setFlipped(false)

      // Only animate if component is still mounted
      if (isMountedRef.current) {
        cardControls
          .start({
            x: -300,
            opacity: 0,
            transition: { duration: 0.3 },
          })
          .then(() => {
            // Additional check before updating state after animation
            if (isMountedRef.current) {
              dispatch(nextFlashCard())
              cardControls.set({ x: 0, opacity: 1 })
              setStartTime(Date.now())
            }
          })
      } else {
        // If not mounted, just update state without animation
        dispatch(nextFlashCard())
      }
    } else {
      // If we're in review mode and finished reviewing, go back to normal mode
      if (reviewMode) {
        setReviewMode(false)
        setReviewCards([])
        dispatch(setCurrentFlashCard(0))
        setFlipped(false)
        return
      }

      // Otherwise, complete the quiz
      const correctCount = calculateScore()
      const totalQuestions = cards.length
      const score = totalQuestions ? (correctCount / totalQuestions) * 100 : 0

      // Calculate total time from answers
      const totalTime = Array.isArray(answers) ? answers.reduce((acc, answer) => acc + (answer?.timeSpent || 0), 0) : 0

      // Complete the quiz with proper result data
      const quizResults = {
        score,
        answers: answers || [],
        completedAt: new Date().toISOString(),
        percentage: score,
        correctAnswers: correctCount,
        stillLearningAnswers: processedResults.stillLearningCount,
        incorrectAnswers: processedResults.incorrectCount,
        totalQuestions: totalQuestions,
        totalTime: totalTime,
        reviewCards: processedResults.reviewCards,
        stillLearningCards: processedResults.stillLearningCards,
      }

      dispatch(completeFlashCardQuiz(quizResults))

      // Show confetti for completion
      setShowConfetti(true)
    }
  }, [
    currentQuestionIndex,
    reviewMode,
    reviewCards.length,
    cards,
    dispatch,
    calculateScore,
    answers,
    cardControls,
    processedResults,
  ])

  // Rating feedback optimization with smoother spring physics
  const ratingFeedbackVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      willChange: "transform, opacity",
    },
    visible: {
      opacity: 1,
      scale: [0.9, 1.05, 1],
      willChange: "transform, opacity",
      transition: {
        duration: 0.4,
        times: [0, 0.6, 1],
        type: "spring",
        stiffness: 300,
        damping: 15,
      },
    },
    exit: {
      opacity: 0,
      scale: 1.1,
      willChange: "transform, opacity",
      transition: {
        duration: 0.25,
        ease: "easeOut",
      },
    },
  }

  // Handle self-rating functionality with improved animation coordination - now supports three states
  const handleSelfRating = useCallback(
    (cardId: string, rating: "correct" | "incorrect" | "still_learning") => {
      if (!cardId) return

      // Calculate time spent
      const endTime = Date.now()
      const timeSpent = Math.floor((endTime - startTime) / 1000)

      // Update card times
      setCardTimes((prev) => ({
        ...prev,
        [cardId]: (prev[cardId] || 0) + timeSpent,
      }))

      // Disable swipe during animation
      setSwipeDisabled(true)

      // Submit answer - still_learning is neither correct nor incorrect
      const answerData = {
        answer: rating,
        userAnswer: rating,
        timeSpent: timeSpent,
        isCorrect: rating === "correct",
        questionId: cardId,
      }

      dispatch(submitFlashCardAnswer(answerData))

      // Show rating animation with coordinated timing
      setRatingAnimation(rating)

      // Add haptic feedback for mobile if available
      if (window.navigator && window.navigator.vibrate) {
        if (rating === "correct") {
          window.navigator.vibrate([50])
        } else if (rating === "still_learning") {
          window.navigator.vibrate([30, 20, 30])
        } else {
          window.navigator.vibrate([20, 30, 40])
        }
      }

      let timerRef: NodeJS.Timeout | null = null

      // Handle auto-advance with coordinated timing
      if (autoAdvance) {
        // Use a slight delay to show feedback before advancing
        timerRef = setTimeout(() => {
          if (isMountedRef.current) {
            setRatingAnimation(null)
            // Short delay before advancing to next card for better UX
            const advanceTimer = setTimeout(() => {
              if (isMountedRef.current) {
                moveToNextCard()
                setSwipeDisabled(false)
                setStartTime(Date.now())
              }
            }, 50)

            return () => clearTimeout(advanceTimer)
          }
        }, 700)
      } else {
        timerRef = setTimeout(() => {
          if (isMountedRef.current) {
            setRatingAnimation(null)
            setSwipeDisabled(false)
          }
        }, 700)
      }

      return () => {
        if (timerRef) clearTimeout(timerRef)
      }
    },
    [dispatch, autoAdvance, moveToNextCard, startTime],
  )

  // Handle restart quiz
  const handleRestartQuiz = useCallback(() => {
    dispatch(resetFlashCards())

    setFlipped(false)
    setReviewMode(false)
    setReviewCards([])
    setShowConfetti(false)

    // Add reset parameters to URL
    const url = new URL(window.location.href)
    url.searchParams.set("reset", "true")
    url.searchParams.set("t", Date.now().toString())
    router.push(url.toString())
  }, [dispatch, router])

  // Handle swipe gestures
  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (swipeDisabled) return

      const swipeDirection = info.offset.x > 0 ? "right" : "left"
      const swipeDistance = Math.abs(info.offset.x)
      const swipeVelocity = Math.abs(info.velocity.x)

      // Consider both distance and velocity for more natural swipe detection
      const isEffectiveSwipe = swipeDistance > swipeThreshold || swipeVelocity > 0.5

      if (isEffectiveSwipe) {
        // Add haptic feedback for mobile if available
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50)
        }

        if (swipeDirection === "left") {
          moveToNextCard()
        } else {
          toggleFlip()
        }
      } else {
        // Animate back to original position with spring physics
        cardControls.start({
          x: 0,
          opacity: 1,
          transition: {
            type: "spring",
            stiffness: 500,
            damping: 30,
          },
        })
      }
    },
    [swipeDisabled, swipeThreshold, moveToNextCard, toggleFlip, cardControls],
  )

  // Keyboard navigation - updated to support three rating options
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
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isCompleted, moveToNextCard, toggleFlip, currentCard, flipped, handleSelfRating])

  // Confetti animation effect
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

    return () => {
      document
        .querySelectorAll('div[style*="position: fixed"][style*="pointer-events: none"]')
        .forEach((container) => container.remove())
    }
  }, [showConfetti])

  // Add useEffect for CSS animation variables to control all animations centrally
  useEffect(() => {
    // Set CSS variables for consistent animation timing across component
    document.documentElement.style.setProperty("--card-flip-duration", animationsEnabled ? "0.4s" : "0.1s")
    document.documentElement.style.setProperty("--card-transition-easing", "cubic-bezier(0.23, 1, 0.32, 1)")
    document.documentElement.style.setProperty("--rating-animation-duration", "0.4s")

    return () => {
      // Clean up CSS variables
      document.documentElement.style.removeProperty("--card-flip-duration")
      document.documentElement.style.removeProperty("--card-transition-easing")
      document.documentElement.style.removeProperty("--rating-animation-duration")
    }
  }, [animationsEnabled])

  // Optimize confetti rendering to use requestAnimationFrame for better performance
  useEffect(() => {
    if (!showConfetti) return

    let confettiContainer: HTMLElement | null = null

    // Create confetti with RAF for smoother animation
    const createConfetti = () => {
      const confettiCount = 150
      confettiContainer = document.createElement("div")
      confettiContainer.style.position = "fixed"
      confettiContainer.style.top = "0"
      confettiContainer.style.left = "0"
      confettiContainer.style.width = "100%"
      confettiContainer.style.height = "100%"
      confettiContainer.style.pointerEvents = "none"
      confettiContainer.style.zIndex = "9999"
      document.body.appendChild(confettiContainer)

      // Use DocumentFragment for better performance when adding multiple elements
      const fragment = document.createDocumentFragment()

      for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement("div")
        const size = Math.random() * 10 + 5

        // Set all styles at once for better performance
        Object.assign(confetti.style, {
          position: "absolute",
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
          borderRadius: Math.random() > 0.5 ? "50%" : "0",
          top: "0",
          left: `${Math.random() * 100}%`,
          willChange: "transform, opacity",
          transform: "translateZ(0)", // Hardware acceleration hint
        })

        // Use modern Web Animation API for better performance
        const keyframes = [
          { transform: "translateY(0) rotate(0)", opacity: 1 },
          { transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 },
        ]

        const timing = {
          duration: Math.random() * 3000 + 1500,
          easing: "cubic-bezier(0.1, 0.8, 0.3, 1)",
          fill: "forwards" as FillMode,
        }

        const animation = confetti.animate(keyframes, timing)

        animation.onfinish = () => {
          confetti.remove()
          if (confettiContainer && confettiContainer.childElementCount === 0) {
            confettiContainer.remove()
          }
        }

        fragment.appendChild(confetti)
      }

      // Add all confetti at once to minimize reflows
      confettiContainer.appendChild(fragment)
    }

    // Use requestAnimationFrame for better timing
    requestAnimationFrame(createConfetti)

    return () => {
      // Clean up the confetti container on unmount
      if (confettiContainer) {
        confettiContainer.remove()
      }
    }
  }, [showConfetti])

  if (isLoading) {
    return <QuizLoader message="Loading flashcards..." subMessage="Preparing your study materials" />
  }

  // Animation variants
  const cardVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
      willChange: "transform, opacity",
      transform: "translate3d(0,0,0)", // Force GPU acceleration
    }),
    animate: {
      x: 0,
      opacity: 1,
      scale: 1,
      willChange: "transform, opacity",
      transform: "translate3d(0,0,0)",
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
      willChange: "transform, opacity",
      transform: "translate3d(0,0,0)",
      transition: {
        x: { type: "spring", stiffness: 300, damping: 25 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.3 },
      },
    }),
  }  // Enhance animation variants with 3D transforms and hardware acceleration
  const frontCardVariants = {
    initial: { opacity: 0, rotateY: 0 },
    animate: { opacity: 1, rotateY: 0, transition: { duration: animationsEnabled ? 0.4 : 0.1, ease: [0.23, 1, 0.32, 1] } },
    exit: { opacity: 0, rotateY: 90, transition: { duration: animationsEnabled ? 0.3 : 0.1, ease: [0.23, 1, 0.32, 1] } }
  };
  const backCardVariants = {
    initial: { opacity: 0, rotateY: -90 },
    animate: { opacity: 1, rotateY: 0, transition: { duration: animationsEnabled ? 0.4 : 0.1, ease: [0.23, 1, 0.32, 1] } },
    exit: { opacity: 0, rotateY: -90, transition: { duration: animationsEnabled ? 0.3 : 0.1, ease: [0.23, 1, 0.32, 1] } }
  }

  // Render different content based on quiz state
  const renderQuizContent = () => {
    // Only show flashcard UI if not completed or in review mode
    if (isCompleted && !reviewMode) {
      // Don't render results directly - QuizResultHandler will handle this
      return null
    }

    // Not completed or in review mode - show flashcard UI
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="rounded-lg shadow-md border bg-background">
          {/* Header Section */}
          <div className="px-6 py-4 flex justify-between items-center">
            <QuizProgress
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={reviewMode ? reviewCards.length : cards?.length || 0}
              timeSpent={[]}
              title={reviewMode ? `Review Mode: ${title}` : title}
              quizType="Flashcard"
              animate={animationsEnabled}
            />

            {/* Settings popover */}
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
                    <Button variant="outline" size="sm" onClick={() => handleEnterReviewMode()} className="w-full">
                      Review Incorrect
                    </Button>
                  )}

                  {reviewMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEnterReviewMode("still_learning")}
                      className="w-full"
                    >
                      Review Still Learning
                    </Button>
                  )}

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
                    <p>2/S: Still learning</p>
                    <p>3/N: Mark as incorrect</p>
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
                drag={!swipeDisabled && !isCompleted ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12} /* Reduce elasticity for more precise feel */
                onDragEnd={handleDragEnd}
                animate={cardControls}
                layoutId={`card-${currentQuestionIndex}`} /* Add layout ID for FLIP animations */
                className="absolute inset-0 w-full h-full touch-manipulation" /* Improve touch behavior */
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
                    role="button"
                    aria-label="Flip card to see answer"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        toggleFlip()
                      }
                    }}
                    style={{ willChange: 'transform, opacity', transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
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
                      {currentCard?.question || "No question available"}
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
                    role="button"
                    aria-label="Flip card back to see question"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        toggleFlip()
                      }
                    }}
                    style={{ willChange: 'transform, opacity', transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
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

                    {/* Self-rating buttons - now with three options */}
                    <div className="mt-6 md:mt-8 flex flex-col gap-2 sm:gap-3 w-full max-w-sm z-10">
                      <p className="text-xs sm:text-sm text-center text-muted-foreground mb-1 sm:mb-2 font-medium">
                        How well did you know this?
                      </p>
                      <div className="flex justify-center gap-2">
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
                            className="flex items-center gap-1 relative overflow-hidden h-9 px-3"
                          >
                            <ThumbsUp className="h-3 w-3" />
                            <span className="text-xs">Got it</span>
                          </Button>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant={selfRating[currentCard?.id || ""] === "still_learning" ? "secondary" : "outline"}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (currentCard?.id) {
                                handleSelfRating(currentCard.id.toString(), "still_learning")
                              }
                            }}
                            className="flex items-center gap-1 relative overflow-hidden h-9 px-3"
                          >
                            <BookOpen className="h-3 w-3" />
                            <span className="text-xs">Learning</span>
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
                            className="flex items-center gap-1 relative overflow-hidden h-9 px-3"
                          >
                            <ThumbsDown className="h-3 w-3" />
                            <span className="text-xs">Missed</span>
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

                    {/* Rating feedback animation - updated for three states */}
                    <AnimatePresence>
                      {ratingAnimation && (
                        <motion.div
                          key={`rating-${currentCard?.id}-${ratingAnimation}`}
                          variants={ratingFeedbackVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm z-20 ${
                            ratingAnimation === "correct"
                              ? "bg-primary/10"
                              : ratingAnimation === "still_learning"
                                ? "bg-secondary/10"
                                : "bg-destructive/10"
                          }`}
                        >
                          <div
                            className={
                              ratingAnimation === "correct"
                                ? "text-primary"
                                : ratingAnimation === "still_learning"
                                  ? "text-secondary-foreground"
                                  : "text-destructive"
                            }
                          >
                            {ratingAnimation === "correct" ? (
                              <Check className="h-16 w-16" />
                            ) : ratingAnimation === "still_learning" ? (
                              <BookOpen className="h-16 w-16" />
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
                  {currentQuestionIndex + 1}/{reviewMode ? reviewCards.length : cards?.length || 0}
                </span>
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${reviewMode ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${progress}%` }}
                    initial={{
                      width: `${(currentQuestionIndex / (reviewMode ? reviewCards.length : cards?.length || 1)) * 100}%`,
                    }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  ></motion.div>
                </div>
              </div>

              {/* Skip button */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={moveToNextCard}
                  disabled={currentQuestionIndex >= (cards?.length || 0) - 1}
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

      {/* Add confetti component */}
      <Confetti isActive={showConfetti} count={150} duration={3000} />

      {/* Existing scrollbar styles */}
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
          will-change: background-color;
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
          transform-style: preserve-3d;
        }
        /* Use CSS variables for animation speed and consistent easing */
        .card-flip {
          transition: all var(--card-flip-duration, 0.4s) var(--card-transition-easing, cubic-bezier(0.23, 1, 0.32, 1));
          will-change: transform, opacity;
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }
        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          .card-flip {
            transition-duration: 0.1s;
            transition-timing-function: ease-out;
          }
          
          .rating-animation {
            transition-duration: 0.1s;
          }
        }
        
        /* Touch optimization for mobile */
        .touch-manipulation {
          touch-action: manipulation;
        }
      `}</style>
    </>
  )
}

// More precise custom comparison function for memoization
function arePropsEqual(prevProps: FlashCardComponentProps, nextProps: FlashCardComponentProps) {
  // Check if arrays have changed by reference
  if (
    prevProps.quizId !== nextProps.quizId ||
    prevProps.slug !== nextProps.slug ||
    prevProps.title !== nextProps.title
  ) {
    return false
  }

  // Check card length
  if (prevProps.cards?.length !== nextProps.cards?.length) {
    return false
  }

  // Check if savedCardIds has changed
  const prevSavedLength = prevProps.savedCardIds?.length || 0
  const nextSavedLength = nextProps.savedCardIds?.length || 0

  if (prevSavedLength !== nextSavedLength) {
    return false
  }

  // If all checks passed, components are equal
  return true
}

export default FlashCardQuiz
