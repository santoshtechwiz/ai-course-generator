"use client"

import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const testimonials = [
  {
    name: "Alex Chen",
    role: "Software Engineer",
    quote:
      "As a self-taught developer, this platform has been invaluable. The AI-generated quizzes help me validate my learning, and the ad-free video experience lets me focus on mastering new technologies without distractions.",
    emoji: "👨‍💻",
    accentColor: "bg-blue-500",
  },
  {
    name: "Priya Sharma",
    role: "Data Scientist",
    quote:
      "Balancing work and continuous learning is challenging, but this platform makes it easier. The AI-powered knowledge checks ensure I'm grasping complex concepts, and the ability to learn without ads interrupting my flow is priceless.",
    emoji: "📊",
    accentColor: "bg-purple-500",
  },
  {
    name: "Michael Johnson",
    role: "Self-Taught UX Designer",
    quote:
      "Transitioning careers was daunting, but this platform made self-learning accessible. The AI-assisted quizzes helped me identify knowledge gaps, and the ad-free environment allowed me to immerse myself fully in design principles.",
    emoji: "🎨",
    accentColor: "bg-pink-500",
  },
  {
    name: "Emily Rodriguez",
    role: "Full-Stack Developer",
    quote:
      "As someone juggling a full-time job and learning new skills, efficiency is key. This platform's AI-generated assessments and distraction-free video lectures have significantly accelerated my learning process.",
    emoji: "💻",
    accentColor: "bg-green-500",
  },
  {
    name: "Raj Patel",
    role: "DevOps Engineer",
    quote:
      "Staying updated with the latest in DevOps is crucial. This platform's AI-curated content and quizzes help me quickly grasp new concepts. The ad-free experience means I can focus on learning during my limited free time.",
    emoji: "🚀",
    accentColor: "bg-orange-500",
  },
]

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const testimonialsData = useMemo(() => testimonials, [])

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonialsData.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonialsData.length) % testimonialsData.length)
  }

  useEffect(() => {
    const autoPlay = setInterval(nextTestimonial, 5000)
    return () => clearInterval(autoPlay)
  }, [])

  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-background via-background/80 to-background/50">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12 text-foreground">
            Empowering Self-Learners & Professionals
          </h2>
          <div className="relative">
            <div className="overflow-hidden">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: "tween", duration: 0.3 }}
                  className="flex justify-center"
                >
                  <TestimonialCard testimonial={testimonialsData[currentIndex]} />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="absolute top-1/2 left-0 -translate-y-1/2 md:-left-16">
              <Button
                variant="outline"
                size="icon"
                onClick={prevTestimonial}
                className="rounded-full shadow-md hover:shadow-lg transition-shadow"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 md:-right-16">
              <Button
                variant="outline"
                size="icon"
                onClick={nextTestimonial}
                className="rounded-full shadow-md hover:shadow-lg transition-shadow"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex justify-center mt-8 space-x-2">
            {testimonialsData.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  index === currentIndex ? "bg-primary" : "bg-primary/30",
                )}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function TestimonialCard({ testimonial }) {
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="text-6xl mb-4">{testimonial.emoji}</div>
        <blockquote className="text-sm md:text-base font-medium mb-4 flex-grow text-foreground">
          "{testimonial.quote}"
        </blockquote>
        <div className="mt-auto flex items-center space-x-4">
          <div className={cn("w-1 h-12 rounded-full", testimonial.accentColor)} aria-hidden="true" />
          <cite className="not-italic">
            <span className="font-semibold text-foreground block">{testimonial.name}</span>
            <span className="text-sm text-muted-foreground">{testimonial.role}</span>
          </cite>
        </div>
      </CardContent>
    </Card>
  )
}

