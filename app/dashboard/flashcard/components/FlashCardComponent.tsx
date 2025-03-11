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
      }, 200)
    } else if (!isCompleted) {
      setIsCompleted(true)
      setShowConfetti(true)
      if (onComplete) onComplete()

      // Hide confetti after 3 seconds
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
    }, 200)
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
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setFlipped(false)
    setIsCompleted(false)
    setSelfRating({})
  }

  // Card variants for animations
  const cardVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
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
        confetti.style.borderRadius = "50%"
        confetti.style.top = "0"
        confetti.style.left = `${Math.random() * 100}%`

        const animation = confetti.animate(
          [
            { transform: "translateY(0) rotate(0)", opacity: 1 },
            { transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 360}deg)`, opacity: 0 },
          ],
          {
            duration: Math.random() * 2000 + 1000,
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
      {/* Quiz Header */}
      <div className={quizStyles.header}>
        <div className="flex items-center justify-between w-full">
          <h2 className={quizStyles.headerTitle}>Flashcards</h2>
          <p className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {cards.length}
          </p>
        </div>
      </div>

      {/* Flashcard Content */}
      <div className="p-6 border-b border-border/50">
        {!isCompleted ? (
          <>
            {/* Flashcard with flip animation */}
            <div className="relative min-h-[300px] w-full">
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
                  {/* We'll use two separate divs instead of trying to flip one */}
                  {!flipped ? (
                    // Front of card
                    <div
                      onClick={toggleFlip}
                      className="w-full h-full rounded-lg border border-border/50 shadow-sm cursor-pointer bg-background p-6 flex flex-col items-center justify-center"
                    >
                      <div className="text-xl font-medium text-center">{currentCard?.question}</div>
                      <div className="mt-4 text-sm text-muted-foreground">Click to see answer</div>
                    </div>
                  ) : (
                    // Back of card
                    <div
                      onClick={toggleFlip}
                      className="w-full h-full rounded-lg border border-border/50 shadow-sm cursor-pointer bg-primary/10 p-6 flex flex-col items-center justify-center"
                    >
                      <div className="text-lg text-center">{currentCard?.answer}</div>
                      <div className="mt-6 flex flex-col gap-3 w-full max-w-xs">
                        <p className="text-sm text-center text-muted-foreground mb-2">How well did you know this?</p>
                        <div className="flex justify-center gap-3">
                          <Button
                            variant={selfRating[currentCard?.id || ""] === "correct" ? "default" : "outline"}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelfRating(currentCard?.id || "", "correct")
                            }}
                            className="flex items-center gap-1"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            Got it
                          </Button>
                          <Button
                            variant={selfRating[currentCard?.id || ""] === "incorrect" ? "destructive" : "outline"}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelfRating(currentCard?.id || "", "incorrect")
                            }}
                            className="flex items-center gap-1"
                          >
                            <ThumbsDown className="h-4 w-4" />
                            Still learning
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex justify-between items-center mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSaveCard()
                }}
                className="flex items-center gap-1"
              >
                {isSaved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                {isSaved ? "Saved" : "Save Card"}
              </Button>
              <div className="text-sm text-muted-foreground">
                {flipped ? "Click to see question" : "Click to see answer"}
              </div>
            </div>
          </>
        ) : (
          <div className="min-h-[300px] flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-center mb-4">Congratulations!</div>
            <div className="text-lg text-center mb-6">You've completed all {cards.length} flashcards.</div>

            <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-md">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {Object.values(selfRating).filter((r) => r === "correct").length}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Cards you knew</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {Object.values(selfRating).filter((r) => r === "incorrect").length}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">Cards to review</div>
              </div>
            </div>

            <Button onClick={handleRestart} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Study Again
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      {!isCompleted && (
        <div className="p-6">
          <div className={quizStyles.buttonContainer}>
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0 || !exitComplete}
              className="flex items-center"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
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
          </div>

          {/* Progress indicator */}
          <div className="mt-6">
            <div className={quizStyles.progressContainer}>
              <div
                className={quizStyles.progressBar}
                style={{
                  width: `${progress}%`,
                  transition: "width 0.5s ease-in-out",
                }}
              ></div>
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

