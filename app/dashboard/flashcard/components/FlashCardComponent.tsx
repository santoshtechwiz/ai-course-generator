"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Check,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { FlashCard } from "@/app/types/types"
import { quizStyles } from "@/components/QuizDesignSystem"

interface FlashCardComponentProps {
  cards: FlashCard[]
  onSaveCard?: (card: FlashCard) => void
  savedCardIds?: string[]
  onComplete?: () => void
}

export function FlashCardComponent({ cards, onSaveCard, savedCardIds = [], onComplete }: FlashCardComponentProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [direction, setDirection] = useState(0)
  const [selfRating, setSelfRating] = useState<Record<string, "correct" | "incorrect" | null>>({})
  const [showConfetti, setShowConfetti] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [exitComplete, setExitComplete] = useState(true)
  const [ratingAnimation, setRatingAnimation] = useState<"correct" | "incorrect" | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)
  const currentCard = cards[currentIndex]

  // Calculate progress
  const progress = ((currentIndex + 1) / cards.length) * 100
  const isSaved = currentCard?.id ? savedCardIds.includes(currentCard.id.toString()) : false

  // Handle card navigation
  const handleNext = () => {
    if (!exitComplete) return
    if (currentIndex < cards.length - 1) {
      setDirection(1)
      setFlipped(false)
      setExitComplete(false)
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1)
      }, 300)
    } else if (!isCompleted) {
      setIsCompleted(true)
      setShowConfetti(true)
      if (onComplete) onComplete()
      setTimeout(() => {
        setShowConfetti(false)
      }, 3000)
    }
  }

  const handlePrevious = () => {
    if (!exitComplete || currentIndex === 0) return
    setDirection(-1)
    setFlipped(false)
    setExitComplete(false)
    setTimeout(() => {
      setCurrentIndex(currentIndex - 1)
    }, 300)
  }

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

  const handleRestart = () => {
    setCurrentIndex(0)
    setFlipped(false)
    setIsCompleted(false)
    setSelfRating({})
  }

  // Enhanced card variants with more dynamic 3D effects
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

  // Front card variants with hover effects
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

  // Back card variants with hover effects
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

  // Button animation variants
  const buttonVariants = {
    tap: { scale: 0.95 },
    hover: { scale: 1.05 },
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

  return (
    <div className={quizStyles.container}>
      {/* Quiz Header with subtle animation */}
      <motion.div
        className={quizStyles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between w-full">
          <h2 className={quizStyles.headerTitle}>Flashcards</h2>
          <p className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {cards.length}
          </p>
        </div>
      </motion.div>

      {/* Flashcard Content */}
      <div className="p-6 border-b border-border/50">
        {!isCompleted ? (
          <>
            {/* Flashcard with improved flip and hover animations */}
            <div className="relative min-h-[300px] w-full perspective-1000">
              <AnimatePresence initial={false} custom={direction} onExitComplete={() => setExitComplete(true)}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={cardVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0 w-full min-h-[300px]"
                  ref={cardRef}
                >
                  {!flipped ? (
                    // Front of card with enhanced gradient and shadow
                    <motion.div
                      onClick={toggleFlip}
                      className="w-full h-full rounded-lg border border-border/50 shadow-lg cursor-pointer bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-50 p-6 flex flex-col items-center justify-center relative overflow-hidden"
                      variants={frontCardVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      whileHover="hover"
                    >
                      {/* Decorative elements */}
                      <motion.div
                        className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full -mr-16 -mt-16"
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
                        className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200/30 rounded-full -ml-12 -mb-12"
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

                      <div className="text-xl font-medium text-center text-blue-800 z-10">{currentCard?.question}</div>
                      <motion.div
                        className="mt-4 text-sm text-blue-600 flex items-center gap-1"
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
                      </motion.div>
                    </motion.div>
                  ) : (
                    // Back of card with different color scheme and animated self-rating buttons
                    <motion.div
                      onClick={toggleFlip}
                      className="w-full h-full rounded-lg border border-border/50 shadow-lg cursor-pointer bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 p-6 flex flex-col items-center justify-center relative overflow-hidden"
                      variants={backCardVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      whileHover="hover"
                    >
                      {/* Decorative elements */}
                      <motion.div
                        className="absolute top-0 left-0 w-32 h-32 bg-green-200/30 rounded-full -ml-16 -mt-16"
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
                        className="absolute bottom-0 right-0 w-24 h-24 bg-emerald-200/30 rounded-full -mr-12 -mb-12"
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

                      <div className="text-lg text-center text-green-800 z-10">{currentCard?.answer}</div>

                      <div className="mt-6 flex flex-col gap-3 w-full max-w-xs z-10">
                        <p className="text-sm text-center text-green-700 mb-2">How well did you know this?</p>
                        <div className="flex justify-center gap-3">
                          <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                            <Button
                              variant={selfRating[currentCard?.id || ""] === "correct" ? "default" : "outline"}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelfRating(currentCard?.id || "", "correct")
                              }}
                              className="flex items-center gap-1 relative overflow-hidden"
                            >
                              <ThumbsUp className="h-4 w-4" />
                              Got it
                            </Button>
                          </motion.div>

                          <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                            <Button
                              variant={selfRating[currentCard?.id || ""] === "incorrect" ? "destructive" : "outline"}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelfRating(currentCard?.id || "", "incorrect")
                              }}
                              className="flex items-center gap-1 relative overflow-hidden"
                            >
                              <ThumbsDown className="h-4 w-4" />
                              Still learning
                            </Button>
                          </motion.div>
                        </div>
                      </div>

                      {/* Rating feedback animation */}
                      <AnimatePresence>
                        {ratingAnimation === "correct" && (
                          <motion.div
                            className="absolute inset-0 bg-green-500/10 flex items-center justify-center"
                            variants={ratingFeedbackVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            <motion.div
                              className="bg-green-100 text-green-800 rounded-full p-3"
                              animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 10, 0, -10, 0],
                              }}
                              transition={{ duration: 0.5 }}
                            >
                              <Sparkles className="h-8 w-8" />
                            </motion.div>
                          </motion.div>
                        )}

                        {ratingAnimation === "incorrect" && (
                          <motion.div
                            className="absolute inset-0 bg-red-500/10 flex items-center justify-center"
                            variants={ratingFeedbackVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            <motion.div
                              className="bg-red-100 text-red-800 rounded-full p-3"
                              animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, -5, 0, 5, 0],
                              }}
                              transition={{ duration: 0.5 }}
                            >
                              <RotateCcw className="h-8 w-8" />
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex justify-between items-center mt-6">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSaveCard()
                  }}
                  className="flex items-center gap-1"
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
                  {isSaved ? "Saved" : "Save Card"}
                </Button>
              </motion.div>

              <motion.div
                className="text-sm text-muted-foreground"
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
              </motion.div>
            </div>
          </>
        ) : (
          <motion.div
            className="min-h-[300px] flex flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <motion.div
              className="text-2xl font-bold text-center mb-4 text-purple-700"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              Congratulations!
            </motion.div>

            <motion.div
              className="text-lg text-center mb-6 text-purple-600"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              You've completed all {cards.length} flashcards.
            </motion.div>

            <motion.div
              className="grid grid-cols-2 gap-4 mb-8 w-full max-w-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <motion.div
                className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)" }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <motion.div
                  className="text-3xl font-bold text-green-600 dark:text-green-400"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 10,
                    delay: 0.7,
                  }}
                >
                  {Object.values(selfRating).filter((r) => r === "correct").length}
                </motion.div>
                <div className="text-sm text-green-600 dark:text-green-400">Cards you knew</div>
              </motion.div>

              <motion.div
                className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)" }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <motion.div
                  className="text-3xl font-bold text-red-600 dark:text-red-400"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 10,
                    delay: 0.9,
                  }}
                >
                  {Object.values(selfRating).filter((r) => r === "incorrect").length}
                </motion.div>
                <div className="text-sm text-red-600 dark:text-red-400">Cards to review</div>
              </motion.div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1, type: "spring" }}
            >
              <Button onClick={handleRestart} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Study Again
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      {!isCompleted && (
        <div className="p-6">
          <div className={quizStyles.buttonContainer}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0 || !exitComplete}
                className="flex items-center"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={handleNext} disabled={!exitComplete} className="flex items-center">
                {currentIndex < cards.length - 1 ? (
                  <>
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Complete
                    <Check className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Enhanced progress indicator with animation */}
          <div className="mt-6">
            <div className={quizStyles.progressContainer}>
              <motion.div
                className={quizStyles.progressBar}
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #34d399, #3b82f6)",
                }}
                initial={{ width: `${(currentIndex / cards.length) * 100}%` }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              ></motion.div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Card {currentIndex + 1}</span>
              <span>{cards.length} Cards</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

