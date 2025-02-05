"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { cn } from "@/lib/utils"

const testimonials = [
  {
    name: "Alex Chen",
    role: "Software Engineer",
    quote:
      "As a self-taught developer, this platform has been invaluable. The AI-generated quizzes help me validate my learning, and the ad-free video experience lets me focus on mastering new technologies without distractions.",
    accentColor: "bg-blue-500",
  },
  {
    name: "Priya Sharma",
    role: "Data Scientist",
    quote:
      "Balancing work and continuous learning is challenging, but this platform makes it easier. The AI-powered knowledge checks ensure I'm grasping complex concepts, and the ability to learn without ads interrupting my flow is priceless.",
    accentColor: "bg-purple-500",
  },
  {
    name: "Michael Johnson",
    role: "Self-Taught UX Designer",
    quote:
      "Transitioning careers was daunting, but this platform made self-learning accessible. The AI-assisted quizzes helped me identify knowledge gaps, and the ad-free environment allowed me to immerse myself fully in design principles.",
    accentColor: "bg-pink-500",
  },
  {
    name: "Emily Rodriguez",
    role: "Full-Stack Developer",
    quote:
      "As someone juggling a full-time job and learning new skills, efficiency is key. This platform's AI-generated assessments and distraction-free video lectures have significantly accelerated my learning process.",
    accentColor: "bg-green-500",
  },
  {
    name: "Raj Patel",
    role: "DevOps Engineer",
    quote:
      "Staying updated with the latest in DevOps is crucial. This platform's AI-curated content and quizzes help me quickly grasp new concepts. The ad-free experience means I can focus on learning during my limited free time.",
    accentColor: "bg-orange-500",
  },
]

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cardsPerView, setCardsPerView] = useState(1)

  const updateCardsPerView = useCallback(() => {
    if (window.innerWidth >= 1024) {
      setCardsPerView(3)
    } else if (window.innerWidth >= 640) {
      setCardsPerView(2)
    } else {
      setCardsPerView(1)
    }
  }, [])

  useEffect(() => {
    updateCardsPerView()
    window.addEventListener("resize", updateCardsPerView)
    return () => window.removeEventListener("resize", updateCardsPerView)
  }, [updateCardsPerView])

  const nextTestimonial = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % (testimonials.length - cardsPerView + 1))
  }, [cardsPerView])

  const prevTestimonial = useCallback(() => {
    setCurrentIndex(
      (prevIndex) =>
        (prevIndex - 1 + testimonials.length - cardsPerView + 1) % (testimonials.length - cardsPerView + 1),
    )
  }, [cardsPerView])

  useEffect(() => {
    const autoPlay = setInterval(nextTestimonial, 5000)
    return () => clearInterval(autoPlay)
  }, [nextTestimonial])

  return (
    <section className="w-full py-12 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-primary">What Our Users Say</h2>
        <div className="relative">
          <div className="overflow-hidden">
            <motion.div
              className="flex"
              animate={{ x: `-${currentIndex * (100 / cardsPerView)}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex-shrink-0 px-2",
                    cardsPerView === 1 ? "w-full" : cardsPerView === 2 ? "w-1/2" : "w-1/3",
                  )}
                >
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </motion.div>
          </div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -left-4 md:-left-6">
            <Button
              variant="outline"
              size="icon"
              onClick={prevTestimonial}
              className="rounded-full shadow-md hover:shadow-lg transition-shadow"
              aria-label="Previous testimonials"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 -right-4 md:-right-6">
            <Button
              variant="outline"
              size="icon"
              onClick={nextTestimonial}
              className="rounded-full shadow-md hover:shadow-lg transition-shadow"
              aria-label="Next testimonials"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

interface Testimonial {
  name: string
  role: string
  quote: string
  accentColor: string
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="h-full bg-card">
      <CardContent className="p-4 sm:p-6 flex flex-col h-full">
        <div className="flex items-center space-x-4 mb-4">
          <div
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center",
              testimonial.accentColor,
            )}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">{testimonial.name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{testimonial.role}</p>
          </div>
        </div>
        <blockquote className="text-foreground flex-grow">
          <Quote className="h-5 w-5 sm:h-6 sm:w-6 text-primary mb-2" />
          <p className="text-xs sm:text-sm">{testimonial.quote}</p>
        </blockquote>
      </CardContent>
    </Card>
  )
}

