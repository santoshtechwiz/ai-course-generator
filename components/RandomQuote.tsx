"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, Quote, Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "The more I read, the more I acquire, the more certain I am that I know nothing.", author: "Voltaire" },
  { text: "Change is the end result of all true learning.", author: "Leo Buscaglia" },
  { text: "Develop a passion for learning. If you do, you will never cease to grow.", author: "Anthony J. D'Angelo" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Knowledge speaks, but wisdom listens.", author: "Jimi Hendrix" },
  {
    text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
    author: "Brian Herbert",
  },
  { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
  {
    text: "The only person who is educated is the one who has learned how to learn and change.",
    author: "Carl Rogers",
  },
]

export const RandomQuote = () => {
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
    }, 10000) // Increased to 10 seconds for better readability

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

  const handleDotClick = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  if (!hasMounted) return null

  const slideVariants = {
    enter: (direction: number) => ({
      x: prefersReducedMotion ? 0 : (direction > 0 ? 50 : -50),
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.95,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: prefersReducedMotion ? 0 : (direction < 0 ? 50 : -50),
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.95,
    }),
  }

  const sparkleAnimation = prefersReducedMotion ? {} : {
    animate: {
      rotate: [0, 360],
      scale: [1, 1.1, 1],
    },
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "linear",
    }
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              className="p-2 rounded-full bg-primary/10"
              {...sparkleAnimation}
            >
              <Quote className="w-4 h-4 text-primary" />
            </motion.div>
            <div>
              <CardTitle className="text-lg font-semibold">Daily Inspiration</CardTitle>
              <p className="text-sm text-muted-foreground">Wisdom to fuel your learning journey</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              className="h-8 w-8 p-0 hover:bg-primary/10"
              aria-label="Previous quote"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayPause}
              className="h-8 w-8 p-0 hover:bg-primary/10"
              aria-label={isPlaying ? "Pause auto-play" : "Resume auto-play"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="h-8 w-8 p-0 hover:bg-primary/10"
              aria-label="Next quote"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="relative min-h-[120px] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-lg" />
          
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
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 },
              }}
              className="relative w-full text-center px-4"
            >
              <motion.div
                className="mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-6 h-6 mx-auto text-primary/60 mb-3" />
                <blockquote className="text-base font-medium text-foreground leading-relaxed italic">
                  "{quotes[currentIndex].text}"
                </blockquote>
              </motion.div>
              
              <motion.div
                className="flex items-center justify-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent flex-1 max-w-8" />
                <cite className="text-sm font-semibold text-primary not-italic">
                  {quotes[currentIndex].author}
                </cite>
                <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent flex-1 max-w-8" />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Enhanced pagination with counter */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
          <div className="text-xs text-muted-foreground font-medium">
            {currentIndex + 1} of {quotes.length}
          </div>
          
          <div className="flex gap-1.5">
            {quotes.slice(0, 10).map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300 hover:scale-110",
                  index === currentIndex 
                    ? "w-6 bg-primary shadow-sm" 
                    : "w-2 bg-primary/30 hover:bg-primary/50"
                )}
                aria-label={`Go to quote ${index + 1}`}
              />
            ))}
            {quotes.length > 10 && (
              <div className="flex items-center ml-1">
                <div className="text-xs text-muted-foreground">...</div>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            {isPlaying ? (
              <div className="flex items-center gap-1">
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
                Auto-play
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                Paused
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default RandomQuote

