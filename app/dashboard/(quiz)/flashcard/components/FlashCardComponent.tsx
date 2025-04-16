"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, Check, ThumbsUp, ThumbsDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { FlashCard } from "@/app/types/types"
import { useQuizState } from "@/hooks/use-quiz-state"

import { Card, CardContent } from "@/components/ui/card"
import { QuizResultDisplay } from "../../components/QuizResultDisplay"
import { MotionWrapper } from "@/components/ui/animations/motion-wrapper"
import { useAnimation } from "@/providers/animation-provider"
import { SignInPrompt } from "@/app/auth/signin/components/SignInPrompt"
import { QuizProgress } from "../../components/QuizProgress"
import { QuizFeedback } from "../../components/QuizFeedback"
import { QuizLoader } from "@/components/ui/quiz-loader"

interface FlashCardComponentProps {
  cards: FlashCard[]
  quizId: string | number
  slug: string
  title: string
  onSaveCard?: (card: FlashCard) => void
  savedCardIds?: string[]
  onComplete?: () => void
}

export function FlashCardComponent({
  cards,
  quizId,
  slug,
  title,
  onSaveCard,
  savedCardIds = [],
  onComplete,
}: FlashCardComponentProps) {
  const [flipped, setFlipped] = useState(false)
  const [direction, setDirection] = useState(0)
  const [selfRating, setSelfRating] = useState<Record<string, "correct" | "incorrect" | null>>({})
  const [showConfetti, setShowConfetti] = useState(false)
  const [exitComplete, setExitComplete] = useState(true)
  const [ratingAnimation, setRatingAnimation] = useState<"correct" | "incorrect" | null>(null)
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewCards, setReviewCards] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const cardRef = useRef<HTMLDivElement>(null)
  const { animationsEnabled } = useAnimation()

  // Add loading state with timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const calculateScore = useCallback(
    (selectedOptions: (string | null)[], questions: FlashCard[]) => {
      return Object.values(selfRating).filter((rating) => rating === "correct").length
    },
    [selfRating],
  )

  const {
    currentQuestionIndex,
    selectedOptions,
    timeSpent,
    quizCompleted,
    quizResults,
    showFeedbackModal,
    isSubmitting,
    isSuccess,
    isError,
    errorMessage,
    isAuthenticated,
    session,
    handleSelectOption,
    handleNextQuestion,
    handleFeedbackContinue,
    restartQuiz,
  } = useQuizState({
    quizId,
    slug,
    questions: cards,
    quizType: "flashcard",
    calculateScore,
    onComplete,
  })

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

  const handleEnterReviewMode = () => {
    if (cardsToReview.length === 0) {
      // No cards to review
      return
    }

    setReviewCards(cardsToReview)
    setCurrentIndex(0)
    setFlipped(false)
    setReviewMode(true)
    setIsCompleted(false)
  }

  const handleExitReviewMode = () => {
    setReviewMode(false)
    setCurrentIndex(0)
    setFlipped(false)
  }

  // Get the current card based on mode
  const getCurrentCard = () => {
    if (reviewMode && reviewCards.length > 0) {
      return cards[reviewCards[currentQuestionIndex]]
    }
    return cards[currentQuestionIndex]
  }

  const currentCard = getCurrentCard()

  // Check if current card is saved
  const isSaved = currentCard?.id ? savedCardIds.includes(currentCard.id.toString()) : false

  // Calculate progress
  const progress = reviewMode
    ? ((currentQuestionIndex + 1) / reviewCards.length) * 100
    : ((currentQuestionIndex + 1) / cards.length) * 100

  const toggleFlip = () => {
    setFlipped(!flipped)
  }

  const handleSaveCard = () => {
    if (onSaveCard && currentCard) {
      onSaveCard(currentCard)
    }
  }

  const handleSelfRating = (cardId: string, rating: "correct" | "incorrect") => {
    setSelfRating((prev) => ({
      ...prev,
      [cardId]: rating,
    }))
    setRatingAnimation(rating)

    // Reset animation state after animation completes
    setTimeout(() => {
      setRatingAnimation(null)
    }, 1000)
  }

  // Enhanced card variants with more dynamic 3D effects and smoother transitions
  const cardVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      rotateY: direction > 0 ? 45 : -45,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotateY: 0,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 25 },
        opacity: { duration: 0.4 },
        rotateY: { duration: 0.4 },
        scale: { type: "spring", stiffness: 300, damping: 25 },
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      rotateY: direction < 0 ? 45 : -45,
      scale: 0.9,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 25 },
        opacity: { duration: 0.4 },
        rotateY: { duration: 0.4 },
        scale: { duration: 0.3 },
      },
    }),
  }

  // Front card variants with enhanced hover effects
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
    hover: {
      scale: 1.03,
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 },
    },
  }

  // Back card variants with enhanced hover effects
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
    hover: {
      scale: 1.03,
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 },
    },
  }

  // Rating feedback animation variants with more dynamic motion
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
  }, [showConfetti])

  if (isLoading) {
    return <QuizLoader message="Loading flashcards..." subMessage="Preparing your study materials" />
  }

  const renderQuizContent = () => {
    if (quizCompleted) {
      const correctCount = calculateScore(selectedOptions, cards)
      const totalQuestions = cards.length
      const percentage = (correctCount / totalQuestions) * 100
      const totalTime = quizResults?.elapsedTime ?? timeSpent.reduce((sum, time) => sum + time, 0)

      if (isAuthenticated) {
        return (
          <MotionWrapper animate={animationsEnabled} variant="fade" duration={0.6}>
            <QuizResultDisplay
              quizId={quizId.toString()}
              title={title}
              score={percentage}
              totalQuestions={totalQuestions}
              totalTime={totalTime}
              correctAnswers={correctCount}
              type="flashcard"
              slug={slug}
            />
          </MotionWrapper>
        )
      }

      return (
        <MotionWrapper animate={true} variant="fade" duration={0.6}>
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center space-y-6">
              {!session ? <SignInPrompt callbackUrl={`/dashboard/flashcard/${slug}`} /> : null}
            </CardContent>
          </Card>
        </MotionWrapper>
      )
    }

    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="rounded-lg shadow-md border bg-background">
          {/* Header Section */}
          <div className="px-6 py-4 space-y-4">
            <QuizProgress
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={cards.length}
              timeSpent={timeSpent}
              title={title}
              quizType="Flashcard"
              animate={animationsEnabled}
            />
          </div>

          {/* Flashcard Content */}
          <div className="p-4 sm:p-6 md:p-8 border-b border-border/50">
            {/* Flashcard with improved flip and hover animations and responsive height */}
            <div className="relative min-h-[250px] sm:min-h-[300px] md:min-h-[350px] w-full perspective-1000">
              <AnimatePresence initial={false} custom={direction} onExitComplete={() => setExitComplete(true)}>
                <motion.div
                  key={reviewMode ? `review-${currentQuestionIndex}` : `card-${currentQuestionIndex}`}
                  custom={direction}
                  variants={cardVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0 w-full h-full"
                  ref={cardRef}
                >
                  {!flipped ? (
                    // Front of card with enhanced gradient, shadow and improved text handling
                    <motion.div
                      onClick={toggleFlip}
                      className="w-full h-full rounded-xl border border-border/50 shadow-lg cursor-pointer bg-card p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden"
                      variants={frontCardVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      whileHover="hover"
                    >
                      {/* Decorative elements with improved positioning for small screens */}
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

                      {/* Improved text container with better overflow handling */}
                      <div className="text-lg sm:text-xl md:text-2xl font-medium text-center text-foreground z-10 max-w-full sm:max-w-md leading-relaxed overflow-auto max-h-[200px] sm:max-h-[250px] md:max-h-[300px] scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-primary/20 scrollbar-track-transparent px-2">
                        {currentCard?.question}
                      </div>
                      <motion.span
                        className="mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground flex items-center gap-1"
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
                    </motion.div>
                  ) : (
                    // Back of card with different color scheme, animated self-rating buttons, and improved text handling
                    <motion.div
                      onClick={toggleFlip}
                      className="w-full h-full rounded-xl border border-border/50 shadow-lg cursor-pointer bg-card p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden"
                      variants={backCardVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      whileHover="hover"
                    >
                      {/* Decorative elements with improved positioning for small screens */}
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

                      {/* Improved text container with better overflow handling */}
                      <div className="text-base sm:text-lg md:text-xl text-center text-foreground z-10 max-w-full sm:max-w-md leading-relaxed overflow-auto max-h-[150px] sm:max-h-[180px] md:max-h-[220px] scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-primary/20 scrollbar-track-transparent px-2">
                        {currentCard?.answer}
                      </div>

                      {/* Responsive self-rating buttons */}
                      <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col gap-2 sm:gap-3 w-full max-w-xs z-10">
                        <p className="text-xs sm:text-sm text-center text-muted-foreground mb-1 sm:mb-2 font-medium">
                          How well did you know this?
                        </p>
                        <div className="flex justify-center gap-2 sm:gap-4">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant={selfRating[currentCard?.id || ""] === "correct" ? "default" : "outline"}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (currentCard?.id) {
                                  handleSelfRating(currentCard.id.toString(), "correct")
                                  handleSelectOption("correct")
                                }
                              }}
                              className="flex items-center gap-1 sm:gap-2 relative overflow-hidden h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                            >
                              <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="whitespace-nowrap">Got it</span>
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
                                  handleSelectOption("incorrect")
                                }
                              }}
                              className="flex items-center gap-1 sm:gap-2 relative overflow-hidden h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                            >
                              <ThumbsDown className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="whitespace-nowrap">Still learning</span>
                            </Button>
                          </motion.div>
                        </div>
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
                                <Check className="h-12 w-12 sm:h-16 sm:w-16" />
                              ) : (
                                <ThumbsDown className="h-12 w-12 sm:h-16 sm:w-16" />
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Improved responsive layout for card actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 sm:mt-6 md:mt-8 gap-3 sm:gap-0">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSaveCard()
                  }}
                  className="flex items-center gap-2 h-8 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm"
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
                    {isSaved ? (
                      <BookmarkCheck className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    ) : (
                      <Bookmark className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </motion.span>
                  <span>{isSaved ? "Saved" : "Save Card"}</span>
                </Button>
              </motion.div>

              <motion.span
                className="text-xs sm:text-sm text-muted-foreground"
                animate={{
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              >
                {flipped ? "Tap to see question" : "Tap to see answer"}
              </motion.span>
            </div>
          </div>

          {/* Navigation with improved responsive layout */}
          <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentQuestionIndex > 0) {
                      setDirection(-1)
                      setFlipped(false)
                      setExitComplete(false)
                      setTimeout(() => {
                        handleNextQuestion(null, currentQuestionIndex - 1)
                      }, 300)
                    }
                  }}
                  disabled={currentQuestionIndex === 0 || !exitComplete}
                  className="flex items-center h-8 sm:h-10 md:h-11 px-3 sm:px-4 md:px-5 text-xs sm:text-sm"
                >
                  <ChevronLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="whitespace-nowrap">Previous</span>
                </Button>
              </motion.div>

              {reviewMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExitReviewMode}
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground"
                >
                  Exit Review Mode
                </Button>
              )}

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => {
                    if (currentQuestionIndex < cards.length - 1) {
                      setDirection(1)
                      setFlipped(false)
                      setExitComplete(false)
                      setTimeout(() => {
                        handleNextQuestion()
                      }, 300)
                    } else {
                      handleNextQuestion(cards.length)
                    }
                  }}
                  disabled={!exitComplete}
                  className="flex items-center h-8 sm:h-10 md:h-11 px-3 sm:px-4 md:px-5 text-xs sm:text-sm"
                >
                  {currentQuestionIndex < cards.length - 1 ? (
                    <>
                      <span className="whitespace-nowrap">Next</span>
                      <ChevronRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                    </>
                  ) : (
                    <>
                      <span className="whitespace-nowrap">Complete</span>
                      <Check className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Enhanced progress indicator with animation */}
            <div className="mt-4 sm:mt-6 md:mt-8 px-1">
              <div className="h-1.5 sm:h-2 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${reviewMode ? "bg-destructive" : "bg-primary"}`}
                  style={{
                    width: `${progress}%`,
                  }}
                  initial={{ width: `${(currentQuestionIndex / cards.length) * 100}%` }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                ></motion.div>
              </div>
              <div className="flex justify-between mt-1 sm:mt-2 text-xs text-muted-foreground">
                <span>Card {currentQuestionIndex + 1}</span>
                <span>{cards.length} Cards</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {renderQuizContent()}

      {showFeedbackModal && (
        <QuizFeedback
          isSubmitting={isSubmitting}
          isSuccess={isSuccess}
          isError={isError}
          score={calculateScore(selectedOptions, cards)}
          totalQuestions={cards.length}
          onContinue={handleFeedbackContinue}
          errorMessage={errorMessage}
          quizType="flashcard"
        />
      )}

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
}
