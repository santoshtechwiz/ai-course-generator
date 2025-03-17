"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Quote, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"

const quotes = [
  { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "Education is not preparation for life; education is life itself.", author: "John Dewey" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
]

export const RandomQuote = () => {
  const [currentIndex, setCurrentIndex] = useState(Math.floor(Math.random() * quotes.length))
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [direction, setDirection] = useState(0) // -1 for left, 1 for right, 0 for initial

  const nextQuote = () => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % quotes.length)
  }

  const prevQuote = () => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + quotes.length) % quotes.length)
  }

  // Auto-rotate quotes
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      nextQuote()
    }, 15000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  // Pause auto-rotation when user interacts
  const handleManualNavigation = (callback: () => void) => {
    setIsAutoPlaying(false)
    callback()

    // Resume auto-rotation after 30 seconds of inactivity
    const timeout = setTimeout(() => {
      setIsAutoPlaying(true)
    }, 30000)

    return () => clearTimeout(timeout)
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  }

  return (
    <div className="relative overflow-hidden rounded-lg w-full border border-border/50 shadow-sm bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-background" />

      <div className="relative px-4 py-4">
        <div className="absolute top-2 left-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary/70">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Inspiration</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => handleManualNavigation(prevQuote)}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Previous quote"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="w-full max-w-2xl mx-auto px-6">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-2 bg-primary/10 p-2 rounded-full">
                  <Quote className="h-5 w-5 text-primary" />
                </div>
                <motion.p
                  className="text-lg font-medium text-foreground mb-2 italic"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {quotes[currentIndex].text}
                </motion.p>
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="h-px w-6 bg-primary/30" />
                  <p className="text-sm text-muted-foreground font-medium">{quotes[currentIndex].author}</p>
                  <div className="h-px w-6 bg-primary/30" />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            onClick={() => handleManualNavigation(nextQuote)}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Next quote"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex justify-center mt-4">
          <div className="flex gap-1.5">
            {quotes.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1)
                  handleManualNavigation(() => setCurrentIndex(index))
                }}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-primary/30 hover:bg-primary/50"
                }`}
                aria-label={`Go to quote ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RandomQuote