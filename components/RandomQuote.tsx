"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Quote, ChevronLeft, ChevronRight } from "lucide-react"

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
    }, 10000) // Reduced auto-rotate interval for a more dynamic feel

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  // Pause auto-rotation when user interacts
  const handleManualNavigation = (callback: () => void) => {
    setIsAutoPlaying(false)
    callback()

    // Resume auto-rotation after 20 seconds of inactivity
    const timeout = setTimeout(() => {
      setIsAutoPlaying(true)
    }, 20000)

    return () => clearTimeout(timeout)
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  }

  return (
    <div className="relative overflow-hidden rounded-lg w-full border border-border/50 shadow-sm bg-background/80 backdrop-blur-sm p-2">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-background" />

      <div className="relative flex items-center justify-between">
        <button
          onClick={() => handleManualNavigation(prevQuote)}
          className="h-6 w-6 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Previous quote"
        >
          <ChevronLeft className="h-3 w-3" />
        </button>

        <div className="flex-1 mx-2 min-w-0">
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
              <motion.p
                className="text-sm font-medium text-foreground italic truncate"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                "{quotes[currentIndex].text}"
              </motion.p>
              <motion.div
                className="text-xs text-muted-foreground mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                – {quotes[currentIndex].author}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={() => handleManualNavigation(nextQuote)}
          className="h-6 w-6 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Next quote"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="flex justify-center mt-2">
        <div className="flex gap-1">
          {quotes.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1)
                handleManualNavigation(() => setCurrentIndex(index))
              }}
              className={`h-1 w-1 rounded-full transition-all ${
                index === currentIndex ? "w-3 bg-primary" : "bg-primary/30 hover:bg-primary/50"
              }`}
              aria-label={`Go to quote ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default RandomQuote