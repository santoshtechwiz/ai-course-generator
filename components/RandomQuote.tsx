"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, Quote, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const quotes = [
  { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "Education is not preparation for life; education is life itself.", author: "John Dewey" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "The only source of knowledge is experience.", author: "Albert Einstein" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "The purpose of education is to replace an empty mind with an open one.", author: "Malcolm Forbes" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
]

const RandomQuote = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [hasMounted, setHasMounted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    setCurrentIndex(Math.floor(Math.random() * quotes.length))
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % quotes.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [isPlaying])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handlePrevious = () => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + quotes.length) % quotes.length)
  }

  const handleNext = () => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % quotes.length)
  }

  if (!hasMounted) return null

  const slideVariants = {
    enter: (direction: number) => ({
      x: prefersReducedMotion ? 0 : (direction > 0 ? 30 : -30),
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: prefersReducedMotion ? 0 : (direction < 0 ? 30 : -30),
      opacity: 0,
    }),
  }

  return (
    <Card className="relative overflow-hidden bg-card border-4 border-border shadow-[6px_6px_0px_0px_hsl(var(--border))]">
      <section className="relative p-4" role="region" aria-labelledby="quote-heading" aria-live="polite">
        <h2 id="quote-heading" className="sr-only">Inspirational Quotes</h2>
        <div className="flex items-center justify-between gap-4">
          {/* Quote Icon and Content */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <motion.div
                className="p-2 rounded-full bg-primary/10 border border-primary/20"
                animate={prefersReducedMotion ? {} : {
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Quote className="w-4 h-4 text-primary" />
              </motion.div>
            </div>
            
            {/* Quote Content */}
            <div className="flex-1 min-w-0">
              <div className="relative min-h-[60px] flex items-center">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                    }}
                    className="absolute inset-0 flex flex-col justify-center"
                  >
                    <blockquote className="text-sm font-medium text-foreground leading-relaxed line-clamp-2 mb-1">
                      "{quotes[currentIndex].text}"
                    </blockquote>
                    <cite className="text-xs text-primary font-semibold not-italic">
                      — {quotes[currentIndex].author}
                    </cite>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
              aria-label="Previous quote"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayPause}
              className={cn(
                "h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary",
                isPlaying && "text-primary bg-primary/5"
              )}
              aria-label={isPlaying ? "Pause auto-play" : "Resume auto-play"}
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
              aria-label="Next quote"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-primary/10">
          <div className="flex gap-1">
            {quotes.map((_, index) => (
              <motion.div
                key={index}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  index === currentIndex 
                    ? "w-4 bg-primary" 
                    : "w-1 bg-primary/30"
                )}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {isPlaying && (
              <motion.div
                className="w-1 h-1 bg-green-500 rounded-full"
                animate={prefersReducedMotion ? {} : {
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
            <span className="hidden sm:inline">
              {currentIndex + 1}/{quotes.length}
            </span>
          </div>
        </div>
      </section>
    </Card>
  )
}

export default RandomQuote

