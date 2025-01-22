"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "High School Teacher",
    content:
      "Course AI has revolutionized the way I create and manage my classroom content. It's an indispensable tool for modern educators.",
  },
  {
    name: "Michael Chen",
    role: "Online Course Creator",
    content:
      "The AI-powered features have saved me countless hours in course creation. My students love the interactive quizzes!",
  },
  {
    name: "Emily Rodriguez",
    role: "Corporate Trainer",
    content:
      "Course AI has made it incredibly easy to design engaging training modules for our employees. The results speak for themselves.",
  },
]

export function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative h-64 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-card rounded-lg shadow-lg"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-lg mb-4">"{testimonials[currentIndex].content}"</p>
          <p className="font-semibold">{testimonials[currentIndex].name}</p>
          <p className="text-sm text-muted-foreground">{testimonials[currentIndex].role}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

