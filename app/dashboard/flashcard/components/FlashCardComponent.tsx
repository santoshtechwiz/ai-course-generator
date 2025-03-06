"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform } from "framer-motion"
import { ChevronLeft, ChevronRight, Bookmark, Brain, XCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { FlashCard } from "@/app/types/types"

interface FlashCardComponentProps {
  cards: FlashCard[]
  onSaveCard?: (card: FlashCard) => void
  savedCardIds?: string[]
  onComplete?: () => void
}

export function FlashCardComponent({ cards, onSaveCard, savedCardIds = [], onComplete }: FlashCardComponentProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [progress, setProgress] = useState(0)
  const [score, setScore] = useState({ correct: 0, incorrect: 0 })
  const [direction, setDirection] = useState(0) // -1 for left, 1 for right
  const [streak, setStreak] = useState(0)
  const [showStreak, setShowStreak] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const confettiRef = useRef<HTMLCanvasElement>(null)
  const progressControls = useAnimation()

  // For drag functionality
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10])
  const cardOpacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 0.8, 1, 0.8, 0.5])

  useEffect(() => {
    setProgress(((currentIndex + 1) / cards.length) * 100)
    progressControls.start({ width: `${progress}%`, transition: { duration: 0.5 } })
  }, [currentIndex, cards.length, progress, progressControls])

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setDirection(1)
      setIsFlipped(false)
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1)
      }, 300)
    } else if (onComplete) {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setDirection(-1)
      setIsFlipped(false)
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1)
      }, 300)
    }
  }

  const handleAnswer = (correct: boolean) => {
    if (correct) {
      // Increment streak for correct answers
      const newStreak = streak + 1
      setStreak(newStreak)

      // Show streak celebration for every 3 correct answers
      if (newStreak % 3 === 0) {
        setShowStreak(true)
        setTimeout(() => setShowStreak(false), 2000)

        // Trigger confetti for milestone streaks
        if (confettiRef.current && newStreak >= 3) {
          createConfetti(confettiRef.current)
        }
      }
    } else {
      // Reset streak on incorrect answers
      setStreak(0)
    }

    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1),
    }))

    handleNext()
  }

  const handleSave = () => {
    if (onSaveCard && cards[currentIndex]) {
      onSaveCard(cards[currentIndex])
    }
  }

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 100) {
      // Swiped right - mark as correct
      handleAnswer(true)
    } else if (info.offset.x < -100) {
      // Swiped left - mark as incorrect
      handleAnswer(false)
    }
  }

  const currentCard = cards[currentIndex]
  const isSaved = currentCard?.id ? savedCardIds.includes(currentCard.id) : false

  // Simple confetti effect for celebrating streaks
  function createConfetti(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas to full window size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles = []
    const particleCount = 100
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        size: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 15 + 5,
        angle: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: Math.random() * 0.2 - 0.1,
        shape: Math.random() > 0.6 ? "circle" : Math.random() > 0.5 ? "square" : "triangle",
      })
    }

    // Animation
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        // Move particle
        particle.x += Math.cos(particle.angle) * particle.speed
        particle.y += Math.sin(particle.angle) * particle.speed + 0.5 // Add gravity
        particle.rotation += particle.rotationSpeed
        particle.speed *= 0.96 // Slow down

        // Draw particle
        ctx.save()
        ctx.translate(particle.x, particle.y)
        ctx.rotate(particle.rotation)
        ctx.fillStyle = particle.color

        if (particle.shape === "circle") {
          ctx.beginPath()
          ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else if (particle.shape === "square") {
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size)
        } else if (particle.shape === "triangle") {
          ctx.beginPath()
          ctx.moveTo(0, -particle.size / 2)
          ctx.lineTo(particle.size / 2, particle.size / 2)
          ctx.lineTo(-particle.size / 2, particle.size / 2)
          ctx.closePath()
          ctx.fill()
        }

        ctx.restore()
      })

      if (particles.some((p) => p.speed > 0.1)) {
        requestAnimationFrame(animate)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    animate()
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 text-foreground">
      {/* Confetti canvas for celebrations */}
      <canvas
        ref={confettiRef}
        className="fixed inset-0 pointer-events-none z-50"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Header with score and progress */}
      <div className="flex justify-between items-center">
        <motion.div
          className="flex items-center text-blue-500 font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Brain className="h-5 w-5 mr-2 text-blue-500" />
          <span>
            Card {currentIndex + 1} of {cards.length}
          </span>
        </motion.div>

        <div className="flex space-x-4">
          <motion.div
            className="flex items-center text-green-500"
            initial={{ scale: 1 }}
            animate={{
              scale: score.correct > 0 ? [1, 1.2, 1] : 1,
              transition: { duration: 0.3 },
            }}
          >
            <CheckCircle className="mr-1 h-5 w-5" />
            <span>{score.correct}</span>
          </motion.div>
          <motion.div
            className="flex items-center text-red-500"
            initial={{ scale: 1 }}
            animate={{
              scale: score.incorrect > 0 ? [1, 1.2, 1] : 1,
              transition: { duration: 0.3 },
            }}
          >
            <XCircle className="mr-1 h-5 w-5" />
            <span>{score.incorrect}</span>
          </motion.div>
        </div>
      </div>

      {/* Streak indicator */}
      <AnimatePresence>
        {showStreak && streak >= 3 && (
          <motion.div
            className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <span className="font-bold">{streak} streak! 🔥</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <div className="w-full h-2.5 bg-blue-100 dark:bg-blue-950/30 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>

      {/* Card container */}
      <div className="relative w-full perspective">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            ref={cardRef}
            className="w-full rounded-xl border border-border shadow-sm bg-card text-card-foreground overflow-hidden cursor-pointer"
            initial={{
              x: direction === 0 ? 0 : direction > 0 ? 300 : -300,
              opacity: 0,
            }}
            animate={{
              x: 0,
              opacity: 1,
            }}
            exit={{
              x: direction > 0 ? -300 : 300,
              opacity: 0,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            style={{ x, rotate, opacity: cardOpacity }}
            onClick={handleFlip}
          >
            <div className="p-6">
              <motion.div
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ transformStyle: "preserve-3d" }}
                className="relative w-full"
              >
                {/* Front of card (Question) */}
                <motion.div
                  className="space-y-6 backface-hidden"
                  style={{
                    backfaceVisibility: "hidden",
                    position: isFlipped ? "absolute" : "relative",
                    width: "100%",
                    opacity: isFlipped ? 0 : 1,
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <motion.div
                        className="text-blue-500 mr-2"
                        animate={{ rotate: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                            stroke="#3B82F6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13"
                            stroke="#3B82F6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 17H12.01"
                            stroke="#3B82F6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </motion.div>
                      <h2 className="text-xl font-bold text-blue-500">Question</h2>
                    </div>
                    {onSaveCard && (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSave()
                        }}
                      >
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                          <Bookmark className={cn("h-5 w-5", isSaved && "fill-current text-gray-600")} />
                        </Button>
                      </motion.div>
                    )}
                  </div>

                  <motion.div
                    className="min-h-[200px] flex items-center justify-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    <p className="text-lg text-center text-foreground">{currentCard?.question}</p>
                  </motion.div>

                  <div className="pt-4">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFlip()
                        }}
                        variant="outline"
                        className="w-full border-border hover:bg-muted text-muted-foreground"
                      >
                        Reveal Answer
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Back of card (Answer) */}
                <motion.div
                  className="space-y-6 backface-hidden"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    position: !isFlipped ? "absolute" : "relative",
                    width: "100%",
                    opacity: !isFlipped ? 0 : 1,
                  }}
                >
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold text-foreground">Answer</h2>
                    {onSaveCard && (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSave()
                        }}
                      >
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                          <Bookmark className={cn("h-5 w-5", isSaved && "fill-current text-gray-600")} />
                        </Button>
                      </motion.div>
                    )}
                  </div>

                  <motion.div
                    className="min-h-[200px] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    <p className="text-lg text-center text-foreground">{currentCard?.answer}</p>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAnswer(false)
                        }}
                        variant="outline"
                        className="bg-red-50 hover:bg-red-100 text-red-500 border-red-100 w-full"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Incorrect
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAnswer(true)
                        }}
                        variant="outline"
                        className="bg-green-50 hover:bg-green-100 text-green-500 border-green-100 w-full"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Correct
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation controls */}
      <div className="flex justify-between items-center mt-4">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            variant="outline"
            size="sm"
            className="text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
        </motion.div>

        <motion.div
          className="text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          key={currentIndex}
        >
          {currentIndex + 1} of {cards.length}
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1 && !onComplete}
            variant="outline"
            size="sm"
            className="text-foreground"
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </motion.div>
      </div>

      {/* Swipe instruction */}
      <motion.div
        className="text-center text-sm text-muted-foreground mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        Swipe left for incorrect, right for correct
      </motion.div>
    </div>
  )
}

