"use client"

import { useRef, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const testimonials = [
  {
    name: "Alex Chen",
    role: "Software Engineer",
    quote:
      "As a self-taught developer, this platform has been invaluable. The AI-generated quizzes help me validate my learning, and the ad-free video experience lets me focus on mastering new technologies without distractions.",
    emoji: "👨‍💻",
  },
  {
    name: "Priya Sharma",
    role: "Data Scientist",
    quote:
      "Balancing work and continuous learning is challenging, but this platform makes it easier. The AI-powered knowledge checks ensure I'm grasping complex concepts, and the ability to learn without ads interrupting my flow is priceless.",
    emoji: "📊",
  },
  {
    name: "Michael Johnson",
    role: "Self-Taught UX Designer",
    quote:
      "Transitioning careers was daunting, but this platform made self-learning accessible. The AI-assisted quizzes helped me identify knowledge gaps, and the ad-free environment allowed me to immerse myself fully in design principles.",
    emoji: "🎨",
  },
  {
    name: "Emily Rodriguez",
    role: "Full-Stack Developer",
    quote:
      "As someone juggling a full-time job and learning new skills, efficiency is key. This platform's AI-generated assessments and distraction-free video lectures have significantly accelerated my learning process.",
    emoji: "💻",
  },
  {
    name: "Raj Patel",
    role: "DevOps Engineer",
    quote:
      "Staying updated with the latest in DevOps is crucial. This platform's AI-curated content and quizzes help me quickly grasp new concepts. The ad-free experience means I can focus on learning during my limited free time.",
    emoji: "🚀",
  },
]

export default function TestimonialsSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  useEffect(() => {
    const autoPlay = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
    }, 5000) // Change testimonial every 5 seconds

    return () => clearInterval(autoPlay)
  }, [])

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: currentIndex * 300,
        behavior: "smooth",
      })
    }
  }, [currentIndex])

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
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto space-x-6 pb-8 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="flex-shrink-0 w-[300px] md:w-[350px] snap-center">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="text-6xl mb-4">{testimonial.emoji}</div>
                    <blockquote className="text-sm md:text-base font-medium mb-4 flex-grow text-foreground">
                      "{testimonial.quote}"
                    </blockquote>
                    <cite className="not-italic mt-auto">
                      <span className="font-semibold text-foreground">{testimonial.name}</span>
                      <span className="block text-sm text-muted-foreground mt-1">{testimonial.role}</span>
                    </cite>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="absolute top-1/2 -left-4 -translate-y-1/2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  scroll("left")
                  setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
                }}
                className="rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Scroll left</span>
              </Button>
            </div>
            <div className="absolute top-1/2 -right-4 -translate-y-1/2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  scroll("right")
                  setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
                }}
                className="rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Scroll right</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

