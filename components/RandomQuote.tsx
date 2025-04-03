"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

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
  const [currentIndex, setCurrentIndex] = useState(0) // Start with index 0
  const [direction, setDirection] = useState(0) // -1 for left, 1 for right, 0 for initial
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setCurrentIndex(Math.floor(Math.random() * quotes.length)) // Set random index only on the client
    setHasMounted(true) // Indicate that component has mounted
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % quotes.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  if (!hasMounted) return null // Avoid hydration mismatch by rendering nothing initially

  return (
    <div className="relative overflow-hidden rounded-lg w-full border border-border/50 shadow-sm bg-background/80 backdrop-blur-sm py-2 px-3">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-background" />

      <div className="relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center"
          >
            <motion.p className="text-sm font-medium text-foreground italic">
              "{quotes[currentIndex].text}"
            </motion.p>
            <motion.div className="text-xs text-muted-foreground mt-1">
              – {quotes[currentIndex].author}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center mt-2">
          <div className="flex gap-1">
            {quotes.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1 rounded-full transition-all ${
                  index === currentIndex ? "w-3 bg-primary" : "w-1 bg-primary/30 hover:bg-primary/50"
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

