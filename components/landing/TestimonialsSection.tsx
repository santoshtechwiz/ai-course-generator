"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Quote, Code, Database, Palette, Cpu, Rocket } from "lucide-react"
import { cn } from "@/lib/utils"
import type React from "react"

const testimonials = [
  {
    name: "Alex Chen",
    role: "Software Engineer",
    quote:
      "As a self-taught developer, this platform has been invaluable. The AI-generated quizzes help me validate my learning, and the ad-free video experience lets me focus on mastering new technologies without distractions.",
    icon: Code,
  },
  {
    name: "Priya Sharma",
    role: "Data Scientist",
    quote:
      "Balancing work and continuous learning is challenging, but this platform makes it easier. The AI-powered knowledge checks ensure I'm grasping complex concepts, and the ability to learn without ads interrupting my flow is priceless.",
    icon: Database,
  },
  {
    name: "Michael Johnson",
    role: "Self-Taught UX Designer",
    quote:
      "Transitioning careers was daunting, but this platform made self-learning accessible. The AI-assisted quizzes helped me identify knowledge gaps, and the ad-free environment allowed me to immerse myself fully in design principles.",
    icon: Palette,
  },
  {
    name: "Emily Rodriguez",
    role: "Full-Stack Developer",
    quote:
      "As someone juggling a full-time job and learning new skills, efficiency is key. This platform's AI-generated assessments and distraction-free video lectures have significantly accelerated my learning process.",
    icon: Cpu,
  },
  {
    name: "Raj Patel",
    role: "DevOps Engineer",
    quote:
      "Staying updated with the latest in DevOps is crucial. This platform's AI-curated content and quizzes help me quickly grasp new concepts. The ad-free experience means I can focus on learning during my limited free time.",
    icon: Rocket,
  },
]

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cardsPerView, setCardsPerView] = useState(1)

  const updateCardsPerView = useCallback(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth >= 1024) {
        setCardsPerView(3)
      } else if (window.innerWidth >= 640) {
        setCardsPerView(2)
      } else {
        setCardsPerView(1)
      }
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
    <section className="py-10 md:py-16 bg-gradient-to-b from-background to-secondary/20">
      <div className="container px-4 md:px-6 max-w-6xl mx-auto">
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
                    "flex-shrink-0 px-3",
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
              className="rounded-full shadow-md hover:shadow-lg transition-shadow hidden md:flex"
              aria-label="Previous testimonials"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 -right-4 md:-right-6">
            <Button
              variant="outline"
              size="icon"
              onClick={nextTestimonial}
              className="rounded-full shadow-md hover:shadow-lg transition-shadow hidden md:flex"
              aria-label="Next testimonials"
            >
              <ChevronRight className="h-5 w-5" />
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
  icon: React.ElementType
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const Icon = testimonial.icon

  return (
    <Card className="h-full bg-card shadow-md">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground">{testimonial.name}</h3>
            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
          </div>
        </div>
        <blockquote className="text-foreground flex-grow">
          <Quote className="h-6 w-6 text-primary mb-2" />
          <p className="text-base">{testimonial.quote}</p>
        </blockquote>
      </CardContent>
    </Card>
  )
}

